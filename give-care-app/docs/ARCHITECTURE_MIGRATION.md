# Architecture Migration Guide

## Overview

This guide covers migrating from the PHASE 1 denormalized schema to the improved PHASE 2 architecture that follows Convex best practices.

**Key Changes:**
1. Split hot `users` table to reduce contention
2. Add `jobs` table for idempotent side-effects (outbox pattern)
3. Type-safe context helpers prevent context leakage
4. Role-based admin auth (DB-driven, not hardcoded)
5. Webhook signature verification helpers
6. Idempotency patterns for external API calls

---

## Schema Changes

### Before (PHASE 1 - Hot Users Table)

```typescript
users: {
  // Auth (10 fields)
  name, email, phone, phoneNumber, ...

  // Profile (8 fields)
  firstName, relationship, zipCode, journeyPhase, ...

  // Burnout (5 fields)
  burnoutScore, burnoutBand, pressureZones, ...

  // Activity (5 fields)
  lastContactAt, lastProactiveMessageAt, ...

  // Assessments (6 fields)
  assessmentInProgress, assessmentType, ...

  // Subscription (5 fields)
  stripeCustomerId, subscriptionStatus, ...

  // Conversation (5 fields)
  recentMessages, historicalSummary, ...
}
```

**Problem:** 117 fields in one table = contention hotspot. Every SMS, billing event, and assessment update hits the same row.

### After (PHASE 2 - Split Tables)

```typescript
// Auth identity only (minimal for fast webhook lookup)
users: {
  email, phoneNumber, roles, createdAt, updatedAt
}

// Mostly static profile data
userProfiles: {
  userId, firstName, relationship, zipCode, journeyPhase,
  burnoutScore, burnoutBand, pressureZones,
  lastContactAt, assessmentInProgress, ...
}

// High-churn conversation data
conversationState: {
  userId, recentMessages, historicalSummary,
  conversationStartDate, totalInteractionCount, ...
}

// Subscription data
billingAccounts: {
  userId, stripeCustomerId, stripeSubscriptionId,
  subscriptionStatus, canceledAt, trialEndsAt, ...
}

// Idempotent side-effects (NEW)
jobs: {
  key, type, payload, status, attempts,
  nextAttemptAt, lastError, result, ...
}
```

**Benefit:** Reduced write contention, clearer separation of concerns, better query patterns.

---

## Migration Steps

### 1. Add New Tables (Non-Breaking)

The schema changes are additive. Deploy the new schema first:

```bash
npx convex deploy
```

This adds `jobs`, `userProfiles`, `conversationState`, and `billingAccounts` tables without breaking existing code.

### 2. Backfill New Tables

Create a migration script to copy data from `users` to new tables:

