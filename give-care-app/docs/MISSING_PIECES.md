# Missing Pieces Research Report

**Date**: 2025-11-09
**Status**: Post-Restoration Analysis
**TypeScript Errors**: 20

---

## Executive Summary

After the restoration work, 20 TypeScript errors remain. The errors fall into 3 categories:

1. **Type Definition Issues** (10 errors) - Missing properties, incorrect types
2. **API Structure Issues** (6 errors) - Incorrect function paths, missing exports
3. **Architecture Mismatches** (4 errors) - Actions trying to access db, wrong context types

---

## TypeScript Errors Breakdown

### Category 1: Type Definition Issues (10 errors)

#### 1.1 HydratedContext Missing Properties (6 errors)
**Files**: `convex/core.ts` (lines 214, 234, 236, 237, 239, 240)

**Issue**: The `HydratedContext` type in `lib/types.ts` is missing 6 properties that `core.ts` expects:
- `policyBundle`
- `promptHistory`
- `budget`
- `lastAssessment`
- `crisisFlags`

**Current Definition** (`lib/types.ts:19-28`):
```typescript
export type HydratedContext = {
  userId: string;
  sessionId?: string;
  locale: string;
  consent: {
    emergency: boolean;
    marketing: boolean;
  };
  metadata?: any;
};
```

**Expected Definition**:
```typescript
export type HydratedContext = {
  userId: string;
  sessionId?: string;
  locale: string;
  policyBundle?: any;                    // ADD
  budget?: Budget;                       // ADD
  promptHistory?: string;                // ADD
  consent: {
    emergency: boolean;
    marketing: boolean;
  };
  lastAssessment?: number;               // ADD
  crisisFlags?: any;                     // ADD
  metadata?: any;
};
```

**Fix**: Add missing properties to `HydratedContext` type definition.

---

#### 1.2 Duplicate maxSteps in Agent Configs (3 errors)
**Files**: `convex/agents.ts` (lines 251, 465, 638)

**Issue**: `sharedAgentConfig` from `lib/usage.ts` contains `maxSteps: 10`, and it's spread into agent configs AFTER explicit `maxSteps` definitions, causing TypeScript to warn about duplicate properties.

**Current Pattern**:
```typescript
// lib/usage.ts:5-7
export const sharedAgentConfig = {
  maxSteps: 10,
};

// agents.ts:239-251
const mainAgent = new Agent(components.agent, {
  tools: { ... },
  maxSteps: 5,                           // First definition
  contextHandler: async (...) => { ... },
  ...sharedAgentConfig,                  // Spreads maxSteps: 10 (overwrite warning)
});
```

**Fix Options**:
1. Remove `maxSteps` from `sharedAgentConfig` (keep explicit per-agent values)
2. Remove explicit `maxSteps` from agents (use shared value of 10)
3. Spread `sharedAgentConfig` FIRST, then override with explicit values

**Recommended**: Option 1 - Remove from `sharedAgentConfig` since each agent needs different values (Main=5, Crisis=1, Assessment=2).

---

#### 1.3 renderPrompt Type Mismatch (1 error)
**Files**: `convex/agents.ts` (line 344)

**Issue**: `renderPrompt()` expects `Record<string, string>`, but `profileComplete` is a boolean.

**Current Code** (`agents.ts:337-346`):
```typescript
const basePrompt = renderPrompt(MAIN_PROMPT, {
  userName,
  relationship,
  careRecipient,
  journeyPhase,
  totalInteractionCount,
  wellnessInfo,
  profileComplete,              // ❌ boolean, not string
  missingFieldsSection,
});
```

**Fix**: Convert boolean to string:
```typescript
profileComplete: String(profileComplete),
```

---

### Category 2: API Structure Issues (6 errors)

#### 2.1 Guardrails Tool Missing Metadata (3 errors)
**Files**: `convex/agents/guardrails.tool.ts` (lines 22, 30, 32)

**Issue**: Tool context (`ToolCtx`) doesn't have a `metadata` property. The code is trying to access `ctx.metadata` which doesn't exist.

