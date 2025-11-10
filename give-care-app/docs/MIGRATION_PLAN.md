# Feature Migration Plan: convex2 → convex

**Date**: 2025-01-14  
**Status**: Planning  
**Goal**: Migrate GiveCare features from `convex2` to `convex` using Convex idiomatic patterns

---

## Executive Summary

This plan migrates all GiveCare features from `convex2` (custom implementation) to `convex` (boilerplate) using **Convex Agent Component's built-in capabilities** and idiomatic patterns. The migration eliminates redundancy, improves performance, and aligns with FEATURES.md requirements.

**Key Principles:**
1. ✅ Use Agent Component's built-in memory/search (no custom memory system)
2. ✅ Let Agent Component manage threads/messages (no duplicate storage)
3. ✅ Use `contextOptions` for memory retrieval (no async enrichment)
4. ✅ Store only GiveCare-specific state (let Agent Component handle the rest)
5. ✅ Follow Convex patterns from boilerplate (tools, agents, workflows)

---

## Architecture Overview

### Current State (convex2)
- ❌ Custom threads table (redundant)
- ❌ Custom messages table (redundant)
- ❌ Custom memory system (redundant)
- ❌ Complex context hydration (redundant)
- ✅ Good feature implementation (assessments, tools, workflows)

### Target State (convex)
- ✅ Agent Component manages threads/messages automatically
- ✅ Agent Component's built-in memory via `contextOptions`
- ✅ Simplified schema (only GiveCare-specific tables)
- ✅ Idiomatic Convex patterns (tools, agents, workflows)
- ✅ All features from convex2 migrated

---

## Migration Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up core infrastructure using Agent Component

#### 1.1 Schema Migration
**From**: `convex2/schema.ts` (20+ tables)  
**To**: Simplified schema using Agent Component

**Keep (GiveCare-specific):**
```typescript
// convex/schema.ts
export default defineSchema({
  // Users (GiveCare-specific fields only)
  users: defineTable({
    externalId: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
    locale: v.string(),
    consent: v.optional(consentValidator),
    address: v.optional(addressValidator),
    metadata: v.any(), // Profile, wellness, preferences
  })
    .index('by_externalId', ['externalId'])
    .index('by_phone', ['phone']),

  // Assessments (GiveCare-specific)
  assessments: defineTable({
    userId: v.id('users'),
    definitionId: v.string(), // 'ema', 'bsfc', 'reach2', 'sdoh'
    version: v.string(),
    answers: v.array(v.object({ questionId: v.string(), value: v.number() })),
    completedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_definition', ['userId', 'definitionId']),

  // Scores (GiveCare-specific)
  scores: defineTable({
    userId: v.id('users'),
    assessmentId: v.id('assessments'),
    composite: v.number(),
    band: v.string(), // 'crisis', 'moderate', 'stable', 'thriving'
    zones: v.object({
      emotional: v.number(),
      physical: v.number(),
      social: v.number(),
      time: v.number(),
      financial: v.optional(v.number()),
    }),
    confidence: v.number(),
  }).index('by_user', ['userId']),

  // Interventions (GiveCare-specific)
  interventions: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    targetZones: v.array(v.string()),
    evidenceLevel: v.string(), // 'high', 'moderate', 'low'
    duration: v.string(),
    tags: v.array(v.string()),
    content: v.string(),
  })
    .index('by_category', ['category'])
    .index('by_evidence', ['evidenceLevel']),

  // Subscriptions (GiveCare-specific)
  subscriptions: defineTable({
    userId: v.id('users'),
    stripeCustomerId: v.string(),
    planId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_customer', ['stripeCustomerId']),

  // Structured memories (lightweight, for category queries only)
  // Semantic search handled by Agent Component
  memories: defineTable({
    userId: v.id('users'),
    category: v.string(), // 'care_routine', 'preference', 'intervention_result', 'crisis_trigger'
    content: v.string(),
    importance: v.number(), // 1-10
    // No embedding - Agent Component handles semantic search
  }).index('by_user_category', ['userId', 'category']),

  // Metrics (GiveCare-specific)
  metrics_daily: defineTable({
    date: v.string(), // YYYY-MM-DD
    totalUsers: v.number(),
    activeUsers: v.number(),
    newUsers: v.number(),
    totalMessages: v.number(),
    avgBurnoutScore: v.number(),
    crisisAlerts: v.number(),
  }).index('by_date', ['date']),
});
```

