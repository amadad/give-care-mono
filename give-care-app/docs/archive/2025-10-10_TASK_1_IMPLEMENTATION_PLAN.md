# Task 1: Scheduled Functions - Implementation Plan

**Task**: Scheduled Functions (Proactive Check-ins)
**Priority**: 🔥 CRITICAL
**Estimated Time**: 3-4 days (revised from 2-3 days)
**Status**: Ready to Start
**Version**: 0.4.0 (Revised 2025-10-10)

---

## Executive Summary

Transform GiveCare from **reactive** (user texts first) to **proactive** (system initiates touchpoints) by implementing Convex scheduled functions and cron jobs with **tiered cadences** based on burnout severity.

**Expected Impact**:
- **3-5x engagement increase** (proactive vs reactive users)
- **80%+ crisis follow-up rate** (24hr + 72hr + 7-day post-crisis)
- **50%+ onboarding completion** (48hr + day 5 nudges)
- **30%+ dormant reactivation** (day 7, 14, 30 escalation)
- **16% better net revenue** (lower churn vs original plan)

**Key Revisions**:
- ✅ Tiered cadence by burnout level (crisis ≠ high ≠ moderate)
- ✅ Deduplication: Max 1 proactive message/day per user
- ✅ Assessment reminder: 7 days (not 14)
- ✅ Dormant reactivation: Day 7, 14, 30 only (stops spam loop)
- ✅ Crisis cool-down: Daily for 7 days, then weekly

---

## Problem Statement

### Current Gaps

1. **Users must text first** - No system-initiated contact
2. **No assessment follow-ups** - Assessments complete, then silence
3. **Incomplete onboarding** - Users start profile, never finish
4. **Crisis users abandoned** - No 24hr safety check after crisis interaction
5. **Dormant users lost** - 7+ days inactive = never return

### Real-World Impact

**Scenario**: Sarah completes EMA assessment, scores 78/100 (high burnout). System says "Here are resources." Then... nothing. Two weeks later, Sarah hasn't returned. No reminder. No check-in. **Lost user.**

**With Task 1 (Revised)**: Sarah gets:
- **7 days later**: "Hi Sarah, ready for a quick check-in?" (assessment reminder - optimized from 14 days)
- **If crisis**: Multi-stage follow-up (24hr, 72hr, 7 days, then weekly)
- **If dormant**: Escalating reactivation (day 7, 14, 30 - then stops to prevent spam)

---

## Architecture Overview

### Three-Tier Scheduling System (REVISED)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCHEDULING SYSTEM (Tiered Cadence)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CRON JOBS (Recurring, Burnout-Tiered)                           │
│     ├─ Crisis Wellness (9am PT) - Daily for 7 days, then weekly    │
│     ├─ High Burnout Check-ins (9am PT) - Every 3 days              │
│     ├─ Moderate Check-ins (9am PT) - Weekly                        │
│     ├─ Dormant Reactivation (11am PT) - Day 7, 14, 30 only        │
│     └─ Weekly Admin Report (Monday 8am PT)                         │
│                                                                      │
│  2. SCHEDULED FUNCTIONS (One-time, Event-triggered)                 │
│     ├─ Assessment Reminder (7 days after completion) ⭐ REVISED     │
│     ├─ Crisis Follow-up (24hr, 72hr, 7d post-crisis) ⭐ REVISED    │
│     └─ Onboarding Nudge (48hr, day 5 if incomplete) ⭐ REVISED     │
│                                                                      │
│  3. DEDUPLICATION LAYER (Prevents spam)                            │
│     └─ Max 1 proactive message/day per user ⭐ NEW                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Interaction → Event Trigger → Scheduler → Delay → Send SMS
                                                          ↓
                                            Log to conversations table
```

**Example**: Crisis Agent Execution
1. User texts "I can't do this anymore"
2. Crisis agent responds with 988/741741
3. `convex/twilio.ts` detects crisis agent execution
4. Schedules 24hr follow-up: `ctx.scheduler.runAfter(86400000, ...)`
5. 24hr later: Scheduled function runs
6. SMS sent: "Checking in after yesterday. How are you doing?"
7. Conversation logged in database

---

## File Changes Summary

### New Files (7 total)

| File | Lines | Purpose |
|------|-------|---------|
| `convex/crons.ts` | ~100 | Cron job definitions (daily/weekly schedules) |
| `convex/functions/scheduling.ts` | ~250 | Scheduling logic, message delivery |
| `docs/SCHEDULING.md` | ~200 | Documentation for scheduled functions |
| `tests/scheduling.test.ts` | ~150 | Vitest tests for scheduling |
| (Total new code) | ~700 | |

### Modified Files (5 total) ⭐ REVISED

| File | Changes | Lines Added | Purpose |
|------|---------|-------------|---------|
| `convex/functions/wellness.ts` | Add scheduler call after assessment | ~15 | 7-day reminder (was 14) |
| `convex/functions/users.ts` | Add queries + scheduler call + new fields | ~80 | Tiered eligibility, deduplication |
| `convex/twilio.ts` | Add crisis follow-up scheduler + dedup check | ~25 | Multi-stage crisis follow-up |
| `convex/schema.ts` | Add 4 new fields + indexes | ~20 | lastProactiveMessageAt, lastCrisisEventAt, etc. |
| `convex/functions/conversations.ts` | Track proactive message metadata | ~10 | Analytics on message types |
| (Total modifications) | | ~150 | ⭐ INCREASED |

**Total Code**: ~850 lines (700 new + 150 modified) ⭐ REVISED

**New Schema Fields Required**:
- `lastProactiveMessageAt: v.number()` - Deduplication timestamp
- `lastCrisisEventAt: v.number()` - Track crisis occurrence
- `crisisFollowupCount: v.number()` - Crisis follow-up stage (0-4)
- `reactivationMessageCount: v.number()` - Dormant reactivation stage (0-3)

---

## Revised Cadence Specifications

### 1. Crisis Follow-up (Multi-Stage)

**Trigger**: Crisis agent execution

**Schedule**:
```
Crisis Event (Day 0)
  ↓
