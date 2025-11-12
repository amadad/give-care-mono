# Convex Idiomatic Patterns - Reference Guide

**Quick reference for Convex/Agent Component idiomatic patterns used in GiveCare migration.**

---

## 1. Agent Definition (Idiomatic)

### ✅ Correct Pattern
```typescript
"use node";

import { Agent } from '@convex-dev/agent';
import { components } from '../_generated/api';
import { openai } from '@ai-sdk/openai';

export const mainAgent = new Agent(components.agent, {
  name: 'Agent Name',
  languageModel: openai('gpt-5-nano'),
  instructions: 'System prompt',
  tools: { tool1, tool2 },
  maxSteps: 5,
  // ✅ No custom contextHandler - use contextOptions instead
});
```

### ❌ Anti-Pattern
```typescript
export const mainAgent = new Agent(components.agent, {
  // ...
  contextHandler: async (ctx, args) => {
    // ❌ Custom handler - use contextOptions in generateText() instead
    return [...];
  },
});
```

---

## 2. Memory & Context (Idiomatic)

### ✅ Correct Pattern - Use Agent Component's Built-in Memory
```typescript
const result = await thread.generateText({
  prompt: input.text,
  contextOptions: {
    searchOtherThreads: true,  // ✅ Searches all user's threads
    recentMessages: 10,
    searchOptions: {
      textSearch: true,
      vectorSearch: true,
      limit: 10,
    },
  },
});
```

### ❌ Anti-Pattern - Custom Memory System
```typescript
// ❌ Don't build custom memory system
const memories = await ctx.runQuery(internal.retrieveMemories, {...});
ctx.scheduler.runAfter(0, internal.enrichThreadContext, {...});
```

---

## 3. Thread Management (Idiomatic)

### ✅ Correct Pattern - Let Agent Component Manage
```typescript
// Create thread
const { threadId, thread } = await agent.createThread(ctx, {
  userId: user._id,
  metadata: { /* GiveCare-specific metadata */ },
});

// Continue thread
const { thread } = await agent.continueThread(ctx, { threadId });

// Agent Component automatically saves messages
const result = await thread.generateText({ prompt: input.text });
```

### ❌ Anti-Pattern - Custom Thread Storage
```typescript
// ❌ Don't create custom threads table
threads: defineTable({...})

// ❌ Don't manually save messages
await ctx.runMutation(api.recordOutbound, { message: {...} });
```

---

## 4. Tool Definition (Idiomatic)

### ✅ Correct Pattern - Use `createTool`
```typescript
"use node";

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const myTool = createTool({
  description: 'Tool description',
  args: z.object({
    param: z.string().describe('Parameter description'),
  }),
  handler: async (ctx, args) => {
    // ctx.userId available automatically
    const result = await ctx.runQuery(api.example.query, {
      userId: ctx.userId,
      param: args.param,
    });
    
    return { success: true, data: result };
  },
});
```

### ❌ Anti-Pattern - Custom Tool Implementation
```typescript
// ❌ Don't build custom tool system
export const myTool = {
  name: 'myTool',
  execute: async (args) => { /* ... */ },
};
```

---

## 5. Workflow Definition (Idiomatic)

### ✅ Correct Pattern - Use Workflow Component
```typescript
import { WorkflowManager } from '@convex-dev/workflow';
import { components, internal } from '../_generated/api';
import { v } from 'convex/values';

const workflow = new WorkflowManager(components.workflow);

export const myWorkflow = workflow.define({
  args: {
    userId: v.id('users'),
    data: v.string(),
  },
  handler: async (step, args) => {
    // Step 1: Mutation
    const id = await step.runMutation(internal.example.create, {
      userId: args.userId,
      data: args.data,
    });
    
    // Step 2: Action
    await step.runAction(internal.example.process, {
      id,
    });
    
    // Step 3: Query
    const result = await step.runQuery(internal.example.get, { id });
    
    return { success: true, result };
  },
});
```

### ❌ Anti-Pattern - Manual Workflow
```typescript
// ❌ Don't build manual workflow system
export const myWorkflow = action({
  handler: async (ctx, args) => {
    // Manual retry logic, state management, etc.
  },
});
```

---

## 6. Schema Design (Idiomatic)

### ✅ Correct Pattern - Only GiveCare-Specific Tables
```typescript
export default defineSchema({
  // ✅ Users (GiveCare-specific)
  users: defineTable({
    externalId: v.string(),
    phone: v.optional(v.string()),
    metadata: v.any(), // Profile, wellness, etc.
  }).index('by_externalId', ['externalId']),

  // ✅ Assessments (GiveCare-specific)
  assessments: defineTable({
    userId: v.id('users'),
    definitionId: v.string(),
    answers: v.array(v.object({...})),
  }).index('by_user', ['userId']),

  // ✅ Lightweight memories (for category queries only)
  // Semantic search handled by Agent Component
  memories: defineTable({
    userId: v.id('users'),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
    // ✅ No embedding - Agent Component handles semantic search
  }).index('by_user_category', ['userId', 'category']),
});
```

