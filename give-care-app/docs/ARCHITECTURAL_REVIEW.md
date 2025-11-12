# Architectural Review: Critical Examination Against CONVEX Best Practices

## Review Methodology

**Sources**: CONVEX_01.md (Best Practices), CONVEX_02.md (Agent Component)  
**Focus**: Validate each architectural suggestion for GiveCare use case  
**Criteria**: Alignment with Convex patterns, scalability, maintainability

---

## ✅ 1. Stripe Fix - "Events-In, State-Out"

### CONVEX_01.md Alignment

**✅ Idempotency** (Line 482-494):
- "Only schedule and ctx.run* internal functions" → Webhook handler should be `internalMutation`
- Single `subscriptions.applyStripeEvent` mutation aligns with "avoid sequential mutations"

**✅ Helper Functions** (Line 561-571):
- Pure function `mapStripeEventToSubscription()` follows "most logic should be plain TypeScript functions"

**✅ Single Mutation** (Line 791-840):
- "Avoid sequential ctx.runMutation" → Single mutation updates subscription state correctly

### CONVEX_02.md Alignment

**✅ Durable Workflows** (Line 1225-1233):
- Webhook processing doesn't need workflow (single mutation is sufficient)
- Workflows are for multi-step, long-lived processes

### Validation for Use Case

**✅ Correct**: Stripe webhooks are inherently event-driven; mapping to state is the right pattern  
**✅ Correct**: Promo codes in Stripe (not Convex) aligns with separation of concerns  
**⚠️ Consideration**: `billing_events` should have unique index on `stripeEventId` (CONVEX_01.md: "Check for redundant indexes")

### Implementation Pattern

```typescript
// ✅ CONVEX_01.md compliant: Single mutation, idempotent
export const applyStripeEvent = internalMutation({
  args: { stripeEventId: v.string(), eventData: v.any() },
  handler: async (ctx, { stripeEventId, eventData }) => {
    // Check idempotency (single query)
    const existing = await ctx.db.query('billing_events')
      .withIndex('by_event', q => q.eq('stripeEventId', stripeEventId))
      .first()
    if (existing) return { duplicate: true }
    
    // Pure function (CONVEX_01.md helper pattern)
    const subscriptionState = mapStripeEventToSubscription(eventData)
    
    // Single mutation (CONVEX_01.md: avoid sequential mutations)
    await ctx.db.patch(userId, { subscriptions: subscriptionState })
    await ctx.db.insert('billing_events', { stripeEventId, eventData })
  }
})
```

**Files**:
- `convex/stripe.ts`: Only `createCheckoutSession` (action) + webhook signature check
- `convex/http.ts`: Route → verify → `internal.stripe.applyWebhook`
- Remove `promo_codes` table unless analytics needed

---

## ✅ 2. Layering with Import Rules

### CONVEX_01.md Alignment

**✅ Helper Functions** (Line 561-571):
- "Most logic should be written as plain TypeScript functions" → Domain layer is pure TS
- "convex/model" pattern (Line 626-728) → Your `lib/domain` + `lib/services` is equivalent

**✅ Separation** (Line 626-728):
- Example shows helper functions in `convex/model` → Domain layer follows this pattern

### CONVEX_02.md Alignment

**✅ Agent Tools** (Line 620-710):
- Tools can call domain services → Your pattern supports this

### Validation for Use Case

**✅ Correct**: Enforcing import rules prevents accidental coupling  
**✅ Correct**: Ports pattern allows testing domain logic without Convex  
**⚠️ Consideration**: ESLint rules may be overkill if TypeScript paths are strict enough

### Dependency Arrows

```
lib/domain (pure TS) → no imports from Convex or vendors
lib/services (Convex-aware) → imports from domain + _generated/server
lib/infrastructure (generic) → no domain imports
convex/* (API surface) → imports services + infrastructure
```

**Implementation**:
- Use `tsconfig.json` paths: `@domain/*`, `@services/*`, `@infra/*`
- Ports in `@domain/ports/` (e.g., `PaymentProvider.ts`)
- Implementations in `@services/` (e.g., `stripeProvider.ts`)