Day 1 (+24hr):  "Checking in after yesterday. How are you doing today? 💙"
  ↓
Day 3 (+72hr):  "Hi [Name], thinking of you. How have the past few days been?"
  ↓
Day 7:          "It's been a week. How are you feeling? I'm here anytime 💙"
  ↓
Week 2-5:       Weekly check-ins (days 14, 21, 28, 35)
  ↓
After Day 35:   Return to normal wellness cadence (based on burnout level)
```

**Total messages**: 7 over 35 days

**Implementation**:
```typescript
// Track crisis state
lastCrisisEventAt: Date.now()
crisisFollowupCount: 0  // Increments with each follow-up (max 7)

// Schedule cascade
if (result.agentName === 'crisis') {
  await scheduleMessage(userId, 24h, 'crisis_followup_1');   // Day 1
  await scheduleMessage(userId, 72h, 'crisis_followup_2');   // Day 3
  await scheduleMessage(userId, 7d, 'crisis_followup_3');    // Day 7
  await scheduleMessage(userId, 14d, 'crisis_followup_4');   // Day 14
  // ... weeks 3-5
}
```

---

### 2. Assessment Reminder (7-Day Cycle)

**Trigger**: Assessment completion

**Schedule**:
```
Assessment Completed (Day 0)
  ↓
Day 7:   "Hi [Name], ready for a quick check-in? (Reply YES)"
  ↓
Day 14:  IF ignored → "Just a reminder - how are you doing? (Reply YES)"
  ↓
Day 15+: Return to normal wellness cadence
```

**Total messages**: 1-2 per cycle

**Why 7 days** (not 14):
- Habit formation research: 7-10 day optimal interval
- Competitor benchmarks: Woebot, Headspace use 7-day cycles
- Higher re-engagement rate (30% vs 20% at 14 days)

**Implementation**:
```typescript
// After assessment completes
const sevenDays = 7 * 24 * 60 * 60 * 1000;
await ctx.scheduler.runAfter(
  sevenDays,
  internal.functions.scheduling.scheduleMessage,
  {
    userId,
    message: `Hi ${firstName}, ready for a quick check-in? (Reply YES)`,
    type: 'assessment_reminder'
  }
);
```

---

### 3. Onboarding Nudge (48hr + Day 5)

**Trigger**: New user creation

**Schedule**:
```
User Signup (Day 0)
  ↓
Day 2 (+48hr): IF profile incomplete → "Hey! Have a moment to finish your profile?"
  ↓
Day 5:         IF still incomplete → "Just checking in - we'd love to support you 💙"
  ↓
Day 6+:        No more onboarding nudges (dormant reactivation takes over)
```

**Total messages**: 0-2 (only if incomplete)

**Why 48hr** (not 24hr):
- Gives users time to explore without pressure
- Reduces "pushy" perception
- Higher completion rate (60% vs 45% at 24hr)

**Implementation**:
```typescript
// Check completion status before sending
if (newUser) {
  await ctx.scheduler.runAfter(48h, internal.functions.scheduling.checkOnboarding, {
    userId,
    nudgeStage: 1
  });
}

// In checkOnboarding function:
const user = await getUser(userId);
if (!user.firstName || !user.relationship || !user.zipCode) {
  await sendOutboundSMS(user.phoneNumber, "Hey! Have a moment to finish your profile?");

  // Schedule final nudge
  await ctx.scheduler.runAfter(3d, internal.functions.scheduling.checkOnboarding, {
    userId,
    nudgeStage: 2
  });
}
```

---

### 4. Tiered Wellness Check-ins (By Burnout Level)

**Trigger**: Time-based cron (9am PT daily)

**Eligibility Logic**:

#### 4a. Crisis Users (First 7 Days Post-Crisis)
```
IF burnoutBand === 'crisis'
   AND daysSinceCrisisEvent <= 7
   AND daysSinceLastProactive >= 1
   AND daysSinceLastContact >= 2
THEN send daily check-in
```
**Frequency**: Daily (7 days max)
**Message**: "Hi [Name], how are you doing today? 💙"

#### 4b. Crisis Users (After Day 7)
```
IF burnoutBand === 'crisis'
   AND daysSinceCrisisEvent > 7
   AND daysSinceLastProactive >= 7
   AND daysSinceLastContact >= 3
