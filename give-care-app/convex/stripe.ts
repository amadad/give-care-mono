/**
 * Stripe integration for GiveCare subscriptions
 *
 * Flow:
 * 1. User fills form on givecareapp.com/signup (name, email, phone, plan)
 * 2. createCheckoutSession creates Stripe checkout + user record
 * 3. User completes payment on Stripe
 * 4. Webhook receives payment confirmation
 * 5. User record updated to active + welcome SMS sent
 */

"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

/**
 * Create a Stripe Checkout session for subscription signup
 * Called from the signup form on givecareapp.com
 */
export const createCheckoutSession = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(), // E.164 format: +1XXXXXXXXXX
    priceId: v.string(), // Stripe Price ID (from your Stripe Dashboard)
    couponCode: v.optional(v.string()), // Optional coupon code (CAREGIVER50, PARTNER-ORG, etc.)
  },
  handler: async (ctx, { fullName, email, phoneNumber, priceId, couponCode }): Promise<string | null> => {
    // Fail fast if HOSTING_URL is missing in production
    const domain = process.env.HOSTING_URL;
    if (!domain) {
      console.error("[Stripe] HOSTING_URL environment variable is not set");
      throw new Error("Server configuration error: HOSTING_URL is required for checkout");
    }

    const stripe = new Stripe(process.env.STRIPE_KEY!, {
      apiVersion: "2025-09-30.clover",
    });

    // Create or get Stripe customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customer: Stripe.Customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        name: fullName,
        phone: phoneNumber,
        metadata: {
          phoneNumber, // Store for reference
        },
      });
    }

    // Create pending user record in Convex
    const userId = await ctx.runMutation(internal.subscriptions.createPendingUser, {
      fullName,
      email,
      phoneNumber,
      stripeCustomerId: customer.id,
    });

    // Validate coupon code if provided
    let discounts: { coupon: string }[] | undefined;
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          discounts = [{ coupon: couponCode }];
          console.log(`[Stripe] Applying coupon: ${couponCode} (${coupon.name})`);
        } else {
          console.warn(`[Stripe] Invalid coupon code: ${couponCode}`);
        }
      } catch (error) {
        console.error(`[Stripe] Coupon validation error: ${couponCode}`, error);
        // Continue without coupon if validation fails
      }
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      customer_update: {
        // Allow updating customer info at checkout (address, etc.)
        address: 'auto',
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      discounts,
      success_url: `${domain}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/signup`,
      metadata: {
        userId, // Link to Convex user
        phoneNumber,
        couponCode: couponCode || 'none',
      },
      subscription_data: {
        metadata: {
          userId,
          phoneNumber,
          couponCode: couponCode || 'none',
        },
      },
      // Pre-fill customer information from signup form
      customer_email: customer.email || undefined, // Pre-fill email (user can't change it)
      phone_number_collection: {
        enabled: false, // Don't collect phone - we already have it
      },
    });

    // Store checkout session ID for verification
    await ctx.runMutation(internal.subscriptions.updateCheckoutSession, {
      userId,
      checkoutSessionId: session.id,
    });

    return session.url;
  },
});

/**
 * Handle Stripe webhooks (payment confirmations, subscription events)
 * Called by Stripe servers via POST /stripe
 */
export const fulfillCheckout = internalAction({
  args: {
    signature: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, { signature, payload }) => {
    const stripe = new Stripe(process.env.STRIPE_KEY!, {
      apiVersion: "2025-09-30.clover",
    });

    const webhookSecret = process.env.STRIPE_WEBHOOKS_SECRET!;

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const phoneNumber = session.metadata?.phoneNumber;

          if (!userId || !phoneNumber) {
            console.error("Missing userId or phoneNumber in session metadata");
            return { success: false };
          }

          // Activate subscription
          await ctx.runMutation(internal.subscriptions.activateSubscription, {
            userId: userId as any,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          });

          // Send welcome SMS
          await ctx.runAction(internal.stripe.sendWelcomeSMS, {
            phoneNumber,
            userId: userId as any,
          });

          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error("Missing userId in subscription metadata");
            return { success: false };
          }

          // Normalize Stripe status (all are now valid in validator)
          await ctx.runMutation(internal.subscriptions.updateSubscriptionStatus, {
            userId: userId as any,
            subscriptionStatus: subscription.status,
          });

          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;

          if (!userId) {
            console.error("Missing userId in subscription metadata");
            return { success: false };
          }

          await ctx.runMutation(internal.subscriptions.updateSubscriptionStatus, {
            userId: userId as any,
            subscriptionStatus: "canceled",
          });

          break;
        }
      }

      return { success: true };
    } catch (err) {
      console.error("Stripe webhook error:", err);
      return { success: false, error: (err as Error).message };
    }
  },
});

/**
 * Send welcome SMS via Twilio when subscription activates
 */
export const sendWelcomeSMS = internalAction({
  args: {
    phoneNumber: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { phoneNumber, userId }) => {
    try {
      // Check if Twilio credentials are configured
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioNumber) {
        console.warn(`[Stripe] Twilio not configured - welcome SMS to ${phoneNumber} skipped`);
        console.warn('[Stripe] Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
        return { success: false, error: 'Twilio not configured' };
      }

      // Send welcome SMS via Twilio
      const twilio = require('twilio')(accountSid, authToken);

      const welcomeMessage =
        "Welcome to GiveCare! 🎉\n\n" +
        "I'm here to support you on your caregiving journey. " +
        "Reply anytime with a question or just say hello to get started.\n\n" +
        "You're not alone in this.";

      await twilio.messages.create({
        body: welcomeMessage,
        from: twilioNumber,
        to: phoneNumber,
      });

      console.log(`✅ Welcome SMS sent to ${phoneNumber} for user ${userId}`);
      return { success: true };
    } catch (error) {
      // Don't fail subscription activation if SMS fails
      console.error(`[Stripe] Failed to send welcome SMS to ${phoneNumber}:`, error);
      return { success: false, error: String(error) };
    }
  },
});