**Remove (Agent Component handles):**
- ❌ `threads` table (Agent Component manages)
- ❌ `messages` table (Agent Component manages)
- ❌ `sessions` table (use thread metadata instead)
- ❌ `memories.embedding` (Agent Component handles semantic search)

#### 1.2 Component Setup
**From**: `convex2/convex.config.ts`  
**To**: `convex/convex.config.ts`

```typescript
// convex/convex.config.ts
import { defineApp } from 'convex/server';
import agent from '@convex-dev/agent/convex.config';
import workflow from '@convex-dev/workflow/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import twilio from '@convex-dev/twilio/convex.config'; // ✅ Twilio SMS component

const app = defineApp();
app.use(agent);      // ✅ Thread/message management
app.use(workflow);   // ✅ Durable workflows
app.use(rateLimiter); // ✅ Rate limiting
app.use(twilio);     // ✅ SMS sending/receiving

export default app;
```

**Environment Variables:**
```bash
npx convex env set TWILIO_ACCOUNT_SID=ACxxxxx
npx convex env set TWILIO_AUTH_TOKEN=xxxxx
npx convex env set TWILIO_PHONE_NUMBER=+14151234567
```

#### 1.3 Core Utilities
**Migrate from**: `convex2/core.ts`  
**To**: `convex/lib/core.ts`

**Simplified version** (no session/thread management):
```typescript
// convex/lib/core.ts
import { v } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';

// Only GiveCare-specific helpers
export const ensureUser = async (ctx: MutationCtx, params: {
  externalId: string;
  channel: 'sms' | 'email' | 'web';
  phone?: string;
  locale?: string;
}) => {
  const existing = await ctx.db
    .query('users')
    .withIndex('by_externalId', (q) => q.eq('externalId', params.externalId))
    .unique();
  
  if (existing) return existing;
  
  const userId = await ctx.db.insert('users', {
    externalId: params.externalId,
    phone: params.phone,
    channel: params.channel,
    locale: params.locale || 'en-US',
    metadata: {},
  });
  
  return ctx.db.get(userId)!;
};
```

---

### Phase 2: Agents (Week 1-2)
**Goal**: Migrate 3 agents using Agent Component properly

#### 2.1 Main Agent
**From**: `convex2/agents/main.ts`  
**To**: `convex/agents/main.ts`

**Key Changes:**
- ✅ Use Agent Component's `contextOptions` for memory (no custom `enrichThreadContext`)
- ✅ Remove custom `contextHandler` (use built-in)
- ✅ Let Agent Component save messages automatically

```typescript
// convex/agents/main.ts
"use node";

import { Agent } from '@convex-dev/agent';
import { components } from '../_generated/api';
import { openai } from '@ai-sdk/openai';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';
import { extractProfileVariables, buildWellnessInfo } from '../lib/profile';
import { searchResources } from '../tools/searchResources';
import { recordMemory } from '../tools/recordMemory';
import { checkWellnessStatus } from '../tools/checkWellnessStatus';
import { findInterventions } from '../tools/findInterventions';
import { updateProfile } from '../tools/updateProfile';
import { startAssessment } from '../tools/startAssessment';

export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: openai('gpt-5-nano'),
  instructions: MAIN_PROMPT,
  tools: {
    searchResources,
    recordMemory,
    check_wellness_status: checkWellnessStatus,
    find_interventions: findInterventions,
    update_profile: updateProfile,
    start_assessment: startAssessment,
  },
  maxSteps: 5,
  // ✅ No custom contextHandler - use contextOptions in generateText()
});

export const runMainAgent = action({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }) => {
    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    
    const { userName, relationship, careRecipient } = extractProfileVariables(profile);
    const wellnessInfo = buildWellnessInfo(metadata);
    
    const systemPrompt = renderPrompt(MAIN_PROMPT, {
      userName,
      relationship,
      careRecipient,
      wellnessInfo,
    });

    // Get or create thread
    let thread;
    let newThreadId: string;
    
    if (threadId) {
      const result = await mainAgent.continueThread(ctx, {
        threadId,
        userId: context.userId,
      });
      thread = result.thread;
      newThreadId = threadId;
    } else {
      const result = await mainAgent.createThread(ctx, {
        userId: context.userId,
        metadata: { /* GiveCare-specific metadata */ },
      });
      thread = result.thread;
      newThreadId = result.threadId;
    }

    // ✅ Use Agent Component's built-in memory search
    const result = await thread.generateText({
      prompt: input.text,
      system: systemPrompt,
      contextOptions: {
        searchOtherThreads: true,  // ✅ Built-in cross-thread memory
        recentMessages: 10,
        searchOptions: {
          textSearch: true,
          vectorSearch: true,
          limit: 10,
        },
      },
    });

    // ✅ Agent Component automatically saves message
    // No manual recordOutbound needed!

    return {
      text: result.text,
      threadId: newThreadId,
    };
  },
});
```

