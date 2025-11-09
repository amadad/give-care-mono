# Convex Integration Guide

**Purpose:** Reference for calling Convex functions across the refactored architecture
**Last Updated:** 2025-01-09

---

## Architecture Overview

The Convex backend is organized into three main directories:

```
convex/
├── actions/         # Node-only side effects (Stripe, Twilio, Resend)
├── domains/         # Pure queries & mutations organized by domain
└── lib/             # Business logic utilities (no Convex primitives)
```

### File Categories

**actions/** - Node runtime required (`"use node"`)
- External API calls (Stripe, Twilio, Resend)
- Cannot be called from browser
- Example: `billing.actions.ts`, `sms.actions.ts`

**domains/** - Pure Convex functions
- Queries: Read-only database access
- Mutations: Database writes
- Internal variants: Server-only (not exposed to client)
- Example: `messages.ts`, `wellness.ts`, `logs.ts`

**lib/** - Business logic utilities
- No Convex primitives (ctx, db)
- Pure TypeScript functions
- Importable anywhere
- Example: `prompts.ts`, `policy.ts`, `rateLimiting.ts`

---

## Calling Convention Matrix

### Rule of Thumb

| Function Type | Call With | Example |
|--------------|-----------|---------|
| `query` | `api.<file>.<fn>` | `api.domains.wellness.getStatus` |
| `mutation` | `api.<file>.<fn>` | `api.domains.messages.recordInbound` |
| `action` | `api.<file>.<fn>` | `api.resources.searchResources` |
| `internalQuery` | `internal.domains.<file>.<fn>` | `internal.domains.users.getByExternalId` |
| `internalMutation` | `internal.domains.<file>.<fn>` | `internal.domains.logs.logAgentRunInternal` |
| `internalAction` | `internal.domains.<file>.<fn>` | `internal.domains.threads.createComponentThread` |

### Key Principles

1. **Public functions** (query/mutation/action) → Use `api.*`
2. **Internal functions** (internalQuery/internalMutation/internalAction) → Use `internal.*`
3. **Prefer source paths** over barrel exports for clarity
   - ✅ `api.domains.messages.recordInbound`
   - ❌ `api.internal.recordInbound` (ambiguous)

---

## Real Examples

### agents.ts (Action calling queries/actions/internal mutations)

```typescript
import { action, internalAction } from './_generated/server';
import { internal, components, api } from './_generated/api';

export const runMainAgent = action({
  handler: async (ctx, { input, context, threadId }) => {
    // Call public action (resources.ts)
    const result = await ctx.runAction(api.resources.searchResources, {
      query: args.query,
      metadata: userMetadata,
    });

    // Call public query (domains/wellness.ts)
    const status = await ctx.runQuery(api.domains.wellness.getStatus, {
      userId,
    });

    // Call public query (domains/interventions.ts)
    const interventions = await ctx.runQuery(api.domains.interventions.getByZones, {
      zones,
      minEvidenceLevel: 'moderate',
      limit: 5,
    });

    // Call internal mutation (domains/logs.ts)
    await ctx.runMutation(internal.domains.logs.logAgentRunInternal, {
      userId: context.userId,
      agent: 'main',
      policyBundle: 'default_v1',
      budgetResult: { /* ... */ },
      latencyMs,
      traceId: `main-${Date.now()}`,
    });

    return { chunks, latencyMs, threadId };
  },
});
```

### http.ts (HTTP route calling mutations)

```typescript
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api, internal } from './_generated/api';

const http = httpRouter();

http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Verify signature, parse event...

    // Call public mutation (billing.ts)
    await ctx.runMutation(api.billing.applyStripeEvent, {
      id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }),
});

http.route({
  path: '/sms',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // Parse Twilio webhook...

    // Call public mutation (domains/messages.ts)
    const messageRecord = await ctx.runMutation(api.domains.messages.recordInbound, {
      message: {
        externalId: from,
        channel: 'sms',
        text: body,
        meta: { twilioSid: messageSid, from, phone: from },
        traceId,
      },
    });

    return new Response('<?xml version="1.0"?><Response></Response>', { status: 200 });
  }),
});
```

### inbound.ts (Internal action calling internal mutations and public mutations)

```typescript
import { internalAction } from './_generated/server';
import { internal, components, api } from './_generated/api';

