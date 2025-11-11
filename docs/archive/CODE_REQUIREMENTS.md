# GiveCare Code-Based Requirements & Goals
## Extracted from Actual Implementation

**Purpose:** Extract features, requirements, and goals from the actual codebase implementation (not documentation) to compare with documented requirements.

**Last Updated:** 2025-01-14

---

## 1. Core Architecture (From Code)

### 1.1 Technology Stack (Actual)

**Backend:**
- **Convex** - Serverless database + functions + real-time
- **@convex-dev/agent** - Agent Component for thread/message management
- **@convex-dev/workflow** - Durable workflows for multi-step processes
- **@convex-dev/twilio** - Twilio component for SMS
- **@convex-dev/rate-limiter** - Rate limiting component
- **Google Gemini 2.5 Flash Lite** - LLM for all agents (main, crisis, assessment)
- **OpenAI text-embedding-3-small** - Embeddings for semantic search

**External Services:**
- **Twilio** - SMS delivery (via component)
- **Stripe** - Payment processing (webhook-based)
- **Google Maps Grounding API** - Resource search (with fallback stubs)

### 1.2 Agent Architecture (Actual)

**3 Agents Implemented:**

1. **Main Agent** (`convex/agents/main.ts`)
   - Model: `gemini-2.5-flash-lite`
   - Tools: 6 tools (searchResources, recordMemory, check_wellness_status, find_interventions, update_profile, start_assessment)
   - Max steps: 5
   - Fast path: Short inputs (<5 chars) skip LLM if profile complete
   - Timeout: 4s SLA with fallback response
   - Context: Reduced on first turn (3 messages vs 5)

2. **Crisis Agent** (`convex/agents/crisis.ts`)
   - Model: `gemini-2.5-flash-lite`
   - Tools: None (prioritizes speed)
   - Max steps: 1
   - No context search (fastest response)
   - Triggers workflow for follow-up

3. **Assessment Agent** (`convex/agents/assessment.ts`)
   - Model: `gemini-2.5-flash-lite`
   - Tools: 1 tool (getInterventions)
   - Max steps: 2
   - Full context search (10 messages, vector + text)

### 1.3 Database Schema (Actual - 20+ Tables)

**Core Tables:**
- `users` - External ID, phone, email, channel, locale, metadata (profile stored here)
- `profiles` - Separate table (demographics, preferences)
- `assessments` - Completed assessments (definitionId, answers, completedAt)
- `assessment_sessions` - In-progress assessments (questionIndex, answers, status)
- `scores` - Burnout scores (composite, band, zones)
- `interventions` - Support strategies (title, category, targetZones, evidenceLevel)
- `intervention_zones` - Join table for zone-based queries (normalized)
- `memories` - Structured memories (category, content, importance) - NO embeddings (Agent Component handles semantic search)
- `subscriptions` - Stripe subscriptions (stripeCustomerId, planId, status)
- `alerts` - Crisis alerts (type, severity, context, status)
- `resource_cache` - TTL-based cache (category, zip, results, expiresAt)
- `agent_runs` - Analytics (agent, latencyMs, budgetResult)
- `tool_calls` - Tool telemetry (name, durationMs, success, cost)
- `guardrail_events` - Safety tracking (ruleId, action, context)
- `inbound_receipts` - Idempotency for Twilio retries
- `billing_events` - Stripe webhook events (idempotent)

**Indexes:**
- `users`: by_externalId, by_phone
- `assessments`: by_user, by_user_definition
- `assessment_sessions`: by_user_status, by_user_definition
- `intervention_zones`: by_zone, by_intervention
- `resource_cache`: by_category_zip, by_expiresAt
- `agent_runs`: by_user, by_trace
- `tool_calls`: by_user, by_trace

---

## 2. Features Implemented (From Code)

### 2.1 SMS Processing Flow

**Inbound Flow** (`convex/inbound.ts`):
1. Twilio webhook → `processInbound`
2. Idempotency check (messageSid)
3. Rate limiting (20 requests/minute per phone)
4. Ensure user exists
5. Crisis detection (keyword matching)
6. Route to agent (crisis or main)
7. Send SMS response

**Performance Optimizations:**
- Idempotency prevents duplicate processing
- Rate limiting before expensive agent work
- Fast path for short inputs (<5 chars, profile complete)
- Timeout protection (4s for main agent)
- Background memory enrichment (non-blocking)

### 2.2 Crisis Detection (Actual Implementation)

