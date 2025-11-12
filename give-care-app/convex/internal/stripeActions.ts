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
      apiVersion: "2024-12-18.acacia",
    });

    let event;
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Process event via idempotent mutation
    await ctx.runMutation(internal.stripe.applyStripeEvent, {
      stripeEventId: event.id,
      eventType: event.type,
      eventData: event.data.object,
    });

    return { processed: true };
  },
});

