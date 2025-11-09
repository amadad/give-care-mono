"use node";

/**
 * Newsletter / email subscription actions live here to isolate all Resend usage.
 */

import { action } from '../_generated/server';
import { api } from '../_generated/api';
import { v } from 'convex/values';
import { Resend } from 'resend';

export const newsletterSignup = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      if (process.env.RESEND_AUDIENCE_ID) {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
      }

      await ctx.runMutation(api.domains.email.logDelivery, {
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