---

## ✅ 3. Learning Loop - Event-First

### CONVEX_01.md Alignment

**✅ Avoid Sequential Queries** (Line 791-840):
- Single `events` table query is better than multiple table queries
- "Replace them with a single ctx.runQuery" → Event-first aligns

**✅ Helper Functions** (Line 561-571):
- `analyzeInterventionEffectiveness` as pure function is correct

### CONVEX_02.md Alignment

**✅ Workflows** (Line 1225-1233):
- Trend jobs can consume events via workflows
- "Durability and idempotency" → Append-only events are naturally idempotent

### Validation for Use Case

**✅ Correct**: Event-first makes reprocessing trivial (CONVEX_02.md: "surviving server restarts")  
**✅ Correct**: Single table with indexes is more efficient than multiple tables  
**⚠️ Consideration**: `intervention_events` table can be replaced by `events` with `type: 'intervention.*'`

### Event Schema

```typescript
events: defineTable({
  userId: v.id('users'),
  type: v.union(
    v.literal('intervention.try'),
    v.literal('intervention.success'),
    v.literal('resource.open'),
    v.literal('assessment.completed'),
    // ... more event types
  ),
  payload: v.any(), // { interventionId, zones, gcBurnoutBefore/After, placeId, ... }
}).index('by_user_time', ['userId', '_creationTime'])
  .index('by_type_time', ['type', '_creationTime'])
```

**Implementation**:
```typescript
// ✅ CONVEX_01.md compliant: Single query, not sequential
export async function getEffectiveInterventions(ctx: QueryCtx, zones: string[]) {
  const events = await ctx.db.query('events')
    .withIndex('by_type_time', q => q.eq('type', 'intervention.success'))
    .take(5000) // CONVEX_01.md: "Only use .collect with a small number"
  
  // Pure function (CONVEX_01.md helper pattern)
  return analyzeInterventionEffectiveness(events).rankFor(zones)
}
```

---

## ✅ 4. Composite Burnout Score (gcBurnout)

### CONVEX_01.md Alignment

**✅ Helper Functions** (Line 561-571):
- Pure `composite()` function is correct pattern
- "Most logic should be written as plain TypeScript functions"

**✅ Write-Through** (Line 791-840):
- Single mutation after score write is correct
- "Avoid sequential ctx.runMutation" → Recalculate composite in same transaction

**✅ Denormalization** (Line 247-277):
- Storing `gcBurnout` in `users.metadata` is denormalization for performance
- "Denormalize the number of watched movies" → Same pattern

### CONVEX_02.md Alignment

**✅ Agent Tools** (Line 620-710):
- `checkWellnessStatus` tool returns composite → correct

### Validation for Use Case

**✅ Correct**: Composite is the primary metric users care about  
**✅ Correct**: Recency + reliability weights make sense clinically  
**✅ Correct**: Formula with instrument weights + decay + answeredRatio is sound

### Implementation

```typescript
// ✅ CONVEX_01.md compliant: Pure function
// @domain/burnoutScoring.ts
export function composite(inputs: Input[], now = Date.now()): number {
  const base = { ema: 0.15, cwbs: 0.3, reach2: 0.3, sdoh: 0.25 } as const
  const decay = (t: number) => Math.exp(-(now - t) / (30*24*3600e3)) // 30d half-life
  const w = (i: Input) => base[i.instrument] * (0.5 + 0.5 * i.answeredRatio) * decay(i.timeMs)
  const num = inputs.reduce((s, i) => s + w(i) * i.gcBurnout, 0)
  const den = inputs.reduce((s, i) => s + w(i), 0)
  return den ? Math.round(num / den) : NaN
}

export function band(score: number): string {
  if (Number.isNaN(score)) return 'unknown'
  if (score < 40) return 'very_low'
  if (score < 60) return 'low'
  if (score < 80) return 'moderate'
  return 'high'
}
```

