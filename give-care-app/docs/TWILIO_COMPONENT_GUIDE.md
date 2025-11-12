# Twilio Component Integration Guide

**Using `@convex-dev/twilio` component for SMS in GiveCare.**

---

## Overview

The [Twilio SMS component](https://www.convex.dev/components) provides:
- ✅ Automatic message storage (sandboxed table)
- ✅ Automatic status tracking (delivery status updates)
- ✅ Built-in webhook handling (signature verification)
- ✅ Query methods (`listIncoming`, `listOutgoing`, `getMessagesByCounterparty`)
- ✅ No custom message table needed

---

## Installation

```bash
npm install @convex-dev/twilio
npx convex env set TWILIO_ACCOUNT_SID=ACxxxxx
npx convex env set TWILIO_AUTH_TOKEN=xxxxx
npx convex env set TWILIO_PHONE_NUMBER=+14151234567
```

---

## Setup

### 1. Register Component

```typescript
// convex/convex.config.ts
import { defineApp } from 'convex/server';
import twilio from '@convex-dev/twilio/convex.config';

const app = defineApp();
app.use(twilio);
export default app;
```

### 2. Create Twilio Client

```typescript
// convex/lib/twilio.ts
import { Twilio } from '@convex-dev/twilio';
import { components } from '../_generated/api';
import { internalMutation } from '../_generated/server';
import { messageValidator } from '@convex-dev/twilio';
import { internal } from '../_generated/api';

export const twilio = new Twilio(components.twilio, {
  defaultFrom: process.env.TWILIO_PHONE_NUMBER!,
});

// Handle incoming messages
twilio.incomingMessageCallback = internal.inbound.handleIncomingMessage;

export const handleIncomingMessage = internalMutation({
  args: { message: messageValidator },
  handler: async (ctx, { message }) => {
    // Component automatically saves message
    // This callback runs in same transaction
    
    // Trigger agent response
    await ctx.scheduler.runAfter(0, internal.inbound.processInbound, {
      phone: message.from,
      text: message.body,
      messageSid: message.sid,
    });
  },
});
```

### 3. Register Webhook Routes

```typescript
// convex/http.ts
import { httpRouter } from 'convex/server';
import { twilio } from './lib/twilio';

const http = httpRouter();

// ✅ Automatically registers:
// - /twilio/incoming-message
// - /twilio/message-status
twilio.registerRoutes(http);

export default http;
```

### 4. Configure Twilio Phone Number

**Option A: Via Twilio Console**
1. Go to Phone Numbers → Manage → Active Numbers
2. Click your phone number
3. Under "Messaging Configuration" → "A message comes in"
4. Set URL: `YOUR_CONVEX_SITE_URL/twilio/incoming-message`
5. Save

**Option B: Via Code**
```typescript
// convex/setup.ts
import { internalAction } from './_generated/server';
import { twilio } from './lib/twilio';

export const registerIncomingSmsHandler = internalAction({
  handler: async (ctx) => {
    return await twilio.registerIncomingSmsHandler(ctx, {
      sid: 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Your Twilio Phone Number SID
    });
  },
});
```

---

## Sending SMS

```typescript
// convex/inbound.ts
"use node";

import { internalAction } from './_generated/server';
import { twilio } from './lib/twilio';
import { v } from 'convex/values';

export const sendSmsResponse = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ Component handles sending and status tracking
    const status = await twilio.sendMessage(ctx, {
      to: args.to,
      body: args.text,
    });
    
    // status.sid - Message SID for tracking
    // Component automatically stores message and tracks status updates
    
    return { sent: true, sid: status.sid };
  },
});
```

---

## Receiving SMS

Incoming messages are automatically:
1. ✅ Saved to component's sandboxed `messages` table
2. ✅ Status tracked automatically
3. ✅ Your callback (`handleIncomingMessage`) invoked

**Message Status Values:**
- `queued` - Message queued for delivery
- `sent` - Message sent to carrier
- `delivered` - Message delivered to recipient
- `undelivered` - Message failed to deliver
- `failed` - Message failed to send

---

## Querying Messages

```typescript
// convex/messages.ts
import { query } from './_generated/server';
import { twilio } from './lib/twilio';
import { v } from 'convex/values';

// List all messages
export const listAll = query({
  handler: async (ctx) => {
    return await twilio.list(ctx);
  },
});

// List incoming messages
export const listIncoming = query({
  handler: async (ctx) => {
    return await twilio.listIncoming(ctx);
  },
});

// List outgoing messages
export const listOutgoing = query({
  handler: async (ctx) => {
    return await twilio.listOutgoing(ctx);
  },
});

// Get messages by phone number (both directions)
export const getMessagesByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    return await twilio.getMessagesByCounterparty(ctx, { from: phone });
  },
});

// Get messages sent to a number
export const getMessagesTo = query({
  args: { to: v.string() },
  handler: async (ctx, { to }) => {
    return await twilio.getMessagesTo(ctx, { to });
  },
});

// Get messages from a number
export const getMessagesFrom = query({
  args: { from: v.string() },
  handler: async (ctx, { from }) => {
    return await twilio.getMessagesFrom(ctx, { from });
  },
});

// Get message by SID (for status checking)
export const getMessageStatus = query({
  args: { sid: v.string() },
  handler: async (ctx, { sid }) => {
    const message = await twilio.getMessageBySid(ctx, { sid });
    return message?.status; // 'queued', 'sent', 'delivered', etc.
  },
});
```

---

## Migration from Custom Implementation

### Before (convex2)
```typescript
// Custom Twilio client
import twilio from 'twilio';
const client = twilio(accountSid, authToken);

// Manual webhook handling
http.route({
  path: '/webhooks/twilio/sms',
  handler: async (ctx, request) => {
    // Manual signature verification
    const isValid = await verifyTwilioSignature(...);
    
    // Manual message storage
    await ctx.runMutation(api.internal.recordInbound, {
      message: { text: body, from: from, ... },
    });
  },
});

// Manual message sending
await client.messages.create({ to, body });
```

### After (convex with component)
```typescript
// Component client
import { Twilio } from '@convex-dev/twilio';
export const twilio = new Twilio(components.twilio, {...});

// Automatic webhook handling
twilio.registerRoutes(http);

// Component handles sending + storage
await twilio.sendMessage(ctx, { to, body });
```

---

## Benefits

1. **No Custom Message Table** - Component has its own sandboxed table
2. **Automatic Status Tracking** - Component subscribes to Twilio status webhooks
3. **Built-in Query Methods** - No need to write custom queries
4. **Signature Verification** - Component handles webhook security
5. **Less Code** - ~70% reduction in Twilio-related code

---

## Integration with Agent Component

The Twilio component works seamlessly with Agent Component:

```typescript
// Incoming message → Agent response flow
twilio.incomingMessageCallback = internal.inbound.handleIncomingMessage;

export const handleIncomingMessage = internalMutation({
  args: { message: messageValidator },
  handler: async (ctx, { message }) => {
    // 1. Component saves message automatically
    // 2. Trigger agent response
    await ctx.scheduler.runAfter(0, internal.agents.main.runMainAgent, {
      input: {
        channel: 'sms',
        text: message.body,
        userId: message.from, // Phone number as externalId
      },
      context: { /* ... */ },
    });
  },
});

// Agent response → SMS sending
export const sendAgentResponse = internalAction({
  handler: async (ctx, { phone, text }) => {
    // Use component to send
    await twilio.sendMessage(ctx, { to: phone, body: text });
  },
});
```

---

## Error Handling

```typescript
export const sendSmsResponse = internalAction({
  handler: async (ctx, args) => {
    try {
      const status = await twilio.sendMessage(ctx, {
        to: args.to,
        body: args.text,
      });
      return { success: true, sid: status.sid };
    } catch (error) {
      // Component handles Twilio API errors
      console.error('Failed to send SMS:', error);
      return { success: false, error: String(error) };
    }
  },
});
```

---

## Rate Limiting

Combine with Rate Limiter component:

```typescript
import { RateLimiter } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';

const rateLimiter = new RateLimiter(components.rateLimiter);

export const sendSmsResponse = internalAction({
  handler: async (ctx, args) => {
    // Check rate limit first
    const limitCheck = await rateLimiter.check(ctx, {
      key: `sms:${args.to}`,
      limit: 10, // 10 SMS per day
      window: 24 * 60 * 60 * 1000,
    });
    
    if (!limitCheck.allowed) {
      throw new Error('SMS rate limit exceeded');
    }
    
    // Send via Twilio component
    return await twilio.sendMessage(ctx, { to: args.to, body: args.text });
  },
});
```

---

## References

- [Twilio Component Docs](https://www.convex.dev/components)
- [Twilio Component Package](https://www.npmjs.com/package/@convex-dev/twilio)
- [Twilio Status Values](https://www.twilio.com/docs/sms/api/message-resource#message-status-values)

---

**Last Updated**: 2025-11-11

