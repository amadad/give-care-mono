# Schema Migration: Task 1 Scheduled Functions

**Version**: 0.4.0
**Date**: 2025-10-10
**Impact**: Non-breaking (adds optional fields)

---

## Overview

Task 1 (Scheduled Functions) requires **4 new fields** in the `users` table to enable:
1. Deduplication of proactive messages
2. Crisis follow-up tracking
3. Dormant reactivation staging

**Good news**: All fields are **optional** - existing users won't break.

---

## Schema Changes

### File: `convex/schema.ts`

**Add to `users` table**:

```typescript
users: defineTable({
  // ... existing fields (phoneNumber, firstName, etc.) ...

  // ⭐ NEW: Proactive messaging tracking
  lastProactiveMessageAt: v.optional(v.number()),  // Timestamp of last proactive message sent
  lastCrisisEventAt: v.optional(v.number()),       // Timestamp of last crisis agent trigger
  crisisFollowupCount: v.optional(v.number()),     // 0-7 (tracks crisis follow-up stage)
  reactivationMessageCount: v.optional(v.number()), // 0-3 (tracks dormant reactivation stage)
})
  .index('by_journey', ['journeyPhase'])
  .index('by_last_contact', ['lastContactAt'])
  .index('by_burnout', ['burnoutBand'])
  // ⭐ NEW: Indexes for scheduled function queries
  .index('by_last_proactive', ['lastProactiveMessageAt'])
  .index('by_crisis_event', ['lastCrisisEventAt'])
```

---

## Field Descriptions

### 1. `lastProactiveMessageAt: v.optional(v.number())`

**Purpose**: Global deduplication - prevents multiple proactive messages same day

**Values**:
- `undefined` (default) - No proactive messages sent yet
- `1728691200000` - Timestamp of last proactive message (ms since epoch)

**Used by**:
- `canSendProactiveMessage()` helper function
- All scheduled message sends (wellness, assessment, dormant, crisis)

**Example**:
```typescript
// Before sending any proactive message:
const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
if (user.lastProactiveMessageAt && user.lastProactiveMessageAt > oneDayAgo) {
  console.log('Skipping - already sent proactive message today');
  return;
}

// After sending:
await ctx.db.patch(userId, {
  lastProactiveMessageAt: Date.now()
});
```

---

### 2. `lastCrisisEventAt: v.optional(v.number())`

**Purpose**: Track when user last triggered crisis agent (for tiered wellness cadence)

**Values**:
- `undefined` (default) - Never had crisis event
- `1728691200000` - Timestamp of last crisis agent execution

**Used by**:
- Wellness check-in cron (determines daily vs weekly frequency)
- Crisis follow-up scheduler

**Example**:
```typescript
// After crisis agent executes:
await ctx.db.patch(userId, {
  lastCrisisEventAt: Date.now(),
  crisisFollowupCount: 0  // Reset counter
});

// In daily wellness cron:
const daysSinceCrisis = (Date.now() - user.lastCrisisEventAt) / (24 * 60 * 60 * 1000);

if (daysSinceCrisis <= 7) {
  sendDailyCheckIn();  // Daily for first 7 days
} else {
  sendWeeklyCheckIn(); // Weekly after day 7
}
```

---

### 3. `crisisFollowupCount: v.optional(v.number())`

**Purpose**: Track stage of multi-stage crisis follow-up (prevents duplicate messages)

**Values**:
- `undefined` or `0` (default) - No crisis follow-ups sent yet
- `1-7` - Number of crisis follow-up messages sent

**Stages**:
- 0: No follow-ups yet
- 1: 24hr follow-up sent
- 2: 72hr follow-up sent
- 3: 7-day follow-up sent
- 4-7: Weekly follow-ups (days 14, 21, 28, 35)

**Used by**:
- Crisis follow-up scheduler (prevents sending duplicate stages)

**Example**:
```typescript
// After sending 24hr follow-up:
await ctx.db.patch(userId, {
  crisisFollowupCount: (user.crisisFollowupCount || 0) + 1
});

// When scheduling follow-ups:
if (user.crisisFollowupCount === 0) {
  // Send 24hr follow-up
} else if (user.crisisFollowupCount === 1) {
  // Send 72hr follow-up
}
// ... etc
```

---

### 4. `reactivationMessageCount: v.optional(v.number())`

**Purpose**: Track stage of dormant reactivation (prevents infinite spam loop)

**Values**:
- `undefined` or `0` (default) - No reactivation messages sent
- `1` - Day 7 reactivation sent
- `2` - Day 14 reactivation sent
- `3` - Day 30 reactivation sent (final)

**Critical**: After `reactivationMessageCount` = 3, mark `journeyPhase` = 'churned' and STOP messaging

**Used by**:
- Dormant reactivation cron (prevents spam loop)

