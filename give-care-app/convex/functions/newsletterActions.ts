import { action } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Resend } from 'resend';

/**
 * Newsletter signup action
 *
 * Adds email to Resend audience and logs subscription in Convex
 */
export const newsletterSignup = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    try {
      // Add to Resend audience (newsletter list)
      if (process.env.RESEND_AUDIENCE_ID) {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
      }

      // Log subscription in Convex emails table
      await ctx.runMutation(internal.functions.email.logDelivery, {
        to: email,
        subject: 'Newsletter Subscription',
        status: 'subscribed',
        traceId: `newsletter-${Date.now()}-${email}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Newsletter signup error:', error);
      throw new Error('Failed to subscribe to newsletter');
    }
  },
});
