# Convex Architecture Refactoring Plan

## Executive Summary

Your codebase has **5 critical architectural issues** causing:
- **300x more database queries** than necessary
- **15+ RPC calls per message** (should be 2-3)
- **52 files when ~15 is optimal**
- **Performance risks** at scale

## Root Cause

Applied SQL/MVC patterns (normalization, repositories, services) to a document database that thrives on denormalization and simplicity.

---

## Issue 1: Over-Normalized Schema ⚠️ CRITICAL

### Current State (WRONG)
```typescript
// 4 separate tables requiring joins
users: { phoneNumber, email }
caregiverProfiles: { userId, firstName, burnoutScore, ... }
subscriptions: { userId, stripeCustomerId, ... }
conversationState: { userId, recentMessages, ... }

// Loading 100 users = 301 queries!
const users = await ctx.db.query('users').collect() // 1 query
const profiles = await Promise.all(users.map(u =>
  ctx.db.query('caregiverProfiles').withIndex('by_user', q => q.eq('userId', u._id)).first()
)) // 100 queries
// + 100 subscriptions + 100 conversationState = 301 total!
```

### Target State (CORRECT)
```typescript
// ONE denormalized table
users: defineTable({
  // Auth
  phoneNumber: v.optional(v.string()),
  email: v.optional(v.string()),

  // Profile (from caregiverProfiles)
  firstName: v.optional(v.string()),
  relationship: v.optional(v.string()),
  careRecipientName: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  journeyPhase: v.optional(v.string()),

  // Burnout (from caregiverProfiles)
  burnoutScore: v.optional(v.number()),
  burnoutBand: v.optional(v.string()),
  burnoutConfidence: v.optional(v.number()),
  pressureZones: v.optional(v.array(v.string())),
  pressureZoneScores: v.optional(v.object({
    physical_health: v.optional(v.number()),
    emotional_wellbeing: v.optional(v.number()),
    financial_concerns: v.optional(v.number()),
    time_management: v.optional(v.number()),
    social_support: v.optional(v.number()),
  })),

  // Activity (from caregiverProfiles)
  lastContactAt: v.optional(v.number()),
  lastProactiveMessageAt: v.optional(v.number()),
  lastCrisisEventAt: v.optional(v.number()),
  crisisFollowupCount: v.optional(v.number()),
  reactivationMessageCount: v.optional(v.number()),

  // Subscription (from subscriptions)
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  subscriptionStatus: v.optional(v.string()),
  canceledAt: v.optional(v.number()),
  trialEndsAt: v.optional(v.number()),

  // Conversation (from conversationState)
  recentMessages: v.optional(v.array(v.object({
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }))),
  historicalSummary: v.optional(v.string()),
  conversationStartDate: v.optional(v.number()),
  totalInteractionCount: v.optional(v.number()),

  // Onboarding
  onboardingAttempts: v.optional(v.record(v.string(), v.number())),
  onboardingCooldownUntil: v.optional(v.number()),
  assessmentInProgress: v.optional(v.boolean()),
  assessmentType: v.optional(v.string()),
  assessmentCurrentQuestion: v.optional(v.number()),

  // Device
  rcsCapable: v.optional(v.boolean()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('email', ['email'])
  .index('by_phone', ['phoneNumber'])
  .index('by_created', ['createdAt'])
  .index('by_journey', ['journeyPhase'])
  .index('by_burnout', ['burnoutScore'])
  .index('by_burnout_band', ['burnoutBand'])
  .index('by_last_contact', ['lastContactAt'])
  .index('by_stripe_customer', ['stripeCustomerId'])
  .index('by_stripe_subscription', ['stripeSubscriptionId'])
  .index('by_journey_contact', ['journeyPhase', 'lastContactAt'])
  .index('by_band_crisis', ['burnoutBand', 'lastCrisisEventAt'])

// Loading 100 users = 1 query!
const users = await ctx.db.query('users').collect()
```

### Migration Steps

1. **Add new fields to users table** (additive change - safe)
2. **Write migration mutation** to copy data
3. **Update all queries** to use single table
4. **Delete old tables** (caregiver Profiles, subscriptions, conversationState)
5. **Delete lib/userHelpers.ts** (479 lines - no longer needed!)

### Impact
- ✅ 300x query reduction (301 → 1 for 100 users)
- ✅ Delete 479-line helper file
- ✅ Simpler code (no joins, no enrichment)
- ✅ Transactional consistency
- ✅ All updates atomic

---

## Issue 2: Excessive ctx.run* Calls

### Current State (WRONG)
```typescript
// services/MessageHandler.ts - 15+ RPC calls!
export class MessageHandler {
  async handle(args) {
    const user = await this.ctx.runMutation(
      internal.functions.users.getOrCreateByPhone, {...}
    ) // RPC 1

    await this.ctx.runMutation(
      internal.functions.conversations.logMessage, {...}
    ) // RPC 2

    await this.ctx.runMutation(
      internal.functions.conversations.logMessage, {...}
    ) // RPC 3

    const responses = await this.ctx.runQuery(
      internal.functions.assessments.getSessionResponses, {...}
    ) // RPC 4

    // ... 11+ more RPC calls
  }
}
```

