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
 * Stripe Price IDs
 * Maps to existing products in Stripe
 * Monthly: $9.99/month (price_1SH4eMAXk51qociduivShWb7)
 * Annual: $99.00/year (price_1SH4eMAXk51qocidOhbWRDpk)
 */
const STRIPE_PRICE_IDS = {
  monthly: "price_1SH4eMAXk51qociduivShWb7",
  annual: "price_1SH4eMAXk51qocidOhbWRDpk",
} as const;

/**
 * Create Stripe checkout session
 * Returns checkout URL for redirect
 * Creates/updates user record before checkout
 */
export const createCheckoutSession = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    priceId: v.string(),
  },
  handler: async (ctx, { fullName, email, phoneNumber, priceId }) => {
    // Get environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.givecareapp.com";

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Determine plan from price ID
    const planId = priceId === STRIPE_PRICE_IDS.monthly ? "monthly" : "annual";

    // Create or update user in Convex
    const userId = await ctx.runMutation(internal.internal.users.upsertUserFromSignup, {
      phone: phoneNumber,
      email,
      name: fullName,
    });

    // Get user record
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user) {
      throw new Error("Failed to create user");
    }

    // Import Stripe SDK (Node.js runtime)
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Find or create Stripe customer
    let customerId: string;
    const existingSubscription = await ctx.runQuery(
      internal.internal.subscriptions.getByUserId,
      { userId }
    );

    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: fullName,
        phone: phoneNumber,
        metadata: {
          userId,
          planId,
        },
      });
      customerId = customer.id;
    }

    // Set success/cancel URLs
    const successUrl = `${siteUrl}/signup/success`;
    const cancelUrl = `${siteUrl}/signup?canceled=true`;

    // Create checkout session using price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        phone: phoneNumber,
      },
    });

    return session.url;
  },
});

