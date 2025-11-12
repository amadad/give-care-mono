# Performance Optimizations & FEATURES.md Compliance

## Performance Requirements from FEATURES.md

- **Crisis response latency**: <600ms (p95)
- **Time to first value**: <3 messages
- **Assessment completion rate**: Target 60%
- **User retention**: Target 50% at 30 days

## CONVEX_01.md Performance Guidelines

- Queries/mutations should finish in **<100ms**
- Work with **<few hundred records**
- Use actions sparingly (slower, more expensive)
- Batch queries with `Promise.all` for parallel queries
- Denormalize for performance (gcBurnout in metadata)

---

## Missing Performance Optimizations

### 1. Crisis Response <600ms Fast-Path 🔴 CRITICAL

**FEATURES.md Requirement**: Crisis response latency <600ms (p95)

**Current State**: Crisis detection exists but may route through LLM

**Optimization**:
- **Deterministic keyword detection** (no LLM call)
- **Pre-computed crisis response template** (single segment)
- **Short-circuit at HTTP router** (before agent routing)
- **Logging for latency monitoring** (track p95)

**Implementation**:
```typescript
// convex/inbound.ts
async function handleCrisisFastPath(ctx: ActionCtx, text: string, phone: string) {
  const startTime = Date.now()
  
  // Deterministic detection (already exists)
  const crisisResult = detectCrisis(text)
  if (!crisisResult.isCrisis) return null
  
  // Pre-computed response (no LLM)
  const response = getCrisisResponse(crisisResult.isDVHint)
  
  // Send immediately
  await ctx.runAction(internal.twilio.sendSMS, { to: phone, body: response })
  
  // Log latency
  const latency = Date.now() - startTime
  await ctx.runMutation(internal.metrics.logCrisisLatency, { latency })
  
  return { routed: 'crisis', latency }
}
```

**Files**:
- `convex/inbound.ts`: Add fast-path before agent routing
- `convex/lib/utils.ts`: Ensure `getCrisisResponse()` is deterministic
- `convex/internal/metrics.ts`: Add latency logging

---

### 2. Assessment Cooldown Enforcement

**FEATURES.md Requirement**: Cooldowns prevent gaming and reduce load

**Current State**: Cooldown check exists but should be explicit in plan

**Optimization**:
- Check cooldown **before** starting assessment (single query)
- Return user-friendly error with days remaining
- Prevents unnecessary session creation

**Implementation**:
```typescript
// convex/lib/services/assessmentService.ts
export async function checkCooldown(
  ctx: QueryCtx,
  userId: Id<'users'>,
  definitionId: AssessmentType
): Promise<{ allowed: boolean; daysRemaining?: number }> {
  const catalogEntry = getAssessmentDefinition(definitionId)
  const lastCompleted = await ctx.db
    .query('assessments')
    .withIndex('by_user_and_type_time', q =>
      q.eq('userId', userId).eq('definitionId', definitionId))
    .order('desc')
    .first()
  
  if (!lastCompleted) return { allowed: true }
  
  const timeSince = Date.now() - lastCompleted.completedAt
  const cooldownMs = catalogEntry.cooldownDays * 24 * 60 * 60 * 1000
  
  if (timeSince < cooldownMs) {
    const daysRemaining = Math.ceil((cooldownMs - timeSince) / (24 * 60 * 60 * 1000))
    return { allowed: false, daysRemaining }
  }
  
  return { allowed: true }
}
```

**Files**:
- `convex/lib/services/assessmentService.ts`: Add explicit cooldown check
- `convex/tools.ts`: Call cooldown check before `startAssessment`

---

### 3. Resource Cache TTL Optimization

**FEATURES.md Requirement**: Smart caching with category-based TTLs

**Current State**: Cache exists but TTL could be optimized

**Optimization**:
- **Category-based TTLs** (respite: 30 days, meals: 1 day)
- **Stale-while-revalidate** pattern (return stale, refresh in background)
- **Reduce Maps API calls** (primary cost driver)

**Implementation**:
```typescript
// convex/resources.ts
const CATEGORY_TTLS_DAYS: Record<string, number> = {
  respite: 30,      // Changes rarely
  support: 7,       // Weekly updates
  daycare: 14,      // Bi-weekly
  homecare: 14,
  medical: 7,
  community: 7,
  meals: 1,         // Daily changes
  transport: 7,
  hospice: 30,
  memory: 30,
}
```

**Files**:
- `convex/resources.ts`: Already has TTL logic, verify it's optimal
- `convex/workflows.ts`: Background refresh workflow

---

### 4. Subscription Grace Period Handling

**FEATURES.md Requirement**: Grace period allows resubscription without losing continuity

**Current State**: Schema has `gracePeriodEndsAt` but logic missing

**Optimization**:
- Check `gracePeriodEndsAt` in subscription queries
- Allow access during grace period
- Redirect to resubscribe after grace period expires