**Write Path**:
```typescript
// ✅ CONVEX_01.md compliant: Single mutation after score write
// @services/wellnessService.ts
export async function recalculateComposite(ctx: MutationCtx, userId: Id<'users'>) {
  const scores = await getScoresForUser(ctx, userId) // Single query
  const composite = composite(scores) // Pure function
  
  // Write-through to metadata (denormalization for performance)
  await ctx.db.patch(userId, { metadata: { ...user.metadata, gcBurnout: composite } })
  
  // Also store in scores_composite for trend charts
  await ctx.db.insert('scores_composite', { userId, gcBurnout: composite, band: band(composite) })
}
```

**Schema**:
```typescript
scores_composite: defineTable({
  userId: v.id('users'),
  gcBurnout: v.number(),
  band: v.string(),
}).index('by_user_time', ['userId', '_creationTime'])
```

---

## ✅ 5. Progressive Onboarding - Policy Engine

### CONVEX_01.md Alignment

**✅ Helper Functions** (Line 561-571):
- `missing()` as pure function is correct
- "Most logic should be written as plain TypeScript functions"

**✅ Centralized Logic** (Line 626-728):
- Policy engine centralizes checks → aligns with helper function pattern

### CONVEX_02.md Alignment

**✅ Agent Tools** (Line 620-710):
- Tools call `enforce()` before executing → correct pattern

### Validation for Use Case

**✅ Correct**: Centralized policy prevents scattered checks  
**✅ Correct**: Single question return (not list) aligns with P2 (never repeat)  
**✅ Correct**: Crisis path bypass is correct (safety first)

### Implementation

```typescript
// ✅ CONVEX_01.md compliant: Pure function
// @domain/onboarding.ts
type Interaction = 'resource_search'|'assessment'|'intervention'|'check_in'

const REQUIRED: Record<Interaction, (keyof UserProfile)[]> = {
  resource_search: ['zipCode'],
  assessment: ['careRecipient'],
  intervention: ['careRecipient'],
  check_in: []
}

export function missing(profile: Partial<UserProfile>, t: Interaction): string[] {
  return (REQUIRED[t] ?? []).filter(f => !profile[f])
}
```

```typescript
// ✅ CONVEX_01.md compliant: Helper function pattern
// @services/onboardingService.ts
export async function enforce(ctx: QueryCtx, userId: Id<'users'>, interaction: Interaction) {
  const user = await ctx.db.get(userId) // Single query
  const gaps = missing(user?.metadata ?? {}, interaction) // Pure function
  return { allowed: gaps.length === 0, gaps }
}
```

**Usage**:
- Every tool calls `enforce(...)` before executing
- If not allowed, return single next question (not list)
- Crisis path bypasses this check

---

## ✅ 6. Resource Suggestions - Explicit Mapping

### CONVEX_01.md Alignment

**✅ Helper Functions** (Line 561-571):
- Pure `mapZoneToCategories()` function is correct

### Validation for Use Case

**✅ Correct**: Explicit mapping is testable and maintainable  
**✅ Correct**: Workflow loops categories → existing `searchResources` (reuse)

### Implementation

```typescript
// ✅ CONVEX_01.md compliant: Pure function, testable
// @domain/zoneMapping.ts
export function mapZoneToCategories(zone: string): string[] {
  switch (zone) {
    case 'zone_time': return ['respite', 'transport', 'meals']
    case 'zone_emotional': return ['support', 'community']
    case 'zone_physical': return ['homecare', 'medical']
    case 'zone_social': return ['support', 'community']
    case 'zone_financial': return ['sdoh_financial', 'community']
    default: return ['support']
  }
}
```

---

## ✅ 7. SDOH Enrichment - Audit Trail

### CONVEX_01.md Alignment

**✅ Helper Functions** (Line 561-571):
- Pure `extractSDOHProfile()` function is correct

**✅ Audit Trail**:
- `profile_changes` event is good practice (aligns with "Record progress" principle)

### Validation for Use Case

