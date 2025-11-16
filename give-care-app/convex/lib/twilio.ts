/**
 * Twilio Component Integration
 * Twilio Component handles signature verification automatically
 */

import { Twilio } from "@convex-dev/twilio";
import { components, internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

const HAS_TWILIO_CREDS =
  Boolean(process.env.TWILIO_ACCOUNT_SID) &&
  Boolean(process.env.TWILIO_AUTH_TOKEN);

const FALLBACK_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "test-account";
const FALLBACK_FROM = process.env.TWILIO_PHONE_NUMBER ?? "+15555550100";

class TwilioStub {
  public incomingMessageCallback = internal.inbound.handleIncomingMessage;

  constructor(private defaultFrom: string, private accountSid: string) {}

  registerRoutes(_: unknown) {
    // No-op in tests – real Twilio client registers HTTP routes
  }

  async sendMessage(
    ctx: ActionCtx,
    args: { to: string; body: string; from?: string }
  ) {
    const from = args.from ?? this.defaultFrom;
    if (!from) {
      throw new Error(
        "Missing Twilio phone number. Set TWILIO_PHONE_NUMBER or provide a from number."
      );
    }
    const now = new Date().toISOString();
    const sid = `SM${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    const message = {
      account_sid: this.accountSid,
      api_version: "2010-04-01",
      body: args.body,
      counterparty: args.to,
      date_created: now,
      date_sent: now,
      date_updated: now,
      direction: "outbound-api",
      error_code: null,
      error_message: null,
      from,
      messaging_service_sid: null,
      num_media: "0",
      num_segments: "1",
      price: null,
      price_unit: null,
      sid,
      status: "sent",
      subresource_uris: null,
      to: args.to,
      uri: `/2010-04-01/Accounts/${this.accountSid}/Messages/${sid}`,
      rest: { simulated: true },
    };

    // Note: Component tables are sandboxed and not directly accessible via ctx.db
    // The real Twilio component handles message insertion automatically
    // For the stub, we just return the simulated message without inserting it
    // Tests that query messages should use the real Twilio component or mock appropriately
    return message;
  }
}

/**
 * Twilio client instance
 */
export const twilio = HAS_TWILIO_CREDS
  ? new Twilio(components.twilio, {
      defaultFrom: process.env.TWILIO_PHONE_NUMBER,
    })
  : new TwilioStub(FALLBACK_FROM, FALLBACK_ACCOUNT_SID);

if (!HAS_TWILIO_CREDS) {
  console.warn(
    "TWILIO_ACCOUNT_SID/AUTH_TOKEN not set – using local Twilio stub for tests."
  );
}

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