**Implementation**:
```typescript
// convex/lib/services/subscriptionService.ts
export async function checkSubscriptionAccess(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<{ hasAccess: boolean; reason?: string }> {
  const subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', q => q.eq('userId', userId))
    .first()
  
  if (!subscription) return { hasAccess: false, reason: 'no_subscription' }
  
  // Check grace period
  if (subscription.status === 'canceled' && subscription.gracePeriodEndsAt) {
    if (Date.now() < subscription.gracePeriodEndsAt) {
      return { hasAccess: true, reason: 'grace_period' }
    }
    return { hasAccess: false, reason: 'grace_period_expired' }
  }
  
  return { hasAccess: subscription.status === 'active' }
}
```

**Files**:
- `convex/lib/services/subscriptionService.ts`: Add grace period check
- `convex/inbound.ts`: Check subscription before agent routing (except crisis)

---

### 5. Subscription Gating (Crisis Always Available)

**FEATURES.md Requirement**: Crisis support always available regardless of subscription

**Current State**: Gating logic missing

**Optimization**:
- Check subscription status before agent routing
- **Bypass gating for crisis keywords** (safety first)
- Return resubscribe message for inactive subscriptions (non-crisis)

**Implementation**:
```typescript
// convex/inbound.ts
async function checkAccess(ctx: QueryCtx, userId: Id<'users'>, isCrisis: boolean) {
  // Crisis always allowed
  if (isCrisis) return { allowed: true }
  
  // Check subscription
  const access = await checkSubscriptionAccess(ctx, userId)
  if (access.hasAccess) return { allowed: true }
  
  // Return resubscribe message
  return {
    allowed: false,
    message: 'Your subscription has ended. Crisis support is always available. To continue using GiveCare, please resubscribe at [link].'
  }
}
```

**Files**:
- `convex/inbound.ts`: Add access check before agent routing
- `convex/lib/services/subscriptionService.ts`: Subscription check function

---

### 6. Proactive Messaging Frequency Adaptation

**FEATURES.md Requirement**: Frequency adapts to burnout score

**Current State**: Fixed frequency, not adaptive

**Optimization**:
- **Daily** for crisis/moderate users (gcBurnout ≥60)
- **Weekly** for stable users (gcBurnout <60)
- Update frequency after each assessment completion

**Implementation**:
```typescript
// convex/lib/domain/messaging.ts
export function getCheckInFrequency(gcBurnout: number): 'daily' | 'weekly' {
  return gcBurnout >= 60 ? 'daily' : 'weekly'
}

// convex/lib/services/wellnessService.ts
export async function updateCheckInFrequency(
  ctx: MutationCtx,
  userId: Id<'users'>
) {
  const user = await ctx.db.get(userId)
  const gcBurnout = user.metadata?.gcBurnout ?? 0
  const frequency = getCheckInFrequency(gcBurnout)
  
  await ctx.db.patch(userId, {
    metadata: {
      ...user.metadata,
      checkInFrequency: frequency,
    }
  })
}
```

**Files**:
- `convex/lib/domain/messaging.ts`: Frequency calculation
- `convex/lib/services/wellnessService.ts`: Update frequency after assessment
- `convex/crons.ts`: Use frequency for scheduled check-ins

---

### 7. Memory Retrieval Optimization

**FEATURES.md Requirement**: Memory importance scoring (1-10), prioritize what matters

**Current State**: Vector search exists but could be optimized

**Optimization**:
- **Limit retrieval to top 5** by importance (≥7)
- **Cache recent memories** per user (avoid repeated searches)
- **Async retrieval** (non-blocking agent execution)

**Implementation**:
```typescript
// convex/lib/services/memoryService.ts
export async function getRelevantMemories(
  ctx: QueryCtx,
  userId: Id<'users'>,
  query: string,
  limit: number = 5
): Promise<Memory[]> {
  // Get all memories for user (single query)
  const allMemories = await ctx.db
    .query('memories')
    .withIndex('by_user_category', q => q.eq('userId', userId))
    .collect()
  
  // Filter by importance (≥7)
  const importantMemories = allMemories.filter(m => m.importance >= 7)
  
  // Use vector search on important memories only
  // (Agent Component handles vector search)
  return importantMemories.slice(0, limit)
}
```

**Files**:
- `convex/lib/services/memoryService.ts`: Optimize retrieval
- `convex/agents.ts`: Ensure async memory retrieval

---

## Query Performance Optimizations

### 8. Composite Score Query Optimization

**Current Issue**: May query multiple tables sequentially

**Optimization**:
- Single query with join-like pattern
- Use `scores_composite` table for trends (already planned)
- Denormalize `gcBurnout` in metadata (already planned)

**Implementation**:
```typescript
// convex/lib/services/wellnessService.ts
export async function getCompositeScore(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<number> {
  // Fast path: Use denormalized value
  const user = await ctx.db.get(userId)
  if (user.metadata?.gcBurnout !== undefined) {
    return user.metadata.gcBurnout
  }
  
  // Fallback: Calculate from scores_composite (single query)
  const latest = await ctx.db
    .query('scores_composite')
    .withIndex('by_user_time', q => q.eq('userId', userId))
    .order('desc')
    .first()
  
  return latest?.gcBurnout ?? 0
}
```

