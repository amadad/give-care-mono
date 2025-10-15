/**
 * SMS Service - Edge Runtime Compatible
 *
 * Edge-compatible Twilio API client using fetch() instead of the Node.js SDK.
 * Compatible with Cloudflare Pages, Vercel Edge, and other edge runtimes.
 */

import { env } from './env';

const TWILIO_API_BASE = 'https://api.twilio.com';

/**
 * SMS message templates
 */
export const SMS_TEMPLATES = {
  welcome: (name: string) => `Welcome to GiveCare, ${name}! 🤗

Your caregiving support is now active.

Reply to this message anytime for:
• Daily check-ins
• Resource recommendations
• Crisis support
• Community connections

We're here for you.`,

  paymentReminder: (name: string) =>
    `Hi ${name}, your GiveCare payment didn't go through. Please update your payment method to continue receiving support. Visit: https://givecareapp.com/account`,

  subscriptionCanceled: (name: string) =>
    `${name}, we're sorry to see you go. Your GiveCare subscription has ended. You can resubscribe anytime at https://givecareapp.com/signup`,
};

/**
 * Send SMS using Twilio REST API
 */
async function sendTwilioMessage(
  to: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const accountSid = env.TWILIO_ACCOUNT_SID;
    const authToken = env.TWILIO_AUTH_TOKEN;
    const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken || !messagingServiceSid) {
      throw new Error('Twilio credentials not configured');
    }

    // Create Basic Auth header
    const credentials = btoa(`${accountSid}:${authToken}`);

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('Body', body);
    formData.append('MessagingServiceSid', messagingServiceSid);

    // Make API request
    const response = await fetch(
      `${TWILIO_API_BASE}/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Twilio API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send welcome SMS to new subscriber
 */
export async function sendWelcomeSMS(
  phoneNumber: string,
  name: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`📱 Sending welcome SMS to ${phoneNumber}`);

  const result = await sendTwilioMessage(
    phoneNumber,
    SMS_TEMPLATES.welcome(name)
  );

  if (result.success) {
    console.log(`✅ Welcome SMS sent successfully: ${result.messageId}`);
  }

  return result;
}

/**
 * Send payment reminder SMS
 */
export async function sendPaymentReminderSMS(
  phoneNumber: string,
  name: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`📱 Sending payment reminder SMS to ${phoneNumber}`);

  const result = await sendTwilioMessage(
    phoneNumber,
    SMS_TEMPLATES.paymentReminder(name)
  );

  if (result.success) {
    console.log(`✅ Payment reminder SMS sent: ${result.messageId}`);
  }

  return result;
}

/**
 * Send subscription canceled SMS
 */
export async function sendSubscriptionCanceledSMS(
  phoneNumber: string,
  name: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`📱 Sending cancellation SMS to ${phoneNumber}`);

  const result = await sendTwilioMessage(
    phoneNumber,
    SMS_TEMPLATES.subscriptionCanceled(name)
  );

  if (result.success) {
    console.log(`✅ Cancellation SMS sent: ${result.messageId}`);
  }

  return result;
}

/**
 * Send generic SMS (for custom messages)
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`📱 Sending SMS to ${phoneNumber}`);

  const result = await sendTwilioMessage(phoneNumber, message);

  if (result.success) {
    console.log(`✅ SMS sent successfully: ${result.messageId}`);
  }

  return result;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}