**Current Code**:
```typescript
// guardrails.tool.ts:22
const userId = ctx.metadata?.convex?.userId;

// guardrails.tool.ts:30
const sessionId = ctx.metadata?.convex?.sessionId;

// guardrails.tool.ts:32
const metadata = ctx.metadata;
```

**Problem**: Agent Component's `ToolCtx` doesn't expose metadata directly. Metadata needs to be passed as tool arguments or accessed differently.

**Fix Options**:
1. Pass metadata as tool argument
2. Remove metadata access from guardrails tool
3. Use different context type

**Recommended**: Pass userId/sessionId as explicit tool arguments.

---

#### 2.2 Missing recordOutbound Export (1 error)
**Files**: `convex/inbound.ts` (line 26)

**Issue**: Code calls `api.internal.recordOutbound` but this may not be exported correctly from the generated API.

**Current Code**:
```typescript
await ctx.runMutation(api.internal.recordOutbound, {
  message: { ... }
});
```

**Investigation Needed**: Verify that `internal/index.ts` exports are generating `api.internal.*` correctly. May need to regenerate types with `npx convex codegen`.

**Temporary Fix**: Change to direct import:
```typescript
import { recordOutbound } from '../internal/index';
```

---

#### 2.3 Twilio Messages API (1 error)
**Files**: `convex/inbound.ts` (line 21)

**Issue**: Code tries to use `twilio.messages.create()` directly, but we're using Convex Twilio Component which has different API.

**Current Code**:
```typescript
await twilio.messages.create({
  to: args.to,
  body: args.text,
});
```

**Expected API** (Convex Twilio Component):
```typescript
await twilio.send(ctx, {
  to: args.to,
  body: args.text,
});
```

**Fix**: Use correct Twilio Component API from `@convex-dev/twilio`.

---

#### 2.4 logAssessmentEvent Type Extraction (1 error)
**Files**: `convex/public.ts` (line 231)

**Issue**: Trying to extract context type from `startAssessment['handler']` which doesn't work with Convex registered mutations.

**Current Code**:
```typescript
const logAssessmentEvent = async (
  ctx: Parameters<typeof startAssessment['handler']>[0],
  args: { ... }
) => { ... };
```

**Fix**: Use explicit `MutationCtx` type:
```typescript
import { MutationCtx } from './_generated/server';

const logAssessmentEvent = async (
  ctx: MutationCtx,
  args: { ... }
) => { ... };
```

---

### Category 3: Architecture Mismatches (4 errors)

#### 3.1 cleanupResourceCache Using db in Action (3 errors)
**Files**: `convex/resources.ts` (lines 128, 133, 157)

**Issue**: `cleanupResourceCache` is defined as an `internalAction` but tries to access `ctx.db`, which is only available in queries and mutations.

**Current Code**:
```typescript
export const cleanupResourceCache = internalAction({
  handler: async (ctx, { limit = 200 }) => {
    const stale = await ctx.db.query('resource_cache').take(limit);  // ❌ No db in actions
    for (const entry of stale) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        await ctx.db.delete(entry._id);                              // ❌ No db in actions
      }
    }
  },
});
```

**Fix**: Change to `internalMutation`:
```typescript
export const cleanupResourceCache = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 200 }) => {
    const now = Date.now();
    const stale = await ctx.db.query('resource_cache').take(limit);
    let removed = 0;
    for (const entry of stale) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        await ctx.db.delete(entry._id);
        removed += 1;
      }
    }
    return { removed };
  },
});
```

**Note**: Also update cron job in `crons.ts` to call `internal.resources.cleanupResourceCache` instead of action.

---

#### 3.2 Missing test.setup.ts (1 error)
**Files**: `tests/simulation/context.simulation.test.ts` (line 13)

**Issue**: Test file imports `../../convex/test.setup` which doesn't exist.

**Fix Options**:
1. Create `convex/test.setup.ts` with test utilities
2. Remove the import from test files
3. Update test imports to use correct paths

**Recommended**: Check git history for what `test.setup.ts` contained and restore if needed, or remove import if obsolete.

---

## Functional Completeness vs FEATURES.md

Comparing current implementation against `docs/FEATURES.md` user journeys:

### ✅ Implemented Features

