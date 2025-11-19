/**
 * HTTP Webhook Router
 * Handles Twilio SMS webhooks and Stripe webhooks
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { twilio } from "./lib/twilio";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Auth routes for admin dashboard authentication
auth.addHttpRoutes(http);

// Twilio Component automatically registers routes:
// - /twilio/incoming-message
// - /twilio/message-status
twilio.registerRoutes(http);

/**
 * Twilio Voice Webhook
 * Responds to incoming calls with voice message
 */
http.route({
  path: "/twilio/voice",
  method: "POST",
  handler: httpAction(async (_ctx, _request) => {
    // Return TwiML response that speaks a message
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi! You've reached GiveCare, the A I-powered support platform for family caregivers.
    We help track burnout, provide emotional support, and connect you with local resources.
    Please send us a text message instead, and we'll be happy to assist you.
    Thank you!
  </Say>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }),
});

/**
 * Stripe Webhook
 * Handles subscription events
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Process Stripe webhook (idempotency handled inside)
    await ctx.runAction(internal.internal.stripeActions.processWebhook, {
      body,
      signature,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
