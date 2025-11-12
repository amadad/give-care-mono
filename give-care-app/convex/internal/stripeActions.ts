/**
 * Internal Stripe Actions
 * Node.js runtime required for Stripe SDK
 */

"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Process Stripe webhook (internal action)
 * Verifies signature and calls applyStripeEvent
 * Must be action because it uses Stripe SDK (Node.js)
 */
export const processWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, { body, signature }) => {
    // Get Stripe webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    // Import Stripe SDK for signature verification
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-10-29.clover",
    });

    let event;
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Process event via idempotent mutation
    await ctx.runMutation(internal.internal.stripe.applyStripeEvent, {
      stripeEventId: event.id,
      eventType: event.type,
      eventData: event.data.object,
    });

    return { processed: true };
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

    // Get existing subscription to determine plan (default to "monthly" if none)
    const existingSubscription = await ctx.runQuery(
      internal.internal.subscriptions.getByUserId,
      { userId }
    );
    const planId = existingSubscription?.planId || "monthly";

    // Import Stripe SDK (Node.js runtime)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    });

    // If user has existing Stripe customer, use Customer Portal
    // This allows them to manage their subscription and resubscribe directly
    if (existingSubscription?.stripeCustomerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: existingSubscription.stripeCustomerId,
        return_url: successUrl,
      });
      return { url: portalSession.url };
    }

    // For new customers without Stripe customer ID, create checkout session
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: userId,
        planId: planId,
      },
    });

    // Stripe price lookup keys
    const STRIPE_PRICE_LOOKUP_KEYS = {
      monthly: "givecare_standard_monthly",
      annual: "givecare_standard_annual",
    } as const;

    // Create checkout session using existing Stripe prices
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [
        {
          price: STRIPE_PRICE_LOOKUP_KEYS[planId],
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

