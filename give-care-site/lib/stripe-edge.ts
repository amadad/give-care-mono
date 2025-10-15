/**
 * Stripe Edge Runtime Helper
 *
 * Edge-compatible Stripe API client using fetch() instead of the Node.js SDK.
 * Compatible with Cloudflare Pages, Vercel Edge, and other edge runtimes.
 */

import { env } from './env';

const STRIPE_API_VERSION = '2025-08-27';
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

/**
 * Make authenticated request to Stripe API
 */
async function stripeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }

  const url = `${STRIPE_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Stripe-Version': STRIPE_API_VERSION,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || `Stripe API error: ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Convert object to URL-encoded form data for Stripe API
 */
function encodeFormData(data: Record<string, any>): string {
  const params = new URLSearchParams();

  function addParam(key: string, value: any) {
    if (value === null || value === undefined) return;

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested objects (e.g., metadata)
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        addParam(`${key}[${nestedKey}]`, nestedValue);
      });
    } else if (Array.isArray(value)) {
      // Handle arrays (e.g., line_items)
      value.forEach((item, index) => {
        if (typeof item === 'object') {
          Object.entries(item).forEach(([itemKey, itemValue]) => {
            addParam(`${key}[${index}][${itemKey}]`, itemValue);
          });
        } else {
          addParam(`${key}[${index}]`, item);
        }
      });
    } else {
      params.append(key, String(value));
    }
  }

  Object.entries(data).forEach(([key, value]) => {
    addParam(key, value);
  });

  return params.toString();
}

/**
 * Stripe Checkout Session
 */
export interface StripeCheckoutSession {
  id: string;
  object: 'checkout.session';
  client_secret: string | null;
  customer: string | null;
  customer_email: string | null;
  customer_details?: {
    email?: string;
    name?: string;
  };
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'complete' | 'expired' | 'open';
  subscription: string | null;
  metadata?: Record<string, string>;
  url?: string;
}

/**
 * Create Stripe Checkout Session
 */
export async function createCheckoutSession(params: {
  mode: 'payment' | 'subscription';
  ui_mode?: 'embedded' | 'hosted';
  customer_email?: string;
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  success_url?: string;
  cancel_url?: string;
  return_url?: string;
  allow_promotion_codes?: boolean;
  metadata?: Record<string, string>;
}): Promise<StripeCheckoutSession> {
  const formData = encodeFormData(params);

  return stripeRequest<StripeCheckoutSession>(
    '/checkout/sessions',
    {
      method: 'POST',
      body: formData,
    }
  );
}

/**
 * Retrieve Stripe Checkout Session
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>(
    `/checkout/sessions/${sessionId}`
  );
}

/**
 * Stripe Webhook Event
 */
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

/**
 * Verify Stripe webhook signature
 */
export async function constructWebhookEvent(
  payload: string,
  signature: string
): Promise<StripeWebhookEvent> {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  // Parse signature header
  const signatureElements = signature.split(',').reduce((acc, element) => {
    const [key, value] = element.split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  const timestamp = signatureElements.t;
  const v1Signature = signatureElements.v1;

  if (!timestamp || !v1Signature) {
    throw new Error('Invalid signature format');
  }

  // Create signed payload
  const signedPayload = `${timestamp}.${payload}`;

  // Compute expected signature using Web Crypto API (Edge-compatible)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  // Convert to hex string
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Compare signatures
  if (expectedSignature !== v1Signature) {
    throw new Error('Webhook signature verification failed');
  }

  // Check timestamp is within tolerance (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  const timestampAge = currentTime - parseInt(timestamp, 10);
  if (timestampAge > 300) {
    throw new Error('Webhook timestamp too old');
  }

  // Parse and return event
  return JSON.parse(payload) as StripeWebhookEvent;
}

/**
 * Stripe Subscription
 */
export interface StripeSubscription {
  id: string;
  object: 'subscription';
  customer: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired';
  metadata?: Record<string, string>;
}

/**
 * Retrieve Stripe Subscription
 */
export async function retrieveSubscription(
  subscriptionId: string
): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>(
    `/subscriptions/${subscriptionId}`
  );
}

/**
 * Stripe Customer
 */
export interface StripeCustomer {
  id: string;
  object: 'customer';
  email: string | null;
  name: string | null;
  metadata?: Record<string, string>;
}

/**
 * Retrieve Stripe Customer
 */
export async function retrieveCustomer(
  customerId: string
): Promise<StripeCustomer> {
  return stripeRequest<StripeCustomer>(
    `/customers/${customerId}`
  );
}
