# GiveCare Architecture Reference
# give-care-app/convex

**Purpose:** Concise technical map for AI agents and developers
**Last Updated:** 2025-01-11 (v1.7.0 - Post-consolidation)

---

## System Overview

**What:** AI-powered SMS caregiving support platform
**How:** Convex backend + OpenAI Agents + Twilio SMS
**Why:** Reduce caregiver burnout through trauma-informed AI support
**For:** Family caregivers of elderly/disabled loved ones

**Architecture:** 3-agent system (Main, Crisis, Assessment) on Convex-native stack
**Communication:** SMS-first (160 char), trauma-informed (P1-P6 principles)
**Data:** User profiles, wellness scores, conversations, resources, interventions

**Current State:** Compat `domains/` shims restored (wellness, interventions, messages) so legacy `api.domains.*` references resolve during cleanup.

---

## Folder Structure

```
convex/
├── agents.ts        # All 3 agents consolidated (Main, Crisis, Assessment)
├── workflows.ts     # All workflows consolidated (check-ins, trends, engagement, etc.)
├── tools.ts         # All agent tools consolidated (8 tools)
├── assessments.ts   # Assessment Q&A and scoring
├── crons.ts         # Scheduled jobs
├── http.ts          # Webhook router (Twilio, Stripe)
├── inbound.ts       # SMS message processing
├── inboundHelpers.ts # Batched queries for inbound processing
├── internal.ts      # Internal API functions
├── interventions.ts # Intervention queries and mutations
├── public.ts        # Public API surface
├── resources.ts     # Resource search + cache
├── schema.ts        # Database schema (36 tables)
├── wellness.ts      # Wellness status queries
├── setup.test.ts    # Test setup
├── test.setup.ts    # Test configuration
└── lib/
    ├── assessmentCatalog.ts  # Assessment definitions (EMA, BSFC, REACH2, SDOH)
    ├── billing.ts            # Stripe billing utilities
    ├── maps.ts               # Google Maps integration
    ├── models.ts             # LLM model configuration
    ├── prompts.ts            # Agent system prompts (P1-P6)
    ├── twilio.ts             # Twilio configuration
    ├── types.ts              # TypeScript types
    ├── utils.ts              # Consolidated utilities (helpers, constants, errors)
    └── validators.ts          # Convex validators
```

**Note:** Consolidated from 58 files to 24 files (58% reduction). All agents, workflows, tools, and utilities merged into single files for simplicity.

---

## File Breakdown

### Core Files

| File | LOC | Purpose | Key Exports |
|------|-----|---------|-------------|
| `agents.ts` | ~600 | All 3 agents consolidated | `mainAgent`, `crisisAgent`, `assessmentAgent`, `runMainAgent`, `runCrisisAgent`, `runAssessmentAgent` |
| `workflows.ts` | ~900 | All workflows consolidated | `dispatchDue`, `detectScoreTrends`, `monitorEngagement`, `suggestInterventions`, `crisisEscalation`, `enrichMemory`, `updateCheckInSchedule`, `refresh` |
| `tools.ts` | ~400 | All 8 agent tools consolidated | `searchResources`, `startAssessment`, `checkWellnessStatus`, `findInterventions`, `getInterventions`, `recordMemory`, `updateProfile`, `trackInterventionPreference` |
| `assessments.ts` | ~340 | Assessment Q&A and scoring | `startAssessment`, `handleInboundAnswer`, `finalizeAssessment` |
| `internal.ts` | ~350 | Internal API functions | `logAgentRunInternal`, `getUserById`, `getAllUsers`, `getAssessmentById`, `getActiveSessionInternal`, `startAssessmentInternal` |
| `public.ts` | ~140 | Public API surface | `recordMemory`, `listMemories` |
| `resources.ts` | ~395 | Resource search + cache | `searchResources` |
| `http.ts` | ~180 | Webhook handlers | Twilio, Stripe webhooks |
| `schema.ts` | ~330 | Database schema | 36 tables |

### Library Files (`lib/`)