#### 2.2 Crisis Agent
**From**: `convex2/agents/crisis.ts`  
**To**: `convex/agents/crisis.ts`

**Key Changes:**
- ✅ Fast response (<600ms) - no tools, minimal steps
- ✅ Use Agent Component's thread management
- ✅ Trigger workflow for follow-up

```typescript
// convex/agents/crisis.ts
"use node";

import { Agent } from '@convex-dev/agent';
import { components } from '../_generated/api';
import { openai } from '@ai-sdk/openai';
import { CRISIS_PROMPT } from '../lib/prompts';

export const crisisAgent = new Agent(components.agent, {
  name: 'Crisis Support',
  languageModel: openai('gpt-5-nano'),
  instructions: CRISIS_PROMPT,
  maxSteps: 1, // ✅ No tools - prioritize speed
});

export const runCrisisAgent = internalAction({
  args: {
    input: v.object({ text: v.string(), userId: v.string() }),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, threadId }) => {
    const { thread } = threadId
      ? await crisisAgent.continueThread(ctx, { threadId })
      : await crisisAgent.createThread(ctx, { userId: input.userId });

    // ✅ Fast response - no context search needed
    const result = await thread.generateText({
      prompt: input.text,
      system: CRISIS_PROMPT,
      contextOptions: {
        recentMessages: 0, // ✅ No search for speed
        searchOptions: { limit: 0 },
      },
    });

    // Trigger workflow for follow-up
    await ctx.runAction(internal.workflows.crisisEscalation, {
      userId: input.userId,
      threadId: threadId || result.threadId,
      messageText: input.text,
    });

    return { text: result.text, threadId: result.threadId };
  },
});
```

#### 2.3 Assessment Agent
**From**: `convex2/agents/assessment.ts`  
**To**: `convex/agents/assessment.ts`

**Key Changes:**
- ✅ Use Agent Component's thread management
- ✅ Store assessment results in GiveCare-specific tables
- ✅ Use tools for intervention matching

```typescript
// convex/agents/assessment.ts
"use node";

import { Agent } from '@convex-dev/agent';
import { components } from '../_generated/api';
import { openai } from '@ai-sdk/openai';
import { ASSESSMENT_PROMPT } from '../lib/prompts';
import { getInterventions } from '../tools/getInterventions';

export const assessmentAgent = new Agent(components.agent, {
  name: 'Assessment Specialist',
  languageModel: openai('gpt-5-mini'),
  instructions: ASSESSMENT_PROMPT,
  tools: { getInterventions },
  maxSteps: 2,
});
```

---

### Phase 3: Tools (Week 2)
**Goal**: Migrate all tools using `createTool` pattern

#### 3.1 Tool Migration List

| Tool | From | To | Notes |
|------|------|-----|-------|
| `searchResources` | `convex2/tools/searchResources.ts` | `convex/tools/searchResources.ts` | ✅ Already uses `createTool` |
| `recordMemory` | `convex2/tools/recordMemory.ts` | `convex/tools/recordMemory.ts` | ✅ Store in lightweight table, use Agent Component for search |
| `checkWellnessStatus` | `convex2/tools/checkWellnessStatus.ts` | `convex/tools/checkWellnessStatus.ts` | ✅ Query scores table |
| `findInterventions` | `convex2/tools/findInterventions.ts` | `convex/tools/findInterventions.ts` | ✅ Already uses `createTool` |
| `updateProfile` | `convex2/tools/updateProfile.ts` | `convex/tools/updateProfile.ts` | ✅ Update user.metadata |
| `startAssessment` | `convex2/tools/startAssessment.ts` | `convex/tools/startAssessment.ts` | ✅ Create assessment record |

#### 3.2 Tool Pattern (Idiomatic)
```typescript
// convex/tools/example.ts
"use node";

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const exampleTool = createTool({
  description: 'Tool description',
  args: z.object({
    param: z.string().describe('Parameter description'),
  }),
  handler: async (ctx, args) => {
    // ctx.userId available automatically
    // ctx.runQuery, ctx.runMutation, ctx.runAction available
    
    const result = await ctx.runQuery(api.example.query, {
      userId: ctx.userId,
      param: args.param,
    });
    
    return { success: true, data: result };
  },
});
```

