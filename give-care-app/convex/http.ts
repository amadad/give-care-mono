/**
 * HTTP Webhook Router
 * Handles Twilio SMS webhooks and Stripe webhooks
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { twilio } from "./lib/twilio";
import { internal } from "./_generated/api";

const http = httpRouter();

// Twilio Component automatically registers routes:
// - /twilio/incoming-message
// - /twilio/message-status
twilio.registerRoutes(http);

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