| File | Purpose | Exports |
|------|---------|---------|
| `utils.ts` | Consolidated utilities | `ensureAgentThread`, `toAssessmentAnswers`, `mapToInterventionZones`, `extractProfileVariables`, `buildWellnessInfo`, `getNextMissingField`, `detectCrisis`, `crisisResponse`, `getTone`, `getByExternalId`, `ensureUser`, `logAgentRun`, constants, error classes |
| `assessmentCatalog.ts` | Assessment definitions | `CATALOG`, question sets, scoring logic |
| `prompts.ts` | Agent system prompts | `MAIN_PROMPT`, `CRISIS_PROMPT`, `ASSESSMENT_PROMPT`, `renderPrompt()` |
| `models.ts` | LLM model configuration | `LANGUAGE_MODELS`, `EMBEDDING_MODELS` |
| `types.ts` | TypeScript types | `UserProfile`, `AgentMetadata`, `AgentContext`, etc. |
| `validators.ts` | Convex validators | `agentContextValidator`, `channelValidator`, `userProfileValidator`, etc. |
| `billing.ts` | Stripe billing utilities | Billing helpers |
| `maps.ts` | Google Maps integration | `searchWithMapsGrounding` |
| `twilio.ts` | Twilio configuration | Twilio client setup |

---

## Core Features

### 1. Conversation Management

**What:** Thread-based SMS conversations with AI agents
**How:** Convex Agent Component + OpenAI + Twilio webhooks
**Why:** Maintain context across multi-turn conversations
**For:** All users

**Files:**
- `http.ts` - Twilio webhook handler
- `agents.ts` - Agent implementations
- `core.ts` - Context hydration/persistence

**Flow:**
```
SMS → Twilio → http.ts → core.hydrate() → agents.runMainAgent() → Twilio SMS
```

**Status:** ✅ HTTP webhook + `internal/inbound` handle SMS ingress/egress

### 2. Wellness Assessments

**What:** 4 validated assessments (EMA, BSFC, REACH-II, SDOH)
**How:** Question-by-question via SMS, scored by pressure zone
**Why:** Track burnout, identify intervention needs
**For:** Users tracking wellness over time

**Files:**
- `lib/assessmentCatalog.ts` - Definitions (57 questions)
- `lib/assessments.ts` - Scoring logic
- `agents.ts` - Assessment agent + interpretation tools
- `schema.ts` - `assessment_sessions`, `assessments`, `scores`

**Pressure Zones:** Emotional, Physical, Social, Time, Financial

**Status:** ✅ Assessment tools run via restored `api.domains.*` queries

### 3. Crisis Detection & Response

**What:** Detect crisis keywords, provide immediate resources
**How:** Pattern matching + crisis agent with structured protocol
**Why:** Safety-critical - prevent harm
**For:** Users expressing suicidal thoughts, self-harm, despair

**Files:**
- `lib/policy.ts` - Crisis term detection (19 keywords)
- `agents.ts` - Crisis agent implementation
- `workflows.ts` - Durable escalation workflow

**Resources:** 988 Suicide & Crisis Lifeline, 741741 Crisis Text Line, 911

**Flow:**
```
Detect crisis terms → workflows.crisisEscalation → agents.runCrisisAgent → 988/741741/911
```

**Status:** ✅ Core logic intact

### 4. Local Resource Discovery

**What:** Find nearby caregiving services (respite, support groups, adult day care)
**How:** Google Maps Grounding API + Gemini 2.0 Flash semantic search
**Why:** Connect caregivers to real-world support
**For:** Users needing local services

**Files:**
- `actions/maps.actions.ts` - Google Maps integration + cache writer
- `resources.ts` - `api.resources.searchResources` compat action
- `agents.ts` - `searchResources` tool (Main agent)
- `schema.ts` - `resource_cache` table (category+zip index)

**Categories:** respite, support, daycare, homecare, medical, community, meals, transport, hospice, memory

**Status:** ✅ Cache restored (TTL via `resource_cache`, hourly cleanup cron)

### 5. Working Memory System

**What:** Save user context over time (care routines, preferences, triggers)
**How:** `recordMemory` tool stores categorized memories with importance scores
**Why:** Build personalized context, reduce repeated questions (P2)
**For:** All users - proactive context building

**Files:**
- `public.ts` - `recordMemory` mutation
- `agents.ts` - `recordMemoryTool`
- `schema.ts` - `memories` table (with embeddings)

**Categories:** care_routine, preference, intervention_result, crisis_trigger, family_health

**Status:** ✅ Public + agent tooling wired via `api.public.recordMemory/listMemories`

### 6. Evidence-Based Interventions

**What:** 20+ micro-commitments matched to pressure zones
**How:** Query interventions by zone, filter by evidence level
**Why:** Personalize support strategies
**For:** Users with high burnout scores

**Files:**
- `schema.ts` - `interventions` table
- `agents.ts` - `findInterventionsTool`

**Evidence Levels:** high, moderate, low

**Status:** ✅ `api.domains.interventions.getByZones` back online