**Detection** (`convex/lib/policy.ts`):
- 13 crisis keywords (not 15+ as documented)
- Severity levels: high, medium, low
- Pattern matching (no AI delay)
- Keywords: "kill myself", "suicide", "i want to die", "end my life", "hurt myself", "self harm", "can't go on", "hopeless", "done with life", "make it stop", "panic attack", "overdose", "lost control"

**Response** (`convex/agents/crisis.ts`):
- No tools (prioritizes speed)
- No context search (fastest response)
- Pre-formatted response with 988/741741/911
- Triggers workflow for follow-up (24 hours)

**Workflow** (`convex/workflows/crisis.ts`):
- Logs crisis event to alerts table
- Checks emergency contact consent
- Schedules 24-hour follow-up
- Sends follow-up message if no recent activity

**Gap:** Emergency contact notification not fully implemented (returns `sent: false`)

### 2.3 Assessments (Actual Implementation)

**4 Assessments** (`convex/lib/assessmentCatalog.ts`):
1. **EMA** - 3 questions (stress, energy, support)
2. **BSFC** - 10 questions (4 zones: emotional, physical, social, time)
3. **REACH-II** - 16 questions (4 zones)
4. **SDOH** - 28 questions (5 zones: adds financial)

**Scoring Logic:**
- Likert scale (1-5)
- Zone-based buckets (questions mapped to zones)
- Average calculation per zone
- Composite score: normalized to 0-100 scale
- Band calculation: very_low, low, moderate, high
- Pressure zones: zones with average >= 3.5

**Assessment Flow** (`convex/assessments.ts`):
- `startAssessment` - Creates session, closes existing
- `answerAssessment` - Appends answer, increments index
- `finalizeAssessment` - Computes score, creates assessment record
- `getActiveSession` - Returns in-progress session

**Gap:** Assessment agent doesn't automatically ask questions - requires manual question flow

### 2.4 Memory System (Actual Implementation)

**Storage** (`convex/public.ts`, `convex/schema.ts`):
- `memories` table: userId, category, content, importance (1-10)
- Categories: care_routine, preference, intervention_result, crisis_trigger, family_health
- NO embeddings stored (Agent Component handles semantic search via contextOptions)

**Memory Tools:**
- `recordMemory` - Saves memory (public mutation)
- `listMemories` - Lists by user, ordered by importance
- Background enrichment via workflow (`convex/workflows/memory/enrichMemory`)

**Semantic Search:**
- Agent Component's `contextOptions` handles vector search
- Uses `text-embedding-3-small` embeddings
- No manual embedding storage needed

### 2.5 Resource Discovery (Actual Implementation)

**Search Flow** (`convex/resources.ts`):
1. Extract zip from query, metadata, or user profile
2. Check cache (by category + zip)
3. Stale-while-revalidate (SWR) pattern:
   - Valid cache: Return immediately
   - Stale cache: Return immediately + refresh in background
   - No cache: Race Maps API (1.5s) vs stub fallback
4. Cache results with TTL (category-based: 7-30 days)

**Categories:**
- respite (30d TTL), support (14d), daycare (30d), homecare (30d), medical (14d), community (14d), meals (7d), transport (7d), hospice (30d), memory (30d)

**Maps Integration** (`convex/lib/maps.ts`):
- Google Maps Grounding API
- Race timeout: 1.5s
- Stub fallback if Maps API slow/unavailable
- Background refresh via workflow

**Gap:** Maps API credentials may not be configured (stub fallback used)

### 2.6 Interventions (Actual Implementation)

**Storage** (`convex/schema.ts`):
- `interventions` table: title, description, category, targetZones, evidenceLevel
- `intervention_zones` join table (normalized for fast zone queries)

**Tools:**
- `findInterventions` - Query by zones (main agent)
- `getInterventions` - Query by zones (assessment agent)

**Gap:** Interventions table may not be seeded (no seed script found)

### 2.7 Profile Management (Actual Implementation)

**Storage:**
- Profile stored in `users.metadata.profile` (not separate table)
- Fields: firstName, careRecipientName, relationship, zipCode

**Progressive Onboarding** (`convex/lib/profile.ts`):
- Priority order: careRecipientName → zipCode (contextual) → firstName → relationship
- Contextual zipCode collection (only when resources needed)
- One field at a time (P2 principle)

**Tools:**
- `updateProfile` - Updates profile fields

### 2.8 Rate Limiting (Actual Implementation)

**Per User** (`convex/inbound.ts`):
- 20 requests per minute per phone (fixed window)
- Uses Rate Limiter component

**Gap:** No token budget enforcement (documented but not implemented)
**Gap:** No SMS/day limit enforcement (documented but not implemented)