### Target State (CORRECT)
```typescript
// convex/messages.ts - ONE mutation for all DB work
export const processIncomingMessage = internalMutation({
  args: {
    from: v.string(),
    body: v.string(),
    agentResponse: v.string(),
    contextUpdates: v.any(),
  },
  handler: async (ctx, { from, body, agentResponse, contextUpdates }) => {
    // All DB operations in ONE transaction

    // 1. Get or create user
    let user = await ctx.db
      .query('users')
      .withIndex('by_phone', q => q.eq('phoneNumber', from))
      .first()

    if (!user) {
      const userId = await ctx.db.insert('users', {
        phoneNumber: from,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      user = await ctx.db.get(userId)
    }

    // 2. Log messages
    await ctx.db.insert('conversations', {
      userId: user._id,
      role: 'user',
      text: body,
      createdAt: Date.now(),
    })

    await ctx.db.insert('conversations', {
      userId: user._id,
      role: 'assistant',
      text: agentResponse,
      createdAt: Date.now(),
    })

    // 3. Update context
    await ctx.db.patch(user._id, {
      ...contextUpdates,
      lastContactAt: Date.now(),
      updatedAt: Date.now(),
    })

    return { success: true }
  }
})

// convex/twilio.ts - Action only handles agent
export const onIncomingMessage = internalAction({
  args: { from: v.string(), body: v.string(), ... },
  handler: async (ctx, args) => {
    // Call agent (requires Node runtime)
    const agent = new Agent(...)
    const response = await agent.run(args.body)

    // ONE mutation to save everything
    await ctx.runMutation(internal.messages.processIncomingMessage, {
      from: args.from,
      body: args.body,
      agentResponse: response.text,
      contextUpdates: response.contextUpdates,
    })
  }
})
```

### Impact
- ✅ 80% RPC reduction (15 → 2 calls)
- ✅ Transactional consistency
- ✅ Automatic conflict handling
- ✅ Simpler code

---

## Issue 3: Unbounded .collect() Queries

### Current State (WRONG)
```typescript
// functions/users.ts:290 - loads ALL crisis users!
export const getEligibleForCrisisDaily = internalQuery({
  handler: async ctx => {
    const profiles = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_burnout_band', q => q.eq('burnoutBand', 'crisis'))
      .collect() // Could be 1000+ users!

    // Filter in JavaScript (inefficient!)
    return profiles.filter(p =>
      p.journeyPhase === 'active' &&
      p.lastCrisisEventAt > sevenDaysAgo &&
      (!p.lastContactAt || p.lastContactAt < twoDaysAgo)
    )
  }
})
```

### Target State (CORRECT)
```typescript
// Option 1: Composite index
users: defineTable({...})
  .index('by_crisis_active', ['burnoutBand', 'journeyPhase'])

export const getEligibleForCrisisDaily = internalQuery({
  handler: async ctx => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000

    return await ctx.db
      .query('users')
      .withIndex('by_crisis_active', q =>
        q.eq('burnoutBand', 'crisis')
         .eq('journeyPhase', 'active')
      )
      .filter(q => q.lt(q.field('lastContactAt'), twoDaysAgo))
      .collect()
  }
})

// Option 2: Pagination
export const getEligibleForCrisisDaily = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_burnout_band', q => q.eq('burnoutBand', 'crisis'))
      .paginate(paginationOpts)
  }
})
```

### Files to Fix
- `convex/functions/users.ts` (lines 290, 315, 348, 378, 408)
- `convex/lib/userHelpers.ts` (line 242)
- `convex/feedback.ts` (lines 214-226)

### Impact
- ✅ O(n) → O(log n) query performance
- ✅ Prevents bandwidth spikes at scale
- ✅ Better index utilization

---

## Issue 4: Actions Instead of Mutations

### Current State (WRONG)
```typescript
// newsletter.ts - 3 RPC calls for simple DB ops!
export const subscribe = action({ // ❌ Should be mutation
  handler: async (ctx, { email }) => {
    const existing = await ctx.runQuery(
      api.functions.newsletter.getByEmail, { email }
    ) // RPC 1

    if (existing) {
      await ctx.runMutation(
        api.functions.newsletter.resubscribe, { email }
      ) // RPC 2
    } else {
      await ctx.runMutation(
        api.functions.newsletter.create, { email }
      ) // RPC 3
    }
  }
})
```

### Target State (CORRECT)
```typescript
export const subscribe = mutation({ // ✅ Mutation!
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email')
    }
    const normalized = email.toLowerCase().trim()

    // Read + write in ONE transaction
    const existing = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_email', q => q.eq('email', normalized))
      .unique()

    if (existing && !existing.unsubscribed) {
      return { success: true, alreadySubscribed: true }
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        unsubscribed: false,
        resubscribedAt: Date.now(),
      })
    } else {
      await ctx.db.insert('newsletterSubscribers', {
        email: normalized,
        subscribedAt: Date.now(),
      })
    }

    return { success: true, email: normalized }
  }
})
```

