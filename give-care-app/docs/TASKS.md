# Active Sprint Tasks

**Version**: 0.7.0 | **Status**: 4 Remaining | **Updated**: 2025-10-12

---

## Overview

**Completed**: Proactive messaging, cost protection, admin dashboard (deployment) ✅

**Remaining**: Admin dashboard polish, vector search, user dashboard, evaluation framework

**Archived Completed Work**: See `docs/archive/tasks-2025-10-11.md`

---

## Task Board

### 📋 To Do

Four remaining features for full production readiness:

1. **Admin Dashboard Polish** (🔥 HIGH) - Complete user actions, pagination, UX fixes (1-2 weeks)
2. **Vector Search** (🔥 HIGH) - Semantic intervention matching (replace static mapping)
3. **User Dashboard** (🟡 MEDIUM) - Auth, profile, progress, wellness tracking
4. **Evaluation Framework** (🟡 MEDIUM) - Automated evals + GEPA integration

### 🚧 Doing

_(No tasks currently in progress)_

### 💡 Backlog

None - all planned features are in active development track.

---

## Task Details

---

## Task 1: Scheduled Functions (Proactive Check-ins)

### **Status**: ✅ COMPLETE (2025-10-10)
### **Priority**: 🔥 CRITICAL
### **Time Taken**: 4 days

✅ **IMPLEMENTED**: All proactive messaging features with revised cadences. See **`docs/SCHEDULING.md`** for operational guide. Planning docs archived in **`docs/archive/2025-10-10_*`**.

### Objective

Enable the platform to proactively reach out to users with **tiered, burnout-level-appropriate** wellness check-ins, assessment reminders, crisis follow-ups, and reactivation messages. This is the **most important feature** for caregiving support platforms.

### Current Gap

- Users must text first (reactive model)
- No follow-up after assessments complete
- Incomplete onboarding users disappear (no nudges)
- Crisis users don't receive 24hr check-ins
- Dormant users (7+ days inactive) never return

### Implementation

#### **1.1 Core Infrastructure**

**Create: `convex/crons.ts`** (New file)

Daily/weekly recurring jobs using Convex Cron Jobs.

```typescript
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Daily wellness check-ins (9am PT)
crons.daily(
  'daily-wellness-checkin',
  { hourUTC: 17, minuteUTC: 0 }, // 9am PT = 5pm UTC
  internal.functions.scheduling.sendDailyCheckins
);

// Weekly admin report (Monday 8am PT)
crons.weekly(
  'weekly-admin-report',
  { hourUTC: 16, minuteUTC: 0, dayOfWeek: 'monday' },
  internal.functions.scheduling.generateWeeklyReport
);

// Daily dormant user reactivation (11am PT)
crons.daily(
  'reactivate-dormant-users',
  { hourUTC: 19, minuteUTC: 0 },
  internal.functions.scheduling.reactivateDormantUsers
);

export default crons;
```

**Create: `convex/functions/scheduling.ts`** (New file)

Schedule management and message delivery functions.

```typescript
import { internalMutation, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';

/**
 * Schedule a one-time message to a user
 */
export const scheduleMessage = internalMutation({
  args: {
    userId: v.id('users'),
    message: v.string(),
    delayMs: v.number(), // Milliseconds from now
    type: v.string(), // 'wellness_checkin' | 'assessment_reminder' | 'crisis_followup' | 'onboarding_nudge'
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      args.delayMs,
      internal.functions.scheduling.sendScheduledMessage,
      {
        userId: args.userId,
        message: args.message,
        type: args.type,
      }
    );

    return { success: true, scheduledAt: Date.now() + args.delayMs };
  },
});

/**
 * Send scheduled message (called by scheduler)
 */
export const sendScheduledMessage = internalAction({
  args: {
    userId: v.id('users'),
    message: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user phone number
    const user = await ctx.runQuery(internal.functions.users.getUser, {
      userId: args.userId,
    });

    if (!user) {
      console.error(`User ${args.userId} not found for scheduled message`);
      return;
    }

    // Send via Twilio
    await ctx.runMutation(internal.twilio.sendOutboundSMS, {
      to: user.phoneNumber,
      body: args.message,
    });

    // Log conversation
    await ctx.runMutation(internal.functions.conversations.create, {
      userId: args.userId,
      role: 'assistant',
      text: args.message,
      mode: 'sms',
      agentName: 'scheduled',
    });
  },
});

/**
 * Daily wellness check-ins (cron job)
 */
export const sendDailyCheckins = internalAction({
  handler: async (ctx) => {
    // Get users eligible for check-ins
    // - journeyPhase = 'active'
    // - lastContactAt > 2 days ago
    // - burnoutBand in ['high', 'crisis']
    const users = await ctx.runQuery(internal.functions.users.getEligibleForCheckin);

    let sent = 0;
    for (const user of users) {
      const message = user.firstName
        ? `Hi ${user.firstName}, how are you doing today? 💙`
        : 'Hi friend, how are you doing today? 💙';

      await ctx.runMutation(internal.functions.scheduling.scheduleMessage, {
        userId: user._id,
        message,
        delayMs: 0, // Send immediately
        type: 'wellness_checkin',
      });
      sent++;
    }

    console.log(`Sent ${sent} daily check-ins`);
    return { sent };
  },
});

/**
 * Reactivate dormant users (cron job)
 */
export const reactivateDormantUsers = internalAction({
  handler: async (ctx) => {
    // Get users with no contact in 7+ days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const users = await ctx.runQuery(internal.functions.users.getDormantUsers, {
      sinceTimestamp: sevenDaysAgo,
    });

    let sent = 0;
    for (const user of users) {
      const message = user.firstName
        ? `Hey ${user.firstName}, just checking in. It's been a while - how are things going? Reply anytime 💙`
        : `Hey there, just checking in. It's been a while - how are things going? Reply anytime 💙`;

      await ctx.runMutation(internal.functions.scheduling.scheduleMessage, {
        userId: user._id,
        message,
        delayMs: 0,
        type: 'reactivation',
      });
      sent++;
    }

    console.log(`Sent ${sent} reactivation messages`);
    return { sent };
  },
});

/**
 * Weekly admin report (cron job)
 */