### 7. Usage Tracking & Rate Limiting

**What:** Monitor LLM costs, prevent abuse
**How:** Track all token usage, enforce SMS/token limits
**Why:** Cost control, abuse prevention
**For:** System operators

**Files:**
- `lib/usage.ts` - Config
- `lib/rateLimiting.ts` - Rate limit helpers
- `schema.ts` - `llm_usage`, `usage_invoices` tables

**Limits:** 10 SMS/day per user, 50K tokens/hour per user, 500K TPM global

**Status:** ✅ Library functions intact

### 8. Subscription Billing

**What:** Stripe subscription management (free tier + premium)
**How:** Checkout sessions, webhook handling, entitlement checks
**Why:** Monetize premium features
**For:** Premium users

**Files:**
- `actions/stripe.actions.ts` - Stripe integration
- `http.ts` - Stripe webhook handler
- `schema.ts` - `subscriptions` table

**Plans:** free (basic), premium (unlimited assessments, priority support)

**Status:** ✅ Webhook routes to `api.billing.applyStripeEvent`

---

## Agent Tools Reference

### Main Agent Tools (6)

| Tool | Purpose | Status |
|------|---------|--------|
| `searchResources` | Find local caregiving services | ✅ Uses `api.resources.searchResources` |
| `recordMemory` | Save important user context | ✅ Working |
| `checkWellnessStatus` | Fetch burnout trends | ✅ `api.domains.wellness.getStatus` |
| `findInterventions` | Get support strategies | ✅ `api.domains.interventions.getByZones` |
| `updateProfile` | Update user info | ❓ Needs verification |
| `startAssessment` | Begin wellness check-in | ✅ `api.public.startAssessment` |

### Assessment Agent Tools (1)

| Tool | Purpose | Status |
|------|---------|--------|
| `getInterventions` | Fetch interventions by zones | ✅ `api.domains.interventions.getByZones` |

### Guardrails Tool (1)

| Tool | Purpose | Status |
|------|---------|--------|
| `guardrails` | Check trauma-informed compliance | ✅ Logs to `api.internal.core.*` |

---

## Database Schema (36 Tables)

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | externalId, phone, email, name, channel, locale, consent |
| `sessions` | Conversation sessions | userId, channel, locale, policyBundle, budget |
| `messages` | Conversation history | userId, channel, direction, text, traceId |
| `memories` | Working memory system | userId, category, content, importance, embedding |

### Assessment Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `assessment_sessions` | Active assessments | userId, definitionId, questionIndex, answers, status |
| `assessments` | Completed assessments | userId, definitionId, version, answers |
| `scores` | Burnout scores | userId, assessmentId, composite, band, confidence |

### Support Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `interventions` | Support strategies | title, category, targetZones, evidenceLevel |
| `intervention_events` | Intervention history | userId, interventionId, status |
| `alerts` | Crisis events | userId, type, severity, context, status |
| `resource_cache` | TTL resource search results | category, zip, results, expiresAt |

### System Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `llm_usage` | Token tracking | userId, model, provider, usage, billingPeriod |
| `usage_invoices` | Aggregated billing | userId, billingPeriod, totalTokens, totalCost, status |
| `subscriptions` | Stripe billing | userId, stripeCustomerId, planId, status |
| `entitlements` | Feature access | userId, feature, active, expiresAt |
| `tool_calls` | Agent tool telemetry | userId, agent, name, durationMs, success, cost |
| `agent_runs` | Agent execution logs | userId, agent, policyBundle, budgetResult, latencyMs |
| `guardrail_events` | Compliance tracking | userId, ruleId, action, context |
| `triggers` | Scheduled tasks | userId, rrule, timezone, nextRun, status |
| `policies` | Policy bundles | name, version, bundle |
| `settings` | System config | key, value |
| `watcher_state` | Engagement monitoring | watcherName, cursor, lastRun |
| `metrics_*` | Aggregated stats | Various daily/subscription/journey metrics |

---

## Key Patterns

### 1. Context Injection Pattern

**What:** Inject conversation summary into agent prompts
**How:** Agent Component manages thread context
**Why:** Reduce token usage (60-80% savings)

**Status:** ✅ Agent Component handles this

### 2. Tool-Based Architecture

**What:** Agents use structured tools instead of free-form generation
**How:** `createTool()` with Zod schemas
**Why:** Reliable, type-safe, testable

```typescript
// agents.ts
const recordMemoryTool = createTool({
  args: z.object({ content: z.string(), category: z.enum([...]) }),
  handler: async (ctx, args) => { /* mutation */ }
});
```

