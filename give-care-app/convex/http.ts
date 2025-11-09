import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api, internal } from './_generated/api';
import Stripe from 'stripe';

/**
 * Verify Twilio webhook signature using Web Crypto API (edge-compatible)
 * See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
async function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): Promise<boolean> {
  // Sort parameters alphabetically and concatenate with URL
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // Create HMAC-SHA1 signature using Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  // Convert to base64
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  return expectedSignature === signature;
}

const http = httpRouter();

/**
 * Stripe Webhook Handler
 *
 * Verifies webhook signature and processes Stripe events
 */
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
      // Using Stripe preview API version for latest features
      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-10-29.clover' as any });
      const signature = request.headers.get('stripe-signature');
      const body = await request.text();

      if (!signature) {
        console.error('Missing Stripe signature');
        return new Response('Missing signature', { status: 400 });
      }

      // Verify webhook signature (use async version for Web Crypto compatibility)
      let event: Stripe.Event;
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        console.error('[stripe-webhook] Signature verification failed:', {
          error: err instanceof Error ? err.message : String(err),
          hasSecret: !!webhookSecret,
          secretPrefix: webhookSecret?.substring(0, 10),
          hasSignature: !!signature,
          bodyLength: body.length,
        });
        return new Response('Invalid signature', { status: 403 });
      }

      // Process verified event
      await ctx.runMutation(internal.functions.billing.applyStripeEvent, {
        id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
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
 * Twilio sends data as application/x-www-form-urlencoded
 *
 * See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
http.route({
  path: '/webhooks/twilio/sms',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioAuthToken) {
      console.error('Missing Twilio auth token');
      return new Response('Server configuration error', { status: 500 });
    }

    try {
      const signature = request.headers.get('x-twilio-signature');
      const url = request.url;

      if (!signature) {
        console.error('Missing Twilio signature');
        return new Response('Missing signature', { status: 400 });
      }

      const formData = await request.formData();

      const from = formData.get('From') as string;
      const body = formData.get('Body') as string;
      const messageSid = formData.get('MessageSid') as string;

      if (!from || !body || !messageSid) {
        return new Response('Missing required fields', { status: 400 });
      }

      // Verify Twilio signature
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value as string;
      });

      const isValid = await verifyTwilioSignature(url, params, signature, twilioAuthToken);

      if (!isValid) {
        console.error('Twilio signature verification failed');
        return new Response('Invalid signature', { status: 403 });
      }

      const traceId = `twilio-${messageSid}`;

      // Record the inbound message (phone number is extracted from 'from' field)
      const messageRecord = await ctx.runMutation(internal.functions.messages.recordInbound, {
        message: {
          externalId: from,
          channel: 'sms',
          text: body,
          meta: {
            twilioSid: messageSid,
            from,
            phone: from, // Extract phone number for user record
          },
          traceId,
        },
      });

      // Trigger async processing and response generation
      console.log('[webhook] Scheduling processInboundMessage', {
        messageId: messageRecord.messageId,
        userId: messageRecord.userId,
        from,
      });

      await ctx.scheduler.runAfter(0, internal.functions.inbound.processInboundMessage, {
        messageId: messageRecord.messageId,
        userId: messageRecord.userId,
        text: body,
        externalId: from,
        channel: 'sms' as const,
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