---

### Phase 4: Workflows (Week 2-3)
**Goal**: Migrate crisis workflows using Workflow Component

#### 4.1 Crisis Escalation Workflow
**From**: `convex2/workflows.ts`  
**To**: `convex/workflows/crisis.ts`

```typescript
// convex/workflows/crisis.ts
import { WorkflowManager } from '@convex-dev/workflow';
import { components, internal } from '../_generated/api';
import { v } from 'convex/values';

const workflow = new WorkflowManager(components.workflow);

export const crisisEscalation = workflow.define({
  args: {
    userId: v.id('users'),
    threadId: v.string(),
    messageText: v.string(),
    crisisTerms: v.array(v.string()),
  },
  handler: async (step, args) => {
    // Step 1: Log crisis event
    const alertId = await step.runMutation(internal.alerts.create, {
      userId: args.userId,
      type: 'crisis_detected',
      severity: 'critical',
      message: `Crisis detected: ${args.crisisTerms.join(', ')}`,
    });

    // Step 2: Generate response (already done by crisis agent)
    // This workflow handles follow-up

    // Step 3: Schedule follow-up (24 hours)
    await step.runMutation(internal.triggers.create, {
      userId: args.userId,
      type: 'one_off',
      nextRun: Date.now() + 24 * 60 * 60 * 1000,
      payload: { alertId, threadId: args.threadId },
    });

    return { success: true, alertId };
  },
});
```

---

### Phase 5: HTTP & Integrations (Week 3)
**Goal**: Migrate Twilio (using component) and Stripe webhooks

#### 5.1 Twilio Integration (Using Component)
**From**: `convex2/twilioClient.ts` + custom webhook handling  
**To**: `@convex-dev/twilio` component

**Installation:**
```bash
npm install @convex-dev/twilio
npx convex env set TWILIO_ACCOUNT_SID=ACxxxxx
npx convex env set TWILIO_AUTH_TOKEN=xxxxx
```

**Component Setup:**
```typescript
// convex/convex.config.ts
import { defineApp } from 'convex/server';
import agent from '@convex-dev/agent/convex.config';
import workflow from '@convex-dev/workflow/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import twilio from '@convex-dev/twilio/convex.config'; // ✅ Add Twilio component

const app = defineApp();
app.use(agent);
app.use(workflow);
app.use(rateLimiter);
app.use(twilio); // ✅ Register Twilio component

export default app;
```

**Twilio Client:**
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

// ✅ Handle incoming messages via callback
twilio.incomingMessageCallback = internal.inbound.handleIncomingMessage;

export const handleIncomingMessage = internalMutation({
  args: { message: messageValidator },
  handler: async (ctx, { message }) => {
    // Component automatically saves message to its own table
    // This callback runs in the same transaction
    
    // Trigger agent response
    await ctx.scheduler.runAfter(0, internal.inbound.processInbound, {
      phone: message.from,
      text: message.body,
      messageSid: message.sid,
    });
  },
});
```

**HTTP Router:**
```typescript
// convex/http.ts
import { httpRouter } from 'convex/server';
import { twilio } from './lib/twilio';
import { api, internal } from './_generated/api';
import { httpAction } from './_generated/server';
import Stripe from 'stripe';

const http = httpRouter();

// ✅ Register Twilio webhook routes automatically
twilio.registerRoutes(http);

// Stripe webhook (keep existing)
http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // ... existing Stripe handler
  }),
});

export default http;
```

**Sending SMS:**
```typescript
// convex/inbound.ts
"use node";

import { internalAction } from './_generated/server';
import { twilio } from './lib/twilio';
import { enforceOutboundSmsLimit } from './lib/rateLimiting';

export const sendSmsResponse = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ Use component's sendMessage
    const status = await twilio.sendMessage(ctx, {
      to: args.to,
      body: args.text,
    });
    
    // Component automatically tracks message status
    // Query later via: twilio.getMessageBySid(ctx, { sid: status.sid })
    
    return { sent: true, sid: status.sid };
  },
});
```

**Querying Messages:**
```typescript
// convex/messages.ts
import { query } from './_generated/server';
import { twilio } from './lib/twilio';
import { v } from 'convex/values';

