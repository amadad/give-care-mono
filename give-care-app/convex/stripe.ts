import { action } from './_generated/server';
import { v } from 'convex/values';
import Stripe from 'stripe';

/**
 * Create Stripe checkout session
 *
 * Creates a subscription checkout session and returns the URL
 * for redirecting the user to Stripe's hosted checkout page
 */
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
      apiVersion: '2023-10-16',
    });

    try {
      // Create checkout session
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
          fullName: args.fullName,
          phoneNumber: args.phoneNumber,
        },
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/signup?canceled=true`,
        // Allow user to use promo codes
        allow_promotion_codes: true,
        // Collect billing address
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
