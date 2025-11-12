# Architectural Refinement: Domain Features vs Infrastructure

## Core Architectural Principles

**Separation of Concerns**: Domain logic (caregiving) independent of infrastructure (Convex patterns)

**Reinforcing Learning Loop**: System improves through feedback → memory → better suggestions

**Loose Coupling**: Domain features communicate through interfaces, not direct dependencies

**Simplicity**: Each layer does one thing well, layers compose naturally

---

## Part 1: Stripe Architecture Fix 🔴 CRITICAL

### Current Problem

- Stripe checkout logic incorrectly placed in `convex/stripe.ts`
- Promo codes managed in Convex when Stripe handles them natively
- Checkout flow should be in `give-care-site`, not Convex

### Correct Architecture

**Checkout Flow** (give-care-site):

1. User fills form → `SignupFormConvex.tsx`
2. Calls `api.stripe.createCheckoutSession` (Convex action)
3. Convex action: Creates Stripe customer, returns checkout URL
4. Redirect to Stripe hosted checkout (promo codes handled by Stripe)
5. Stripe webhook → Convex HTTP router → Update subscription

**What Convex Should Do**:

- ✅ Create Stripe checkout session (action)
- ✅ Process Stripe webhooks (HTTP router)
- ✅ Update `subscriptions` table (mutation)
- ❌ NOT manage promo codes (Stripe handles this)
- ❌ NOT create checkout UI (give-care-site handles this)

**Promo Codes**:

- Stripe handles promo code validation and discount application
- Convex `promo_codes` table only needed if:
  - We want analytics on promo code usage
  - We need to track custom business logic (e.g., "first 100 users get 50% off")
- **Recommendation**: Remove `promo_codes` table unless analytics needed

**Files to Fix**:

- `convex/stripe.ts`: Remove promo code validation, simplify to webhook processing only
- `convex/http.ts`: Ensure Stripe webhook route exists
- `give-care-site`: Already correct (calls Convex action)

---

## Part 2: Architectural Layering

### Layer 1: Domain Logic (Caregiving Business Rules)

**Location**: `convex/lib/domain/`

**Purpose**: Pure business logic, no Convex dependencies

**Examples**:

- `assessmentScoring.ts`: Calculate burnout scores from answers
- `interventionMatching.ts`: Match interventions to pressure zones
- `profileEnrichment.ts`: Extract profile fields from SDOH
- `zoneMapping.ts`: Map pressure zones to resource categories

**Characteristics**:

- Pure TypeScript functions (no `ctx` parameter)
- Testable without Convex
- Reusable across different contexts (SMS, web, API)

### Layer 2: Domain Services (Convex-Aware Business Logic)

**Location**: `convex/lib/services/`

**Purpose**: Business logic that needs database access

**Examples**:

- `assessmentService.ts`: Start assessment, process answers, calculate scores
- `interventionService.ts`: Find interventions by zones, track preferences
- `resourceService.ts`: Search resources, cache results
- `memoryService.ts`: Record memories, retrieve by relevance

**Characteristics**:

- Takes `ctx` parameter (QueryCtx, MutationCtx, ActionCtx)
- Uses domain logic functions from Layer 1
- Handles Convex-specific concerns (transactions, queries)

### Layer 3: Infrastructure (Convex Patterns)

**Location**: `convex/lib/infrastructure/`

**Purpose**: Generic Convex patterns, reusable across domains

**Examples**:

- `workflows.ts`: Durable workflow definitions
- `crons.ts`: Scheduled job definitions
- `rateLimiting.ts`: Rate limit checks
- `featureFlags.ts`: Feature flag checks

**Characteristics**:

- Domain-agnostic
- Follows CONVEX_01.md and CONVEX_02.md patterns
- Composable with domain services

### Layer 4: API Surface (Public Functions)

**Location**: `convex/` (root level)

**Purpose**: Public API for clients and agents

**Examples**:

- `agents.ts`: Agent definitions and public actions
- `assessments.ts`: Public assessment API
- `resources.ts`: Public resource search API
- `stripe.ts`: Stripe webhook processing

**Characteristics**:

- Thin wrappers around domain services
- Argument validation
- Access control checks

---

## Part 3: Reinforcing Learning Loop

