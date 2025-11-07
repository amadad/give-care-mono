import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

/**
 * Stripe Webhook Handler
 *
 * Receives Stripe webhook events and processes them.
 *
 * TODO: Add Stripe signature verification using STRIPE_WEBHOOK_SECRET
 * See: https://stripe.com/docs/webhooks/signatures
 */
http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const event = body as {
        id: string;
        type: string;
        data?: { object?: unknown };
        [key: string]: unknown;
      };

      // TODO: Verify Stripe signature
      // const signature = request.headers.get('stripe-signature');
      // if (!signature || !verifyStripeSignature(body, signature)) {
      //   return new Response('Invalid signature', { status: 401 });
      // }

      await ctx.runMutation(api.functions.billing.applyStripeEvent, {
        id: event.id,
        type: event.type,
        payload: event,
      });

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

/**
 * Twilio SMS Webhook Handler
 *
 * Receives inbound SMS messages from Twilio and processes them.
 *
 * Twilio sends data as application/x-www-form-urlencoded
 *
 * TODO: Add Twilio signature verification using TWILIO_AUTH_TOKEN
 * See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
http.route({
  path: '/webhooks/twilio/sms',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const formData = await request.formData();

      const from = formData.get('From') as string;
      const body = formData.get('Body') as string;
      const messageSid = formData.get('MessageSid') as string;

      if (!from || !body || !messageSid) {
        return new Response('Missing required fields', { status: 400 });
      }

      // TODO: Verify Twilio signature
      // const signature = request.headers.get('x-twilio-signature');
      // if (!signature || !verifyTwilioSignature(request.url, formData, signature)) {
      //   return new Response('Invalid signature', { status: 401 });
      // }

      const traceId = `twilio-${messageSid}`;

      await ctx.runMutation(api.functions.messages.recordInbound, {
        message: {
          externalId: from,
          channel: 'sms',
          text: body,
          meta: {
            twilioSid: messageSid,
            from,
          },
          traceId,
        },
      });

      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    } catch (error) {
      console.error('Twilio webhook error:', error);
      return new Response('Webhook processing failed', { status: 500 });
    }
  }),
});

/**
 * Health check endpoint
 */
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