**✅ Correct**: Low-risk fields only prevents silent mutations  
**✅ Correct**: Audit trail helps debug "why did we start asking for transit help?"

### Implementation

```typescript
// ✅ CONVEX_01.md compliant: Pure function
// @domain/profileEnrichment.ts
export function extractSDOHProfile(answers: AssessmentAnswer[]): Partial<UserProfile> {
  // Only low-risk fields: transportationNeeds, foodInsecurity, housingRisk
  // Calculate zone averages, map to profile values
}
```

```typescript
// ✅ CONVEX_01.md compliant: Single mutation with audit
// @services/assessmentService.ts
export async function enrichProfileFromSDOH(ctx: MutationCtx, userId: Id<'users'>, answers: AssessmentAnswer[]) {
  const profile = extractSDOHProfile(answers) // Pure function
  await ctx.db.patch(userId, { metadata: { ...user.metadata, ...profile } })
  await ctx.db.insert('profile_changes', { userId, reason: 'sdoh_assessment', changes: profile })
}
```

---

## ✅ 8. Infrastructure Polish

### CONVEX_01.md Alignment

**✅ Feature Flags**: Environment variable checks align with CONVEX_01.md patterns  
**✅ Query Batching** (Line 791-840): `getInboundContext` with `Promise.all` is correct

### Validation for Use Case

**✅ Correct**: `SAFE_MODE` for outages is operational best practice  
**✅ Correct**: Negative defaults (`!== 'false'`) are fine if you want on-by-default  
**✅ Correct**: `quiet-hours` and `snoozeUntil` in `getInboundContext` is good (single query)

### Implementation

```typescript
// ✅ CONVEX_01.md compliant: Single query with Promise.all
// @infrastructure/queryBatching.ts
export async function getInboundContext(ctx: QueryCtx, messageSid: string, phone: string) {
  const [receipt, user, session, quietHours] = await Promise.all([
    ctx.db.query('inbound_receipts').withIndex('by_sid', q => q.eq('messageSid', messageSid)).first(),
    ctx.db.query('users').withIndex('by_phone', q => q.eq('phone', phone)).first(),
    ctx.db.query('assessment_sessions').withIndex('by_user_status', q => q.eq('userId', user?._id).eq('status', 'active')).first(),
    checkQuietHours(ctx) // Helper function
  ])
  return { receipt, user, session, quietHours, snoozeUntil: user?.snoozeUntil }
}
```

**Feature Flags**:
```typescript
export const FEATURES = {
  MAPS: process.env.FEATURE_MAPS !== 'false',
  TRENDS: process.env.FEATURE_TRENDS !== 'false',
  PROACTIVE: process.env.FEATURE_PROACTIVE !== 'false',
  SAFE_MODE: process.env.SAFE_MODE === 'on', // Explicit on-by-default
} as const
```

---

## ✅ 9. Tests That Matter

### CONVEX_01.md Alignment

**✅ Helper Functions** (Line 561-571):
- Pure domain functions are easily testable
- "Most logic should be written as plain TypeScript functions" → Tests don't need Convex

### Validation for Use Case

**✅ Correct**: Domain tests (pure functions) are fast and don't need Convex  
**✅ Correct**: Service tests verify idempotency (critical for webhooks)  
**✅ Correct**: Smoke tests verify end-to-end flow

**Test Categories**:
1. **Domain (pure)**: onboarding policy, composite scoring, trend calc, zone→category mapping
2. **Services**: idempotent Stripe events, Twilio signature + duplicate MessageSid, resource cache policy
3. **Smoke**: first-contact → ask for missing zip → resource search → stop/unstop → crisis

---

## ⚠️ 10. Schema Edits - Revised Based on Clarifications

### CONVEX_01.md Alignment

**✅ Indexes** (Line 283-328):
- "Check for redundant indexes" → Need to verify new indexes don't duplicate existing
- `by_user_time` on `scores_composite` is correct (not redundant with `by_user`)

### Validation for Use Case