### How the System Learns

**Feedback Loop 1: Intervention Effectiveness**

```
User receives intervention → Tries it → Reports result (via trackInterventionPreference)
→ Stored in events table → Analyzed by trend detection
→ Future suggestions prioritize interventions with positive outcomes
```

**Feedback Loop 2: Resource Relevance**

```
User searches resources → Clicks/uses resource → System records usage
→ Memory system stores "intervention_result" → Future searches prioritize used resources
→ Resource cache learns which categories are most useful per zip code
```

**Feedback Loop 3: Assessment Patterns**

```
User completes assessments → Scores tracked over time → Trends detected
→ System learns which pressure zones correlate with outcomes
→ Proactive suggestions improve (e.g., "time" zone → suggest respite earlier)
```

**Feedback Loop 4: Memory Relevance**

```
User mentions care routine → Stored in memory → Later referenced by agent
→ User confirms relevance → Memory importance score increases
→ System learns which memories are most useful for each user
```

### Implementation Pattern

**Domain Logic** (`lib/domain/learning.ts`):

```typescript
// Pure function: Analyze intervention effectiveness
export function analyzeInterventionEffectiveness(
  events: Event[]
): InterventionEffectiveness {
  // Calculate success rates per intervention per zone
  // Return which interventions work best for which zones
}
```

**Domain Service** (`lib/services/learningService.ts`):

```typescript
// Convex-aware: Query database, call domain logic
export async function getEffectiveInterventions(
  ctx: QueryCtx,
  zones: string[]
): Promise<Intervention[]> {
  const events = await ctx.db.query('events')
    .withIndex('by_type_time', q => q.eq('type', 'intervention.success'))
    .collect()
  const effectiveness = analyzeInterventionEffectiveness(events)
  // Return interventions ranked by effectiveness for these zones
}
```

**Infrastructure** (`lib/infrastructure/trends.ts`):

```typescript
// Generic pattern: Detect trends across all users
export async function detectScoreTrends(ctx: ActionCtx) {
  // Batch query all users with 2+ scores
  // Calculate trends
  // Schedule workflows for declining users
}
```

**API Surface** (`agents.ts`):

```typescript
// Public: Agent tool that uses learning service
export const findInterventions = createTool({
  handler: async (ctx, { zones }) => {
    // Call learning service to get effective interventions
    return await getEffectiveInterventions(ctx, zones)
  }
})
```

---

## Part 4: Domain Features (Simplified, Elegant)

### 4.0 Composite Caregiver Burnout Score (gcBurnout) 🔴 CRITICAL

**FEATURES.md Requirement**:

> "The goal of the app experience is to arrive at that number and then to lower it through interventions and resources"

**Status**: ❌ **MISSING**

**What's Needed**:

- Composite burnout score calculated from all completed assessments (EMA, SDOH, REACH-II, CWBS)
- Weighted average or aggregation method that combines scores from different instruments
- This is the PRIMARY metric users are trying to lower
- Should be recalculated whenever a new assessment is completed

**Current State**:

- Each assessment calculates its own `gcBurnout` score (0-100)
- `wellness.ts` only returns the latest score, not a composite
- No function combines scores from multiple assessments

**Domain Logic** (`lib/domain/burnoutScoring.ts`):