### 3. Trauma-Informed Principles (P1-P6)

**What:** Non-negotiable communication guidelines
**How:** Embedded in all agent prompts (`lib/prompts.ts`)
**Why:** Respect boundaries, prevent harm

- **P1:** Acknowledge feelings before answering
- **P2:** Never repeat the same question within a session
- **P3:** Offer skip after two attempts
- **P4:** Use soft confirmations ("Got it: Sarah, right?")
- **P5:** Give a skip option on every ask
- **P6:** Deliver value every turn (validation, resource, tip, or progress)

### 4. Rate Limiting Pattern

**What:** Enforce SMS and token limits
**How:** Rate limiter component with reserve/consume API
**Why:** Cost control, abuse prevention

**Status:** ✅ Library functions exist

### 5. Durable Workflows

**What:** Retry-safe multi-step processes
**How:** Workflow component with step functions
**Why:** Reliability for critical operations (crisis)

```typescript
// workflows.ts
workflow.define({
  handler: async (step, args) => {
    await step.runMutation(logCrisisEvent);
    await step.runAction(generateCrisisResponse);
    await step.runMutation(notifyEmergencyContact);
  }
});
```

**Status:** ✅ Workflow logic intact

---

## Integration Points

### Inbound

| Source | Endpoint | Status |
|--------|----------|--------|
| Twilio SMS | `POST /twilio/incoming-message` | ✅ `api.domains.messages` + `internal.inbound.processInboundMessage` |
| Stripe Webhooks | `POST /stripe/webhook` | ✅ `api.billing.applyStripeEvent` compat mutation |
| Web Client | Convex queries/mutations | ✅ Public API intact |

### Outbound

| Destination | Purpose | File | Status |
|-------------|---------|------|--------|
| Twilio API | Send SMS responses | `http.ts` / `internal/inbound.ts` | ✅ Uses `internal.inbound.sendSmsResponse` |
| OpenAI API | LLM generation | `agents.ts` | ✅ Working |
| Google Maps API | Resource grounding | `actions/maps.actions.ts` | ✅ Uses `resource_cache` helpers |
| Stripe API | Billing operations | `actions/stripe.actions.ts` | ✅ Working |

---

## Known Issues (v1.5.0)

### Critical
1. **Convex Typecheck Disabled** - `convex/tsconfig.json` was removed; `npx convex codegen --typecheck enable` currently fails. Reintroduce a tsconfig to re-enable type safety.

### High Priority
1. **Resource Lookup Data** - `api.resources.searchResources` still returns stubbed results; wire the real Google Maps/Gemini lookup before GA.

### Medium Priority
1. **Assessment Responses** - `recordAssessmentResponse` mutation still missing. Add it when wiring EMA/BSFC answer ingestion back to public API.

### Low Priority
1. **Twilio SDK Callback** - `twilioClient.ts` incoming callback remains TODO (HTTP webhook handles ingress for now).
2. **Missing Types** - Some helper types still live only in `lib/types.ts`; re-export as needed.

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

# Deployment
npx convex deploy --typecheck=disable   # Deploy to production (typecheck disabled until tsconfig restored)
npx convex deploy                       # Re-enable once Convex typecheck passes

# Typecheck
npm run typecheck                       # Depends on reinstating convex/tsconfig.json
```

---

## Migration Path (v1.5.0 → v1.6.0)

To restore full functionality:

1. ✅ **Fix Agent Tools** - `agents.ts` + `agents/guardrails.tool.ts` now call restored APIs
2. ✅ **Add Missing Public Functions** - `public.ts` exports `listMemories`, assessment helpers, and scheduler mutations
3. ✅ **Implement SMS Handler** - `http.ts` + `internal/inbound.ts` process inbound SMS and send replies
4. ✅ **Fix Resource Cache** - `maps.actions.ts` and `resources.ts` share the `resource_cache` table
5. ✅ **Fix Billing Webhook** - `api.billing.applyStripeEvent` handles Stripe payloads
6. ✅ **Restore Crons** - Hourly resource-cache cleanup added to `crons.ts`
7. ⏳ **Enable Typecheck** - Recreate `convex/tsconfig.json` and run full typecheck

---

**Last Updated:** v1.5.0 (2025-11-09)
**Total LOC:** ~3,000 (Convex backend)
**Test Coverage:** Unknown (tests may need updates)
**Production Status:** ⚠️ Deploy requires `--typecheck=disable` until Convex tsconfig is restored
