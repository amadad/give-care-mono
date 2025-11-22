# GiveCare Architecture Reference
# give-care-app/convex

**Purpose:** Concise technical map for AI agents and developers
**Last Updated:** 2025-11-22 (v1.7.1 - structure/tools/schema/priorities refresh)

---

## System Overview

- **What:** AI-powered SMS caregiving support platform
- **How:** Convex backend + OpenAI Agents + Twilio SMS
- **Architecture:** Two agents (Main, Assessment) with deterministic crisis routing in `inbound.ts` (no LLM for crisis triage)
- **Communication:** SMS-first (≤160 chars), P1-P6 trauma-informed principles embedded in prompts
- **Data:** Profiles, assessments, scores, interventions, memories, telemetry
- **Current State:** Convex tree spans top-level entrypoints + `internal/` domain modules; 27 tables defined in `schema.ts`; prompts carry P1-P6

---

## Folder Structure (Convex)

```
convex/
├── agents.ts          # Main + Assessment agents, shared usage handler
├── tools.ts           # 8 agent tools (resources, assessments, zones, memory, profile)
├── inbound.ts         # SMS ingress, keyword router, crisis handling, scheduler dispatch
├── http.ts            # Webhooks (Twilio SMS, Stripe)
├── assessments.ts     # Assessment sessions (EMA/SDOH), question flow
├── interventions.ts   # Intervention queries/actions
├── resources.ts       # Resource search + cache orchestration
├── score.ts           # Zone score updates and helpers
├── auth.ts            # Auth helpers (Convex auth tables)
├── feedback.ts        # Feedback mutations/queries
├── stripe.ts          # Stripe checkout + webhooks wrappers
├── twilioMutations.ts # SMS send wrappers used by scheduler paths
├── workflows.ts       # Workflow entrypoints
├── crons.ts           # Cron entrypoints
├── internal/          # Domain internals (agents, assessments, score, sms, users,
│                      # resources, learning, subscriptions, stripe, twilioMutations, workflows, etc.)
├── lib/               # prompts, models, validators, utils, scoring, maps, types
├── scripts/seedInterventions.ts # Seed data for interventions
├── schema.ts          # 27 Convex tables
├── test.setup.ts      # Test configuration
├── convex.config.ts, tsconfig.json
└── _generated/        # Convex codegen artifacts
```

---

## Agents & Tools

**Agents**
- `mainAgent` (agents.ts): General support, resources, assessments, memory; maxSteps=5; usage tracked via `internal.internal.agentRuns.track`.
- `assessmentAgent` (agents.ts): Scoring + recommendations; maxSteps=2; usage tracked as above.
- Crisis routing: deterministic keyword path in `inbound.ts` → crisis follow-up workflows; no separate LLM agent.

**Tools (tools.ts)**

| Tool | Purpose | Backend route |
| --- | --- | --- |
| `getResources` | Resource search with ZIP extraction + score-aware targeting | `internal.resources.searchResources` (action) |
| `startAssessment` | Start EMA or SDOH assessment | `internal.internal.assessments.startAssessment` (mutation) |
| `recordObservation` | Map observed symptom → zone score | `internal.internal.score.updateZone` (mutation) |
| `recordMemory` | Persist caregiver context (5 categories) | `internal.internal.memories.recordMemory` (mutation) |
| `trackInterventionHelpfulness` | Yes/No helpfulness logging | `internal.internal.learning.trackHelpfulnessMutation` (mutation) |
| `findInterventions` | Fetch micro-interventions by zones | `internal.interventions.findInterventions` (query) |
| `checkAssessmentStatus` | Latest EMA/SDOH + burnout snapshot | `internal.internal.users.getUser`, `internal.internal.assessments.getLatestCompletedAssessment` |
| `updateProfile` | Update profile fields (name/relationship/zip/timezone/checkInFrequency) | `internal.internal.users.updateProfile` (mutation) |

---

## Database Schema (27 tables)

Profiles & Scheduling: `users` (metadata, gcSdohScore, zones, zip), `triggers` (rrule scheduling), `alerts` (crisis alerts), `inbound_receipts` (Twilio idempotency), `billing_events` (Stripe idempotency), `entitlements`.

Assessments & Scores: `assessment_sessions`, `assessments`, `scores`, `score_history`, `scores_composite`, `session_metrics` (conversation stats).

Interventions & Learning: `interventions`, `intervention_zones`, `intervention_events` (deprecated), `events` (generic event log with typed payloads), `memories`, `resource_cache`.

Agents & Telemetry: `agent_runs`, `guardrail_events`, `tool_calls`, `llm_usage`, `usage_invoices`, `watcher_state`, `prompt_versions`.

Subscriptions & Feedback: `subscriptions`, `conversation_feedback`, `crisis_feedback`.

---

## Known Issues & Near-Term Roadmap

1) **Type safety gaps**: `metadata` now typed (`UserMetadata`) and `events.payload` uses a discriminated union, but remaining `any` casts should be removed over time and types regenerated via Convex codegen.
2) **Latency**: `inbound.ts` still uses `scheduler.runAfter(0, …)` for agent processing/SMS; hops were reduced inside `internal/agents` (action → action), but inbound entrypoint remains a mutation for Twilio. Consider a dedicated action path or further hop reduction while keeping idempotency/rate limits.
3) **SMS failure visibility**: Missing-phone sends now log to `events` (`sms.missing_phone`), but continue instrumenting other failure modes if observed.
4) **Cleanup**: `intervention_events` table is marked deprecated; plan removal + migration once `events` is fully adopted.

---

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `CONVEX_DEPLOYMENT` | Convex backend URL |
| `OPENAI_API_KEY` | LLM access |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS sending + verification |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Billing operations |
| `GOOGLE_MAPS_API_KEY` | Resource grounding |

---

## Development Commands

```bash
npx convex dev            # Run Convex backend, generate types
npm test                  # Run tests (Vitest)
npx convex deploy         # Deploy (typecheck enabled via convex/tsconfig.json)
```