### 2.9 Billing (Actual Implementation)

**Stripe Integration** (`convex/http.ts`, `convex/internal.ts`):
- Webhook handler: `/webhooks/stripe`
- Idempotent event recording
- Async event processing (scheduled)
- **Gap:** Event processing not implemented (TODO in code)

**Schema:**
- `subscriptions` table: stripeCustomerId, planId, status, currentPeriodEnd
- `billing_events` table: stripeEventId, type, data

**Gap:** No subscription creation/update logic implemented

### 2.10 Cron Jobs (Actual Implementation)

**Scheduled Jobs** (`convex/crons.ts`):
- Resource cache cleanup: Every 6 hours

**Gap:** No engagement monitoring cron (documented but not implemented)
**Gap:** No proactive check-in scheduling (documented but not implemented)

---

## 3. Performance Optimizations (From Code)

### 3.1 Response Time Optimizations

**Main Agent:**
- Fast path for short inputs (<5 chars, profile complete) - skips LLM
- Reduced context on first turn (3 messages vs 5)
- 4s timeout with fallback response
- Background memory enrichment (non-blocking)
- Async analytics logging (fire-and-forget)

**Crisis Agent:**
- No tools (prioritizes speed)
- No context search
- Minimal prompt

**Resource Search:**
- Cache-first (valid cache: <100ms)
- Stale-while-revalidate (stale cache: <100ms + background refresh)
- Race pattern (Maps API vs stub fallback: <500ms)
- Background refresh via workflow

### 3.2 Database Optimizations

**Indexes:**
- Composite indexes for common queries (by_user_definition, by_category_zip)
- Normalized intervention_zones table (O(log n) vs O(n) scans)

**Query Patterns:**
- Limit queries (take(10), take(200))
- Index-based queries (no table scans)
- Batch operations (resource cache cleanup)

### 3.3 Cost Optimizations

**Model Selection:**
- Gemini 2.5 Flash Lite (cheaper than GPT-4o)
- Single model across all agents (consistency)

**Token Usage:**
- Reduced context on first turn
- Background enrichment (non-blocking)
- Max output tokens: 300 (main), 200 (crisis), 400 (assessment)

**Caching:**
- Resource cache with TTL (reduces Maps API calls)
- Stale-while-revalidate (serves stale data while refreshing)

---

## 4. Gaps Between Code and Documentation

### 4.1 Missing Features (Documented but Not Implemented)

1. **Token Budget Enforcement**
   - Documented: 50K tokens/hour per user, 500K TPM global
   - Code: Not implemented (no token tracking)

2. **SMS Rate Limiting**
   - Documented: 10 SMS/day per user
   - Code: Only 20 requests/minute (no daily limit)

3. **Proactive Check-ins**
   - Documented: Daily/weekly scheduled check-ins
   - Code: No cron job or scheduling logic

4. **Engagement Monitoring**
   - Documented: 3 warning signs (sudden drop, crisis burst, decline trend)
   - Code: No monitoring logic

5. **Stripe Event Processing**
   - Documented: Subscription management
   - Code: Event recording only (TODO: implement processing)

6. **Emergency Contact Notification**
   - Documented: Notify emergency contact for high-severity crises
   - Code: Returns `sent: false` (not implemented)

7. **Assessment Question Flow**
   - Documented: Agent asks questions automatically
   - Code: Assessment agent interprets results, doesn't ask questions

8. **Interventions Seeding**
   - Documented: 16+ pre-seeded interventions
   - Code: No seed script found

### 4.2 Implementation Differences

1. **Crisis Keywords**
   - Documented: 15+ keywords
   - Code: 13 keywords

2. **Memory Embeddings**
   - Documented: Embeddings stored in memories table
   - Code: NO embeddings stored (Agent Component handles semantic search)

3. **Model Selection**
   - Documented: GPT-4o nano/mini
   - Code: Gemini 2.5 Flash Lite (all agents)

4. **Response Time**
   - Documented: <900ms average
   - Code: 4s timeout (may exceed 900ms)

5. **Resource Search**
   - Documented: Google Maps Grounding + Gemini 2.0 Flash
   - Code: Maps Grounding API (no Gemini 2.0 Flash mentioned)

---

## 5. Code Quality & Patterns

### 5.1 Architecture Patterns

**Agent Component:**
- Thread/message management handled automatically
- Context injection via `contextOptions`
- Semantic search via built-in vector search

**Workflow Component:**
- Durable workflows for multi-step processes
- Retry-safe operations
- Background processing

