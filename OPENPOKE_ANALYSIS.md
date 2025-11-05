# OpenPoke Architecture Analysis for GiveCare

**Date**: 2025-11-05 (Revised)
**Purpose**: Identify applicable patterns from OpenPoke; document what's already built vs future opportunities

---

## Executive Summary

**Status Check**: GiveCare has already implemented **most** of the valuable patterns from OpenPoke:
- ✅ RRULE-based per-user trigger scheduling
- ✅ Engagement/wellness watchers with alerting
- ✅ Service layer (MessageHandler)
- ✅ Working memory with vector search
- ✅ Markdown system prompts (completed today)

**Remaining Opportunities**:
- Batch manager for parallel tool execution
- Async tool execution for long-running operations
- Agent directory structure (only if scaling beyond 5 agents)

---

## Already Implemented ✅

### 1. Per-User RRULE Trigger Scheduling ✅

**Status**: Fully implemented (v0.8.x)

**Implementation**:
- Schema: `triggers` table with recurrenceRule, timezone, nextOccurrence (convex/schema.ts:600-615)
- Processor: `processDueTriggers` runs every 15 minutes (convex/triggers.ts)
- Cron: `process-rrule-triggers` scheduled function (convex/crons.ts:73-112)
- Agent Tool: `set_wellness_schedule` creates triggers (src/tools.ts:516-598)

**Features**:
- RFC 5545 RRULE support
- IANA timezone awareness
- Missed trigger handling (24h grace period)
- Subscription status gating

**Example**:
```typescript
// User can say: "Remind me every Monday at 9am PT"
// Agent calls set_wellness_schedule tool
// Creates trigger: { recurrenceRule: "FREQ=WEEKLY;BYDAY=MO", timezone: "America/Los_Angeles" }
```

### 2. Engagement & Wellness Monitoring ✅

**Status**: Fully implemented (v0.8.x)

**Implementation**:
- Watchers: `watchCaregiverEngagement`, `watchWellnessTrends` (convex/watchers.ts)
- Schema: `alerts` table for pattern detection (convex/schema.ts:637-648)
- Crons: Engagement watcher (every 6h), wellness watcher (weekly Monday 9am PT)

**Detection Patterns**:
1. Sudden drop: >3 msgs/day → 0 messages in 24h
2. Crisis burst: 3+ crisis keywords in 6h
3. Wellness decline: 4 consecutive worsening scores

**Alert System**:
- Severity levels: low, medium, high, critical
- Admin dashboard integration
- Proactive SMS check-ins

### 3. Service Layer Architecture ✅

**Status**: Fully implemented (v0.8.x)

**Implementation**:
- Primary: `MessageHandler` service (convex/services/MessageHandler.ts, 800+ lines)
- Clear separation of concerns:
  1. Webhook validation (Twilio signature)
  2. Rate limiting (5 layers)
  3. Authentication (user lookup/creation)
  4. Authorization (subscription check)
  5. Context building (async hydration)
  6. Agent execution
  7. Persistence (assessments, conversations, wellness, feedback)
  8. Scheduling (crisis follow-ups, onboarding nudges)

**Benefits Delivered**:
- Testable (can mock ctx)
- Maintainable (clear responsibilities)
- Reusable (extracted from twilio.ts)

### 4. Working Memory System ✅

**Status**: Fully implemented (v0.8.x)

**Implementation**:
- Schema: `memories` table with vector search (convex/schema.ts:617-635)
- Agent Tool: `record_memory` (src/tools.ts:601-641)
- Vector Index: 1536 dimensions, filtered by userId

**Categories**:
- care_routine: Daily schedules, preferences
- preference: Coping strategies, likes/dislikes
- intervention_result: Feedback on strategies
- crisis_trigger: Known stressors

**Features**:
- Importance scoring (1-10)
- Access tracking (lastAccessedAt, accessCount)
- Vector similarity search
- Automatic embedding generation

### 5. Markdown System Prompts ✅

**Status**: Completed 2025-11-05 (TDD approach)

**Implementation**:
- Files: `src/prompts/main_agent.md`, `crisis_agent.md`, `assessment_agent.md`
- Loader: `src/prompts/loader.ts`
- Template variables: `{{userName}}`, `{{careRecipient}}`, etc.
- Tests: 20/20 passing (tests/promptLoader.test.ts)