---

### 9. Intervention Query Optimization

**Current Issue**: May query all interventions then filter

**Optimization**:
- Use `intervention_zones` index for zone filtering
- Limit results to top 10 (evidence-based ranking)

**Implementation**:
```typescript
// convex/lib/services/interventionService.ts
export async function getInterventionsForZones(
  ctx: QueryCtx,
  zones: string[]
): Promise<Intervention[]> {
  // Use index for zone filtering
  const zoneInterventions = await Promise.all(
    zones.map(zone =>
      ctx.db
        .query('intervention_zones')
        .withIndex('by_zone', q => q.eq('zone', zone))
        .collect()
    )
  )
  
  // Get unique intervention IDs
  const interventionIds = new Set(
    zoneInterventions.flat().map(zi => zi.interventionId)
  )
  
  // Fetch interventions (single batch)
  const interventions = await Promise.all(
    Array.from(interventionIds).map(id => ctx.db.get(id))
  )
  
  // Rank by evidence level (pure function)
  return matchInterventionsToZones(interventions.filter(Boolean), zones)
    .slice(0, 10) // Limit to top 10
}
```

---

## Updated Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. Stripe: Event-driven webhook, idempotent mutations
2. Composite Burnout: Domain function + service + write-through
3. Phone Normalization: Fix E.164 format preservation
4. Schema: Add `events` table, `scores_composite` table

### Phase 2: Domain Logic (Week 2)
5. Onboarding Policy: Centralized `enforce()` function
6. Zone Mapping: Pure function for resource suggestions
7. SDOH Enrichment: Pure function + audit trail
8. Proactive Resource Suggestions: Workflow after assessment

### Phase 3: Learning Loop (Week 3)
9. Events Table: Create and migrate from `intervention_events`
10. Trend Detection: Event-first analysis, workflow for decline
11. Effectiveness Analysis: Pure function for intervention ranking

### Phase 4: Infrastructure & Polish (Week 4)
12. Feature Flags: Centralized `FEATURES` object
13. Query Batching: `getInboundContext()` with Promise.all
14. Message Templates: Pure functions with SMS segment enforcement
15. Resource Cache: Policy-safe (place_id only) + category-based TTL
16. TypeScript Path Aliases: Add `@domain/*`, `@services/*`, `@infra/*`
17. Tests: Domain tests, service tests, smoke tests

### Phase 5: Performance & FEATURES.md Compliance (Week 5) 🔴 NEW
18. **Crisis Response Optimization**: Fast-path routing (<600ms p95)
    - Deterministic keyword detection
    - Pre-computed crisis response template
    - Short-circuit at HTTP router
    - Latency logging for monitoring

19. **Assessment Cooldown Enforcement**: Explicit validation
    - Check cooldown before starting assessment
    - User-friendly error with days remaining
    - Prevents gaming and reduces load

20. **Subscription Grace Period**: Handle canceled subscriptions
    - Check `gracePeriodEndsAt` in subscription queries
    - Allow access during grace period
    - Redirect to resubscribe after expiration

21. **Subscription Gating**: Crisis always available
    - Check subscription status before agent routing
    - Bypass gating for crisis keywords
    - Return resubscribe message for inactive subscriptions

22. **Proactive Messaging Frequency**: Adapt to burnout score
    - Daily for crisis/moderate users (gcBurnout ≥60)
    - Weekly for stable users (gcBurnout <60)
    - Update frequency after each assessment

23. **Memory Retrieval Optimization**: Vector search performance
    - Limit retrieval to top 5 by importance (≥7)
    - Cache recent memories per user
    - Async retrieval (non-blocking)

24. **Query Performance**: Composite score and intervention queries
    - Use denormalized `gcBurnout` from metadata
    - Optimize intervention queries with indexes
    - Limit results to top 10

---

## Performance Targets

**CONVEX_01.md Compliance**:
- ✅ Queries/mutations <100ms (batch queries, use indexes)
- ✅ Work with <few hundred records (limit results)
- ✅ Denormalize for performance (gcBurnout in metadata)
- ✅ Batch queries with Promise.all (getInboundContext)

**FEATURES.md Compliance**:
- ✅ Crisis response <600ms (p95) - Fast-path routing
- ✅ Time to first value <3 messages - Onboarding policy
- ✅ Assessment completion 60% - Cooldown enforcement prevents gaming
- ✅ User retention 50% at 30 days - Proactive messaging frequency

---

## Success Criteria

**Performance**:
- Crisis response p95 <600ms ✅
- Main agent p95 <900ms ✅
- Assessment start <100ms ✅
- Resource search <500ms (cached) ✅

**FEATURES.md Compliance**:
- ✅ Grace period handling
- ✅ Subscription gating (crisis always available)
- ✅ Proactive messaging frequency adaptation
- ✅ Assessment cooldown enforcement
- ✅ Memory importance scoring (1-10)

**Ready to proceed with implementation.**