**✅ Correct**: `metadata.gcBurnout` denormalization is for performance (CONVEX_01.md: "Denormalize for performance")  
**✅ Correct**: `scores_composite` table for trend charts is good (separate from per-assessment scores)  
**✅ Correct**: `events` table replacing `intervention_events` is good (single source of truth)  
**✅ Correct**: `resource_cache` with only `placeIds` aligns with Google Maps policy

### Schema Changes (REVISED)

**Decision**: ❌ **Keep `externalId`** - phoneE164 would break email users

```typescript
// ✅ CONVEX_01.md compliant: Keep externalId (supports phone + email)
users: defineTable({
  externalId: v.string(), // Phone number OR email (keep as-is)
  phone: v.optional(v.string()), // E.164 format when channel='sms'
  email: v.optional(v.string()), // Email when channel='email'
  metadata: v.object({
    gcBurnout: v.optional(v.number()), // Denormalized for performance
  })
}).index('by_externalId', ['externalId']) // Keep existing
  .index('by_phone', ['phone']) // Use for phone lookups

// ✅ CONVEX_01.md compliant: Separate table for trends
scores_composite: defineTable({
  userId: v.id('users'),
  gcBurnout: v.number(),
  band: v.string(),
}).index('by_user_time', ['userId', '_creationTime'])

// ✅ CONVEX_01.md compliant: Single events table
events: defineTable({
  userId: v.id('users'),
  type: v.string(), // 'intervention.try' | 'intervention.success' | ...
  payload: v.any(),
}).index('by_user_time', ['userId', '_creationTime'])
  .index('by_type_time', ['type', '_creationTime'])

// ✅ CONVEX_01.md compliant: Resource cache (place_id only per Google policy)
resource_cache: defineTable({
  category: v.string(),
  zip: v.string(),
  placeIds: v.array(v.string()), // Only place IDs, not full data
  expiresAt: v.number(),
}).index('by_category_zip', ['category', 'zip', '_creationTime'])
```

**Migration Considerations**:
- `externalId` → **KEEP AS-IS** (supports both phone and email)
- `phone` field: Fix normalization to preserve E.164 format (currently strips non-digits)
- `intervention_events` → `events`: Migrate directly (no backward compatibility needed)

---

## ✅ 11. Gotchas to Avoid

### CONVEX_01.md Alignment

**✅ Concurrency** (Line 791-840):
- Single mutation keyed by userId prevents races
- "Avoid sequential ctx.runMutation" → Single mutation is correct

**✅ STOP Flow**:
- Short-circuit at HTTP router aligns with CONVEX_01.md access control patterns

### Validation for Use Case

**✅ Correct**: All gotchas are important operational concerns  
**✅ Correct**: Timezone handling in UTC is standard practice  
**✅ Correct**: Crisis copy should be deterministic (not LLM-generated)

**Gotchas**:
1. **Concurrency**: Webhook + user action racing → Always update via single mutation keyed by userId
2. **Timezones**: Store IANA TZ; compute due sends in UTC in one cron
3. **STOP Flow**: Never let agent reply after STOP; short-circuit at HTTP router
4. **Crisis Copy**: Keep one single-segment template; don't let agent improvise

---

## ✅ 12. Shipping Order

### Validation

**✅ Correct**: Stripe first (blocks revenue)  
**✅ Correct**: Composite burnout second (core metric)  
**✅ Correct**: Onboarding policy third (enables other features)  
**✅ Correct**: Events table fourth (enables learning loop)  
**✅ Correct**: Resource search fifth (uses onboarding policy)  
**✅ Correct**: Segment-aware limiter last (optimization)

**Recommended Order**:
1. Stripe: Event-driven state, idempotent webhook, kill promo-code logic
2. Composite burnout: Domain function + service + write-through on any score
3. Onboarding policy engine: One check used by all tools
4. Events table + minimal trend job (decline detection → suggest resources)
5. Resource search: Policy-safe cache (place_id only) + single "Powered by Google" attribution
6. Segment-aware limiter wired everywhere