**Benefits**:
- 59% code reduction (instructions.ts: 382 → 157 lines)
- Better readability (markdown formatting)
- Easier version control (clear git diffs)
- Non-technical editing (stakeholders can review)

### 6. Conversation Management ✅

**Status**: Fully implemented (production schema)

**Implementation**:
- Schema: `conversationState` for summaries (convex/schema.ts:152-187)
- Schema: `conversations` table for message history (convex/schema.ts:438-512)
- Features: role tracking, tool calls, telemetry, search indexing

**Differs from OpenPoke**:
- GiveCare: Real-time database with structured tables
- OpenPoke: Append-only file log with XML format

**Why GiveCare's approach is better**:
- Query flexibility (filter by role, date, user)
- Automatic reactivity (real-time dashboard updates)
- Built-in audit trail (_creationTime)
- HIPAA compliance (Convex handles encryption)

---

## Remaining Opportunities

### 1. Batch Manager for Parallel Tools (2 days)

**Status**: Not yet implemented

**OpenPoke Pattern** (`execution_agent/batch_manager.py:7126`):
- Parallel task execution with 90s timeouts
- Request ID tracking for observability
- Result aggregation before returning to interaction agent
- Defensive error handling

**Application to GiveCare**:
- Parallel assessment scoring (multiple questionnaires)
- Parallel resource searches (multiple pressure zones)
- Parallel intervention matching

**Implementation Path**:
1. Create `convex/agents/batchManager.ts`
2. Add `executeBatch(tools: AgentTool[])` function
3. Use `Promise.all()` for parallel execution
4. Aggregate results before returning to agent

**Expected Impact**: 40-60% faster response time for multi-tool operations

**Trade-offs**:
- Increased complexity
- Harder to debug (parallel execution)
- May not be needed if current response times are acceptable

### 2. Async Tool Execution (3 days)

**Status**: Not yet implemented

**OpenPoke Pattern**:
- Interaction agent returns immediately: "I'm checking your email..."
- Execution agent runs in background (up to 90s)
- Results delivered in follow-up message

**Application to GiveCare**:
- Resource search (often >2s)
- Assessment scoring (multiple calculations)
- Intervention matching (semantic search)

**Implementation Path**:
1. Add `pendingOperations` table to schema
2. Create `executeLongRunningTool` action:
   - Send "Looking into that..." SMS immediately
   - Execute tool asynchronously
   - Send result SMS when complete
3. Track operation status for admin dashboard

**Expected Impact**: Better UX for slow operations, reduced timeout errors

**Trade-offs**:
- **Pro**: User not left waiting (immediate feedback)
- **Con**: 2 SMS messages instead of 1 (increased cost)
- **Con**: More complex state management
- **Con**: User might send another message before result arrives

**Recommendation**: Test with resource search first. Monitor SMS costs and user feedback.

### 3. Agent Directory Structure (1 week)

**Status**: Not needed yet

**OpenPoke Pattern**:
```
agents/
├── interaction_agent/
│   ├── agent.py
│   ├── runtime.py
│   ├── system_prompt.md
│   └── tools.py
└── execution_agent/
    ├── agent.py
    ├── runtime.py
    ├── system_prompt.md
    └── tools.py
```

**GiveCare Current Structure**:
```
src/
├── agents.ts (all 3 agents)
├── instructions.ts (loaders)
├── prompts/*.md (system prompts)
└── tools.ts (shared tools)
```

**When to Refactor**:
- Only if agent count grows beyond 5
- Only if agents have significantly different tool sets
- Only if team size grows (multiple developers working on agents)

**Verdict**: Keep flat structure for now. Refactor if complexity increases.

---

## Not Applicable to GiveCare

### 1. Composio Integration ❌

**Why**: GiveCare doesn't need Composio because:
- No user OAuth required (SMS is phone-based)
- Direct API integrations are simpler (Twilio, Stripe)
- No email/calendar features planned

**Future**: Consider if adding email support or calendar integration.

### 2. Polling Architecture ❌

**Why**: Convex scheduled functions are superior:
- Automatic scaling, retries, error handling
- No background worker management required
- Cost-effective (pay per invocation)
- Real-time database reactivity