```typescript
// convex/migrations/splitUsersTables.ts
import { internalMutation } from './_generated/server'

export const backfillUserTables = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()

    for (const user of users) {
      // 1. Create userProfile
      const existing = await ctx.db
        .query('userProfiles')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .first()

      if (!existing) {
        await ctx.db.insert('userProfiles', {
          userId: user._id,
          firstName: user.firstName,
          relationship: user.relationship,
          careRecipientName: user.careRecipientName,
          zipCode: user.zipCode,
          languagePreference: user.languagePreference,
          journeyPhase: user.journeyPhase,
          burnoutScore: user.burnoutScore,
          burnoutBand: user.burnoutBand,
          burnoutConfidence: user.burnoutConfidence,
          pressureZones: user.pressureZones,
          pressureZoneScores: user.pressureZoneScores,
          lastContactAt: user.lastContactAt,
          lastProactiveMessageAt: user.lastProactiveMessageAt,
          lastCrisisEventAt: user.lastCrisisEventAt,
          crisisFollowupCount: user.crisisFollowupCount,
          reactivationMessageCount: user.reactivationMessageCount,
          onboardingAttempts: user.onboardingAttempts,
          onboardingCooldownUntil: user.onboardingCooldownUntil,
          assessmentInProgress: user.assessmentInProgress,
          assessmentType: user.assessmentType,
          assessmentCurrentQuestion: user.assessmentCurrentQuestion,
          assessmentSessionId: user.assessmentSessionId,
          rcsCapable: user.rcsCapable,
          deviceType: user.deviceType,
          consentAt: user.consentAt,
          appState: user.appState,
          createdAt: user.createdAt || Date.now(),
          updatedAt: user.updatedAt || Date.now(),
        })
      }

      // 2. Create conversationState (if has conversation data)
      if (user.recentMessages || user.historicalSummary) {
        const existingConvo = await ctx.db
          .query('conversationState')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .first()

        if (!existingConvo) {
          await ctx.db.insert('conversationState', {
            userId: user._id,
            recentMessages: user.recentMessages,
            historicalSummary: user.historicalSummary,
            historicalSummaryVersion: user.historicalSummaryVersion,
            conversationStartDate: user.conversationStartDate,
            totalInteractionCount: user.totalInteractionCount,
            historicalSummaryTokenUsage: user.historicalSummaryTokenUsage,
            updatedAt: Date.now(),
          })
        }
      }

      // 3. Create billingAccount (if has subscription data)
      if (user.stripeCustomerId || user.subscriptionStatus) {
        const existingBilling = await ctx.db
          .query('billingAccounts')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .first()

        if (!existingBilling) {
          await ctx.db.insert('billingAccounts', {
            userId: user._id,
            stripeCustomerId: user.stripeCustomerId,
            stripeSubscriptionId: user.stripeSubscriptionId,
            subscriptionStatus: user.subscriptionStatus,
            canceledAt: user.canceledAt,
            trialEndsAt: user.trialEndsAt,
            createdAt: user.createdAt || Date.now(),
            updatedAt: Date.now(),
          })
        }
      }
    }

    return { migrated: users.length }
  },
})
```

Run migration:

```bash
npx convex run migrations:backfillUserTables
```

### 3. Update Model Helpers

Use type-safe context helpers to prevent context leakage:

**Before:**
```typescript
// model/users.ts
export async function patch(
  ctx: MutationCtx,  // Full context
  userId: Id<'users'>,
  updates: Record<string, unknown>
) {
  await ctx.db.patch(userId, { ...updates, updatedAt: Date.now() })
}
```

**After:**
```typescript
// model/users.ts
import { DbWriter } from '../lib/context'

export async function patchProfile(
  db: DbWriter,  // Minimal capability
  userId: Id<'users'>,
  updates: Partial<UserProfile>
) {
  const profile = await db
    .query('userProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()

  if (!profile) {
    throw new Error('User profile not found')
  }

  await db.patch(profile._id, { ...updates, updatedAt: Date.now() })
}
```

### 4. Use Jobs Pattern for Side-Effects

**Before (direct Twilio call in action):**
```typescript
export const sendSMS = internalAction({
  handler: async (ctx, { to, message }) => {
    await ctx.runAction(components.twilio.messages.create, {
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message,
    })
  }
})
```

**After (jobs pattern with idempotency):**
```typescript
import { ensureUniqueJob, twilioJobKey } from '../lib/idempotency'

// 1. HTTP endpoint enqueues job
export const onIncomingMessage = internalAction({
  handler: async (ctx, { messageSid, from, body }) => {
    // Verify signature first
    // ...

    // Enqueue job with idempotency key
    await ctx.runMutation(internal.jobs.enqueue, {
      key: twilioJobKey(messageSid),
      type: 'process_inbound_sms',
      payload: { messageSid, from, body },
    })

    return { success: true }
  }
})

// 2. Worker processes job
export const processJobs = internalAction({
  handler: async (ctx) => {
    const job = await ctx.runMutation(internal.jobs.claim, {
      type: 'process_inbound_sms'
    })

    if (!job) return

    try {
      // Process message
      // ...

      // Mark complete
      await ctx.runMutation(internal.jobs.complete, { jobId: job._id })
    } catch (error) {
      // Retry with backoff
      await ctx.runMutation(internal.jobs.fail, {
        jobId: job._id,
        error: error.message,
        attempts: job.attempts,
      })
    }
  }
})
```

