/**
 * Webhook Signature Verification Helpers
 *
 * Ensures webhooks are authentic and prevents spoofing attacks.
 *
 * CRITICAL SECURITY:
 * - Twilio: X-Twilio-Signature with exact request URL + body
 * - Stripe: Stripe-Signature using webhook secret
 *
 * WHY: Without signature verification, attackers can forge webhooks
 * and trigger unauthorized actions (sending SMS, creating subscriptions, etc.)
 */

import crypto from 'crypto'

/**
 * Verify Twilio webhook signature
 *
 * Twilio signs requests using HMAC-SHA1 with your auth token.
 * The signature is computed from the full URL + all POST parameters.
 *
 * @param authToken - Twilio auth token (from environment)
 * @param signature - X-Twilio-Signature header value
 * @param url - Full request URL (must be exact, including query params)
 * @param params - All POST parameters as key-value pairs
 * @returns True if signature is valid
 *
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */
export function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  // Sort params by key and concatenate as: url + key1 + value1 + key2 + value2...
  const sortedKeys = Object.keys(params).sort()
  const data = sortedKeys.reduce((acc, key) => {
    return acc + key + params[key]
  }, url)

  // Compute HMAC-SHA1
  const hmac = crypto.createHmac('sha1', authToken)
  hmac.update(data)
  const expectedSignature = hmac.digest('base64')

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Verify Stripe webhook signature
 *
 * Stripe signs webhook payloads using HMAC-SHA256.
 * The signature header contains timestamp and signatures.
 *
 * @param webhookSecret - Stripe webhook secret (from Stripe dashboard)
 * @param signature - Stripe-Signature header value
 * @param payload - Raw request body (must be string, not parsed JSON)
 * @param toleranceSeconds - Allow clock skew (default 300s = 5 minutes)
 * @returns True if signature is valid
 *
 * @see https://stripe.com/docs/webhooks/signatures
 */
export function verifyStripeSignature(
  webhookSecret: string,
  signature: string,
  payload: string,
  toleranceSeconds = 300
): boolean {
  // Parse signature header: t=timestamp,v1=sig1,v1=sig2,...
  const parts = signature.split(',')
  const timestamps: number[] = []
  const signatures: string[] = []

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') {
      timestamps.push(parseInt(value, 10))
    } else if (key === 'v1') {
      signatures.push(value)
    }
  }

  if (timestamps.length === 0 || signatures.length === 0) {
    return false
  }

  // Use the most recent timestamp
  const timestamp = Math.max(...timestamps)

  // Check timestamp tolerance (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`
  const hmac = crypto.createHmac('sha256', webhookSecret)
  hmac.update(signedPayload)
  const expectedSignature = hmac.digest('hex')

  // Check if any signature matches (constant-time)
  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(sig),
        Buffer.from(expectedSignature)
      )
    } catch {
      return false
    }
  })
}

/**
 * Extract Stripe event from verified webhook
 *
 * @param payload - Raw request body (string)
 * @returns Parsed Stripe event object
 */
export function parseStripeEvent(payload: string): any {
  try {
    return JSON.parse(payload)
  } catch (error) {
    throw new Error(`Invalid JSON in Stripe webhook payload: ${error}`)
  }
}

/**
 * Webhook verification result
 */
export type WebhookVerificationResult =
  | { valid: true }
  | { valid: false; reason: string }

/**
 * Verify Twilio webhook with detailed error
 */
export function verifyTwilioWebhook(
  authToken: string | undefined,
  signature: string | undefined,
  url: string,
  params: Record<string, string>
): WebhookVerificationResult {
  if (!authToken) {
    return { valid: false, reason: 'Missing TWILIO_AUTH_TOKEN in environment' }
  }

  if (!signature) {
    return { valid: false, reason: 'Missing X-Twilio-Signature header' }
  }

  const isValid = verifyTwilioSignature(authToken, signature, url, params)

  if (!isValid) {
    return { valid: false, reason: 'Invalid Twilio signature' }
  }

  return { valid: true }
}

/**
 * Verify Stripe webhook with detailed error
 */
export function verifyStripeWebhook(
  webhookSecret: string | undefined,
  signature: string | undefined,
  payload: string
): WebhookVerificationResult {
  if (!webhookSecret) {
    return {
      valid: false,
      reason: 'Missing STRIPE_WEBHOOK_SECRET in environment',
    }
  }

  if (!signature) {
    return { valid: false, reason: 'Missing Stripe-Signature header' }
  }

  const isValid = verifyStripeSignature(webhookSecret, signature, payload)

  if (!isValid) {
    return { valid: false, reason: 'Invalid Stripe signature or timestamp' }
  }

  return { valid: true }
}