```typescript
// Pure function: Calculate composite burnout score
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

**Domain Service** (`lib/services/wellnessService.ts`):

```typescript
export async function recalculateComposite(
  ctx: MutationCtx,
  userId: Id<'users'>
): Promise<void> {
  // Get all scores for user (single query)
  const scores = await ctx.db
    .query('scores')
    .withIndex('by_user_and_type_time', q => q.eq('userId', userId))
    .order('desc')
    .collect()
  
  // Calculate composite using domain logic
  const inputs = scores.map(s => ({
    instrument: s.instrument,
    gcBurnout: s.gcBurnout,
    answeredRatio: s.answeredRatio,
    timeMs: s._creationTime,
  }))
  const compositeScore = composite(inputs)
  const compositeBand = band(compositeScore)
  
  // Write-through to metadata (denormalization for performance)
  const user = await ctx.db.get(userId)
  await ctx.db.patch(userId, {
    metadata: { ...user.metadata, gcBurnout: compositeScore }
  })
  
  // Also store in scores_composite for trend charts
  await ctx.db.insert('scores_composite', {
    userId,
    gcBurnout: compositeScore,
    band: compositeBand,
  })
}
```

**Integration Points**:

- Update `wellness.ts` to use composite score instead of latest score
- Update `checkWellnessStatus` tool to return composite score
- **Recalculate composite after each assessment completion** (write-through)
- Store composite in user metadata for quick access

**Files to Create/Modify**:

- `convex/lib/domain/burnoutScoring.ts`: Composite calculation logic
- `convex/lib/services/wellnessService.ts`: Convex-aware service
- `convex/wellness.ts`: Update to use composite score
- `convex/internal/assessments.ts`: Call `recalculateComposite()` after completion

---

### 4.1 Progressive Onboarding (State-Based Awareness) 🔴 CRITICAL

**FEATURES.md Requirement**:

> "Contextually aware or state-based awareness of what fields are missing and what are required for interactions or engagements to be meaningful"

**Status**: ⚠️ **PARTIAL** (onboardingStage exists, but no field tracking logic)

**What's Needed**:

- Track which fields are missing for meaningful interactions
- Contextually ask for required fields before allowing certain actions
- Example: Resource search requires zip code → check before allowing search
- Example: Assessment suggestions require care recipient → check before offering
- State-based awareness: System knows what's needed for each interaction type

**Current State**:

- `onboardingStage` field exists in metadata
- No logic that checks missing fields
- No state machine that determines what to ask next
- No validation before allowing actions

**Domain Logic** (`lib/domain/onboarding.ts`):

```typescript
// Pure function: Determine what fields are missing
export function getMissingRequiredFields(
  profile: Partial<UserProfile>,
  interactionType: 'resource_search' | 'assessment' | 'intervention' | 'check_in'
): string[] {
  const REQUIRED: Record<string, (keyof UserProfile)[]> = {
    resource_search: ['zipCode'],
    assessment: ['careRecipient'],
    intervention: ['careRecipient'],
    check_in: [] // No required fields
  }
  
  const missing: string[] = []
  for (const field of REQUIRED[interactionType] || []) {
    if (!profile[field]) {
      missing.push(field)
    }
  }
  return missing
}

// Pure function: Get next onboarding question
export function getNextOnboardingStep(
  stage: OnboardingStage,
  profile: Partial<UserProfile>
): { nextField: string | null; nextStage: OnboardingStage } {
  // State machine: new → care_recipient → zip_code → assessment_offer → complete
  if (stage === 'new' && !profile.careRecipient) {
    return { nextField: 'careRecipient', nextStage: 'care_recipient' }
  }
  if (stage === 'care_recipient' && !profile.zipCode) {
    return { nextField: 'zipCode', nextStage: 'zip_code' }
  }
  // ... etc
  return { nextField: null, nextStage: 'complete' }
}
```

**Domain Service** (`lib/services/onboardingService.ts`):

```typescript
export async function enforce(
  ctx: QueryCtx,
  userId: Id<'users'>,
  interactionType: string
): Promise<{ allowed: boolean; missingFields: string[]; prompt?: string }> {
  const user = await ctx.db.get(userId)
  const profile = user?.metadata?.profile || {}
  
  const missing = getMissingRequiredFields(profile, interactionType as any)
  
  if (missing.length === 0) {
    return { allowed: true, missingFields: [] }
  }
  
  // Return single question for first missing field
  const firstField = missing[0]
  return {
    allowed: false,
    missingFields: missing,
    prompt: getUserFriendlyPrompt(firstField)
  }
}
```

**Integration Points**:

- `searchResources` tool: Call `enforce()` before allowing search
- `startAssessment` tool: Call `enforce()` before offering
- Main Agent: Check onboarding state before each interaction
- Update onboarding stage as fields are collected

**Files to Create/Modify**:

- `convex/lib/domain/onboarding.ts`: Onboarding state machine logic
- `convex/lib/services/onboardingService.ts`: Convex-aware onboarding service
- `convex/tools.ts`: Add `enforce()` check to all tools (except crisis path)
- `convex/agents.ts`: Check onboarding state in Main Agent context handler

---

### 4.2 Proactive Resource Suggestions

**Domain Logic** (`lib/domain/zoneMapping.ts`):

```typescript
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