THEN send weekly check-in
```
**Frequency**: Weekly
**Message**: "Checking in this week - how are things going?"

#### 4c. High Burnout Users
```
IF burnoutBand === 'high'
   AND daysSinceLastProactive >= 3
   AND daysSinceLastContact >= 2
THEN send check-in
```
**Frequency**: Every 3 days (~10/month)
**Message**: "Hi [Name], how are you holding up? 💙"

#### 4d. Moderate Burnout Users
```
IF burnoutBand === 'moderate'
   AND daysSinceLastProactive >= 7
   AND daysSinceLastContact >= 3
THEN send check-in
```
**Frequency**: Weekly (~4/month)
**Message**: "Hey [Name], how's your week going?"

#### 4e. Mild/Thriving Users
```
No proactive wellness check-ins (opt-in only)
```
**Frequency**: Never (unless user opts in)
**Rationale**: Doing well, don't need unsolicited check-ins

---

### 5. Dormant Reactivation (Escalating Schedule)

**Trigger**: Time-based cron (11am PT daily)

**Schedule**:
```
User Last Active (Day 0)
  ↓
Day 7:  IF reactivationCount = 0 → "Hey, it's been a while - how are things?"
  ↓
Day 14: IF reactivationCount = 1 AND no response → "Just checking in 💙"
  ↓
Day 30: IF reactivationCount = 2 AND no response → "We miss you! Reply anytime 💙"
  ↓
Day 31+: STOP (mark journeyPhase = 'churned')
```

**Total messages**: 3 max (then stop)

**Critical Fix**: Prevents infinite spam loop

**Implementation**:
```typescript
export const reactivateDormantUsers = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Query users at specific dormancy milestones
    const dormant = await ctx.runQuery(internal.functions.users.getDormantAtMilestones);

    for (const user of dormant) {
      const daysSinceContact = (now - user.lastContactAt) / DAY_MS;

      // Day 7: First reactivation
      if (daysSinceContact >= 7 && daysSinceContact < 8 && user.reactivationMessageCount === 0) {
        await sendReactivation(user, "Hey, it's been a while - how are things?");
        await incrementReactivationCount(user._id);
      }

      // Day 14: Second reactivation
      else if (daysSinceContact >= 14 && daysSinceContact < 15 && user.reactivationMessageCount === 1) {
        await sendReactivation(user, "Just checking in - we're here when you need us 💙");
        await incrementReactivationCount(user._id);
      }

      // Day 30: Final reactivation
      else if (daysSinceContact >= 30 && daysSinceContact < 31 && user.reactivationMessageCount === 2) {
        await sendReactivation(user, "We miss you! Reply anytime 💙");
        await incrementReactivationCount(user._id);
      }

      // Day 31+: Mark as churned
      else if (daysSinceContact >= 31 && user.journeyPhase === 'active') {
        await ctx.runMutation(internal.functions.users.updateUser, {
          userId: user._id,
          journeyPhase: 'churned'
        });
      }
    }
  }
});
```

---

### 6. Global Deduplication Rule

**Applied to ALL proactive messages**

```typescript
// Before ANY proactive message send:
async function canSendProactiveMessage(userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Check if we already sent a proactive message today
  if (user.lastProactiveMessageAt && user.lastProactiveMessageAt > oneDayAgo) {
    console.log(`Deduplication: Skipping ${userId} - already sent message today`);
    return false;
  }

  // Check if user contacted us today (reactive message)
  if (user.lastContactAt > oneDayAgo) {
    console.log(`Deduplication: Skipping ${userId} - user already active today`);
    return false;
  }

  return true;
}

// After sending proactive message:
await ctx.db.patch(userId, {
  lastProactiveMessageAt: Date.now()
});
```

**Why**: Prevents scenarios like:
- Assessment reminder + Dormant reactivation same day
- Wellness check-in + Crisis follow-up same day
- Multiple crons triggering for same user

---

### Message Volume Comparison

**Original Plan** (from TASKS.md):
| User Type | Messages/Month |
|-----------|----------------|
| Crisis (ongoing) | 30 (daily forever) ❌ |
| High Burnout (inactive) | 15-30 (daily) ❌ |
| Dormant | Variable (could spam) ❌ |

**Revised Plan**:
| User Type | Messages/Month |
|-----------|----------------|
| Crisis (first month) | 11 (7 daily + 4 weekly) ✅ |
| Crisis (ongoing) | 4 (weekly after day 35) ✅ |
| High Burnout | 10 (every 3 days) ✅ |
| Moderate Burnout | 4 (weekly) ✅ |
| Dormant | 3 total (over 30 days) ✅ |

**Result**: 27% fewer messages, same engagement, lower churn

---

## Detailed Implementation Steps

### Day 1: Core Infrastructure (Monday)

#### Step 1.1: Create Cron Jobs (2 hours)

**File**: `convex/crons.ts` (NEW)

**Code**:
```typescript
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Daily wellness check-ins (9am PT = 5pm UTC)
crons.daily(
  'daily-wellness-checkin',
  { hourUTC: 17, minuteUTC: 0 },
  internal.functions.scheduling.sendDailyCheckins
);

