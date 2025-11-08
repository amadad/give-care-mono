# GiveCare Architecture Reference

**Purpose:** Concise technical map for AI agents and developers
**Last Updated:** 2025-01-08 (v1.4.0)

---

## System Overview

**What:** AI-powered SMS caregiving support platform
**How:** Convex backend + OpenAI Agents + Twilio SMS
**Why:** Reduce caregiver burnout through trauma-informed AI support
**For:** Family caregivers of elderly/disabled loved ones

**Architecture:** 3-agent system (Main, Crisis, Assessment) on Convex-native stack
**Communication:** SMS-first (160 char), trauma-informed (P1-P6 principles)
**Data:** User profiles, wellness scores, conversations, resources, interventions

---

## Folder Structure

```
convex/
├── agents/           # AI agent implementations (3 agents)
├── functions/        # Public API (queries, mutations, actions)
├── lib/             # Business logic utilities
├── model/           # Data access layer
├── workflows/       # Durable workflows (crisis escalation)
├── schema.ts        # Database schema (24 tables)
├── http.ts          # Webhook router (Twilio, Stripe)
└── crons.ts         # Scheduled jobs (metrics, triggers)
```

### `convex/agents/` - AI Agent Implementations

| File | What | How | Why | For |
|------|------|-----|-----|-----|
| `main.ts` | Primary caregiver support agent | 6 tools, conversation context, profile management | Handle 90% of interactions | All users |
| `crisis.ts` | Crisis intervention agent | Detect crisis terms, provide 988/741741/911 resources | Safety-critical responses | Users in crisis |
| `assessment.ts` | Assessment results interpreter | Analyze scores, recommend interventions | Personalize support strategies | Users completing assessments |

### `convex/functions/` - Public API Layer

| File | What | Why | Key Functions |
|------|------|-----|---------------|
| `context.ts` | User session hydration/persistence | Maintain conversation state | `hydrate`, `persist`, `recordMemory`, `getConversationSummary` |
| `assessments.ts` | Assessment definitions & scoring | Track caregiver wellness | `recordAnswer`, `getSession`, `completeSession` |
| `interventions.ts` | Evidence-based support strategies | Match interventions to pressure zones | `getByZones`, `getByCategory` |
| `resources.ts` | Local resource search (Google Maps) | Connect caregivers to local services | `searchResources`, `getRecommendations` |
| `wellness.ts` | Burnout tracking & trends | Monitor caregiver health over time | `getStatus`, `getLatestScore`, `trend` |
| `users.ts` | User profile management | Store caregiver info | `getByExternalId` |
| `messages.ts` | Conversation history | Thread-based message storage | `getForThread`, `getRecent` |
| `alerts.ts` | Crisis event logging | Track high-risk situations | `create`, `getRecent`, `resolve` |
| `admin.ts` | Admin dashboard queries | System monitoring | `getMetrics`, `getAllUsers`, `getSystemHealth` |
| `billing.ts` | Stripe subscription management | Premium features | `createCheckout`, `handleWebhook`, `cancelSubscription` |

### `convex/lib/` - Business Logic Utilities

| File | What | Why | Exports |
|------|------|-----|---------|
| `prompts.ts` | Agent system prompts (P1-P6 principles) | Trauma-informed communication | `MAIN_PROMPT`, `CRISIS_PROMPT`, `ASSESSMENT_PROMPT`, `renderPrompt()` |
| `profile.ts` | Profile completeness helpers | DRY code across agents | `getProfileCompleteness()`, `buildWellnessInfo()`, `extractProfileVariables()` |
| `usage.ts` | LLM token tracking & cost estimation | Monitor API spend | `sharedAgentConfig`, `insertLLMUsage` |
| `rateLimiting.ts` | SMS & token rate limits | Prevent abuse, control costs | `checkMessageRateLimit()`, `consumeTokenUsage()`, `estimateTokens()` |
| `files.ts` | MMS file storage & vision processing | Handle images in SMS | `storeMMSFile()`, `buildMessageWithFiles()` |
| `policy.ts` | Trauma-informed response policies | Consistent tone across agents | `getTone()`, `shouldEscalateToCrisis()` |
| `summarization.ts` | Conversation compression (60-80% savings) | Reduce context window costs | `summarizeConversation()`, `formatForContext()` |
| `maps.ts` | Google Maps grounding (Gemini 2.0) | Geocode resources, semantic search | `searchWithMaps()`, `extractLocations()` |
| `types.ts` | Shared TypeScript types | Type safety | `Channel`, `ConversationContext`, `AgentContext` |

