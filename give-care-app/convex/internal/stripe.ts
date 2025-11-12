/**
 * Internal Stripe Functions
 * Idempotent webhook processing
 */

import { internalMutation } from "../_generated/server";
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