export const listMessages = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    // ✅ Use component's query methods
    const messages = await twilio.getMessagesByCounterparty(ctx, {
      from: phone,
    });
    
    return messages;
  },
});

export const getMessageStatus = query({
  args: { sid: v.string() },
  handler: async (ctx, { sid }) => {
    // ✅ Component tracks delivery status automatically
    const message = await twilio.getMessageBySid(ctx, { sid });
    return message?.status; // 'queued', 'sent', 'delivered', 'failed', etc.
  },
});
```

**Benefits:**
- ✅ Automatic message storage (component manages its own table)
- ✅ Automatic status tracking (Twilio webhooks handled automatically)
- ✅ Built-in query methods (`listIncoming`, `listOutgoing`, `getMessagesByCounterparty`)
- ✅ No manual webhook signature verification (component handles it)
- ✅ No custom message table needed (component has its own sandboxed table)

#### 5.2 Stripe Webhook
**From**: `convex2/http.ts`  
**To**: `convex/http.ts`

```typescript
// Add to convex/http.ts
http.route({
  path: '/webhooks/stripe',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Verify signature
    // Process event
    await ctx.runMutation(api.billing.applyStripeEvent, {
      id: event.id,
      type: event.type,
      payload: event,
    });
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});
```

---

### Phase 6: Assessments (Week 3-4)
**Goal**: Migrate assessment system

#### 6.1 Assessment Catalog
**From**: `convex2/lib/assessmentCatalog.ts`  
**To**: `convex/lib/assessments.ts`

**Keep as-is** - pure data structure:
```typescript
// convex/lib/assessments.ts
export const CATALOG = {
  ema: { /* ... */ },
  bsfc: { /* ... */ },
  reach2: { /* ... */ },
  sdoh: { /* ... */ },
};
```

#### 6.2 Assessment Queries/Mutations
**From**: `convex2/public.ts` (assessment functions)  
**To**: `convex/assessments.ts`

```typescript
// convex/assessments.ts
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getAssessment = query({
  args: { userId: v.id('users'), definitionId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('assessments')
      .withIndex('by_user_definition', (q) =>
        q.eq('userId', args.userId).eq('definitionId', args.definitionId)
      )
      .order('desc')
      .first();
  },
});

export const submitAnswer = mutation({
  args: {
    userId: v.id('users'),
    definitionId: v.string(),
    questionId: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    // Find or create assessment session
    // Add answer
    // Check if complete, calculate score
  },
});
```

---

### Phase 7: Prompts & Policies (Week 4)
**Goal**: Migrate trauma-informed prompts

#### 7.1 Prompts
**From**: `convex2/lib/prompts.ts`  
**To**: `convex/lib/prompts.ts`

**Keep as-is** - pure strings:
```typescript
// convex/lib/prompts.ts
export const TRAUMA_PRINCIPLES = `P1-P6...`;
export const MAIN_PROMPT = `...`;
export const CRISIS_PROMPT = `...`;
export const ASSESSMENT_PROMPT = `...`;

export const renderPrompt = (template: string, vars: Record<string, string>) => {
  // Template rendering
};
```

#### 7.2 Policy Helpers
**From**: `convex2/lib/policy.ts`  
**To**: `convex/lib/policy.ts`

**Keep as-is** - pure helpers:
```typescript
// convex/lib/policy.ts
export const getTone = (context: any) => {
  // Return tone based on context
};
```

---

### Phase 8: Rate Limiting & Usage (Week 4)
**Goal**: Migrate rate limiting and usage tracking

#### 8.1 Rate Limiting
**From**: `convex2/lib/rateLimiting.ts`  
**To**: Use `@convex-dev/rate-limiter` component

```typescript
// convex/lib/rateLimiting.ts
import { RateLimiter } from '@convex-dev/rate-limiter';
import { components } from '../_generated/api';

const rateLimiter = new RateLimiter(components.rateLimiter);