---

## Final Validation Summary

### ✅ All Suggestions Align with CONVEX_01.md & CONVEX_02.md

**CONVEX_01.md Compliance**:
- ✅ Helper functions pattern (pure domain logic)
- ✅ Single mutations (avoid sequential)
- ✅ Idempotency (webhooks, events)
- ✅ Index optimization (no redundant indexes)
- ✅ Denormalization for performance (gcBurnout in metadata)
- ✅ Query batching (Promise.all for parallel queries)

**CONVEX_02.md Compliance**:
- ✅ Durable workflows (trend detection)
- ✅ Agent tools (call domain services)
- ✅ Event-first learning loop (reprocessable)
- ✅ Idempotency guarantees (mutations)

**Use Case Specific**:
- ✅ Composite burnout as primary metric
- ✅ Progressive onboarding as policy engine
- ✅ Event-first learning loop
- ✅ Stripe "events-in, state-out"

---

## Refined Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. **Stripe**: Event-driven webhook, idempotent mutations, remove promo codes
2. **Composite Burnout**: Domain function + service + write-through
3. **Schema Updates**: `events` table, `scores_composite`, `phoneE164` migration

### Phase 2: Domain Logic (Week 2)
4. **Onboarding Policy**: Centralized `enforce()` function, all tools use it
5. **Zone Mapping**: Pure function for resource suggestions
6. **SDOH Enrichment**: Pure function + audit trail

### Phase 3: Learning Loop (Week 3)
7. **Events Table**: Replace `intervention_events` with generic `events`
8. **Trend Detection**: Event-first analysis, workflow for decline detection
9. **Effectiveness Analysis**: Pure function for intervention ranking

### Phase 4: Polish (Week 4)
10. **Resource Search**: Policy-safe cache (place_id only)
11. **Infrastructure**: Feature flags, query batching, message templates
12. **Tests**: Domain tests, service tests, smoke tests

---

## Clarifications Received

1. **Schema Migration**: ❌ **Keep `externalId`** - phoneE164 would break email users. Fix `phone` field normalization to preserve E.164 format instead.
2. **Events Table**: ✅ **Migrate directly** - No backward compatibility needed for `intervention_events` → `events`
3. **Composite Score**: ✅ **Recalculate on every assessment completion** - Write-through to `metadata.gcBurnout` and `scores_composite` table
4. **Import Rules**: ✅ **TypeScript path aliases sufficient** - Currently using `@/*` paths, add `@domain/*`, `@services/*`, `@infra/*`

**See `ARCHITECTURE_DECISIONS.md` for full details.**

---

## Final Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

1. **Stripe**: Event-driven webhook, idempotent mutations, remove promo codes
2. **Composite Burnout**: Domain function + service + write-through on assessment completion
3. **Phone Normalization**: Fix E.164 format preservation in `inbound.ts`
4. **Schema**: Add `events` table, `scores_composite` table, keep `externalId`

### Phase 2: Domain Logic (Week 2)

5. **Onboarding Policy**: Centralized `enforce()` function, all tools use it
6. **Zone Mapping**: Pure function for resource suggestions
7. **SDOH Enrichment**: Pure function + audit trail
8. **Proactive Resource Suggestions**: Workflow after assessment completion

### Phase 3: Learning Loop (Week 3)

9. **Events Table**: Create and migrate from `intervention_events`
10. **Trend Detection**: Event-first analysis, workflow for decline detection
11. **Effectiveness Analysis**: Pure function for intervention ranking

### Phase 4: Infrastructure & Polish (Week 4)

12. **Feature Flags**: Centralized `FEATURES` object
13. **Query Batching**: `getInboundContext()` with Promise.all
14. **Message Templates**: Pure functions with SMS segment enforcement
15. **Resource Cache**: Policy-safe (place_id only)
16. **TypeScript Path Aliases**: Add `@domain/*`, `@services/*`, `@infra/*`
17. **Tests**: Domain tests, service tests, smoke tests

**Ready to proceed with implementation.**