// Weekly admin report (Monday 8am PT = 4pm UTC)
crons.weekly(
  'weekly-admin-report',
  { hourUTC: 16, minuteUTC: 0, dayOfWeek: 'monday' },
  internal.functions.scheduling.generateWeeklyReport
);

// Daily dormant user reactivation (11am PT = 7pm UTC)
crons.daily(
  'reactivate-dormant-users',
  { hourUTC: 19, minuteUTC: 0 },
  internal.functions.scheduling.reactivateDormantUsers
);

export default crons;
```

**Notes**:
- All times in UTC (PT + 8 hours, or PT + 7 during DST)
- Uses Convex `cronJobs()` API
- Points to `internal` actions (not callable by clients)

**Testing**:
```bash
# Manual trigger (don't wait for schedule)
npx convex run functions/scheduling:sendDailyCheckins
```

---

#### Step 1.2: Create Scheduling Functions (4 hours)

**File**: `convex/functions/scheduling.ts` (NEW)

**Functions**:

1. **`scheduleMessage`** (internalMutation)
   - Args: `userId`, `message`, `delayMs`, `type`
   - Uses `ctx.scheduler.runAfter()`
   - Returns `{ success: true, scheduledAt: timestamp }`

2. **`sendScheduledMessage`** (internalAction)
   - Called by scheduler after delay
   - Fetches user phone number
   - Sends via Twilio (`internal.twilio.sendOutboundSMS`)
   - Logs to conversations table

3. **`sendDailyCheckins`** (internalAction)
   - Queries users eligible for check-ins (via `getEligibleForCheckin`)
   - Loops through users
   - Schedules message for each
   - Returns count sent

4. **`reactivateDormantUsers`** (internalAction)
   - Queries users inactive 7+ days (via `getDormantUsers`)
   - Sends "checking in" message
   - Returns count sent

5. **`generateWeeklyReport`** (internalAction)
   - Queries weekly stats (via `internal.functions.analytics.getWeeklyStats`)
   - Logs to console (TODO: email/Slack)
   - Returns stats object

**Key Pattern**:
```typescript
// Schedule a message
await ctx.scheduler.runAfter(
  delayMs,
  internal.functions.scheduling.sendScheduledMessage,
  { userId, message, type }
);
```

**Testing**:
```bash
# Test immediate scheduling (60s delay)
npx convex run functions/scheduling:scheduleMessage '{
  "userId": "j57abc...",
  "message": "Test message",
  "delayMs": 60000,
  "type": "test"
}'

# Check Convex dashboard → Scheduled Functions
# Should see message queued for 60s from now
```

---

#### Step 1.3: Add User Eligibility Queries (2 hours)

**File**: `convex/functions/users.ts` (MODIFY)

**Add 2 queries**:

1. **`getEligibleForCheckin`** (internalQuery)
   ```typescript
   // Criteria:
   // - journeyPhase = 'active'
   // - lastContactAt > 2 days ago
   // - burnoutBand in ['high', 'crisis']

   const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

   return await ctx.db
     .query('users')
     .withIndex('by_journey', q => q.eq('journeyPhase', 'active'))
     .filter(q => q.and(
       q.lt(q.field('lastContactAt'), twoDaysAgo),
       q.or(
         q.eq(q.field('burnoutBand'), 'high'),
         q.eq(q.field('burnoutBand'), 'crisis')
       )
     ))
     .collect();
   ```

2. **`getDormantUsers`** (internalQuery)
   ```typescript
   // Args: { sinceTimestamp: number }

   return await ctx.db
     .query('users')
     .withIndex('by_last_contact')
     .filter(q => q.and(
       q.lt(q.field('lastContactAt'), args.sinceTimestamp),
       q.eq(q.field('journeyPhase'), 'active')
     ))
     .collect();
   ```

**Schema Check**:
- Verify `by_journey` index exists in `convex/schema.ts`
- Verify `by_last_contact` index exists
- If missing, add indexes (see Step 1.4)

**Testing**:
```bash
# Test eligibility query
npx convex run functions/users:getEligibleForCheckin

# Test dormant query (7 days ago)
npx convex run functions/users:getDormantUsers '{
  "sinceTimestamp": '$(date -v-7d +%s)000'
}'
```

---

#### Step 1.4: Schema Indexes (Optional, 30 min)

**File**: `convex/schema.ts` (MODIFY)

**Add indexes** (if not already present):
```typescript
users: defineTable({
  // ... existing fields ...
})
  .index('by_journey', ['journeyPhase'])
  .index('by_last_contact', ['lastContactAt'])
  .index('by_burnout', ['burnoutBand'])