1. **First Contact** (Journey 1):
   - ✅ Zero onboarding friction (agents.ts)
   - ✅ Empathetic acknowledgment (prompts in lib/prompts.ts)
   - ✅ Agent routing (agents.ts: Main, Crisis, Assessment)

2. **Crisis Detection** (Journey 3):
   - ✅ Keyword detection (lib/policy.ts: 19 crisis terms)
   - ✅ <600ms response requirement (Crisis Agent deterministic)
   - ✅ 988/741741/911 resources (workflows.ts: crisis response)
   - ✅ Follow-up scheduling (workflows.ts: 24h/72h)

3. **Memory System** (Journey 6):
   - ✅ recordMemory function (public.ts:110-149)
   - ✅ Semantic search with embeddings (actions/embeddings.actions.ts)
   - ✅ Importance scoring 1-10 (schema.ts: memories table)
   - ✅ Categories: care_routine, preference, intervention_result, crisis_trigger

4. **Assessments** (Journey 5):
   - ✅ 4 validated instruments (lib/assessmentCatalog.ts: EMA, BSFC, REACH-II, SDOH)
   - ✅ 5 pressure zones (lib/assessments.ts: emotional, physical, social, time, financial)
   - ✅ Scoring logic (lib/assessments.ts: calculateScore, calculateZones)
   - ✅ Assessment sessions (schema.ts: assessment_sessions table)

5. **Rate Limiting**:
   - ✅ 10 SMS/day per user (lib/rateLimiting.ts)
   - ✅ 50K tokens/hour per user (lib/rateLimiting.ts)
   - ✅ 500K TPM global (lib/rateLimiting.ts)

6. **PII Protection**:
   - ✅ Phone hashing (lib/pii.ts: hashPhone SHA-256)
   - ✅ SSN/CC/ZIP redaction (lib/pii.ts: redact functions)
   - ✅ Audit trail (schema.ts: messages table)

### ⚠️ Partially Implemented Features

1. **Daily Check-In** (Journey 2):
   - ✅ Scheduled check-ins (schema.ts: triggers table exists)
   - ⚠️ Cron job empty (crons.ts: no scheduled sweeps)
   - ⚠️ EMA scheduling not implemented (workflows.ts: no EMA cron)

2. **Resource Discovery** (Journey 4):
   - ✅ Google Maps integration (actions/maps.actions.ts)
   - ✅ Cache system (schema.ts: resource_cache table)
   - ⚠️ Live lookup stubbed (resources.ts:169-222 returns mock data)
   - ⚠️ No predefined categories (FEATURES.md mentions 10 categories)
   - ⚠️ Zip code storage works but extraction needs testing

3. **Evidence-Based Interventions** (Journey 5):
   - ✅ Interventions table exists (schema.ts)
   - ⚠️ No seeded interventions (16 strategies mentioned in FEATURES.md)
   - ⚠️ No agent tool to fetch interventions by zone
   - ⚠️ No follow-up nudges ("How did respite go?")

4. **Proactive Engagement** (Journey 7):
   - ✅ Engagement tracking (schema.ts: watcher_state table)
   - ⚠️ No silence detection cron
   - ⚠️ No graduated nudge system (Day 5, Day 7)
   - ⚠️ No adaptive check-in frequency

### ❌ Not Yet Implemented Features

1. **Subscription Billing** (Layer 5):
   - ✅ Schema exists (schema.ts: subscriptions, billing_events)
   - ✅ Stripe webhook handler (billing.ts, http.ts)
   - ❌ No Stripe Checkout session creation
   - ❌ No premium feature gating
   - ❌ No promo code support

2. **Admin Dashboard** (Layer 5):
   - ✅ Metrics tables exist (schema.ts: metrics_*)
   - ❌ No admin queries exposed
   - ❌ No real-time dashboard
   - ❌ No user lookup by phone

3. **Knowledge Base** (Layer 3):
   - ❌ No article storage
   - ❌ No semantic search for articles
   - ❌ Future feature per FEATURES.md

---

## Critical Missing Implementations

### 1. Twilio SMS Handler Integration

**Issue**: `twilioClient.ts:11-12` has commented-out callback:
```typescript
// TODO: Implement incoming message handler
// twilio.incomingMessageCallback = internal.sms.handleIncomingMessage;
```

