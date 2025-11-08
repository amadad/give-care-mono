"use node";

import { internalAction } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Send welcome SMS after Stripe checkout completion
 *
 * Triggered by billing.applyStripeEvent when checkout.session.completed
 * is received with phone number and name metadata.
 */
export const sendWelcomeSms = internalAction({
  args: {
    phoneNumber: v.string(),
    fullName: v.string(),
  },
  handler: async (ctx, { phoneNumber, fullName }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.error('[onboarding] Twilio credentials not configured');
      return { success: false, error: 'Twilio not configured' };
    }

    // Personalized welcome message
    const firstName = fullName.split(' ')[0];
    const welcomeText = `Hi ${firstName}! Welcome to GiveCare. I'm here to support you 24/7 on your caregiving journey. Text me anytime for guidance, resources, or just someone to listen. How are you doing today?`;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: from,
            Body: welcomeText,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[onboarding] Twilio error sending welcome SMS:', error);
        return { success: false, error };
      }

      const data = await response.json();
      console.log('[onboarding] Welcome SMS sent:', { sid: data.sid, to: phoneNumber });

      return { success: true, sid: data.sid };
    } catch (error) {
      console.error('[onboarding] Failed to send welcome SMS:', error);
      return { success: false, error: String(error) };
    }
  },
});