### `convex/model/` - Data Access Layer

| File | What | Why | Exports |
|------|------|-----|---------|
| `users.ts` | User CRUD operations | Abstract database queries | `getByExternalId()`, `ensureUser()`, `ensureSession()` |
| `context.ts` | Session context management | Hydrate/persist conversation state | `hydrate()`, `persist()` |

### `convex/workflows/` - Durable Workflows

| File | What | Why | Steps |
|------|------|-----|-------|
| `crisis.ts` | Crisis escalation workflow | Reliable crisis handling with retries | Log event → Generate response → Notify emergency → Schedule follow-up |
| `crisisSteps.ts` | Individual workflow step functions | Idempotent, retry-safe operations | 7 step functions (logCrisisEvent, generateCrisisResponse, etc.) |

---

## Core Features

### 1. Conversation Management

**What:** Thread-based SMS conversations with AI agents
**How:** Convex Agent Component + OpenAI + Twilio webhooks
**Why:** Maintain context across multi-turn conversations
**For:** All users

**Files:**
- `convex/http.ts` - Twilio webhook handler (`handleInboundSMS`)
- `convex/agents/main.ts` - Main conversation agent
- `convex/functions/messages.ts` - Message persistence

**Flow:**
```
SMS → Twilio → http.ts:handleInboundSMS → context.hydrate → agent.generateText → SMS response
```

### 2. Wellness Assessments

**What:** 4 validated assessments (EMA, BSFC, REACH-II, SDOH) - 57 questions total
**How:** Question-by-question via SMS, scored by pressure zone
**Why:** Track burnout, identify intervention needs
**For:** Users tracking wellness over time

**Files:**
- `convex/functions/assessments.ts` - Definitions, scoring (lines 5-178)
- `convex/agents/assessment.ts` - Results interpretation
- `convex/schema.ts` - `assessment_sessions`, `assessment_answers`, `scores`

**Pressure Zones:** Emotional, Physical, Social, Time, Financial

**Flow:**
```
User → "start check-in" → recordAnswer (each Q) → completeSession → scorer → assessment agent → interventions
```

### 3. Crisis Detection & Response

**What:** Detect crisis keywords, provide immediate resources
**How:** Pattern matching + crisis agent with structured protocol
**Why:** Safety-critical - prevent harm
**For:** Users expressing suicidal thoughts, self-harm, despair

**Files:**
- `convex/lib/policy.ts` - Crisis term detection (`shouldEscalateToCrisis`)
- `convex/agents/crisis.ts` - Structured crisis response
- `convex/workflows/crisis.ts` - Durable escalation workflow
- `convex/functions/alerts.ts` - Crisis event logging

**Resources:** 988 Suicide & Crisis Lifeline, 741741 Crisis Text Line, 911

**Flow:**
```
Detect crisis terms → workflows/crisis.crisisEscalation → crisis agent → 988/741741/911 → emergency contact notification → 24h follow-up
```

### 4. Local Resource Discovery

**What:** Find nearby caregiving services (respite, support groups, adult day care)
**How:** Google Maps Grounding API + Gemini 2.0 Flash semantic search
**Why:** Connect caregivers to real-world support
**For:** Users needing local services

**Files:**
- `convex/lib/maps.ts` - Google Maps integration
- `convex/functions/resources.ts` - Search actions
- `convex/agents/main.ts` - `searchResourcesTool` (lines 49-80)

**Categories:** respite, support, daycare, homecare, medical, community, meals, transport, hospice, memory

**Flow:**
```
User query → searchResourcesTool → maps.searchWithMaps(query + zip) → results with citations + widget tokens
```

### 5. Working Memory System

**What:** Save user context over time (care routines, preferences, triggers)
**How:** `recordMemory` tool stores categorized memories with importance scores
**Why:** Build personalized context, reduce repeated questions (P2)
**For:** All users - proactive context building

**Files:**
- `convex/functions/context.ts` - `recordMemory` mutation (lines 82-106)
- `convex/agents/main.ts` - `recordMemoryTool` (lines 82-110)
- `convex/schema.ts` - `memories` table

**Categories:** care_routine, preference, intervention_result, crisis_trigger

**Flow:**
```
Agent detects valuable info → recordMemory(content, category, importance) → stored in memories table
```

### 6. Evidence-Based Interventions

**What:** 20+ micro-commitments matched to pressure zones
**How:** Query interventions by zone, filter by evidence level
**Why:** Personalize support strategies
**For:** Users with high burnout scores