export const generateWeeklyReport = internalAction({
  handler: async (ctx) => {
    // Aggregate weekly stats
    const stats = await ctx.runQuery(internal.functions.analytics.getWeeklyStats);

    // TODO: Send email to admins or post to Slack
    console.log('Weekly Report:', stats);

    return stats;
  },
});
```

#### **1.2 Integration Points**

**Modify: `convex/functions/wellness.ts`**

Add scheduler call after assessment completion.

```typescript
// After calculating burnout score in recordWellnessScore()
if (completed) {
  // Schedule 2-week follow-up assessment reminder
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  await ctx.scheduler.runAfter(
    twoWeeks,
    internal.functions.scheduling.scheduleMessage,
    {
      userId,
      message: user.firstName
        ? `Hi ${user.firstName}, it's been 2 weeks since your last wellness check. Ready for a quick check-in? (Reply YES)`
        : `Hi, it's been 2 weeks since your last wellness check. Ready for a quick check-in? (Reply YES)`,
      type: 'assessment_reminder',
    }
  );
}
```

**Modify: `convex/functions/users.ts`**

Add scheduler call for incomplete onboarding.

```typescript
// In getOrCreateByPhone() - if new user created
if (newUser) {
  // Schedule 24-hour onboarding nudge
  const twentyFourHours = 24 * 60 * 60 * 1000;
  await ctx.scheduler.runAfter(
    twentyFourHours,
    internal.functions.scheduling.scheduleMessage,
    {
      userId: user._id,
      message: `Hey! Just checking in - have a moment to finish setting up your profile? It helps me support you better 💙`,
      type: 'onboarding_nudge',
    }
  );
}
```

**Modify: `convex/twilio.ts`**

Add crisis follow-up scheduling.

```typescript
// After crisis agent execution
if (result.agentName === 'crisis') {
  // Schedule 24-hour crisis follow-up
  const twentyFourHours = 24 * 60 * 60 * 1000;
  await ctx.scheduler.runAfter(
    twentyFourHours,
    internal.functions.scheduling.scheduleMessage,
    {
      userId,
      message: `Checking in after yesterday. How are you doing today? I'm here if you need support 💙`,
      type: 'crisis_followup',
    }
  );
}
```

#### **1.3 Supporting Queries**

**Add to: `convex/functions/users.ts`**

```typescript
/**
 * Get users eligible for daily check-ins
 */
export const getEligibleForCheckin = internalQuery({
  handler: async (ctx) => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

    const users = await ctx.db
      .query('users')
      .withIndex('by_journey', (q) => q.eq('journeyPhase', 'active'))
      .filter((q) =>
        q.and(
          q.lt(q.field('lastContactAt'), twoDaysAgo),
          q.or(
            q.eq(q.field('burnoutBand'), 'high'),
            q.eq(q.field('burnoutBand'), 'crisis')
          )
        )
      )
      .collect();

    return users;
  },
});

/**
 * Get dormant users (no contact in X days)
 */
export const getDormantUsers = internalQuery({
  args: { sinceTimestamp: v.number() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_last_contact')
      .filter((q) =>
        q.and(
          q.lt(q.field('lastContactAt'), args.sinceTimestamp),
          q.eq(q.field('journeyPhase'), 'active') // Don't reactivate churned users
        )
      )
      .collect();

    return users;
  },
});
```

#### **1.4 Documentation**

**Create: `docs/SCHEDULING.md`**

```markdown
# Scheduled Functions & Cron Jobs

## Overview

GiveCare uses Convex scheduled functions and cron jobs to proactively support users.

## Scheduled Functions (One-time)

### Assessment Reminder
- **Trigger**: 2 weeks after assessment completion
- **Message**: "Ready for a quick check-in?"
- **Eligibility**: All users who completed an assessment

### Crisis Follow-up
- **Trigger**: 24 hours after crisis agent interaction
- **Message**: "Checking in after yesterday. How are you doing?"
- **Eligibility**: Users who triggered crisis agent

### Onboarding Nudge
- **Trigger**: 24 hours after account creation
- **Message**: "Have a moment to finish setting up?"
- **Eligibility**: Users with incomplete profiles

## Cron Jobs (Recurring)

### Daily Wellness Check-ins
- **Schedule**: 9am PT daily
- **Target**: Active users with high/crisis burnout, no contact in 2+ days
- **Message**: "Hi [Name], how are you doing today?"

### Dormant User Reactivation
- **Schedule**: 11am PT daily
- **Target**: Users with no contact in 7+ days
- **Message**: "Just checking in. It's been a while - how are things?"

### Weekly Admin Report
- **Schedule**: Monday 8am PT
- **Output**: Console log (TODO: Email/Slack integration)
- **Metrics**: Total users, crisis count, engagement rate, assessments completed

## Configuration

Edit cron schedules in `convex/crons.ts`:
```typescript
crons.daily('name', { hourUTC: 17, minuteUTC: 0 }, handler);
```

**Timezone**: All times in UTC. Convert from PT: `PT + 8 hours = UTC`

## Testing

```bash
# Manually trigger cron job
npx convex run functions/scheduling:sendDailyCheckins

# Schedule a test message
npx convex run functions/scheduling:scheduleMessage '{
  "userId": "j57abc123...",
  "message": "Test scheduled message",
  "delayMs": 60000,
  "type": "test"
}'
```

## Monitoring

Check Convex Dashboard → Scheduled Functions:
- View upcoming scheduled messages
- See execution history
- Monitor failures
```

### Success Criteria

- [ ] Cron jobs run daily without errors
- [ ] Users receive 2-week assessment reminders
- [ ] Crisis users get 24hr follow-ups
- [ ] Incomplete onboarding users receive nudges
- [ ] Dormant users (7+ days) get reactivation messages
- [ ] Weekly admin reports generate
- [ ] <5% scheduling failures

---

## Task 2: Vector Search (Semantic Intervention Matching)

### **Status**: 📋 To Do
### **Priority**: 🔥 HIGH
### **Estimated Time**: 3-4 days

### Objective

Replace static `ZONE_INTERVENTIONS` mapping with semantic vector search over the `knowledgeBase` table. This enables matching ANY user query to relevant resources, not just predefined pressure zones.

### Current Gap

- Intervention matching uses **static mapping** (7 hard-coded zones in `interventionData.ts`)
- Can only match exact keywords ("emotional" → emotional resources)
- Can't scale beyond ~20 interventions without manual mapping
- No semantic understanding ("I can't get to appointments" ≠ "transportation")
- `knowledgeBase` table exists but is **unused** (schema.ts:141)

### Implementation

#### **2.1 Schema Updates**

**Modify: `convex/schema.ts`**

Add vector search index to `knowledgeBase` table.

```typescript
knowledgeBase: defineTable({
  // ... existing fields ...

  // Add embedding field
  embedding: v.optional(v.array(v.number())), // 1536-dim vector (text-embedding-3-small)
})
  .index("by_type", ["type"])
  .index("by_status", ["status"])
  .index("by_evidence", ["evidenceLevel"])
  .index("by_language", ["language"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["type", "status", "pressureZones"]
  })
  // NEW: Vector search index
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["status", "type", "language"],
  }),