**Example**:
```typescript
// In dormant reactivation cron:
const daysSinceContact = (Date.now() - user.lastContactAt) / (24 * 60 * 60 * 1000);

if (daysSinceContact >= 7 && daysSinceContact < 8 && user.reactivationMessageCount === 0) {
  await sendReactivation(user, "Hey, it's been a while...");
  await ctx.db.patch(userId, { reactivationMessageCount: 1 });
}
else if (daysSinceContact >= 14 && daysSinceContact < 15 && user.reactivationMessageCount === 1) {
  await sendReactivation(user, "Just checking in...");
  await ctx.db.patch(userId, { reactivationMessageCount: 2 });
}
else if (daysSinceContact >= 30 && daysSinceContact < 31 && user.reactivationMessageCount === 2) {
  await sendReactivation(user, "We miss you!");
  await ctx.db.patch(userId, { reactivationMessageCount: 3 });
}
else if (daysSinceContact >= 31 && user.journeyPhase === 'active') {
  // Stop messaging - mark as churned
  await ctx.db.patch(userId, { journeyPhase: 'churned' });
}
```

---

## Migration Steps

### Step 1: Update Schema

**File**: `convex/schema.ts`

```bash
# Edit schema file (add 4 fields + 2 indexes as shown above)
vim convex/schema.ts
```

### Step 2: Deploy Schema

```bash
# Schema changes auto-apply on next deploy
npx convex dev    # For local development
# OR
npx convex deploy --prod  # For production
```

**Convex handles migration automatically**:
- Existing users: All 4 fields will be `undefined`
- New users: Fields can be set immediately
- No data loss, no downtime

### Step 3: Verify Migration

```bash
# Check Convex dashboard → Data → users table
# Should see new fields with <undefined> for existing users
```

### Step 4: Initialize Fields (Optional)

If you want to retroactively initialize fields for existing users:

```typescript
// Run once after schema migration
export const initializeProactiveFields = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();

    for (const user of users) {
      await ctx.db.patch(user._id, {
        lastProactiveMessageAt: undefined,  // No proactive messages yet
        lastCrisisEventAt: undefined,        // No crisis events yet
        crisisFollowupCount: 0,              // Reset counter
        reactivationMessageCount: 0,         // Reset counter
      });
    }

    console.log(`Initialized ${users.length} users`);
  }
});

// Run from CLI:
// npx convex run functions/users:initializeProactiveFields --prod
```

**Note**: This is optional - the code handles `undefined` values gracefully.

---

## Rollback Plan

If schema changes cause issues:

### Option 1: Remove fields (clean rollback)

```typescript
// In convex/schema.ts - just delete the 4 new fields
users: defineTable({
  // ... existing fields only ...
})
  .index('by_journey', ['journeyPhase'])
  .index('by_last_contact', ['lastContactAt'])
  .index('by_burnout', ['burnoutBand'])
  // Delete new indexes

// Redeploy
npx convex deploy --prod
```

Convex will drop the fields and indexes automatically.

### Option 2: Keep schema, disable features

Keep the schema fields but don't use them (comment out scheduled functions code).

---

## Testing Checklist

After schema migration:

- [ ] Verify fields exist in Convex dashboard → Data → users
- [ ] Verify existing users have `undefined` for new fields
- [ ] Create new user - verify fields initialize correctly
- [ ] Trigger crisis agent - verify `lastCrisisEventAt` sets
- [ ] Send proactive message - verify `lastProactiveMessageAt` sets
- [ ] Test dormant reactivation - verify `reactivationMessageCount` increments
- [ ] Test deduplication - send 2 proactive messages same day, verify 2nd blocked

---

## Index Performance

**New indexes**:
- `by_last_proactive`: Used by deduplication checks (every proactive message send)
- `by_crisis_event`: Used by wellness check-in cron (daily query)

**Expected query performance**:
- Before indexes: O(n) table scan (slow at 10k+ users)
- After indexes: O(log n) index lookup (fast at any scale)

**Cost**: Negligible (Convex indexes are free, auto-maintained)

---

## Data Migration Script (If Needed)

If you have existing crisis users and want to set `lastCrisisEventAt` retroactively:

```typescript
export const backfillCrisisEvents = internalMutation({
  handler: async (ctx) => {
    // Find users who are currently in crisis
    const crisisUsers = await ctx.db
      .query('users')
      .withIndex('by_burnout', q => q.eq('burnoutBand', 'crisis'))
      .collect();

    for (const user of crisisUsers) {
      // Set lastCrisisEventAt to their last wellness score timestamp
      const latestScore = await ctx.db
        .query('wellnessScores')
        .withIndex('by_user', q => q.eq('userId', user._id))
        .order('desc')
        .first();

      if (latestScore && latestScore.burnoutBand === 'crisis') {
        await ctx.db.patch(user._id, {
          lastCrisisEventAt: latestScore.createdAt,
          crisisFollowupCount: 0  // Start fresh
        });
      }
    }

    console.log(`Backfilled ${crisisUsers.length} crisis users`);
  }
});
```

**Run**: `npx convex run functions/users:backfillCrisisEvents --prod`

---

## Summary

**What's changing**: 4 new optional fields in `users` table
**Breaking changes**: None (all fields optional)
**Deployment**: Automatic (Convex handles migration)
**Testing required**: Yes (verify deduplication, crisis tracking, reactivation staging)
**Rollback**: Simple (remove fields from schema, redeploy)

---

**Document Version**: 1.0.0
**Status**: Ready for implementation
**Next**: Implement scheduled functions using these fields (see TASK_1_IMPLEMENTATION_PLAN.md)