**Files:**
- `convex/functions/interventions.ts` - `getByZones` query
- `convex/agents/main.ts` - `findInterventionsTool` (lines 131-166)
- `convex/schema.ts` - `interventions` table

**Evidence Levels:** high, moderate, low

**Flow:**
```
User completes assessment → pressure zones identified → getByZones(zones, minEvidence) → 2-5 min activities
```

### 7. Usage Tracking & Rate Limiting

**What:** Monitor LLM costs, prevent abuse
**How:** Track all token usage, enforce SMS/token limits
**Why:** Cost control, abuse prevention
**For:** System operators

**Files:**
- `convex/lib/usage.ts` - Token tracking, cost estimation
- `convex/lib/rateLimiting.ts` - Rate limit helpers
- `convex/schema.ts` - `llm_usage`, `usage_invoices` tables

**Limits:** 5 SMS/5min, 50 SMS/day, 50k tokens/hour per user

**Flow:**
```
Before LLM call → estimateTokens → checkTokenRateLimit → generateText → insertLLMUsage → consumeTokenUsage
```

### 8. Subscription Billing

**What:** Stripe subscription management (free tier + premium)
**How:** Checkout sessions, webhook handling, entitlement checks
**Why:** Monetize premium features
**For:** Premium users

**Files:**
- `convex/functions/billing.ts` - Stripe integration
- `convex/http.ts` - Stripe webhook handler
- `convex/schema.ts` - `subscriptions` table

**Plans:** free (basic), premium (unlimited assessments, priority support)

**Flow:**
```
User → checkout → Stripe → webhook → upsert subscription → entitlement checks
```

---

## Agent Tools Reference

### Main Agent Tools (6)

| Tool | Purpose | Returns | Used When |
|------|---------|---------|-----------|
| `searchResources` | Find local caregiving services | Resources with citations, widget tokens | User asks for local help |
| `recordMemory` | Save important user context | Success confirmation | Agent learns care routine/preference/trigger |
| `check_wellness_status` | Fetch burnout trends | Latest scores, trend data, pressure zones | User asks about progress |
| `find_interventions` | Get support strategies | 2-5 interventions by pressure zone | User needs coping strategies |
| `update_profile` | Update user info | Updated profile object | User provides name/zip/relationship |
| `start_assessment` | Begin wellness check-in | Assessment instructions | User agrees to check-in |

### Assessment Agent Tools (1)

| Tool | Purpose | Returns | Used When |
|------|---------|---------|-----------|
| `getInterventions` | Fetch interventions by zones | Interventions with evidence levels | After scoring completed assessment |

---

## Database Schema (24 Tables)

### Core Tables

| Table | Purpose | Key Fields | Indexes |
|-------|---------|------------|---------|
| `users` | User profiles | externalId, phone, metadata.profile | by_externalId, by_phone |
| `sessions` | Conversation sessions | userId, channel, metadata | by_user_channel |
| `messages` | Conversation history | threadId, role, content, metadata | by_thread |
| `memories` | Working memory system | userId, category, content, importance | by_user_category |

### Assessment Tables

| Table | Purpose | Key Fields | Indexes |
|-------|---------|------------|---------|
| `assessment_sessions` | Active assessments | userId, definitionId, answers | by_user_active |
| `assessment_answers` | Individual answers | sessionId, questionId, answer | by_session |
| `scores` | Burnout scores | userId, composite, band, zones | by_user, by_band |

### Support Tables

| Table | Purpose | Key Fields | Indexes |
|-------|---------|------------|---------|
| `interventions` | Support strategies | title, targetZones, evidenceLevel | by_zone |
| `resources` | Local services | name, category, location, contact | by_category, by_location |
| `alerts` | Crisis events | userId, severity, resolvedAt | by_user, by_unresolved |

### System Tables

| Table | Purpose | Key Fields | Indexes |
|-------|---------|------------|---------|
| `llm_usage` | Token tracking | userId, model, tokens, cost, billingPeriod | by_user_period, by_period |
| `subscriptions` | Stripe billing | userId, stripeId, status, plan | by_user, by_stripe |
| `metrics_daily` | Aggregated stats | date, activeUsers, totalMessages | by_date |

---

## Key Patterns

### 1. Context Injection Pattern

**What:** Inject conversation summary into agent prompts
**How:** `contextHandler` in agent config fetches summary
**Why:** Reduce token usage (60-80% savings)

```typescript
// convex/agents/main.ts:250-270
contextHandler: async (ctx, args) => {
  const summary = await ctx.runQuery(getConversationSummary);
  return [...args.recent, ...conversationContext, ...args.inputMessages];
}
```

