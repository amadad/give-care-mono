/**
 * Convex HTTP router - webhook endpoints for Twilio, health checks, auth
 */

import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { auth } from './auth'

const http = httpRouter()

// Add Convex Auth HTTP routes
auth.addHttpRoutes(http)

/**
 * Escape XML special characters to prevent XML injection in TwiML
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Health check

http.route({
  path: '/health',
  method: 'GET',
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        version: '0.2.0',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }),
})

// Twilio SMS webhook - handled by component
// The @convex-dev/twilio component will call twilio.onIncomingMessage
// when a message arrives at the configured Twilio phone number
http.route({
  path: '/twilio/sms',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Parse form data
    const formData = await request.formData()
    const from = String(formData.get('From') || '')
    const body = String(formData.get('Body') || '')
    const messageSid = String(formData.get('MessageSid') || '')
    const twilioSignature = request.headers.get('X-Twilio-Signature') || ''

    // Build params for signature validation (done in action)
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = String(value)
    })

    // Call our internal action to process the message (validates signature there)
    const result = await ctx.runAction(internal.twilio.onIncomingMessage, {
      from,
      body,
      messageSid,
      twilioSignature,
      requestUrl: request.url,
      params,
    })

    // If validation failed, return error
    if (result.error) {
      return new Response(result.error, {
        status: result.error === 'Unauthorized' ? 403 : 500,
      })
    }

    // Return TwiML with agent's response (with XML escaping)
    const escapedMessage = escapeXML(result.message)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapedMessage}</Message>
</Response>`

    return new Response(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }),
})

// Stripe webhooks - handle payment confirmations and subscription updates
http.route({
  path: '/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get('stripe-signature')
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    const payload = await request.text()

    const result = await ctx.runAction(internal.stripe.fulfillCheckout, {
      signature,
      payload,
    })

    if (result.success) {
      return new Response(null, { status: 200 })
    } else {
      console.error('Stripe webhook error:', result.error)
      return new Response('Webhook Error', { status: 400 })
    }
  }),
})

export default http
