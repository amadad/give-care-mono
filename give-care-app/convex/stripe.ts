"use node";

/**
 * Stripe integration - checkout session creation
 *
 * Uses Stripe SDK to create checkout sessions for subscriptions.
 * Links users via client_reference_id (phoneNumber) for webhook processing.
 */

import { action } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import Stripe from 'stripe';

export const createCheckoutSession = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    priceId: v.string(),
    promoCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-10-29.clover' as any,
    });

    try {
      // Ensure user exists in Convex before creating checkout session
      // phoneNumber is used as externalId
      const user = await ctx.runMutation(internal.internal.ensureUserMutation, {
        externalId: args.phoneNumber,
        phone: args.phoneNumber,
        channel: 'sms' as const,
        locale: 'en-US',
      });

      // Update user metadata with email and name
      if (user) {
        await ctx.runMutation(internal.internal.updateUserMetadata, {
          userId: user._id,
          metadata: {
            email: args.email,
            fullName: args.fullName,
          },
        });
      }

      // Create or retrieve Stripe customer by email
      const customers = await stripe.customers.list({
        email: args.email,
        limit: 1,
      });

      let customerId: string;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: args.email,
          name: args.fullName,
          metadata: {
            phoneNumber: args.phoneNumber,
            fullName: args.fullName,
          },
        });
        customerId = customer.id;
      }

      // Validate and apply promo code if provided
      let discounts: Array<{ coupon: string }> | undefined;
      let promoCodeId: string | undefined;
      
      if (args.promoCode) {
        // Validate promo code
        const promoCode = await ctx.runQuery(internal.internal.getPromoCode, {
          code: args.promoCode,
        });

        if (!promoCode || !promoCode.active) {
          throw new Error(`Promo code ${args.promoCode} is not valid or inactive`);
        }

        // Check expiration
        if (promoCode.expiresAt && promoCode.expiresAt < Date.now()) {
          throw new Error(`Promo code ${args.promoCode} has expired`);
        }

        // Check usage limits
        if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
          throw new Error(`Promo code ${args.promoCode} has reached its usage limit`);
        }

        // Create Stripe coupon from promo code
        const coupon = await stripe.coupons.create({
          percent_off: promoCode.discountType === 'percent' ? promoCode.discountValue : undefined,
          amount_off: promoCode.discountType === 'amount' ? promoCode.discountValue : undefined,
          currency: 'usd',
          duration: 'once', // One-time discount
          name: promoCode.code,
        });

        discounts = [{ coupon: coupon.id }];
        promoCodeId = promoCode._id;
      }

      // Create checkout session with client_reference_id for webhook linking
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        customer: customerId,
        client_reference_id: args.phoneNumber, // Key for webhook user linking
        line_items: [
          {
            price: args.priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            phoneNumber: args.phoneNumber,
            fullName: args.fullName,
            ...(promoCodeId ? { promoCodeId } : {}),
          },
        },
        success_url: `${frontendUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/signup?canceled=true`,
        allow_promotion_codes: true, // Enables promo codes (including trial promo codes)
        billing_address_collection: 'required',
        metadata: {
          phoneNumber: args.phoneNumber,
          fullName: args.fullName,
          ...(args.promoCode ? { promoCode: args.promoCode } : {}),
        },
      };

      if (discounts) {
        sessionParams.discounts = discounts;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      if (!session.url) {
        throw new Error('Failed to create checkout session URL');
      }

      return session.url;
    } catch (error) {
      console.error('[stripe] Checkout session creation error:', error);
      if (error instanceof Error) {
        throw new Error(`Stripe error: ${error.message}`);
      }
      throw new Error('Failed to create checkout session');
    }
  },
});
