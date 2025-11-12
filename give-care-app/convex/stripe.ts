/**
 * Stripe Integration
 * - createCheckoutSession: Creates Stripe checkout session (action)
 * - processWebhook: Moved to internal/stripe.ts (internal action)
 */

"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Stripe Price Lookup Keys
 * Maps to existing products in Stripe
 * Monthly: $9.99/month
 * Annual: $99.00/year
 */
const STRIPE_PRICE_LOOKUP_KEYS = {
  monthly: "givecare_standard_monthly",
  annual: "givecare_standard_annual",
} as const;

/**
 * Create Stripe checkout session
 * Returns checkout URL for redirect
 */
export const createCheckoutSession = action({
  args: {
    userId: v.id("users"),
    planId: v.union(v.literal("monthly"), v.literal("annual")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, { userId, planId, successUrl, cancelUrl }) => {
    // Get Stripe secret key from environment
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Get user to find/create Stripe customer
    const user = await ctx.runQuery(internal.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Import Stripe SDK (Node.js runtime)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Find or create Stripe customer
    let customerId: string;
    const existingSubscription = await ctx.runQuery(
      internal.subscriptions.getByUserId,
      { userId }
    );

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

    // Create checkout session using existing Stripe prices
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
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