**Domain Service** (`lib/services/resourceService.ts`):

```typescript
export async function suggestResourcesForZone(
  ctx: ActionCtx,
  userId: Id<'users'>,
  zone: string
): Promise<void> {
  const categories = mapZoneToCategories(zone)
  // Use existing searchResources tool via agent
  // Or call Maps API directly
}
```

**Infrastructure** (`workflows.ts`):

```typescript
export const suggestResourcesWorkflow = workflow.define({
  args: {
    userId: v.id('users'),
    zone: v.string(),
  },
  handler: async (step, { userId, zone }) => {
    await step.runAction(api.services.resourceService.suggestResourcesForZone, {
      userId,
      zone
    })
  }
})
```

**Trigger** (`internal/assessments.ts`):

```typescript
// After assessment completion
const highestZone = Object.entries(score.zones)
  .sort(([, a], [, b]) => b - a)[0][0]
  
await ctx.scheduler.runAfter(0, internal.workflows.suggestResourcesWorkflow, {
  userId: user._id,
  zone: highestZone
})
```

---

### 4.3 SDOH Profile Enrichment

**Domain Logic** (`lib/domain/profileEnrichment.ts`):

```typescript
export function extractSDOHProfile(answers: AssessmentAnswer[]): Partial<UserProfile> {
  // Pure function: answers → profile fields
  // Calculate zone averages, map to profile values
  // Only low-risk fields: transportationNeeds, foodInsecurity, housingRisk
  const profile: Partial<UserProfile> = {}
  
  // Map SDOH answers to profile fields
  // Example: zone_financial high → financialStatus: 'struggling'
  
  return profile
}
```

**Domain Service** (`lib/services/assessmentService.ts`):

```typescript
export async function enrichProfileFromSDOH(
  ctx: MutationCtx,
  userId: Id<'users'>,
  answers: AssessmentAnswer[]
): Promise<void> {
  const profile = extractSDOHProfile(answers)
  
  // Audit trail: Store changes in profile_changes table
  await ctx.db.insert('profile_changes', {
    userId,
    changes: profile,
    source: 'sdoh_assessment',
    timestamp: Date.now(),
  })
  
  // Update user profile (only low-risk fields)
  const user = await ctx.db.get(userId)
  await ctx.db.patch(userId, {
    metadata: {
      ...user.metadata,
      profile: { ...user.metadata.profile, ...profile }
    }
  })
}
```

**Integration** (`internal/assessments.ts`):

```typescript
// After SDOH completion
if (definitionId === 'sdoh') {
  await enrichProfileFromSDOH(ctx, userId, session.answers)
}
```

---

### 4.4 Intervention Suggestions After Assessment

**Domain Logic** (`lib/domain/interventionMatching.ts`):

```typescript
export function matchInterventionsToZones(
  interventions: Intervention[],
  zones: string[]
): Intervention[] {
  // Pure function: Filter and rank interventions by zone match
  return interventions
    .filter(i => i.targetZones.some(z => zones.includes(z)))
    .sort((a, b) => {
      // Rank by evidence level (high > moderate > low)
      const evidenceRank = { high: 3, moderate: 2, low: 1 }
      return evidenceRank[b.evidenceLevel] - evidenceRank[a.evidenceLevel]
    })
}
```

**Domain Service** (`lib/services/interventionService.ts`):

```typescript
export async function getInterventionsForZones(
  ctx: QueryCtx,
  zones: string[]
): Promise<Intervention[]> {
  const all = await ctx.db.query('interventions').collect()
  return matchInterventionsToZones(all, zones)
}
```

**Agent Integration** (`agents.ts`):

```typescript
// Assessment Agent already has getInterventions tool
// After assessment completion, agent calls tool automatically
// Agent formats response with evidence levels
```

---

### 4.5 Score Trend Detection

**Domain Logic** (`lib/domain/trendAnalysis.ts`):