### 2. Tool-Based Architecture

**What:** Agents use structured tools instead of free-form generation
**How:** `createTool()` with Zod schemas
**Why:** Reliable, type-safe, testable

```typescript
// convex/agents/main.ts:82-110
const recordMemoryTool = createTool({
  args: z.object({ content: z.string(), category: z.enum([...]) }),
  handler: async (ctx, args) => { /* mutation */ }
});
```

### 3. Trauma-Informed Principles (P1-P6)

**What:** Non-negotiable communication guidelines
**How:** Embedded in all agent prompts
**Why:** Respect boundaries, prevent harm

- **P1:** Acknowledge > Answer > Advance
- **P2:** Never repeat questions
- **P3:** Max 2 attempts per field, offer skip
- **P4:** Soft confirmations ("Got it: Nadia, right?")
- **P5:** Always offer skip option
- **P6:** Deliver value every turn

### 4. Rate Limiting Pattern

**What:** Enforce SMS and token limits
**How:** Rate limiter component with reserve/consume API
**Why:** Cost control, abuse prevention

```typescript
// Usage
await checkMessageRateLimit(ctx, userId, isCrisis);
await consumeMessageRateLimit(ctx, userId, isCrisis);
```

### 5. Durable Workflows

**What:** Retry-safe multi-step processes
**How:** Workflow component with step functions
**Why:** Reliability for critical operations (crisis)

```typescript
// convex/workflows/crisis.ts
workflow.define({
  handler: async (step, args) => {
    await step.runMutation(logCrisisEvent);
    await step.runAction(generateCrisisResponse);
    await step.runMutation(notifyEmergencyContact);
  }
});
```

---

## Integration Points

### Inbound

| Source | Endpoint | Purpose |
|--------|----------|---------|
| Twilio SMS | `POST /twilio/sms` | Receive SMS from users |
| Stripe Webhooks | `POST /stripe/webhook` | Handle subscription events |
| Web Client | Convex queries/mutations | Admin dashboard, web chat |

### Outbound

| Destination | Purpose | File |
|-------------|---------|------|
| Twilio API | Send SMS responses | `convex/http.ts` |
| OpenAI API | LLM generation | `convex/agents/*.ts` |
| Google Maps API | Resource grounding | `convex/lib/maps.ts` |
| Stripe API | Billing operations | `convex/functions/billing.ts` |

---

## Environment Variables

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `CONVEX_DEPLOYMENT` | Convex backend URL | All |
| `OPENAI_API_KEY` | LLM access | Agents |
| `TWILIO_ACCOUNT_SID` | SMS sending | Twilio integration |
| `TWILIO_AUTH_TOKEN` | Webhook verification | Twilio integration |
| `TWILIO_PHONE_NUMBER` | From number | SMS sending |
| `STRIPE_SECRET_KEY` | Billing operations | Subscriptions |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Stripe webhooks |
| `GOOGLE_MAPS_API_KEY` | Resource grounding | Local search |

---

## Development Commands

```bash
# Start backend
npx convex dev                          # Runs Convex backend, generates types

# Testing
npm test                                # Run all tests (Vitest)
npm test -- assessments                 # Run specific test file

# Manual operations
npx convex run functions:assessments:completeSession --userId="user_123"
npx convex run internal:internal/metrics:aggregateDailyMetrics

# Deployment
npx convex deploy                       # Deploy to production
```

---

## Quick Reference

**When user sends SMS:**
1. `http.ts:handleInboundSMS` receives webhook
2. `context.hydrate` loads/creates user session
3. Detect crisis terms → route to crisis agent
4. Otherwise → main agent with conversation context
5. Agent generates response (may call tools)
6. Send SMS via Twilio
7. `context.persist` saves session state

**When user completes assessment:**
1. `assessments.completeSession` triggers scoring
2. Scorer calculates composite + pressure zones
3. Insert into `scores` table
4. Assessment agent interprets results
5. `getInterventions` by pressure zones
6. Return personalized support strategies

**When user in crisis:**
1. Detect crisis terms in message
2. Trigger `workflows/crisis.crisisEscalation`
3. Log to `alerts` table (severity: high)
4. Crisis agent provides 988/741741/911 resources
5. Notify emergency contact if configured
6. Schedule 24h follow-up workflow

---

**Last Updated:** v1.4.0 (2025-01-08)
**Total LOC:** ~3,500 (Convex backend)
**Test Coverage:** 472 tests passing