### 5. Verify Webhook Signatures

Use the new webhook helpers:

```typescript
import { verifyTwilioWebhook } from '../lib/webhooks'

export const onIncomingMessage = internalAction({
  handler: async (ctx, { twilioSignature, requestUrl, params }) => {
    // Verify signature
    const verification = verifyTwilioWebhook(
      process.env.TWILIO_AUTH_TOKEN,
      twilioSignature,
      requestUrl,
      params
    )

    if (!verification.valid) {
      return { error: 'Unauthorized', reason: verification.reason }
    }

    // Process webhook
    // ...
  }
})
```

### 6. Grant Admin Roles in DB

Instead of hardcoded `ADMIN_USER_IDS`, grant roles via mutation:

```typescript
// One-time: Grant admin role to bootstrap user
export const grantAdminRole = internalMutation({
  handler: async (ctx, { userId }: { userId: Id<'users'> }) => {
    const user = await ctx.db.get(userId)
    if (!user) throw new Error('User not found')

    const roles = user.roles || []
    if (!roles.includes('admin')) {
      await ctx.db.patch(userId, {
        roles: [...roles, 'admin'],
      })
    }
  }
})
```

---

## Testing Migration

### 1. Test Schema Compatibility

Ensure old code still works with new schema:

```bash
npm run test
```

### 2. Test Webhook Idempotency

Send duplicate webhook with same MessageSid:

```bash
curl -X POST https://your-app.convex.site/twilio/sms \
  -H "X-Twilio-Signature: <valid-sig>" \
  -d "MessageSid=SM123" \
  -d "From=+1234567890" \
  -d "Body=test"

# Second call should be deduplicated
curl -X POST https://your-app.convex.site/twilio/sms \
  -H "X-Twilio-Signature: <valid-sig>" \
  -d "MessageSid=SM123" \
  -d "From=+1234567890" \
  -d "Body=test"

# Check jobs table - should only have one job
```

### 3. Test Role-Based Admin

Verify admin access works:

```typescript
// Grant admin role
await ctx.runMutation(internal.admin.grantAdminRole, {
  userId: 'your-user-id'
})

// Test admin endpoint
const metrics = await ctx.runQuery(internal.functions.admin.getSystemMetrics)
```

---

## Rollback Plan

If issues arise, rollback is safe because:

1. Old `users` table is unchanged (still has all fields)
2. New tables are additive (can be ignored)
3. Code can fall back to reading from `users` table

To rollback:
1. Revert code changes
2. Keep new tables (for future migration retry)
3. Continue using old `users` table

---

## Performance Gains

After migration, expect:

- **50% reduction** in write contention on users table
- **Faster webhook processing** (minimal user lookup)
- **Better query patterns** (join userProfiles only when needed)
- **Idempotent webhooks** (no duplicate SMS sends)
- **Exponential backoff** (automatic retry for transient failures)

---

## Code Patterns Summary

| Pattern | Before | After |
|---------|--------|-------|
| Context types | `MutationCtx` everywhere | `DbReader`, `DbWriter` (minimal) |
| Admin auth | Hardcoded `ADMIN_USER_IDS` | DB roles (`user.roles.includes('admin')`) |
| Side-effects | Direct SDK calls in actions | Jobs table + worker pattern |
| Webhooks | Manual signature checks | `verifyTwilioWebhook()` helper |
| Idempotency | Duplicate detection in code | `ensureUniqueJob()` with key |
| User data | Single hot `users` row | Split: profile, conversation, billing |

---

## Next Steps

1. Review this migration guide with the team
2. Schedule migration window (low-traffic time)
3. Run backfill script on production
4. Monitor error rates and latency
5. Gradually update model helpers to use new schema
6. Remove deprecated fields from `users` table in PHASE 3

---

## Questions?

See review document for full context and rationale.
Key issues addressed:
- Context leakage (ActionCtx in models)
- Hot users row
- Side-effect discipline
- Webhook security
- Idempotency