**Component-Based:**
- Twilio component (automatic message tracking)
- Rate Limiter component (token bucket)
- Agent Component (thread management)

### 5.2 Error Handling

**Idempotency:**
- Message deduplication (inbound_receipts)
- Stripe event deduplication (billing_events)

**Fallbacks:**
- Timeout fallback responses (main agent)
- Stub resource results (Maps API fallback)
- Error fallback responses (all agents)

**Graceful Degradation:**
- Stale cache served while refreshing
- Stub results if Maps API unavailable
- Fallback responses on errors

### 5.3 Performance Patterns

**Non-Blocking Operations:**
- Background memory enrichment
- Async analytics logging
- Background resource refresh

**Race Patterns:**
- Maps API vs stub fallback (1.5s timeout)
- Return first to complete

**Caching:**
- TTL-based cache (resource_cache)
- Stale-while-revalidate pattern
- Category-based TTLs

---

## 6. Actual Performance Characteristics

### 6.1 Response Times (From Code)

**Main Agent:**
- Fast path: <100ms (short input, profile complete)
- Normal path: Up to 4s (with timeout fallback)
- Timeout fallback: <100ms

**Crisis Agent:**
- Target: <600ms (no tools, no context search)
- Actual: Likely <1s (minimal processing)

**Resource Search:**
- Cache hit: <100ms
- Stale cache: <100ms (with background refresh)
- No cache: <500ms (race winner: Maps API or stub)

### 6.2 Throughput (From Code)

**Rate Limits:**
- 20 requests/minute per phone (fixed window)
- No global rate limit implemented

**Concurrency:**
- Convex auto-scaling (serverless)
- No explicit concurrency limits

### 6.3 Cost (From Code)

**Model Costs:**
- Gemini 2.5 Flash Lite: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
- OpenAI embeddings: ~$0.02 per 1M tokens

**Optimizations:**
- Reduced context on first turn
- Background enrichment (non-blocking)
- Caching (reduces API calls)

---

## 7. Summary: What's Actually Built

### ✅ Fully Implemented

1. **SMS Processing** - Inbound/outbound via Twilio component
2. **3-Agent System** - Main, Crisis, Assessment agents
3. **Crisis Detection** - Keyword matching, workflow follow-up
4. **Assessments** - 4 assessments with scoring logic
5. **Memory System** - Record/list memories (semantic search via Agent Component)
6. **Resource Search** - Google Maps Grounding with cache + stub fallback
7. **Profile Management** - Progressive onboarding
8. **Rate Limiting** - 20 requests/minute per phone
9. **Stripe Webhooks** - Event recording (idempotent)
10. **Resource Cache Cleanup** - Cron job every 6 hours

### ⚠️ Partially Implemented

1. **Billing** - Webhook recording only (no event processing)
2. **Crisis Follow-up** - Workflow exists but emergency contact not implemented
3. **Interventions** - Schema exists but may not be seeded

### ❌ Not Implemented (Documented)

1. **Token Budget Enforcement** - No token tracking/limits
2. **SMS Daily Limits** - No daily limit enforcement
3. **Proactive Check-ins** - No scheduling logic
4. **Engagement Monitoring** - No monitoring logic
5. **Assessment Question Flow** - Agent doesn't ask questions automatically
6. **Emergency Contact Notification** - Returns false (not implemented)

---

## 8. Key Insights for Performance-First Rebuild

### 8.1 What Works Well

1. **Agent Component** - Automatic thread/message management, semantic search
2. **Fast Path** - Short input optimization (skips LLM)
3. **Stale-While-Revalidate** - Resource cache pattern
4. **Race Patterns** - Maps API vs stub fallback
5. **Background Processing** - Non-blocking enrichment, analytics

### 8.2 What Needs Improvement

1. **Response Time** - 4s timeout may exceed <900ms target
2. **Token Budget** - No enforcement (cost control missing)
3. **Rate Limiting** - Only per-minute, no daily limits
4. **Proactive Features** - No scheduling/monitoring
5. **Billing** - Incomplete implementation

### 8.3 Architecture Decisions

1. **Model Selection** - Gemini 2.5 Flash Lite (cheaper, faster than GPT-4o)
2. **Memory Storage** - No embeddings (Agent Component handles semantic search)
3. **Caching Strategy** - TTL-based with stale-while-revalidate
4. **Error Handling** - Fallbacks at every layer

---

**Next Steps:** Compare this code-based analysis with `ESSENTIAL_REQUIREMENTS.md` (documentation-based) to identify discrepancies and prioritize features for performance-first rebuild.

