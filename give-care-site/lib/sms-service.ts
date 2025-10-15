import twilio from 'twilio'
import { env } from './env'

/**
 * SMS Service using Twilio
 *
 * Handles sending SMS messages for user onboarding and notifications.
 * Only sends to users with active subscriptions (payment-gated).
 */

/**
 * Create Twilio client
 */
function getTwilioClient() {
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
}

/**
 * Get Twilio messaging configuration
 * Uses Messaging Service SID instead of individual phone number
 */
function getMessagingConfig() {
  return {
    messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
  }
}

/**
 * SMS message templates
 */
const SMS_TEMPLATES = {
  welcome: (name: string) => `Welcome to GiveCare, ${name}! 🤗

Your caregiving support is now active.

Reply to this message anytime for:
• Daily check-ins
• Resource recommendations
• Crisis support
• Community connections

We're here for you.`,

  paymentReminder: (name: string) => `Hi ${name}, your GiveCare payment didn't go through. Please update your payment method to continue receiving support. Visit: https://givecareapp.com/account`,

  subscriptionCanceled: (name: string) => `${name}, we're sorry to see you go. Your GiveCare subscription has ended. You can resubscribe anytime at https://givecareapp.com/signup`,
}

/**
 * Send welcome SMS to new subscriber
 */
export async function sendWelcomeSMS(
  phoneNumber: string,
  name: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`📱 Sending welcome SMS to ${phoneNumber}`)

    const client = getTwilioClient()
    const message = await client.messages.create({
      body: SMS_TEMPLATES.welcome(name),
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
      to: phoneNumber,
    })

    console.log(`✅ Welcome SMS sent successfully: ${message.sid}`)

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    console.error('❌ Failed to send welcome SMS:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send payment reminder SMS
 */
export async function sendPaymentReminderSMS(
  phoneNumber: string,
  name: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`📱 Sending payment reminder SMS to ${phoneNumber}`)

    const client = getTwilioClient()
    const message = await client.messages.create({
      body: SMS_TEMPLATES.paymentReminder(name),
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
      to: phoneNumber,
    })

    console.log(`✅ Payment reminder SMS sent: ${message.sid}`)

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    console.error('❌ Failed to send payment reminder SMS:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send subscription canceled SMS
 */
export async function sendSubscriptionCanceledSMS(
  phoneNumber: string,
  name: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`📱 Sending cancellation SMS to ${phoneNumber}`)

    const client = getTwilioClient()
    const message = await client.messages.create({
      body: SMS_TEMPLATES.subscriptionCanceled(name),
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
      to: phoneNumber,
    })

    console.log(`✅ Cancellation SMS sent: ${message.sid}`)

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    console.error('❌ Failed to send cancellation SMS:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send generic SMS (for custom messages)
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`📱 Sending SMS to ${phoneNumber}`)

    const client = getTwilioClient()
    const sentMessage = await client.messages.create({
      body: message,
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
      to: phoneNumber,
    })

    console.log(`✅ SMS sent successfully: ${sentMessage.sid}`)

    return {
      success: true,
      messageId: sentMessage.sid,
    }
  } catch (error) {
    console.error('❌ Failed to send SMS:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phoneNumber)
}
