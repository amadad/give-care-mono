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

## Task Summary

| Task | Status | Priority | Time | Notes |
|------|--------|----------|------|-------|
| **Task 1: Scheduled Functions** | ✅ COMPLETE | 🔥 CRITICAL | 4 days | Proactive messaging implemented |
| **Task 6: Rate Limiter** | ✅ COMPLETE | 🔥 CRITICAL | 1 day | Cost protection implemented |
| **Task 3: Admin Dashboard** | 🚧 DOING | 🔥 HIGH | 2 weeks | Phase 1 done (deployment), Phase 2 in progress (actions) |
| **Task 2: Vector Search** | 📋 To Do | 🔥 HIGH | 3-4 days | Semantic intervention matching |
| **Task 4: User Dashboard** | 📋 To Do | 🟡 MEDIUM | 2 weeks | Auth, profile, wellness tracking |
| **Task 5: Evaluation Framework** | 📋 To Do | 🟡 MEDIUM | 1 week | Automated evals + GEPA prep |
| **Task 7: GEPA Optimization** | 💡 Integrated | 🔵 LOW | N/A | Now part of Task 5 |

**Completion Status**: 2.5/7 tasks complete (36%) - Admin dashboard 50% done

**Remaining time**: ~6 weeks total
- **Phase 1** (High Priority): Admin Dashboard Phase 2 (1 week) + Vector Search (3-4 days) = ~2 weeks
- **Phase 2** (Medium Priority): User Dashboard (2 weeks) + Eval Framework (1 week) = ~3 weeks
- **Phase 3** (Low Priority): GEPA optimization when data available (6-12 months)

---

**Last Updated**: 2025-10-12
**Version**: 0.7.0
**Tasks Completed**: Scheduled Functions, Rate Limiter
**Tasks In Progress**: Admin Dashboard (Phase 2 - Actions & Polish)
**Remaining**: Vector Search, User Dashboard, Evaluation Framework