**Impact**:
- Incoming SMS not processed by Twilio Component
- Webhook in http.ts works but doesn't trigger agent
- Messages reach database but no agent response

**Fix Required**: Wire Twilio Component callback to internal handler:
```typescript
// twilioClient.ts
import { internal } from './_generated/api';
twilio.incomingMessageCallback = internal.inbound.processInboundMessage;
```

---

### 2. Resource Search Live Lookup

**Issue**: `resources.ts:169-222` returns stubbed data instead of live Google Maps results.

**Current Code**:
```typescript
export const searchResources = action({
  handler: async (ctx, args) => {
    // ... zip validation ...

    // Stubbed results
    return {
      results: [
        {
          name: `${args.category} Resource 1`,
          address: `123 Main St, ${resolvedZip}`,
          // ... mock data ...
        }
      ]
    };
  }
});
```

**Expected**: Call `actions/maps.actions.ts:searchGoogleMaps()` with live API lookup.

**Fix Required**: Replace stub with:
```typescript
const mapResults = await ctx.runAction(internal.actions.maps.searchGoogleMaps, {
  query: args.query,
  zip: resolvedZip,
});
```

---

### 3. Evidence-Based Interventions Seeding

**Issue**: `interventions` table exists but empty. No seed data, no agent tool.

**Missing**:
- 16 evidence-based strategies (FEATURES.md:291-294)
- Agent tool: `find_interventions` (references deleted `api.domains.interventions.getByZones`)
- Intervention matching logic by pressure zones

**Required Files**:
- `convex/lib/interventions_seed.ts` - Seed 16 strategies with evidence levels
- `convex/domains/interventions.ts` - `getByZones` query
- `convex/agents.ts` - Restore `find_interventions` tool

---

### 4. Scheduled Check-Ins (Cron Jobs)

**Issue**: `crons.ts` is empty. No scheduled sweeps for:
- Daily check-ins
- Resource cache cleanup
- Engagement nudges
- Crisis follow-ups

**Expected** (per STATUS.md:233-237):
```typescript
const crons = cronJobs();

crons.interval(
  'check-in-sweep',
  { minutes: 5 },
  internal.workflows.checkInSweep
);

crons.interval(
  'engagement-nudge',
  { hours: 6 },
  internal.workflows.engagementSweep
);

crons.hourly(
  'resource-cache-cleanup',
  { minuteUTC: 0 },
  internal.resources.cleanupResourceCache
);

export default crons;
```

---

## Missing Workflow Implementations

Per `workflows.ts`, these workflows are defined but may have missing handlers:

1. **checkInSweep** - ✅ Exists (workflows.ts:95)
2. **engagementSweep** - ✅ Exists (workflows.ts:144)
3. **crisisFollowUp** - ✅ Exists (workflows.ts:198)

But scheduled triggers in `crons.ts` are missing.

---

## Deployment Blockers

### High Priority (Blocks Production)

1. **TypeScript Errors** - 20 errors prevent clean deployment
2. **Twilio SMS Handler** - Incoming messages won't process
3. **Agent Tools Broken** - Guardrails tool crashes on metadata access

### Medium Priority (Degrades Functionality)

1. **Resource Search Stubbed** - Users get fake data
2. **Interventions Missing** - No evidence-based suggestions
3. **Cron Jobs Empty** - No scheduled check-ins or follow-ups

### Low Priority (Future Features)

1. **Admin Dashboard** - Monitoring/support tools
2. **Billing Integration** - Revenue features
3. **Knowledge Base** - Article search

---

## Recommended Fix Order

### Phase 1: TypeScript Cleanup (1-2 hours)

1. ✅ Fix HydratedContext type (add 6 properties)
2. ✅ Fix duplicate maxSteps (remove from sharedAgentConfig)
3. ✅ Fix renderPrompt boolean (convert to string)
4. ✅ Fix cleanupResourceCache (change action → mutation)
5. ✅ Fix logAssessmentEvent type (use MutationCtx)
6. ✅ Fix guardrails metadata access (pass as args)
7. ✅ Fix Twilio messages API (use Component API)
8. ✅ Verify/fix recordOutbound export