export const sendSmsResponse = internalAction({
  handler: async (ctx, { userId, text, to, from }) => {
    // Send SMS via Twilio...

    // Call public mutation (domains/messages.ts)
    await ctx.runMutation(api.domains.messages.recordOutbound, {
      message: {
        externalId: userId,
        channel: 'sms',
        text,
        meta: { twilioSid: data.sid, to },
        traceId: `twilio-outbound-${data.sid}`,
      },
    });

    return { sid: data.sid };
  },
});

const ensureComponentThreadId = async (ctx: ActionCtx, user: UserDoc): Promise<string> => {
  // Call internal mutation (domains/threads.ts)
  const createdThreadId = await ctx.runMutation(internal.domains.threads.createComponentThread, {
    userId: user._id,
  });

  return createdThreadId;
};
```

### crons.ts (Cron jobs calling internal actions)

```typescript
import { cronJobs } from 'convex/server';
import { api } from './_generated/api';

const crons = cronJobs();

// Call internal action (domains/scheduler.ts - re-exported through internal.ts)
crons.interval(
  'process-scheduled-triggers',
  { minutes: 5 },
  api.internal.internalProcessDueTriggers,  // internal action from domains/scheduler.ts
  { batchSize: 50 }
);

// Call internal action (domains/metrics.ts - re-exported through internal.ts)
crons.daily(
  'aggregate-daily-metrics',
  { hourUTC: 2, minuteUTC: 0 },
  api.internal.aggregateDailyMetrics,  // internal action from domains/metrics.ts
  {}
);

export default crons;
```

### domains/metrics.ts (Internal action calling internal mutations in same domain)

```typescript
import { internalAction, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';

export const aggregateDailyMetrics = internalAction({
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);

    // Call internal mutations in same domain (self-referential)
    await ctx.runMutation(internal.domains.metrics.computeDailyMetrics, { date: today });
    await ctx.runMutation(internal.domains.metrics.computeSubscriptionMetrics, {});
    await ctx.runMutation(internal.domains.metrics.computeJourneyFunnel, {});
    await ctx.runMutation(internal.domains.metrics.computeBurnoutDistribution, {});
  },
});

export const computeDailyMetrics = internalMutation({
  handler: async (ctx, { date }) => {
    // Database writes...
  },
});
```

---

## Common Mistakes

### ❌ Wrong: Using internal.internal.*

```typescript
// BAD - internal.internal is not a valid namespace
await ctx.runQuery(internal.internal.getStatus, { userId });
await ctx.runMutation(internal.internal.recordInbound, { message });
```

### ✅ Correct: Use proper namespaces

```typescript
// GOOD - Use api.domains.* for public queries/mutations
await ctx.runQuery(api.domains.wellness.getStatus, { userId });
await ctx.runMutation(api.domains.messages.recordInbound, { message });

// GOOD - Use internal.domains.* for internal functions
await ctx.runMutation(internal.domains.logs.logAgentRunInternal, { /* ... */ });
```

### ❌ Wrong: Using internal.* for public functions

```typescript
// BAD - billing.applyStripeEvent is a public mutation
await ctx.runMutation(internal.billing.applyStripeEvent, { /* ... */ });

// BAD - resources.searchResources is a public action
await ctx.runAction(internal.resources.searchResources, { /* ... */ });
```

### ✅ Correct: Use api.* for public functions

```typescript
// GOOD - Public mutation
await ctx.runMutation(api.billing.applyStripeEvent, { /* ... */ });

// GOOD - Public action
await ctx.runAction(api.resources.searchResources, { /* ... */ });
```

---

## Migration Checklist

When refactoring existing code:

- [ ] Check if function is public (query/mutation/action) or internal (internalQuery/internalMutation/internalAction)
- [ ] Use `api.*` for public functions, `internal.*` for internal functions
- [ ] Prefer source paths (`api.domains.messages.*`) over barrel exports
- [ ] Import `api` from `_generated/api` if not already imported
- [ ] Run `npx convex dev` to regenerate types after changes

---

## Testing

Run tests to verify namespace correctness:

```bash
npm test -- simulation
```

Integration tests cover:
- Stripe webhook → entitlements → welcome SMS
- Twilio webhook → inbound processing → agent response
- Non-subscriber SMS → signup flow
- Cron triggers → alert processing
