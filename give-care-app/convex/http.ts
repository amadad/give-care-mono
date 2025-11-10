import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { twilio } from './lib/twilio';
import { api, internal } from './_generated/api';
import Stripe from 'stripe';

const http = httpRouter();

// ✅ Register Twilio webhook routes automatically
// Registers: /twilio/incoming-message and /twilio/message-status
twilio.registerRoutes(http);

// ============================================================================
// STRIPE WEBHOOK
// ============================================================================

http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOKS_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe configuration');
      return new Response('Server configuration error', { status: 500 });
    }

    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-10-29.clover' as any,
      });
      const signature = request.headers.get('stripe-signature');
      const body = await request.text();

      if (!signature) {
        console.error('Missing Stripe signature');
        return new Response('Missing signature', { status: 400 });
      }

      let event: Stripe.Event;
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        console.error('[stripe-webhook] Signature verification failed:', err);
        return new Response('Invalid signature', { status: 403 });
      }

      // Process verified event (billing.ts will be created later)
      // await ctx.runMutation(api.billing.applyStripeEvent, {
      //   id: event.id,
      //   type: event.type,
      //   payload: event as unknown as Record<string, unknown>,
      // });

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return new Response('Webhook processing failed', { status: 500 });
    }
  }),
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: 'ok', timestamp: Date.now() }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),
});

export default http;