```typescript
export function calculateScoreTrend(scores: number[]): TrendResult {
  if (scores.length < 2) {
    return { direction: 'insufficient_data', change: 0 }
  }
  
  const recent = scores.slice(-3) // Last 3 scores
  const older = scores.slice(0, -3) // Earlier scores
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.length > 0 
    ? older.reduce((a, b) => a + b, 0) / older.length
    : recentAvg
  
  const change = recentAvg - olderAvg
  
  return {
    direction: change > 5 ? 'declining' : change < -5 ? 'improving' : 'stable',
    change: Math.abs(change),
  }
}
```

**Infrastructure** (`lib/infrastructure/trends.ts`):

```typescript
export async function detectScoreTrends(ctx: ActionCtx) {
  // Batch query all users with 2+ composite scores (single query)
  const users = await ctx.runQuery(internal.queries.getUsersWithMultipleCompositeScores)
  
  for (const user of users) {
    const scores = user.compositeScores.map(s => s.gcBurnout)
    const trend = calculateScoreTrend(scores)
    
    if (trend.direction === 'declining' && trend.change >= 5) {
      await ctx.scheduler.runAfter(0, internal.workflows.suggestInterventionsForDecline, {
        userId: user._id
      })
    }
  }
}
```

---

## Part 5: Infrastructure (Lightweight, Composable)

### 5.1 Feature Flags

**Location**: `convex/lib/infrastructure/featureFlags.ts`

**Pattern**: Simple environment variable checks

```typescript
export const FEATURES = {
  MAPS: process.env.FEATURE_MAPS !== 'false',
  TRENDS: process.env.FEATURE_TRENDS !== 'false',
  PROACTIVE: process.env.FEATURE_PROACTIVE !== 'false',
  SAFE_MODE: process.env.SAFE_MODE === 'on', // Explicit on-by-default
} as const
```

### 5.2 Query Batching

**Location**: `convex/lib/infrastructure/queryBatching.ts`

**Pattern**: Single query that batches multiple lookups

```typescript
export async function getInboundContext(
  ctx: QueryCtx,
  messageSid: string,
  phone: string
): Promise<InboundContext> {
  // Use Promise.all for parallel queries
  const [receipt, user, session, rateLimit] = await Promise.all([
    ctx.db.query('inbound_receipts').withIndex('by_sid', q => q.eq('messageSid', messageSid)).first(),
    ctx.db.query('users').withIndex('by_phone', q => q.eq('phone', phone)).first(),
    ctx.db.query('assessment_sessions').withIndex('by_user_status', q => q.eq('userId', user?._id).eq('status', 'active')).first(),
    checkRateLimit(ctx, user?._id), // Rate limit check
  ])
  
  return { receipt, user, session, rateLimitOk: rateLimit.ok }
}
```

### 5.3 Message Templates

**Location**: `convex/lib/domain/messageTemplates.ts`

**Pattern**: Pure functions that return message strings

```typescript
export function getDay5Nudge(name: string): string {
  return `Hey ${name}, just checking in. How are you doing today?`
}

export function getDay7Nudge(name: string): string {
  return `Hi ${name}, it's been a week. Want to do a quick check-in?`
}