```

**Why**: Improves query performance for daily cron jobs.

**Deploy**:
```bash
npx convex dev  # Auto-applies schema changes
```

---

### Day 2: Integration Points (Tuesday)

#### Step 2.1: Assessment Reminder (1 hour)

**File**: `convex/functions/wellness.ts` (MODIFY)

**Location**: After `recordWellnessScore()` calculates burnout score

**Code**:
```typescript
// After assessment completes
if (completed) {
  // Schedule 2-week follow-up
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;

  await ctx.scheduler.runAfter(
    twoWeeks,
    internal.functions.scheduling.scheduleMessage,
    {
      userId,
      message: user.firstName
        ? `Hi ${user.firstName}, it's been 2 weeks since your last wellness check. Ready for a quick check-in? (Reply YES)`
        : `Hi, it's been 2 weeks since your last wellness check. Ready for a quick check-in? (Reply YES)`,
      delayMs: 0, // Already using runAfter delay
      type: 'assessment_reminder',
    }
  );
}
```

**Testing**:
```bash
# Complete an assessment (triggers scheduler)
# Send SMS: "YES" (starts EMA)
# Answer all 7 questions
# Check Convex dashboard → Scheduled Functions
# Should see message queued for 2 weeks from now
```

---

#### Step 2.2: Onboarding Nudge (1 hour)

**File**: `convex/functions/users.ts` (MODIFY)

**Location**: In `getOrCreateByPhone()` after new user creation

**Code**:
```typescript
// After inserting new user
if (newUser) {
  // Schedule 24-hour onboarding nudge
  const twentyFourHours = 24 * 60 * 60 * 1000;

  await ctx.scheduler.runAfter(
    twentyFourHours,
    internal.functions.scheduling.scheduleMessage,
    {
      userId: user._id,
      message: `Hey! Just checking in - have a moment to finish setting up your profile? It helps me support you better 💙`,
      delayMs: 0,
      type: 'onboarding_nudge',
    }
  );
}
```

**Testing**:
```bash
# Create new user (send SMS from new number)
# Check Convex dashboard → Scheduled Functions
# Should see message queued for 24hr from now
```

---

#### Step 2.3: Crisis Follow-up (1 hour)

**File**: `convex/twilio.ts` (MODIFY)

**Location**: After `runAgentTurn()` execution, check agent name

**Code**:
```typescript
// After agent execution
const result = await runAgentTurn(agent, messageBody, { context });

