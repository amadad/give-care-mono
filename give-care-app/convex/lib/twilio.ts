/**
 * Twilio Component Integration
 * Twilio Component handles signature verification automatically
 */

import { Twilio } from "@convex-dev/twilio";
import { components, internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

/**
 * Twilio client instance
 */
export const twilio = new Twilio(components.twilio, {
  defaultFrom: process.env.TWILIO_PHONE_NUMBER,
});

// Set incoming message callback
twilio.incomingMessageCallback = internal.inbound.handleIncomingMessage;

/**
 * Send SMS via Twilio Component
 * Component handles encoding, segment counting, etc.
 */
export async function sendSMS(
  ctx: ActionCtx,
  to: string,
  body: string
): Promise<void> {
  await twilio.sendMessage(ctx, {
    to,
    body,
  });
}

/**
 * Get first outbound message template (CTIA compliant)
 */
export function getFirstMessageTemplate(): string {
  return "I'm here for family caregivers. We can check in, track burnout, and find local help. Reply YES to start. Reply HELP for help, STOP to opt out. Msg&data rates may apply.";
}

/**
 * Get HELP response message
 */
export function getHelpMessage(): string {
  return "GiveCare helps family caregivers track burnout and find local resources. We send check-ins and can help you find support. Reply STOP to opt out. For immediate crisis support, text 988 or 741741.";
}

/**
 * Get STOP confirmation message
 */
export function getStopConfirmation(): string {
  return "You've been unsubscribed. Reply YES to resubscribe.";
}

/**
 * Get consent message (after first message)
 */
export function getConsentMessage(): string {
  return "We store your messages to support you. Terms/Privacy: [link]. Reply STOP to opt out.";
}