export function getDay14Nudge(name: string): string {
  return `${name}, we haven't heard from you. Everything okay?`
}
```

**SMS Segment Enforcement** (`lib/infrastructure/smsUtils.ts`):

```typescript
export function enforceSmsSegments(text: string): string {
  // Ensure single segment (≤160 chars)
  if (text.length > 160) {
    return text.substring(0, 157) + '...'
  }
  return text
}
```

---

## Summary: Architectural Principles

### Domain Features

- **Location**: `lib/domain/` (pure logic) + `lib/services/` (Convex-aware)
- **Pattern**: Pure functions → Domain services → API surface
- **Learning**: Feedback loops through `events` table → analysis → better suggestions

### Infrastructure

- **Location**: `lib/infrastructure/` (generic patterns)
- **Pattern**: Composable utilities (feature flags, batching, workflows)
- **Learning**: Infrastructure supports learning, doesn't dictate it

### Integration Points

- **Domain ↔ Infrastructure**: Domain services call infrastructure utilities
- **Domain ↔ API**: API surface calls domain services
- **Learning Loop**: Domain logic analyzes feedback, infrastructure executes workflows

### Stripe Fix

- **Checkout**: give-care-site → Convex action → Stripe → Webhook → Convex
- **Promo Codes**: Stripe handles validation, Convex only tracks if analytics needed
- **Recommendation**: Remove `promo_codes` table unless analytics required

---

## Critical Review Summary

**Full Review**: See `docs/ARCHITECTURAL_REVIEW.md` for detailed validation against CONVEX_01.md and CONVEX_02.md

### ✅ All 12 Suggestions Validated

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

**Key Findings**:

1. **Stripe**: "Events-in, state-out" aligns perfectly with CONVEX_01.md single mutation pattern
2. **Composite Burnout**: Primary metric - recalculate on every assessment completion (write-through)
3. **Onboarding Policy**: Centralized `enforce()` function prevents scattered checks
4. **Events Table**: Single append-only table replaces multiple event tables (more efficient)
5. **Schema**: `scores_composite` for trends, `events` for learning loop, **keep `externalId`** (supports phone + email)

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
15. **Resource Cache**: Policy-safe (place_id only) + category-based TTL optimization
16. **TypeScript Path Aliases**: Add `@domain/*`, `@services/*`, `@infra/*`
17. **Tests**: Domain tests, service tests, smoke tests

### Phase 5: Performance & FEATURES.md Compliance (Week 5) 🔴 NEW

18. **Crisis Response Optimization**: Fast-path routing (<600ms p95)
    - Deterministic keyword detection (no LLM)
    - Pre-computed crisis response template
    - Short-circuit at HTTP router level
    - Latency logging for monitoring

19. **Assessment Cooldown Enforcement**: Explicit validation
    - Check cooldown before starting assessment
    - Return user-friendly error with days remaining
    - Prevents gaming and reduces unnecessary load

20. **Subscription Grace Period**: Handle canceled subscriptions
    - Check `gracePeriodEndsAt` in subscription queries
    - Allow access during grace period
    - Redirect to resubscribe after grace period expires

21. **Subscription Gating**: Crisis always available
    - Check subscription status before agent routing
    - Bypass gating for crisis keywords (safety first)
    - Return resubscribe message for inactive subscriptions (non-crisis)

22. **Proactive Messaging Frequency**: Adapt to burnout score
    - Daily for crisis/moderate users (gcBurnout ≥60)
    - Weekly for stable users (gcBurnout <60)
    - Frequency stored in user metadata, updated after each assessment

23. **Memory Retrieval Optimization**: Vector search performance
    - Limit retrieval to top 5 by importance (≥7)
    - Cache recent memories per user
    - Async retrieval (non-blocking agent execution)

**See `PERFORMANCE_OPTIMIZATIONS.md` for detailed performance requirements and optimizations.**

---

## Implementation Details

### Composite Burnout Score (gcBurnout)

**Formula**:

```typescript
// @domain/burnoutScoring.ts
export function composite(inputs: Input[], now = Date.now()): number {
  const base = { ema: 0.15, cwbs: 0.3, reach2: 0.3, sdoh: 0.25 } as const
  const decay = (t: number) => Math.exp(-(now - t) / (30*24*3600e3)) // 30d half-life
  const w = (i: Input) => base[i.instrument] * (0.5 + 0.5 * i.answeredRatio) * decay(i.timeMs)
  const num = inputs.reduce((s, i) => s + w(i) * i.gcBurnout, 0)
  const den = inputs.reduce((s, i) => s + w(i), 0)
  return den ? Math.round(num / den) : NaN
}
```

**Write Path**: After any assessment completion, recalculate composite and store in:

- `users.metadata.gcBurnout` (denormalized for quick access)
- `scores_composite` table (for trend charts)

### Progressive Onboarding

**Policy Engine**:

```typescript
// @domain/onboarding.ts
const REQUIRED: Record<Interaction, (keyof UserProfile)[]> = {
  resource_search: ['zipCode'],
  assessment: ['careRecipient'],
  intervention: ['careRecipient'],
  check_in: []
}
```

**Usage**: Every tool calls `enforce()` before executing. Returns single question if not allowed.

### Events Table

**Schema**:

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
  payload: v.any(),
}).index('by_user_time', ['userId', '_creationTime'])
  .index('by_type_time', ['type', '_creationTime'])
```

**Migration**: Replace `intervention_events` with `events` table (migrate directly, no backward compatibility)

---

**Ready to proceed with implementation.**