**Outcome**: Zero TypeScript errors, can deploy with typecheck enabled.

---

### Phase 2: Critical Functionality (2-3 hours)

1. ✅ Wire Twilio SMS handler (twilioClient.ts)
2. ✅ Implement live resource search (resources.ts → maps.actions.ts)
3. ✅ Seed interventions table (create interventions_seed.ts)
4. ✅ Restore interventions domain (domains/interventions.ts)
5. ✅ Add cron jobs (crons.ts: 3 scheduled tasks)

**Outcome**: Core user journeys functional (SMS → Agent → Response).

---

### Phase 3: Feature Completeness (3-4 hours)

1. ✅ Implement scheduled check-ins workflow
2. ✅ Implement silence detection/nudges
3. ✅ Add 10 resource categories
4. ✅ Implement intervention matching by zones
5. ✅ Add follow-up nudges for interventions

**Outcome**: All FEATURES.md user journeys work end-to-end.

---

## Success Criteria

### Phase 1 Complete
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npx convex deploy` succeeds without `--typecheck=disable`
- [ ] All 20 TypeScript errors resolved

### Phase 2 Complete
- [ ] Incoming SMS processed and agent responds
- [ ] Resource search returns live Google Maps data
- [ ] Interventions seeded and queryable
- [ ] Cron jobs scheduled and executing

### Phase 3 Complete
- [ ] User receives scheduled check-in SMS
- [ ] Silence detected and nudge sent after 5 days
- [ ] Assessment triggers intervention suggestions
- [ ] Follow-up questions sent for interventions

---

## Testing Checklist

### Unit Tests
- [ ] HydratedContext type accepts all properties
- [ ] Agent configs compile without maxSteps duplication
- [ ] cleanupResourceCache deletes expired entries
- [ ] Intervention queries return correct zones

### Integration Tests
- [ ] Send SMS → Twilio webhook → Agent → SMS reply
- [ ] Assessment completion → Intervention suggestions
- [ ] Crisis keyword → Crisis agent → 988 response
- [ ] Scheduled check-in → Trigger fires → SMS sent

### Manual Testing (Production)
1. **SMS Flow**: Send "Hi" to Twilio number, verify agent response
2. **Resource Search**: Ask for "respite care near me", verify Google Maps data
3. **Assessment**: Complete BSFC, verify score + intervention suggestions
4. **Crisis**: Send "I can't do this anymore", verify <600ms 988 response
5. **Silence**: Wait 5 days without message, verify nudge sent

---

## Files Requiring Changes

### Immediate Fixes (Phase 1)

1. `convex/lib/types.ts` - Add HydratedContext properties
2. `convex/lib/usage.ts` - Remove maxSteps from sharedAgentConfig
3. `convex/agents.ts` - Fix profileComplete toString
4. `convex/agents/guardrails.tool.ts` - Pass metadata as args
5. `convex/resources.ts` - Change cleanupResourceCache to mutation
6. `convex/public.ts` - Use explicit MutationCtx
7. `convex/inbound.ts` - Use Twilio Component API
8. `convex/internal/index.ts` - Verify exports

### Critical Features (Phase 2)

1. `convex/twilioClient.ts` - Wire SMS handler callback
2. `convex/resources.ts` - Implement live lookup
3. `convex/lib/interventions_seed.ts` - CREATE (seed 16 strategies)
4. `convex/domains/interventions.ts` - CREATE (getByZones query)
5. `convex/crons.ts` - Add 3 cron jobs

### Feature Completeness (Phase 3)

1. `convex/workflows.ts` - Verify all workflow handlers
2. `convex/resources.ts` - Add 10 categories
3. `convex/agents.ts` - Restore find_interventions tool
4. `convex/lib/prompts.ts` - Add intervention follow-up prompts

---

## Summary

**Total TypeScript Errors**: 20
**Critical Blockers**: 3 (Twilio handler, agent tools, resource search)
**Estimated Fix Time**: 6-9 hours (3 phases)

**Next Steps**: Start Phase 1 (TypeScript cleanup) to enable clean deployments, then Phase 2 (critical functionality) to restore SMS → Agent → Response flow.