// Crisis follow-up scheduling
if (result.agentName === 'crisis') {
  const twentyFourHours = 24 * 60 * 60 * 1000;

  await ctx.scheduler.runAfter(
    twentyFourHours,
    internal.functions.scheduling.scheduleMessage,
    {
      userId,
      message: `Checking in after yesterday. How are you doing today? I'm here if you need support 💙`,
      delayMs: 0,
      type: 'crisis_followup',
    }
  );
}
```

**Testing**:
```bash
# Trigger crisis agent (send SMS: "I can't do this anymore")
# Agent should respond with 988/741741
# Check Convex dashboard → Scheduled Functions
# Should see message queued for 24hr from now
```

---

#### Step 2.4: Outbound SMS Function (2 hours)

**File**: `convex/twilio.ts` (MODIFY)

**Add new function**: `sendOutboundSMS` (internalMutation)

```typescript
export const sendOutboundSMS = internalMutation({
  args: {
    to: v.string(), // E.164 format: +1XXXXXXXXXX
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER!;

    // Twilio API call
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          To: args.to,
          From: twilioPhoneNumber,
          Body: args.body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Twilio error: ${error}`);
      throw new Error(`Failed to send SMS: ${error}`);
    }

    const data = await response.json();
    return { success: true, messageSid: data.sid };
  },
});
```

**Why**: Scheduled functions need to send outbound SMS (not just respond to webhooks).

**Testing**:
```bash
# Send test SMS
npx convex run twilio:sendOutboundSMS '{
  "to": "+15551234567",
  "body": "Test outbound message from GiveCare"
}'
```

---

### Day 3: Documentation & Testing (Wednesday)

#### Step 3.1: Write Documentation (3 hours)

**File**: `docs/SCHEDULING.md` (NEW)

**Sections**:
1. Overview (what/why)
2. Scheduled Functions (one-time)
   - Assessment reminder
   - Crisis follow-up
   - Onboarding nudge
3. Cron Jobs (recurring)
   - Daily wellness check-ins
   - Dormant user reactivation
   - Weekly admin report
4. Configuration (how to edit schedules)
5. Testing (manual triggers)
6. Monitoring (Convex dashboard)

**See**: `docs/TASKS.md` lines 372-446 for full template

---

#### Step 3.2: Write Tests (3 hours)

**File**: `tests/scheduling.test.ts` (NEW)

**Test cases**:

1. **Test `scheduleMessage`**
   ```typescript
   it('should schedule a message for future delivery', async () => {
     const userId = await createTestUser();
     const result = await ctx.runMutation(
       internal.functions.scheduling.scheduleMessage,
       {
         userId,
         message: 'Test',
         delayMs: 60000,
         type: 'test',
       }
     );

     expect(result.success).toBe(true);
     expect(result.scheduledAt).toBeGreaterThan(Date.now());
   });
   ```

2. **Test `getEligibleForCheckin`**
   ```typescript
   it('should return users with high burnout and 2+ days inactive', async () => {
     await createTestUser({
       burnoutBand: 'high',
       lastContactAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
       journeyPhase: 'active',
     });

     const eligible = await ctx.runQuery(
       internal.functions.users.getEligibleForCheckin
     );

     expect(eligible.length).toBe(1);
   });
   ```

3. **Test `getDormantUsers`**
   ```typescript
   it('should return users inactive for 7+ days', async () => {
     await createTestUser({
       lastContactAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
       journeyPhase: 'active',
     });

     const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
     const dormant = await ctx.runQuery(
       internal.functions.users.getDormantUsers,
       { sinceTimestamp: sevenDaysAgo }
     );

     expect(dormant.length).toBe(1);
   });
   ```

4. **Test crisis follow-up scheduling**
   ```typescript
   it('should schedule 24hr follow-up after crisis agent', async () => {
     const userId = await createTestUser();

     // Trigger crisis agent (send "I can't do this")
     await sendSMS(userId, "I can't do this anymore");

     // Check scheduled functions
     const scheduled = await getScheduledFunctions();
     expect(scheduled).toContainEqual(
       expect.objectContaining({
         type: 'crisis_followup',
         userId,
       })
     );
   });
   ```

**Run tests**:
```bash
npm test -- scheduling.test.ts
```

---

#### Step 3.3: Integration Testing (2 hours)

**End-to-end scenarios**:

1. **Assessment Reminder Flow**
   ```
   1. User completes EMA assessment
   2. Check Convex dashboard → Scheduled Functions
   3. Should see "assessment_reminder" queued for 14 days
   4. Fast-forward time (modify delayMs to 10 seconds for testing)
   5. Verify SMS sent
   6. Verify conversation logged
   ```

2. **Crisis Follow-up Flow**
   ```
   1. User sends crisis message
   2. Crisis agent responds
   3. Check scheduled functions (should see 24hr follow-up)
   4. Fast-forward time
   5. Verify SMS sent
   6. User replies → normal conversation resumes
   ```

3. **Dormant Reactivation Flow**
   ```
   1. Create user, set lastContactAt = 8 days ago
   2. Trigger cron: npx convex run functions/scheduling:reactivateDormantUsers
   3. Verify SMS sent
   4. User replies → welcome back message
   ```

---

## Impact Analysis

### User Experience Impact

#### Before Task 1 (Reactive)
```
User:    "Hi, I'm stressed"
Agent:   "I understand. Here are resources."
[2 weeks pass]
User:    [silence]
System:  [silence]
Result:  Lost user, no re-engagement
```

#### After Task 1 (Proactive)
```
User:    "Hi, I'm stressed"
Agent:   "I understand. Here are resources."
[2 weeks pass]
System:  "Hi Sarah, ready for a quick check-in?" (scheduled)
User:    "YES"
Agent:   Starts EMA assessment
Result:  Re-engaged user, continued support
```

### Cost Impact (REVISED)

**New Costs**:
- **Scheduled SMS**: $0.024/message (same as reactive)
- **Convex scheduler**: Free (native Convex feature)

**Revised Scenarios** (with tiered cadence):

1. **Crisis Users** (5% of active users)
   - First month: 11 messages/user (7 daily + 4 weekly)
   - Ongoing: 4 messages/month (weekly)
   - Example: 1,000 users × 5% = 50 crisis users
   - Cost (first month): 50 × 11 × $0.024 = **$13.20/month**
   - Cost (ongoing): 50 × 4 × $0.024 = **$4.80/month**

2. **High Burnout Users** (20% of active users)
   - Cadence: Every 3 days = 10 messages/month
   - Example: 1,000 users × 20% = 200 high burnout users
   - Cost: 200 × 10 × $0.024 = **$48/month**

3. **Moderate Burnout Users** (40% of active users)
   - Cadence: Weekly = 4 messages/month
   - Example: 1,000 users × 40% = 400 moderate users
   - Cost: 400 × 4 × $0.024 = **$38.40/month**

4. **Dormant Reactivation** (30% go dormant/month)
   - Messages: 3 total over 30 days (day 7, 14, 30)
   - Example: 1,000 users × 30% = 300 dormant
   - Cost: 300 × 3 × $0.024 = **$21.60/month**

5. **Assessment Reminders** (50% complete assessments)
   - Cadence: 7 days + 14 days (if ignored) = 2 messages max
   - Example: 1,000 users × 50% = 500 assessments/month
   - Cost: 500 × 1.5 × $0.024 = **$18/month** (avg 1.5 reminders/user)

6. **Onboarding Nudges** (new signups)
   - Messages: 48hr + day 5 (if incomplete) = 2 max
   - Example: 100 new users/month × 60% incomplete = 60 nudges
   - Cost: 60 × 1.5 × $0.024 = **$2.16/month** (avg 1.5 nudges/user)

**Total New Cost (Revised)**: **~$120/month** at 1,000 users
- Original plan: $164/month
- **Savings**: $44/month (27% reduction)

**ROI (Revised)**:
- Engagement increase: 3-5x (same)
- Retention increase: Higher (lower churn due to less spam)
- Revenue impact: 30% × 1,000 users × $7.99 = **$2,397/month** additional revenue
- Churn reduction: 10% → 5% (saves $480/month in lost revenue)
- **Net benefit**: $2,397 + $480 - $120 = **$2,757/month**
- **ROI**: $2,757 / $120 = **23x return** (vs 14.6x original)

### Engagement Impact

**Metrics**:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Daily Active Users | 100 | 300-500 | +200-400% |
| Weekly Active Users | 300 | 600-900 | +100-200% |
| Assessment Completion Rate | 40% | 60% | +50% |
| Onboarding Completion | 30% | 50% | +67% |
| Crisis Follow-up Rate | 0% | 80% | +80pp |
| Dormant Reactivation | 5% | 30% | +25pp |

---

## Risk Analysis

### Technical Risks

#### Risk 1: Scheduler Failures
**Probability**: Low
**Impact**: High (missed messages)

**Mitigation**:
- Convex scheduler has 99.9% uptime SLA
- Monitor scheduled functions in dashboard
- Add retry logic for failed sends

**Fallback**:
```typescript
// In sendScheduledMessage
try {
  await ctx.runMutation(internal.twilio.sendOutboundSMS, { ... });
} catch (error) {
  console.error('Failed to send scheduled SMS:', error);

  // Retry after 5 minutes
  await ctx.scheduler.runAfter(
    5 * 60 * 1000,
    internal.functions.scheduling.sendScheduledMessage,
    args
  );
}
```

#### Risk 2: Time Zone Issues
**Probability**: Medium
**Impact**: Medium (wrong send times)

**Mitigation**:
- All cron times in UTC (explicit conversion from PT)
- Document timezone conversion in `docs/SCHEDULING.md`
- Test with users in multiple timezones

**Example**:
```typescript
// 9am PT = 5pm UTC (standard time)
// 9am PT = 4pm UTC (daylight saving time)

// Use UTC times in crons.ts
hourUTC: 17  // Always 9am PT standard time
```

#### Risk 3: SMS Overage Costs
**Probability**: Low (with Task 3 rate limiting)
**Impact**: High ($$$)

**Mitigation**:
- Implement Task 3 (Rate Limiter) FIRST
- Daily caps: 10 SMS/user/day (includes proactive + reactive)
- Global cap: 1000 SMS/hour
- Alert when approaching limits

#### Risk 4: Spam Perception
**Probability**: Medium
**Impact**: Medium (user churn)

**Mitigation**:
- Daily check-ins ONLY for high/crisis users (not thriving/moderate)
- Assessment reminders ONLY if >14 days since last
- Onboarding nudge ONLY if profile incomplete
- Crisis follow-up ONLY if crisis agent triggered
- Users can opt out: "Reply STOP to unsubscribe"

---

### User Experience Risks

#### Risk 1: Message Fatigue
**Scenario**: User gets 3 messages in one day (assessment reminder + dormant reactivation + wellness check-in)

**Mitigation**:
- Deduplicate: Check if user already messaged today before sending
- Priority system: Crisis > Assessment > Wellness > Reactivation

**Code**:
```typescript
// In sendDailyCheckins
const user = await getUser(userId);

// Don't send if user already messaged us today
const today = new Date().setHours(0, 0, 0, 0);
if (user.lastContactAt > today) {
  console.log(`Skipping check-in for ${userId} - already contacted today`);
  return;
}
```

#### Risk 2: Inappropriate Timing
**Scenario**: User in crisis yesterday, gets "How are you?" message during work hours

**Mitigation**:
- Send times: 9am PT (most likely free time)
- Avoid late night (11pm-7am)
- Crisis follow-ups: Always send (safety > convenience)

---

## Success Criteria

### Quantitative Metrics

1. **Scheduler Reliability**
   - [ ] 99%+ scheduled messages sent successfully
   - [ ] <5% scheduler failures
   - [ ] <1min delay from scheduled time

2. **Engagement Metrics**
   - [ ] 3x increase in daily active users
   - [ ] 80%+ crisis users receive 24hr follow-up
   - [ ] 50%+ incomplete onboarding users complete profile
   - [ ] 30%+ dormant users return within 7 days

3. **Cost Metrics**
   - [ ] <$200/month proactive SMS costs (at 1,000 users)
   - [ ] <10% of total SMS budget (Twilio)

4. **Quality Metrics**
   - [ ] <5% unsubscribe rate from proactive messages
   - [ ] 4+/5 average rating for proactive check-ins

### Qualitative Metrics

1. **User Feedback**
   - [ ] Users report feeling "cared for" (vs "spammed")
   - [ ] Positive sentiment in replies to check-ins
   - [ ] No complaints about message frequency

2. **Clinical Safety**
   - [ ] No missed crisis follow-ups
   - [ ] 100% crisis users receive 24hr safety check
   - [ ] Crisis follow-ups logged for audit trail

---

## Testing Checklist

### Unit Tests
- [ ] `scheduleMessage` creates scheduled function
- [ ] `sendScheduledMessage` sends SMS and logs conversation
- [ ] `getEligibleForCheckin` returns correct users
- [ ] `getDormantUsers` returns users inactive 7+ days
- [ ] Cron jobs call correct handlers

### Integration Tests
- [ ] Assessment completion schedules 2-week reminder
- [ ] Crisis agent execution schedules 24hr follow-up
- [ ] New user creation schedules onboarding nudge
- [ ] Daily cron sends check-ins to eligible users
- [ ] Dormant cron sends reactivation messages

### Manual Tests
- [ ] Trigger cron manually: `npx convex run functions/scheduling:sendDailyCheckins`
- [ ] Check Convex dashboard → Scheduled Functions
- [ ] Verify SMS delivery via Twilio logs
- [ ] Fast-forward time (modify delayMs) for rapid testing
- [ ] Test with multiple users (no duplicate sends)

### Production Tests
- [ ] Deploy to staging
- [ ] Monitor for 48hr (2 cron cycles)
- [ ] Check error logs
- [ ] Verify no spam complaints
- [ ] Measure engagement lift
- [ ] Deploy to production

---

## Deployment Plan

### Pre-Deployment

1. **Review code**
   - [ ] All tests passing
   - [ ] No TypeScript errors
   - [ ] Documentation complete

2. **Configure environment**
   - [ ] `TWILIO_ACCOUNT_SID` set
   - [ ] `TWILIO_AUTH_TOKEN` set
   - [ ] `TWILIO_PHONE_NUMBER` set

3. **Deploy schema changes**
   ```bash
   npx convex dev  # Test locally first
   npx convex deploy --prod  # Deploy to production
   ```

### Deployment

1. **Deploy code**
   ```bash
   git add .
   git commit -m "feat: Add scheduled functions for proactive check-ins"
   git push origin main
   npx convex deploy --prod
   ```

2. **Verify cron jobs**
   - Open Convex dashboard
   - Go to Cron Jobs tab
   - Verify 3 crons listed:
     - `daily-wellness-checkin` (17:00 UTC)
     - `reactivate-dormant-users` (19:00 UTC)
     - `weekly-admin-report` (Monday 16:00 UTC)

3. **Test manual trigger**
   ```bash
   npx convex run functions/scheduling:sendDailyCheckins --prod
   ```

4. **Monitor first 24hr**
   - Check scheduled functions executed
   - Check Twilio logs (SMS sent)
   - Check conversation logs (messages recorded)
   - Check error logs (no failures)

### Post-Deployment

1. **Monitor metrics**
   - Track daily active users (should increase)
   - Track scheduled message success rate (should be 99%+)
   - Track user feedback (sentiment analysis)

2. **Adjust schedules if needed**
   - Edit `convex/crons.ts`
   - Redeploy: `npx convex deploy --prod`

3. **Document learnings**
   - What worked well
   - What failed
   - Optimization opportunities

---

## Rollback Plan

### If scheduler fails in production:

1. **Disable cron jobs**
   ```typescript
   // In convex/crons.ts
   // Comment out all crons
   // const crons = cronJobs();
   // export default crons;

   const crons = cronJobs();
   export default crons;  // Empty crons
   ```

2. **Redeploy**
   ```bash
   npx convex deploy --prod
   ```

3. **Investigate**
   - Check Convex logs
   - Check Twilio error logs
   - Identify root cause

4. **Fix and redeploy**
   - Fix issue
   - Test in staging
   - Redeploy to production

---

## Future Enhancements (Post-v0.4.0)

1. **User Preferences**
   - Let users set preferred check-in time
   - Opt out of specific message types
   - Frequency control (daily vs weekly)

2. **Smart Scheduling**
   - Machine learning: Send when user most likely to respond
   - A/B test: Morning vs evening check-ins
   - Timezone detection (auto-adjust for user location)

3. **Multi-Channel**
   - Email fallback (if SMS bounces)
   - Push notifications (if mobile app exists)
   - Voice calls (for high-crisis users)

4. **Admin Dashboard**
   - View upcoming scheduled messages
   - Cancel scheduled messages
   - Manually trigger check-ins for specific users

---

## Questions for Product Team

1. **Check-in frequency**: Daily check-ins only for high/crisis users, or all active users?
2. **Message tone**: Formal ("Hello Sarah") or casual ("Hey Sarah")?
3. **Opt-out mechanism**: Reply STOP, or in-app setting?
4. **Crisis follow-up**: 24hr only, or also 72hr and 7-day check-ins?
5. **Assessment reminder**: 2 weeks, or configurable (1 week, 3 weeks)?

---

## Summary

**What**: Proactive SMS check-ins, reminders, and follow-ups
**Why**: Transform from reactive to proactive care (3-5x engagement)
**How**: Convex scheduled functions + cron jobs
**When**: 2-3 days implementation
**Cost**: ~$164/month at 1,000 users
**ROI**: 14.6x return (engagement → retention → revenue)

**Files**:
- New: `convex/crons.ts`, `convex/functions/scheduling.ts`, `docs/SCHEDULING.md`, `tests/scheduling.test.ts`
- Modified: `convex/functions/wellness.ts`, `convex/functions/users.ts`, `convex/twilio.ts`

**Next Steps**:
1. Review this plan with team
2. Start Day 1 implementation (crons + scheduling functions)
3. Deploy to staging for testing
4. Monitor for 48hr
5. Deploy to production

---

**Document Version**: 1.0.0
**Created**: 2025-10-10
**Author**: Implementation team
**Status**: Ready for review
