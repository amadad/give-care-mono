"use node";

/**
 * Stripe actions that require Node runtime (SDK + secrets) live here.
 */

import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import Stripe from 'stripe';

export const createCheckoutSession = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    priceId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover' as any,
    });

    try {
      await ctx.runMutation(internal.core.ensureUserMutation, {
        externalId: args.phoneNumber,
        phone: args.phoneNumber,
        channel: 'sms' as const,
        locale: 'en-US',
        metadata: {
          email: args.email,
          name: args.fullName,
        },
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: args.priceId,
            quantity: 1,
          },
        ],
        customer_email: args.email,
        metadata: {
          userId: args.phoneNumber,
          fullName: args.fullName,
          phoneNumber: args.phoneNumber,
        },
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup?canceled=true`,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session URL');
      }

      return session.url;
    } catch (error) {
      console.error('Stripe checkout session error:', error);
      if (error instanceof Error) {
        throw new Error(`Stripe error: ${error.message}`);
      }
      throw new Error('Failed to create checkout session');
    }
  },
});