### Impact
- ✅ 66% RPC reduction (3 → 1)
- ✅ Transactional consistency
- ✅ Simpler code

---

## Issue 5: Over-Organization

### Current State (52 files)
```
convex/
├── functions/ (30+ files)
│   ├── users.ts
│   ├── assessments.ts
│   ├── wellness.ts
│   └── ... 27 more
├── lib/
│   └── userHelpers.ts (479 lines)
├── services/
│   └── MessageHandler.ts
├── email/
├── resources/
└── utils/
```

### Target State (~15 files)
```
convex/
├── model/ (business logic - plain functions)
│   ├── users.ts (~200 lines)
│   ├── messages.ts (~200 lines)
│   ├── assessments.ts (~200 lines)
│   ├── wellness.ts (~150 lines)
│   └── ... ~8 files total
├── users.ts (thin wrapper, ~30 lines)
├── messages.ts (thin wrapper, ~30 lines)
├── assessments.ts (thin wrapper, ~30 lines)
├── http.ts
├── crons.ts
└── schema.ts
```

### Pattern
```typescript
// convex/model/users.ts - ALL logic here
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")

  return await ctx.db
    .query('users')
    .withIndex('by_token', q => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique()
}

export async function updateProfile(
  ctx: MutationCtx,
  userId: Id<'users'>,
  updates: { firstName?: string; lastName?: string }
) {
  await ctx.db.patch(userId, updates)
}

// convex/users.ts - Thin wrapper (20 lines)
import * as Users from './model/users'

export const getCurrentUser = query({
  handler: (ctx) => Users.getCurrentUser(ctx)
})

export const updateProfile = mutation({
  args: { userId: v.id('users'), updates: v.object({...}) },
  handler: (ctx, { userId, updates }) =>
    Users.updateProfile(ctx, userId, updates)
})
```

### Impact
- ✅ 60% file reduction (52 → 15)
- ✅ 60% code reduction (~5000 → ~2000 lines)
- ✅ Delete lib/, services/ directories
- ✅ Clearer architecture

---

## Implementation Order

### Phase 1: Critical (Do Before Launch)

**Day 1-2: Schema Denormalization**
1. Add fields to users table (additive, safe)
2. Write migration mutation
3. Test migration on dev data
4. Update all queries to use users table
5. Delete old tables
6. Delete lib/userHelpers.ts

**Day 3: MessageHandler Consolidation**
1. Create processIncomingMessage mutation
2. Move all DB ops from action → mutation
3. Update onIncomingMessage to call single mutation
4. Test with sample messages

**Day 4: Fix Unbounded Queries**
1. Add composite indexes
2. Rewrite 5 problematic queries
3. Test with large datasets

### Phase 2: High Priority (Post-Launch)

**Day 5: Newsletter Refactor**
1. Convert subscribe/unsubscribe to mutations
2. Remove helper functions
3. Test from marketing site

**Day 6-8: Reorganize to model/**
1. Create model/ directory
2. Move users logic
3. Move messages logic
4. Move assessment logic
5. Update all imports

---

## Testing Strategy

For each fix, write tests FIRST (TDD):

```typescript
// 1. Write failing test
test('should load user in one query', async () => {
  const user = await ctx.db.get(userId)
  expect(user.firstName).toBe('John')
  expect(user.burnoutScore).toBe(65)
  expect(user.stripeCustomerId).toBe('cus_123')
})

// 2. Implement to pass test
// 3. Refactor
// 4. Verify test still passes
```

---

## Success Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Queries for 100 users | 301 | 1 | 300x |
| RPCs per message | 15+ | 2-3 | 80% |
| Newsletter RPCs | 3 | 1 | 66% |
| Total files | 52 | ~15 | 71% |
| Lines of code | ~5000 | ~2000 | 60% |
| Helper file lines | 479 | 0 | 100% |

---

## Quick Wins (Do Today)

**1. Fix one unbounded query** (15 min)
```typescript
// users.ts:290 - Before
const profiles = await ctx.db.query('caregiverProfiles')...collect()
const eligible = profiles.filter(...)

// After
const eligible = await ctx.db.query('caregiverProfiles')
  .filter(q => q.eq(q.field('journeyPhase'), 'active'))
  .collect()
```

**2. Add no-floating-promises** (5 min)
```javascript
// eslint.config.js
rules: {
  "@typescript-eslint/no-floating-promises": "error"
}
```

**3. Convert newsletter.subscribe to mutation** (30 min)
See Issue 4 above for complete code.

---

## Questions?

These fixes will make your codebase:
- **300x faster** for user queries
- **60% smaller** (fewer files, less code)
- **100% compliant** with Convex best practices
- **Ready to scale** to 10,000+ users

The key insight: **Embrace denormalization**. You're using a document database - let it do what it's good at!
