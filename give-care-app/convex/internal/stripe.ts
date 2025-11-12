/**
 * Internal Stripe Functions
 * Idempotent webhook processing
 */

"use node";

import { internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  mapStripeEventToSubscription,
  type SubscriptionState,
} from "../lib/domain/stripeMapping";
import { internal } from "../_generated/api";

/**
 * Apply Stripe webhook event (idempotent)
 * Single mutation - CONVEX_01.md best practice
 */
export const applyStripeEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    eventType: v.string(),
    eventData: v.any(),
  },
  handler: async (ctx, { stripeEventId, eventType, eventData }) => {
    // Step 1: Idempotency check
    const existingEvent = await ctx.db
      .query("billing_events")
      .withIndex("by_event", (q) => q.eq("stripeEventId", stripeEventId))
      .first();

    if (existingEvent) {
      // Already processed - idempotent
      return { status: "duplicate", eventId: existingEvent._id };
    }

    // Step 2: Map event to subscription state
    const event = {
      id: stripeEventId,
      type: eventType,
      data: { object: eventData },
    };

    const subscriptionState = mapStripeEventToSubscription(event);

    if (!subscriptionState) {
      // Event not relevant for subscription updates
      // Still record it for idempotency
      await ctx.db.insert("billing_events", {
        stripeEventId,
        type: eventType,
        data: eventData,
      });
      return { status: "ignored" };
    }

    // Step 3: Find user by Stripe customer ID
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_customer", (q) =>
        q.eq("stripeCustomerId", subscriptionState.stripeCustomerId)
      )
      .first();

    let userId: string | undefined;

    if (existingSubscription) {
      userId = existingSubscription.userId;
    } else {
      // New subscription - try to find user from event metadata
      // For checkout.session.completed, userId is in session metadata
      // For subscription events, userId might be in customer metadata
      // This is set during checkout session creation
      const metadata = eventData.metadata || {};
      if (metadata.userId) {
        userId = metadata.userId;
      }
    }

    if (!userId) {
      // Cannot process without userId - still record event for idempotency
      await ctx.db.insert("billing_events", {
        stripeEventId,
        type: eventType,
        data: eventData,
      });
      return { status: "skipped", reason: "no_user_id" };
    }

    // Step 4: Upsert subscription (single mutation)
    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        planId: subscriptionState.planId,
        status: subscriptionState.status,
        currentPeriodEnd: subscriptionState.currentPeriodEnd,
        canceledAt: subscriptionState.canceledAt,
        gracePeriodEndsAt: subscriptionState.gracePeriodEndsAt,
      });
    } else if (userId) {
      // Create new subscription
      await ctx.db.insert("subscriptions", {
        userId: userId as any,
        stripeCustomerId: subscriptionState.stripeCustomerId,
        planId: subscriptionState.planId,
        status: subscriptionState.status,
        currentPeriodEnd: subscriptionState.currentPeriodEnd,
        canceledAt: subscriptionState.canceledAt,
        gracePeriodEndsAt: subscriptionState.gracePeriodEndsAt,
      });
    }

    // Step 5: Record billing event for idempotency
    await ctx.db.insert("billing_events", {
      stripeEventId,
      userId: userId as any,
      type: eventType,
      data: eventData,
    });

    return { status: "processed", userId };
  },
});

/**
 * Create checkout session for resubscription
 * Internal action that can be called from mutations
 */
export const createCheckoutSessionForResubscribe = internalAction({
  args: {
    userId: v.id("users"),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, { userId, successUrl, cancelUrl }) => {
    // Get Stripe secret key from environment
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Get user
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Get existing subscription to determine plan (default to "plus" if none)
    const existingSubscription = await ctx.runQuery(
      internal.internal.subscriptions.getByUserId,
      { userId }
    );
    const planId = existingSubscription?.planId || "plus";

    // Import Stripe SDK (Node.js runtime)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Find or create Stripe customer
    let customerId: string;
    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId,
          planId: planId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `GiveCare ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: planId === "free" ? 0 : planId === "plus" ? 2900 : 9900, // $0, $29, $99
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        planId: planId,
      },
    });

    return { url: session.url };
  },
});