**OpenPoke uses polling** because it's simpler for self-hosted deployments.

### 3. Append-Only File Log ❌

**Why**: Convex database is better:
- Query flexibility (filter, sort, paginate)
- Real-time subscriptions (dashboard updates)
- Built-in audit trail (_creationTime)
- HIPAA compliance (encryption handled)

**OpenPoke uses file log** for simplicity and immutability, but GiveCare's database approach is more powerful.

### 4. 2-Agent Architecture Split ❌

**Why**: GiveCare's 3-agent hierarchy is better suited for trauma-informed care:
- Immediate crisis detection and routing (no task delegation delays)
- Seamless assessment flow (no "task execution" framing)
- Warm, continuous support (no orchestration overhead)

**OpenPoke's 2-agent split** (Interaction/Execution) is task-oriented, not support-oriented.

---

## Architecture Comparison

| Feature | OpenPoke | GiveCare | Better |
|---------|----------|----------|--------|
| **Scheduling** | RRULE triggers ✅ | RRULE triggers ✅ | Tie |
| **Monitoring** | Gmail importance watcher | Engagement/wellness watchers | GiveCare (broader) |
| **Storage** | File-based append log | Convex real-time DB | GiveCare (scalable) |
| **Service Layer** | services/ directory | MessageHandler + utilities | Tie |
| **Memory** | Conversation log | Dedicated memories table + vector search | GiveCare (searchable) |
| **Prompts** | Markdown files ✅ | Markdown files ✅ | Tie |
| **Agents** | 2 (Interaction/Execution) | 3 (Main/Crisis/Assessment) | GiveCare (specialized) |
| **Integration** | Composio OAuth | Direct APIs | Tie (different needs) |

---

## Recommendations Summary

### Implement Soon (If Needed)

**1. Batch Manager** (2 days)
- Only if multi-tool operations are common
- Only if response times are noticeably slow
- Test impact before full rollout

**2. Async Tool Execution** (3 days)
- Only if users complain about long waits
- Start with resource search (often slowest)
- Monitor SMS cost increase (2 messages vs 1)

### Don't Implement

**3. Agent Directory Structure**
- Current flat structure is fine for 3 agents
- Refactor only if scaling beyond 5 agents

**4. Composio/OAuth**
- Not needed for SMS-first platform
- Consider if adding email/calendar features

**5. Polling/File Logs**
- Convex is superior for cloud-native deployment

---

## Key Takeaway

**GiveCare has already implemented the most valuable OpenPoke patterns**:
- ✅ Per-user RRULE scheduling
- ✅ Background monitoring (engagement/wellness)
- ✅ Service layer architecture
- ✅ Working memory with vector search
- ✅ Markdown system prompts

**Remaining opportunities are marginal**:
- Batch manager: Useful for parallel operations, but may not be needed if current performance is acceptable
- Async execution: Better UX for long operations, but increases SMS costs
- Directory structure: Only needed if scaling significantly

**Next Step**: Focus on features that differentiate GiveCare from competitors (clinical tools, trauma-informed design, personalized interventions) rather than architectural refactoring.

---

## File Reference (OpenPoke)

**Files Analyzed from shlokkhemani/OpenPoke**:
- `server/agents/interaction_agent/system_prompt.md` (10.4KB)
- `server/agents/execution_agent/system_prompt.md` (3.7KB)
- `server/agents/interaction_agent/runtime.py` (15KB)
- `server/agents/execution_agent/batch_manager.py` (7.1KB)
- `server/services/triggers/service.py` (9.6KB)
- `server/services/trigger_scheduler.py` (6KB)
- `server/services/conversation/log.py` (8.2KB)
- `server/services/gmail/importance_watcher.py` (8.8KB)

**GiveCare Current Implementation**:
- `give-care-app/convex/schema.ts` (triggers, memories, alerts tables)
- `give-care-app/convex/triggers.ts` (RRULE processor)
- `give-care-app/convex/watchers.ts` (engagement/wellness monitoring)
- `give-care-app/convex/services/MessageHandler.ts` (800+ line service)
- `give-care-app/src/prompts/*.md` (markdown system prompts)
- `give-care-app/src/tools.ts` (set_wellness_schedule, record_memory tools)