```

#### **2.2 Embedding Generation**

**Create: `convex/functions/embeddings.ts`** (New file)

```typescript
import { internalAction, internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding for a text string
 */
export const generateEmbedding = internalAction({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
      input: args.text,
    });

    return response.data[0].embedding;
  },
});

/**
 * Generate embeddings for all knowledge base entries
 * Run once after adding new interventions
 */
export const generateAllEmbeddings = internalAction({
  handler: async (ctx) => {
    // Get all knowledge base entries without embeddings
    const entries = await ctx.runQuery(internal.functions.knowledgeBase.getAllWithoutEmbeddings);

    let generated = 0;
    for (const entry of entries) {
      // Combine title + description + content for richer embedding
      const text = `${entry.title}\n${entry.description}\n${entry.content || ''}`;

      const embedding = await ctx.runAction(internal.functions.embeddings.generateEmbedding, {
        text,
      });

      await ctx.runMutation(internal.functions.knowledgeBase.updateEmbedding, {
        id: entry._id,
        embedding,
      });

      generated++;
    }

    console.log(`Generated ${generated} embeddings`);
    return { generated };
  },
});
```

#### **2.3 Vector Search Queries**

**Create: `convex/functions/vectorSearch.ts`** (New file)

```typescript
import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';

/**
 * Semantic search for interventions
 */
export const searchInterventions = internalAction({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    pressureZone: v.optional(v.string()), // Optional filter
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Generate embedding for user query
    const queryEmbedding = await ctx.runAction(
      internal.functions.embeddings.generateEmbedding,
      { text: args.query }
    );

    // Vector search
    const results = await ctx.vectorSearch('knowledgeBase', 'by_embedding', {
      vector: queryEmbedding,
      limit,
      filter: (q) =>
        q.and(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('language'), 'en'),
          args.pressureZone
            ? q.eq(q.field('pressureZones'), args.pressureZone)
            : undefined
        ),
    });

    // Fetch full documents
    const interventions = await Promise.all(
      results.map(async (result) => {
        const doc = await ctx.runQuery(internal.functions.knowledgeBase.getById, {
          id: result._id,
        });
        return {
          ...doc,
          score: result._score, // Similarity score (0-1)
        };
      })
    );

    return interventions;
  },
});
```

#### **2.4 Knowledge Base Functions**

**Create: `convex/functions/knowledgeBase.ts`** (New file)

```typescript
import { internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';

export const getAllWithoutEmbeddings = internalQuery({
  handler: async (ctx) => {
    const entries = await ctx.db
      .query('knowledgeBase')
      .filter((q) => q.eq(q.field('embedding'), undefined))
      .collect();

    return entries;
  },
});

export const updateEmbedding = internalMutation({
  args: {
    id: v.id('knowledgeBase'),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      embedding: args.embedding,
      updatedAt: Date.now(),
    });
  },
});

