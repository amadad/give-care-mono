import Stripe from 'stripe';
import { runtime } from '../../src/harness/runtime';

const stripeSecret = process.env.HARNESS_STRIPE_SECRET ?? process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.HARNESS_STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;

if (stripeSecret && !process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = stripeSecret;
}

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

export const handleStripeWebhook = async (rawBody: Buffer | string, signature: string) => {
  if (!stripe || !webhookSecret) {
    throw new Error('Stripe webhook secrets not configured');
  }
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  await runtime.store.applyStripeEvent({ id: event.id, type: event.type, payload: event });
  return { received: true };
};