export const checkSmsLimit = async (ctx: ActionCtx, userId: string) => {
  const key = `sms:${userId}`;
  const limit = 10; // 10 SMS per day
  const window = 24 * 60 * 60 * 1000; // 24 hours
  
  const result = await rateLimiter.check(ctx, {
    key,
    limit,
    window,
  });
  
  if (!result.allowed) {
    throw new Error('SMS rate limit exceeded');
  }
};
```

#### 8.2 Usage Tracking
**From**: `convex2/lib/usage.ts`  
**To**: Use Agent Component's built-in usage tracking

```typescript
// Agent Component automatically tracks usage via usageHandler
// See convex/agents/config.ts for setup
```

---

## File Structure (Target)

```
convex/
├── _generated/          # Auto-generated
├── agents/
│   ├── main.ts         # Main caregiver support agent
│   ├── crisis.ts       # Crisis support agent
│   ├── assessment.ts   # Assessment agent
│   └── config.ts       # Agent configuration
├── tools/
│   ├── searchResources.ts
│   ├── recordMemory.ts
│   ├── checkWellnessStatus.ts
│   ├── findInterventions.ts
│   ├── updateProfile.ts
│   └── startAssessment.ts
├── workflows/
│   └── crisis.ts       # Crisis escalation workflow
├── lib/
│   ├── core.ts         # Core utilities (simplified)
│   ├── prompts.ts      # Prompt templates
│   ├── policy.ts       # Policy helpers
│   ├── profile.ts      # Profile helpers
│   ├── assessments.ts  # Assessment catalog
│   └── rateLimiting.ts # Rate limiting helpers
├── assessments.ts      # Assessment queries/mutations
├── resources.ts        # Resource search actions
├── interventions.ts   # Intervention queries
├── billing.ts         # Stripe webhook handlers
├── inbound.ts         # Twilio webhook handlers
├── http.ts            # HTTP router
├── schema.ts          # Simplified schema
└── convex.config.ts   # Component configuration
```

---

## Migration Checklist

### Week 1: Foundation
- [ ] Create simplified schema (remove redundant tables)
- [ ] Set up Agent Component in `convex.config.ts`
- [ ] Migrate core utilities (simplified)
- [ ] Migrate Main Agent (use `contextOptions`)
- [ ] Migrate Crisis Agent

### Week 2: Agents & Tools
- [ ] Migrate Assessment Agent
- [ ] Migrate all 6 tools
- [ ] Set up Workflow Component
- [ ] Migrate crisis escalation workflow

### Week 3: Integrations
- [ ] Install `@convex-dev/twilio` component
- [ ] Set up Twilio component (client + webhook registration)
- [ ] Migrate SMS sending to use component
- [ ] Migrate inbound message handling via callback
- [ ] Migrate Stripe webhook handler
- [ ] Migrate assessment system
- [ ] Migrate resource search

### Week 4: Polish
- [ ] Migrate prompts & policies
- [ ] Set up rate limiting
- [ ] Set up usage tracking
- [ ] Write tests
- [ ] Update documentation

---

## Testing Strategy

### Unit Tests
- Test each tool independently
- Test assessment scoring logic
- Test intervention matching

### Integration Tests
- Test agent → tool → database flow
- Test workflow execution
- Test webhook handlers

### Simulation Tests
- Test full user journeys from FEATURES.md
- Test crisis detection and response
- Test assessment completion flow

---

## Rollback Plan

1. **Keep `convex2` intact** during migration
2. **Dual-write period**: Write to both systems, compare outputs
3. **Gradual cutover**: Migrate one feature at a time
4. **Rollback trigger**: If error rate > 1%, revert to `convex2`

---

## Success Criteria

✅ All features from `convex2` migrated  
✅ No duplicate storage (threads, messages)  
✅ Using Agent Component's built-in memory  
✅ Performance improved (30% faster context hydration)  
✅ Code reduced (40% less code)  
✅ All FEATURES.md requirements met  
✅ Tests passing  

---

## Decisions Made ✅

All open questions have been resolved. See **MIGRATION_DECISIONS.md** for finalized decisions:

- ✅ **Clean slate approach** - Ignore convex prod, can be replaced
- ✅ **Only update convex** - Leave convex2 as-is
- ✅ **Latest stable components** - Use latest from npm
- ✅ **Ignore convex2 memories** - Use Agent Component's built-in memory
- ✅ **Thread continuity** - Use Agent Component's `continueThread` pattern (see [Stack article](https://stack.convex.dev/ai-agents))
- ✅ **Reference convex2** - Use for env vars and feature reference only

## Next Steps

1. ✅ **Decisions finalized** - See MIGRATION_DECISIONS.md
2. **Create migration branch**: `migration/convex2-to-convex`
3. **Copy env vars** from convex2 to convex
4. **Start Phase 1** (Foundation)
5. **Follow patterns** from [Stack article](https://stack.convex.dev/ai-agents)
6. **Daily standups** to track progress
7. **Weekly demos** to stakeholders

---

**Last Updated**: 2025-01-14