export const getById = internalQuery({
  args: { id: v.id('knowledgeBase') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

#### **2.5 Tool Integration**

**Modify: `src/tools.ts`**

Replace static mapping in `findInterventions` tool.

```typescript
export const findInterventions = tool({
  name: 'find_interventions',
  description: `Find evidence-based interventions using semantic search.`,

  parameters: z.object({
    query: z.string().optional().default('general support'),
    pressure_zones: z.array(z.string()).nullable().optional(),
  }),

  execute: async (input, runContext) => {
    const context = runContext!.context as GiveCareContext;

    // Build search query from context
    let searchQuery = input.query || 'general caregiver support';

    // Enhance with pressure zones
    const zones = input.pressure_zones || context.pressureZones;
    if (zones.length > 0) {
      searchQuery += ` focusing on ${zones.join(', ')}`;
    }

    // Call vector search (via Convex action)
    // NOTE: Tools can't directly call Convex actions, so we'll need to pre-fetch
    // interventions and pass via context, OR make tool async with Convex client

    // TEMPORARY: Use static mapping until tool execution supports async
    // TODO: Refactor to use vector search after agent execution model update

    const topZones = zones.slice(0, 2);
    const matches = topZones
      .map(zone => ZONE_INTERVENTIONS[zone]?.[0])
      .filter(Boolean);

    const intro = context.burnoutBand === 'crisis'
      ? "I see you're dealing with a lot right now. Here are some immediate supports:\n\n"
      : "Here are some strategies that might help:\n\n";

    return intro + matches
      .map((int, i) => `${i + 1}. **${int.title}**: ${int.desc}\n   ✓ ${int.helpful}% found helpful`)
      .join('\n\n');
  },
});
```

**NOTE**: OpenAI Agents SDK 0.1.9 tools are synchronous. To use vector search, we need to either:
1. Pre-fetch interventions and store in context (recommended for MVP)
2. Wait for async tool support in SDK 0.2.x
3. Use a separate Convex action wrapper

#### **2.6 Knowledge Base Seeding**

**Create: `scripts/seedKnowledgeBase.ts`** (New file)

```typescript
import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const client = new ConvexClient(process.env.CONVEX_URL!);

// Migrate from static interventionData.ts to database
const interventions = [
  {
    type: 'intervention',
    category: 'crisis',
    title: 'Crisis Text Line',
    description: 'Text HOME to 741741 for 24/7 emotional support',
    content: 'Free, confidential crisis support via SMS. Trained counselors respond within minutes.',
    pressureZones: ['emotional', 'self_care'],
    tags: ['crisis', 'mental-health', 'immediate'],
    evidenceSource: 'Crisis Text Line Organization',
    evidenceLevel: 'expert_consensus',
    effectivenessPct: 92,
    deliveryFormat: 'sms_text',
    deliveryData: { url: 'https://www.crisistextline.org' },
    language: 'en',
    culturalTags: [],
    locationSpecific: false,
    zipCodes: [],
    usageCount: 0,
    status: 'active',
    createdBy: 'admin',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // ... add all 20+ interventions from interventionData.ts
];

async function seed() {
  for (const intervention of interventions) {
    await client.mutation(api.functions.knowledgeBase.create, intervention);
    console.log(`Added: ${intervention.title}`);
  }

  console.log('Seeding complete. Run embeddings generation:');
  console.log('npx convex run functions/embeddings:generateAllEmbeddings');
}

seed();
```

Run seeding:
```bash
npx tsx scripts/seedKnowledgeBase.ts
npx convex run functions/embeddings:generateAllEmbeddings
```

#### **2.7 Documentation**

**Create: `docs/VECTOR_SEARCH.md`**

```markdown
# Vector Search for Intervention Matching

## Overview

GiveCare uses OpenAI embeddings + Convex vector search to semantically match user queries to interventions.

## Architecture

1. **Knowledge Base** (`knowledgeBase` table) stores 100+ interventions
2. **Embeddings** (text-embedding-3-small, 1536-dim) generated for all entries
3. **Vector Search** finds semantically similar interventions to user query
4. **Ranking** by similarity score + evidence level + effectiveness %

## Adding New Interventions

```bash
# 1. Add to knowledge base (via Convex dashboard or script)
npx convex run functions/knowledgeBase:create '{...}'

# 2. Generate embedding
npx convex run functions/embeddings:generateAllEmbeddings
```

## Search Examples

| User Query | Matched Intervention |
|------------|---------------------|
| "I'm exhausted all the time" | Respite Care Finder (physical) |
| "Can't afford medical bills" | Financial Assistance Programs |
| "No one understands me" | Local Caregiver Support Groups |
| "Can't get to appointments" | Transportation Assistance |

## Cost

- **Embeddings**: $0.02 per 1M tokens (~$0.01 per 100 interventions)
- **Search**: Free (Convex native vector search)
- **Total**: <$1/month for 1000 interventions

## Performance

- **Embedding generation**: 100-200ms per entry (one-time)
- **Search latency**: 20-50ms per query
- **Accuracy**: 85-90% match relevance (vs 60% with static mapping)
```

### Success Criteria

- [ ] Vector index added to schema
- [ ] Embeddings generated for all knowledge base entries
- [ ] Vector search returns top 5 results in <50ms
- [ ] `findInterventions` tool uses vector search
- [ ] Match relevance >85% (user feedback)
- [ ] Knowledge base has 50+ active interventions
- [ ] Seeding script documented

---

## Task 3: Admin Dashboard (Telemetry & Observability)

### **Status**: 🚧 DOING (Phase 1 Complete, Phase 2 In Progress)
### **Priority**: 🔥 HIGH
### **Estimated Time**: 2 weeks total (1 week remaining)

### Objective

Build a comprehensive admin dashboard for real-time monitoring, user management, crisis alerts, and analytics.

### Product Requirements

**See detailed specification**: [`docs/DASHBOARDS_AND_EVALS.md`](DASHBOARDS_AND_EVALS.md#task-3-admin-dashboard)

**Core Features**:
1. Real-time metrics overview (6 KPIs: users, active, crisis, burnout, latency, SMS)
2. User management table (search, filter, bulk actions)
3. Crisis alerts panel (users in crisis band, pending follow-ups)
4. Analytics charts (burnout distribution, user funnel, SMS trends, intervention stats)
5. System health monitoring (rate limits, API usage, errors)

**Tech Stack**: Vite + React + TypeScript, TanStack Router/Query/Table, Recharts, Convex

**Deployment**: `dash.givecareapp.com` (Cloudflare Pages) ✅ LIVE

---

### Phase 1: Initial Build ✅ COMPLETE (2025-10-10)

**Completed Deliverables**:
- ✅ `admin-frontend/` - Vite + React project with Convex + TanStack Router
- ✅ `convex/functions/admin.ts` - User management queries (296 lines)
- ✅ `convex/functions/analytics.ts` - Metrics aggregation queries (248 lines)
- ✅ 7 pages built: index, users, user detail, crisis, analytics, system, traces, login
- ✅ Reusable UI components: MetricCard, UserTable, BurnoutChart, QualityMetrics, TraceViewer
- ✅ Convex Auth integration (email/password, route protection)
- ✅ Deployed to production: https://dash.givecareapp.com
- ✅ Auto-deploy on git push (CI/CD via Cloudflare Pages)

**Phase 1 Success Criteria Met**:
- ✅ Dashboard loads in <2s, metrics auto-refresh every 30s
- ✅ User table: filter by 3 criteria (journey, burnout, subscription), view details
- ✅ Crisis panel: real-time list, pending follow-ups
- ✅ Charts: burnout distribution, user funnel, SMS trends, quality metrics
- ✅ System health: rate limits, API usage
- ✅ Query latency <1s (p95)
- ✅ Mobile-responsive
- ✅ Real-time updates via Convex subscriptions

---

### Phase 2: Polish & Actions 🚧 IN PROGRESS (2025-10-12)

**Current Status**: 61% production-ready (deployed but incomplete actions)

**Remaining Work**:

#### **Tier 1: Critical Blockers** (Must fix before real operations)
- [ ] **Implement user actions** (1-2 days)
  - [ ] "Send Message" button → Twilio outbound SMS
  - [ ] "Reset Assessment" button → Clear assessment state
  - [ ] "Send Check-in" button (Crisis page) → Scheduled message
  - [ ] "Mark Resolved" button (Crisis page) → Update user state
- [ ] **Add pagination** (1 day)
  - [ ] User table pagination (TanStack Table)
  - [ ] Handle >500 users gracefully
- [ ] **Error boundaries** (0.5 days)
  - [ ] Wrap routes in error boundary
  - [ ] Graceful error handling with retry

#### **Tier 2: Important Issues** (Should fix before team use)
- [ ] **Improve empty states** (0.5 days)
  - [ ] Add helpful CTAs ("No users yet - add test data", etc.)
  - [ ] Clear loading vs empty states
- [ ] **Confirmation dialogs** (1 day)
  - [ ] "Are you sure?" for destructive actions
  - [ ] Toast notifications for action feedback
- [ ] **Audit logging** (1-2 days)
  - [ ] Log who did what, when (admin_actions table)
  - [ ] Show audit trail in UI
- [ ] **CSV export** (1 day)
  - [ ] Export user list to CSV
  - [ ] Export conversation history

#### **Tier 3: Polish** (Nice-to-have)
- [ ] Remove misleading notification badge (or implement notifications)
- [ ] Add logo or remove broken image reference
- [ ] Fix/remove broken nav links (Settings, Help pages)
- [ ] Standardize date formatting + timezone indicators
- [ ] Test keyboard navigation + accessibility (WCAG AA)
- [ ] Implement search command or remove Cmd+K shortcut

**Estimated Time**: 5-7 days remaining

---

### Success Criteria (Updated)

**Phase 1** ✅:
- ✅ All pages functional for viewing data
- ✅ Authentication working
- ✅ Deployed to production

**Phase 2** (Current):
- [ ] All action buttons functional
- [ ] Pagination handles >500 users
- [ ] Error boundaries prevent crashes
- [ ] Confirmation dialogs for destructive actions
- [ ] CSV export working

**Business**:
- [ ] 50% reduction in user support time (blocked until actions work)
- [ ] Crisis response time <5min (blocked until "Send Check-in" works)

---

## Task 4: User Dashboard (Self-Service Portal)

### **Status**: 📋 To Do
### **Priority**: 🟡 MEDIUM
### **Estimated Time**: 2 weeks

### Objective

Build a user-facing dashboard for wellness tracking, intervention browsing, and self-service profile/subscription management.

### Product Requirements

**See detailed specification**: [`docs/DASHBOARDS_AND_EVALS.md`](DASHBOARDS_AND_EVALS.md#task-4-user-dashboard)

**Core Features**:
1. Phone OTP authentication (6-digit code)
2. Wellness dashboard (current score, 30-day trend, pressure zones)
3. Assessment history (list, details, domain scores)
4. Intervention library (recommendations, search, favorites, ratings)
5. Profile editor (name, relationship, care recipient, zip, language)
6. Subscription management (Stripe portal, usage stats)

**Tech Stack**: Vite + React + TypeScript, TanStack Router/Query, Recharts, Convex

**Deployment**: `my.givecare.app` (Vercel/Cloudflare Pages)

**Decision Needed**: Supabase Auth vs Convex Auth (Recommendation: Convex Auth)

### Deliverables

**New Files**:
- `user-dashboard/` - Vite + React project (copy from `_REF/dashboard`)
- `convex/functions/auth.ts` - Phone OTP (send code, verify, create session)
- `convex/functions/dashboard.ts` - User queries (wellness history, assessments, interventions, profile)
- `user-dashboard/src/routes/` - 6 pages (login, index, profile, assessments, interventions, subscription)
- `user-dashboard/src/components/` - Reusable UI (ScoreCard, TrendChart, PressureZoneChart, InterventionCard)

**Schema Additions**:
```typescript
otp_codes: { phoneNumber, code, expiresAt, createdAt }
sessions: { userId, token, expiresAt, createdAt }
```

**Deployment**: Subdomain `my.givecare.app` via Vercel/Cloudflare Pages

### Success Criteria

**Functional**:
- [ ] Phone OTP login (send, verify, 30-day session)
- [ ] Wellness dashboard: score + 30-day trend + pressure zones
- [ ] Assessment history: list + details + domain scores
- [ ] Intervention library: recommendations + search + rate (1-5 stars)
- [ ] Profile editor: update info
- [ ] Subscription: Stripe portal link

**Non-Functional**:
- [ ] Page load <2s (p95)
- [ ] Mobile-first design
- [ ] Session persists 30 days
- [ ] Accessible (WCAG 2.1 AA)

**Business**:
- [ ] 50%+ SMS users adopt web dashboard (within 30 days)
- [ ] 80%+ intervention satisfaction (avg 4+ stars)
- [ ] 30% reduction in support requests

---

## Task 5: Evaluation Framework (Automated Evals + GEPA)

### **Status**: 📋 To Do
### **Priority**: 🟡 MEDIUM
### **Estimated Time**: 1 week (Phase 1), 3-5 days (Phase 2 when ready)

### Objective

Systematically measure agent quality, track performance over time, and prepare for GEPA prompt optimization.

### Product Requirements

**See detailed specification**: [`docs/DASHBOARDS_AND_EVALS.md`](DASHBOARDS_AND_EVALS.md#task-5-evaluation-framework)

**Phase 1: Baseline (Week 1)**:
1. Conversation feedback collection (1-5 star ratings, dimensions: empathy/clarity/trauma-informed)
2. Baseline evals on 50 scenarios (GPT-4 as judge)
3. Export utilities (conversations to JSONL)
4. Daily eval loop (quality regression detection)

**Phase 2: GEPA (When 100+ rated conversations available)**:
5. GEPA integration (generate/evaluate/prune/augment instruction variants)
6. A/B testing (20% users, 30 days, statistical significance)
7. Continuous monitoring (monthly GEPA re-runs)

**Tech Stack**: Node.js eval scripts, OpenAI API (GPT-4 as judge), ax-llm (GEPA), GitHub Actions (automation)

### Deliverables

**New Files**:
- `convex/functions/feedback.ts` - Feedback API (record rating, get top-rated, export)
- `evals/` - Eval framework directory
- `evals/scripts/runEvals.ts` - Baseline evaluation runner (50 scenarios)
- `evals/scripts/gepaOptimize.ts` - GEPA integration (Phase 2)
- `evals/scripts/dailyEvalLoop.ts` - Continuous quality monitoring
- `evals/scripts/exportConversations.ts` - Data export utility

**Schema Additions**:
```typescript
conversation_feedback: {
  conversationId, userId, rating (1-5),
  dimension (empathy | clarity | helpfulness | trauma_informed),
  feedbackText, timestamp
}
```

### Success Criteria

**Phase 1 (Baseline)**:
- [ ] `conversation_feedback` table created
- [ ] Feedback API functional (record, export)
- [ ] Baseline evals run on 50 scenarios
- [ ] Metrics: empathy, clarity, trauma-informed, actionable
- [ ] Results saved to `evals/results/baseline_eval.json`
- [ ] Daily eval loop script functional

**Phase 2 (GEPA)** - Blocked until 100+ rated conversations:
- [ ] 100+ rated conversations (4+ stars)
- [ ] GEPA generates 10+ instruction variants
- [ ] Clinical advisor review (P1-P6 compliance)
- [ ] A/B test (30 days, 500+ users per variant)
- [ ] >10% improvement in empathy scores
- [ ] No degradation in response time or crisis escalations

**Business**:
- [ ] Quality baseline established
- [ ] 80%+ responses rated 4+ stars
- [ ] Continuous monitoring prevents regressions

**Critical Warnings**:
- MUST have clinical advisor review all GEPA variants
- NEVER blindly deploy optimized prompts
- Preserve P1-P6 trauma-informed principles
- Sample size: 100+ rated conversations minimum

**When to Revisit GEPA**: Earliest 2026-04-10 (6 months post-launch)

---

## Task 6: Rate Limiter (Cost & Spam Protection)

### **Status**: ✅ COMPLETE (2025-10-10)
### **Priority**: 🔥 CRITICAL
### **Time Taken**: 1 day

✅ **IMPLEMENTED**: All rate limiting features for cost & spam protection. See **`docs/RATE_LIMITS.md`** for operational guide and configuration details.

**Implemented Features**:
- 5 rate limit configurations (SMS per-user, SMS global, assessments, OpenAI API, spam)
- Cost protection: Max $1,200/day
- Files: `convex/rateLimits.config.ts`, `convex/twilio.ts`, `convex/functions/rateLimitMonitoring.ts`

---

## Task 7: GEPA Prompt Optimization (Integrated into Task 5)

### **Status**: 💡 Integrated into Task 5
### **Priority**: 🔵 LOW

GEPA prompt optimization is now **Phase 2** of Task 5 (Evaluation Framework). See Task 5 for full details.

**Prerequisites**:
- 100+ rated conversations (4+ stars)
- Empathy evaluation rubric validated
- A/B testing infrastructure
- Clinical advisor available
- Budget: ~$50-100 in OpenAI costs

**Earliest start date**: 2026-04-10 (6 months after production launch)

---

## Questions / Decisions Needed

1. **Admin Auth**: Email/password vs OAuth vs Magic link? (Recommendation: Email/password via Convex Auth)
2. **User Auth**: Supabase Auth vs Convex Auth? (Recommendation: Convex Auth)
3. **Dashboard Hosting**: Vercel vs Cloudflare Pages? (Recommendation: Vercel)
4. **Intervention Rating**: In-SMS vs web-only? (Recommendation: Both)
5. **GEPA Timeline**: When to revisit? (Target: 2026-04-10)
6. **Analytics Rollups**: Real-time vs pre-aggregated? (Recommendation: Hybrid)

---

## Task 8: RRULE Trigger System (Personalized Scheduling)

### **Status**: ✅ COMPLETE (2025-10-15)
### **Priority**: 🔥 HIGH
### **Time Taken**: 1 day (TDD approach)
### **Source**: OpenPoke analysis (OPENPOKE_ANALYSIS.md)

### Objective

Replace fixed cron-based scheduling with RRULE-based per-user customizable schedules, enabling timezone support and personalized wellness check-in timing.

### Current Gap

- Fixed 9am PT wellness check-ins for ALL users (no timezone support)
- No user control over check-in timing or frequency
- Can't do complex patterns like "Mon/Wed/Fri only"
- Night shift caregivers get messages at wrong times

### Implementation

#### **8.1 Database Schema** (`convex/schema.ts`)

```typescript
triggers: defineTable({
  userId: v.id("users"),
  recurrenceRule: v.string(), // RRULE format (RFC 5545)
  type: v.string(), // "wellness_checkin" | "assessment_reminder" | "crisis_followup"
  message: v.string(),
  timezone: v.string(), // IANA timezone (America/New_York)
  enabled: v.boolean(),
  nextOccurrence: v.number(), // Unix timestamp
  createdAt: v.number(),
  lastTriggeredAt: v.optional(v.number()),
})
  .index('by_user', ['userId'])
  .index('by_next_occurrence', ['nextOccurrence', 'enabled'])
  .index('by_type', ['type']);
```

#### **8.2 Dependencies**

```json
{
  "dependencies": {
    "rrule": "^2.8.1"
  }
}
```

#### **8.3 Trigger Manager** (`convex/triggers.ts`)

Process due triggers every 15 minutes:

```typescript
import { RRule } from 'rrule';

export const processDueTriggers = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const dueTriggers = await ctx.db
      .query('triggers')
      .withIndex('by_next_occurrence')
      .filter(q => q.and(
        q.lte(q.field('nextOccurrence'), now),
        q.eq(q.field('enabled'), true)
      ))
      .collect();

    for (const trigger of dueTriggers) {
      await sendSMS(ctx, trigger.userId, trigger.message);

      const rrule = RRule.fromString(trigger.recurrenceRule);
      const nextOccurrence = rrule.after(new Date(now));

      await ctx.db.patch(trigger._id, {
        nextOccurrence: nextOccurrence.getTime(),
        lastTriggeredAt: now,
      });
    }
  }
});
```

#### **8.4 User Preference Tool** (`src/tools.ts`)

```typescript
export const setWellnessSchedule = tool({
  name: 'set_wellness_schedule',
  description: 'Set personalized wellness check-in schedule',
  parameters: z.object({
    frequency: z.enum(['daily', 'every_other_day', 'weekly', 'custom']),
    preferredTime: z.string(), // "9:00 AM"
    timezone: z.string(), // "America/Los_Angeles"
    daysOfWeek: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
  }),
  execute: async ({ frequency, preferredTime, timezone, daysOfWeek }, { context }) => {
    const [hour, minute] = parseTime(preferredTime);
    let rrule = '';

    if (frequency === 'daily') {
      rrule = `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=${minute}`;
    } else if (frequency === 'weekly' && daysOfWeek) {
      rrule = `FREQ=WEEKLY;BYDAY=${daysOfWeek.join(',')};BYHOUR=${hour};BYMINUTE=${minute}`;
    }

    await createTrigger(context.userId, { recurrenceRule: rrule, type: 'wellness_checkin', message: 'Quick check-in: How are you feeling today?', timezone });

    return `Set wellness check-ins for ${frequency} at ${preferredTime} ${timezone}`;
  }
});
```

### Success Criteria

- ✅ Triggers table created with RRULE support (5 indexes)
- ✅ processDueTriggers cron runs every 15 minutes
- ✅ setWellnessSchedule tool functional (6th agent tool)
- ✅ Users can set custom check-in times during onboarding
- ✅ Timezone conversion working correctly (PT, MT, CT, ET tested)
- ✅ 54 comprehensive tests passing (100% coverage)
- ✅ Missed trigger handling implemented (<24h skip logic)
- [ ] 10 beta users on custom schedules (pending production testing)
- [ ] 2x engagement increase observed (pending production metrics)

### Expected Impact

- **Engagement**: 2x increase (personalization effect)
- **User satisfaction**: Caregivers get messages at convenient times
- **Nationwide support**: Works across all US timezones
- **Flexibility**: Complex patterns (Mon/Wed/Fri, every other day, etc.)

---

## Task 9: Conversation Summarization (Long-term Context)

### **Status**: 📋 To Do
### **Priority**: 🔥 HIGH
### **Estimated Time**: 5-7 days
### **Source**: OpenPoke analysis (OPENPOKE_ANALYSIS.md)

### Objective

Implement automatic conversation summarization to preserve context beyond OpenAI's 30-day session limit, reducing token costs and enabling infinite context retention.

### Current Gap

- Full conversation history passed to agent (no compression)
- OpenAI sessions expire after 30 days (context loss for long-term users)
- No mechanism to preserve critical caregiver information beyond 30 days
- Token costs increase linearly with conversation length

### Implementation

#### **9.1 Database Schema Updates** (`convex/schema.ts`)

```typescript
users: defineTable({
  // ... existing fields ...

  // Summarization fields
  recentMessages: v.optional(v.array(v.object({
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  }))),
  historicalSummary: v.optional(v.string()), // Compressed summary of >7 days ago
  conversationStartDate: v.optional(v.number()),
  totalInteractionCount: v.optional(v.number()),
})
```

#### **9.2 Summarization Function** (`convex/summarization.ts`)

```typescript
export const updateCaregiverProfile = internalMutation({
  handler: async (ctx, { userId }) => {
    const messages = await getConversationHistory(ctx, userId);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentMessages = messages.filter(m => m.timestamp > sevenDaysAgo);
    const historicalMessages = messages.filter(m => m.timestamp <= sevenDaysAgo);

    let historicalSummary = '';
    if (historicalMessages.length > 20) {
      historicalSummary = await summarizeMessages(historicalMessages, {
        focus: 'caregiver_challenges_and_progress',
        maxTokens: 500,
      });
    }

    await ctx.db.patch(userId, {
      recentMessages,
      historicalSummary,
    });
  }
});
```

#### **9.3 Context Integration** (`src/context.ts`)

```typescript
export interface GiveCareContext {
  // ... existing fields ...

  recentMessages: Array<{ role: string; content: string; timestamp: number }>;
  historicalSummary: string;
  conversationStartDate: number;
  totalInteractionCount: number;
}
```

#### **9.4 Scheduled Summarization** (`convex/crons.ts`)

```typescript
crons.daily(
  'summarize-conversations',
  { hourUTC: 11, minuteUTC: 0 }, // 3am PT (low usage)
  internal.summarization.summarizeAllUsers
);

export const summarizeAllUsers = internalMutation({
  handler: async (ctx) => {
    const activeUsers = await ctx.db
      .query('users')
      .withIndex('by_journey', q => q.eq('journeyPhase', 'active'))
      .collect();

    for (const user of activeUsers) {
      const messageCount = await countMessages(ctx, user._id);
      if (messageCount > 30) {
        await updateCaregiverProfile(ctx, { userId: user._id });
      }
    }
  }
});
```

### Success Criteria

- [ ] Summarization schema fields added
- [ ] Daily summarization cron functional
- [ ] Recent messages (7 days) preserved in full detail
- [ ] Historical messages (>7 days) compressed to 500 tokens
- [ ] Critical facts never summarized (care recipient name, crisis history)
- [ ] 60-80% token cost reduction for long-term users (>100 messages)
- [ ] Context retained beyond 30-day OpenAI limit
- [ ] Agent responses maintain quality with summarized context

### Expected Impact

- **Token savings**: 60-80% for users with 100+ messages
- **Context retention**: Infinite (vs 30-day OpenAI limit)
- **Cost**: <$10/month at 1,000 users
- **Quality**: Agents remember 6+ months of history

---

## Task 10: Working Memory System (Structured Context)

### **Status**: ✅ COMPLETE (2025-10-15)
### **Priority**: 🟡 MEDIUM
### **Time Taken**: <1 day (TDD approach)
### **Source**: OpenPoke analysis (OPENPOKE_ANALYSIS.md)

### Objective

Add structured memory system to record and retrieve important caregiver information, reducing repeated questions and improving personalization.

### Current Gap

- Critical facts only in `users` table (limited fields)
- No way to recall "what interventions worked last month?"
- Caregivers repeat same information multiple times
- Can't surface relevant past discussions

### Implementation

#### **10.1 Memory Schema** (`convex/schema.ts`)

```typescript
memories: defineTable({
  userId: v.id("users"),
  content: v.string(), // "Care recipient John prefers morning bathing routine"
  category: v.string(), // "care_routine" | "preference" | "intervention_result" | "crisis_trigger"
  importance: v.number(), // 1-10
  createdAt: v.number(),
  lastAccessedAt: v.optional(v.number()),
  accessCount: v.optional(v.number()),
  embedding: v.optional(v.array(v.number())), // For vector search (Task 2)
})
  .index('by_user', ['userId'])
  .index('by_user_importance', ['userId', 'importance'])
  .index('by_category', ['category'])
  .vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 1536,
    filterFields: ['userId'],
  });
```

#### **10.2 Memory Recording Tool** (`src/tools.ts`)

```typescript
export const recordMemory = tool({
  name: 'record_memory',
  description: 'Save important information for future reference',
  parameters: z.object({
    content: z.string(),
    category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger']),
    importance: z.number().min(1).max(10),
  }),
  execute: async ({ content, category, importance }, { context }) => {
    await saveMemory({
      userId: context.userId,
      content,
      category,
      importance,
    });
    return `Remembered: ${content}`;
  }
});
```

#### **10.3 Agent Instructions Update** (`src/instructions.ts`)

Add to main agent instructions:
```
When user shares important information (preferences, what works/doesn't work, care routines, crisis triggers), use record_memory to save it for future reference.
```

### Success Criteria

- ✅ Memories table created with 4 indexes (by_user, by_user_importance, by_category, by_embedding)
- ✅ recordMemory tool functional (7th agent tool)
- ✅ Agent uses tool proactively (via updated instructions)
- ✅ Memory importance scoring validated (1-10 range enforced)
- ✅ 26 comprehensive tests passing (100% coverage)
- ✅ Category validation (care_routine, preference, intervention_result, crisis_trigger)
- ✅ Access tracking implemented (accessCount, lastAccessedAt)
- [ ] 50% reduction in repeated questions (pending production testing)
- [ ] 50+ memory entries recorded across test users (pending production deployment)

### Expected Impact

- **Personalization**: Responses tailored to past discussions
- **Efficiency**: 50% reduction in repeated questions
- **Clinical value**: Track intervention effectiveness over time
- **Cost**: Negligible (<$5/month at 1,000 users)

### Note

Memory search (vector-based retrieval) requires Task 2 (Vector Search) to be completed first. This task only implements memory recording.

---

## Task 11: Engagement Watcher (Churn Prevention)

### **Status**: 📋 To Do
### **Priority**: 🟡 MEDIUM
### **Estimated Time**: 3-5 days
### **Source**: OpenPoke analysis (OPENPOKE_ANALYSIS.md)

### Objective

Implement background watchers to detect disengagement patterns, high-stress bursts, and wellness trends for proactive intervention.

### Current Gap

- No detection of sudden engagement drops (early churn signal)
- Can't identify high-stress patterns (3+ crisis keywords in 24 hours)
- No automated trend analysis (worsening wellness scores)

### Implementation

#### **11.1 Engagement Watcher** (`convex/watchers.ts`)

```typescript
export const watchCaregiverEngagement = internalMutation({
  handler: async (ctx) => {
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const users = await ctx.db
      .query('users')
      .withIndex('by_journey', q => q.eq('journeyPhase', 'active'))
      .collect();

    for (const user of users) {
      // Pattern 1: Sudden drop (from daily to silent for 3+ days)
      const recentMessageCount = await countMessages(ctx, user._id, { since: oneDayAgo });
      const previousAverage = user.averageMessagesPerDay || 1;

      if (previousAverage > 3 && recentMessageCount === 0) {
        await flagDisengagement(ctx, user._id, 'sudden_drop');
      }

      // Pattern 2: High-stress burst (5+ messages in 2 hours with crisis keywords)
      const burstMessages = await getMessages(ctx, user._id, { since: sixHoursAgo });
      const crisisKeywordCount = burstMessages.filter(m =>
        /help|overwhelm|can't do this|give up/i.test(m.content)
      ).length;

      if (crisisKeywordCount >= 3) {
        await flagHighStress(ctx, user._id, 'crisis_burst');
      }
    }
  }
});

// Run every 6 hours
crons.interval(
  'engagement-watcher',
  { hours: 6 },
  internal.watchers.watchCaregiverEngagement
);
```

#### **11.2 Wellness Trend Watcher** (`convex/watchers.ts`)

```typescript
export const watchWellnessTrends = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_journey', q => q.eq('journeyPhase', 'active'))
      .collect();

    for (const user of users) {
      const scores = await ctx.db
        .query('wellnessScores')
        .withIndex('by_user_recorded', q => q.eq('userId', user._id))
        .order('desc')
        .take(4); // Last 4 weeks

      if (scores.length < 3) continue;

      const isWorsening = scores.every((score, i) =>
        i === 0 || score.overallScore > scores[i - 1].overallScore
      );

      if (isWorsening) {
        await sendSMS(ctx, user._id,
          "I've noticed your stress levels trending up over the past few weeks. Let's talk about what's changed and how I can help. 💙"
        );
      }
    }
  }
});

// Run weekly
crons.weekly(
  'wellness-trend-watcher',
  { hourUTC: 16, minuteUTC: 0, dayOfWeek: 'monday' },
  internal.watchers.watchWellnessTrends
);
```

#### **11.3 Alerts Schema** (`convex/schema.ts`)

```typescript
alerts: defineTable({
  userId: v.id("users"),
  type: v.string(), // "disengagement" | "high_stress" | "wellness_decline"
  pattern: v.string(),
  severity: v.string(), // "low" | "medium" | "urgent"
  createdAt: v.number(),
  resolvedAt: v.optional(v.number()),
})
  .index('by_user', ['userId'])
  .index('by_severity', ['severity'])
  .index('by_created', ['createdAt']);
```

### Success Criteria

- [ ] Engagement watcher runs every 6 hours
- [ ] Wellness trend watcher runs weekly
- [ ] Alerts table created
- [ ] 20-30% churn reduction observed
- [ ] High-stress bursts detected and escalated
- [ ] Admin dashboard shows alerts

### Expected Impact

- **Churn reduction**: 20-30% (early disengagement detection)
- **Safety improvement**: Faster crisis response
- **User satisfaction**: "GiveCare noticed I was struggling"

---

## Task Summary

| Task | Status | Priority | Time | Notes |
|------|--------|----------|------|-------|
| **Task 1: Scheduled Functions** | ✅ COMPLETE | 🔥 CRITICAL | 4 days | Proactive messaging implemented |
| **Task 6: Rate Limiter** | ✅ COMPLETE | 🔥 CRITICAL | 1 day | Cost protection implemented |
| **Task 8: RRULE Trigger System** | ✅ COMPLETE | 🔥 HIGH | 1 day | 54 tests, TDD approach (OpenPoke) |
| **Task 10: Working Memory System** | ✅ COMPLETE | 🟡 MEDIUM | <1 day | 26 tests, TDD approach (OpenPoke) |
| **Task 3: Admin Dashboard** | 🚧 DOING | 🔥 HIGH | 2 weeks | Phase 1 done (deployment), Phase 2 in progress (actions) |
| **Task 9: Conversation Summarization** | 📋 To Do | 🔥 HIGH | 5-7 days | Long-term context retention (OpenPoke) |
| **Task 2: Vector Search** | 📋 To Do | 🔥 HIGH | 3-4 days | Semantic intervention matching |
| **Task 11: Engagement Watcher** | 📋 To Do | 🟡 MEDIUM | 3-5 days | Churn prevention + trend monitoring (OpenPoke) |
| **Task 4: User Dashboard** | 📋 To Do | 🟡 MEDIUM | 2 weeks | Auth, profile, wellness tracking |
| **Task 5: Evaluation Framework** | 📋 To Do | 🟡 MEDIUM | 1 week | Automated evals + GEPA prep |
| **Task 7: GEPA Optimization** | 💡 Integrated | 🔵 LOW | N/A | Now part of Task 5 |

**Completion Status**: 4/11 tasks complete (36%)

**NEW: OpenPoke-inspired features** (2025-10-15):
- ✅ Task 8: RRULE Trigger System (COMPLETE - 54 tests passing)
- ✅ Task 10: Working Memory System (COMPLETE - 26 tests passing)
- Task 9: Conversation Summarization (infinite context)
- Task 11: Engagement Watcher (churn prevention)

**Remaining time**: ~7 weeks total
- **Phase 1** (High Priority): Admin Dashboard Phase 2 (1 week) + Summarization (1 week) + Vector Search (4 days) = ~3 weeks
- **Phase 2** (Medium Priority): Engagement Watcher (4 days) + User Dashboard (2 weeks) + Eval Framework (1 week) = ~3.5 weeks
- **Phase 3** (Low Priority): GEPA optimization when data available (6-12 months)

**Files Created (Task 8 - RRULE Triggers)**:
- `tests/rruleTriggers.test.ts` (803 lines, 54 tests)
- `convex/triggers.ts` (350 lines)
- Schema: Added `triggers` table with 5 indexes
- Tool: Added `setWellnessSchedule` (6th agent tool)
- Dependency: `rrule@2.8.1`

**Files Created (Task 10 - Working Memory)**:
- `tests/workingMemory.test.ts` (773 lines, 26 tests)
- `convex/functions/memories.ts` (130 lines, 5 functions)
- Schema: Added `memories` table with 4 indexes (including vector index for Task 2)
- Tool: Added `recordMemory` (7th agent tool)
- Instructions: Updated `mainInstructions` with memory guidance

---

**Last Updated**: 2025-10-15
**Version**: 0.7.0
**Tasks Completed**: Scheduled Functions, Rate Limiter
**Tasks In Progress**: Admin Dashboard (Phase 2 - Actions & Polish)
**New Tasks from OpenPoke Analysis**: RRULE Triggers, Conversation Summarization, Working Memory, Engagement Watcher
**Remaining**: All new tasks + Vector Search, User Dashboard, Evaluation Framework