### ❌ Anti-Pattern - Duplicate Agent Component Tables
```typescript
// ❌ Don't create tables that Agent Component manages
threads: defineTable({...}),  // Agent Component has this
messages: defineTable({...}), // Agent Component has this
sessions: defineTable({       // Use thread metadata instead
  promptHistory: [...],       // Agent Component has this
  budget: {...},              // Can be in metadata
}),
```

---

## 7. Querying Messages (Idiomatic)

### ✅ Correct Pattern - Use Agent Component API
```typescript
import { paginationOptsValidator } from 'convex/server';

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const messages = await agent.listMessages(ctx, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
    return messages;
  },
});
```

### ❌ Anti-Pattern - Query Custom Messages Table
```typescript
// ❌ Don't query custom messages table
const messages = await ctx.db
  .query('messages')
  .withIndex('by_user', (q) => q.eq('userId', userId))
  .collect();
```

---

## 8. Rate Limiting (Idiomatic)

### ✅ Correct Pattern - Use Rate Limiter Component
```typescript
import { RateLimiter } from '@convex-dev/rate-limiter';
import { components } from '../_generated/api';

const rateLimiter = new RateLimiter(components.rateLimiter);

export const checkLimit = async (ctx: ActionCtx, key: string) => {
  const result = await rateLimiter.check(ctx, {
    key,
    limit: 10,
    window: 24 * 60 * 60 * 1000, // 24 hours
  });
  
  if (!result.allowed) {
    throw new Error('Rate limit exceeded');
  }
};
```

### ❌ Anti-Pattern - Custom Rate Limiting
```typescript
// ❌ Don't build custom rate limiting
const count = await ctx.db
  .query('rate_limits')
  .withIndex('by_key', (q) => q.eq('key', key))
  .collect();
// Manual counting, windowing, etc.
```

---

## 9. Usage Tracking (Idiomatic)

### ✅ Correct Pattern - Use Agent Component's Built-in
```typescript
// In agent config
import { usageHandler } from '../usage_tracking/usageHandler';

export const defaultConfig = {
  languageModel,
  usageHandler, // ✅ Agent Component tracks usage automatically
  // ...
};
```

### ❌ Anti-Pattern - Manual Usage Tracking
```typescript
// ❌ Don't manually track usage
await ctx.runMutation(api.logUsage, {
  userId,
  tokens: result.usage.totalTokens,
  cost: calculateCost(result.usage),
});
```

---

## 10. Twilio Integration (Idiomatic)

### ✅ Correct Pattern - Use Twilio Component
```typescript
// convex/lib/twilio.ts
import { Twilio } from '@convex-dev/twilio';
import { components } from '../_generated/api';
import { messageValidator } from '@convex-dev/twilio';

export const twilio = new Twilio(components.twilio, {
  defaultFrom: process.env.TWILIO_PHONE_NUMBER!,
});

// Handle incoming messages via callback
twilio.incomingMessageCallback = internal.inbound.handleIncomingMessage;

// convex/http.ts
import { twilio } from './lib/twilio';

const http = httpRouter();
twilio.registerRoutes(http); // ✅ Registers webhook routes automatically
export default http;

// Send message
await twilio.sendMessage(ctx, {
  to: '+14151234567',
  body: 'Hello!',
});

// Query messages
const messages = await twilio.getMessagesByCounterparty(ctx, { from: phone });
```

### ❌ Anti-Pattern - Custom Twilio Implementation
```typescript
// ❌ Don't build custom Twilio client
import twilio from 'twilio';
const client = twilio(accountSid, authToken);

// ❌ Don't manually handle webhooks
http.route({
  path: '/webhooks/twilio/sms',
  handler: async (ctx, request) => {
    // Manual signature verification
    // Manual message storage
  },
});
```

## 11. HTTP Handlers (Idiomatic)

### ✅ Correct Pattern - Use httpRouter
```typescript
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';

const http = httpRouter();

// For custom webhooks (Stripe, etc.)
http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Verify signature
    // Process request
    await ctx.runAction(internal.processStripeEvent, {...});
    
    return new Response('OK', { status: 200 });
  }),
});

export default http;
```

### ❌ Anti-Pattern - Custom HTTP Handling
```typescript
// ❌ Don't build custom HTTP server
export const handleWebhook = async (req: Request) => {
  // Manual routing, verification, etc.
};
```

---

## Key Principles

1. **Let Agent Component manage threads/messages** - Don't duplicate
2. **Use `contextOptions` for memory** - Don't build custom system
3. **Use `createTool` for tools** - Follow Convex pattern
4. **Use Workflow Component** - Don't build manual workflows
5. **Store only GiveCare-specific data** - Let components handle the rest
6. **Use component APIs** - `agent.listMessages()`, `rateLimiter.check()`, etc.

---

## Migration Checklist

When migrating a feature, ask:

- [ ] Am I duplicating what Agent Component provides?
- [ ] Am I using `contextOptions` for memory search?
- [ ] Am I using `createTool` for tools?
- [ ] Am I using Workflow Component for multi-step flows?
- [ ] Am I storing only GiveCare-specific data?
- [ ] Am I using component APIs instead of custom queries?

---

**Last Updated**: 2025-11-11

