# Convex4 Enhancement Plan

## Phase 1 – Foundations (Weeks 1–2)

### 1. Trauma-Informed Conversations & Memory Hooks
- Modularize agents (Main/Crisis/Assessment) using `@convex-dev/agent`.
- Update prompts to enforce P1–P6 and add a `guardrails` tool that always offers “skip,” limits to two attempts, and logs violations.
- Implement explicit `recordMemory` tool usage instructions; auto-call via agent outputs and a post-run hook.
- Hash phone numbers, redact PII in stored messages, and log sensitive data access.

### 2. Semantic Memory Search
- Add embeddings to `memories` (vector field via Convex search indexes or `@convex-dev/rag`).
- Generate embeddings in a Convex action when saving memories.
- Update `contextHandler` to pull the top-N semantically relevant memories instead of the latest five.

### 3. Crisis Detection & Follow-Up
- Expand crisis keyword/severity list; check in the Twilio ingress mutation before invoking agents.
- Send deterministic <600 ms crisis messages, log `crisisEvents`, and schedule workflows for follow-ups (T+24 h, T+72 h) that cancel if the user replies.
- Enforce rate limits on every inbound/outbound via `ctx.rateLimiter.reserve`.

---

## Phase 2 – Clinical Layer (Weeks 3–5)

### 4. EMA (Daily Check-Ins)
- Define the three EMA questions with `(n of 3)` prompts and “reply skip” copy.
- Build a workflow that sends Q1, waits, retries up to two times, then proceeds; record answers via mutations.
- Store preferred check-in times per user; convert to UTC when scheduling via `ctx.scheduler`.

### 5. Assessments (BSFC/REACH-II/SDOH)
- Seed question catalogs, scoring logic, pressure-zone mapping, and opt-in prompts (“10 questions, 5 minutes”).
- Track offers/completions per user (cooldown per assessment type, respect “later”).
- Use workflows for multi-question delivery; compute scores in a mutation and store historical trends.

### 6. Evidence-Based Interventions
- Seed `interventions` with title, duration, evidence level, and zones.
- Add an agent tool to fetch top strategies for dominant zones.
- Log `interventionEvents` and schedule follow-up SMS (e.g., T+48 h) via workflows to ask “How did respite go?”.

---

## Phase 3 – Engagement & Resources (Weeks 6–7)

### 7. Proactive Engagement (Silence Detection)
- Cron job scans `engagementFlags` for 5/7-day silence; send escalating SMS (include crisis resources on the second nudge).
- Reset flags when user replies; dynamically adjust check-in cadence (daily for high stress, weekly when stable).

### 8. Resource Discovery (Maps + Gemini)
- Replace stub action with Google Maps/Gemini integration; cache results per zip/category with TTL (e.g., respite 30 d, support groups 7 d).
- Scheduled refresh workflow re-fetches stale entries and notifies users if saved resources change/close.
- Ensure agent uses stored zip (no re-asking) and offers “Want me to send the links?”.

---

## Phase 4 – Business Ops & Observability (Weeks 8–9)

### 9. Rate Limits & Usage Analytics
- Finalize `@convex-dev/rate-limiter` policies (10 SMS/day per user, token ceilings) and embed `reserve` calls in SMS + agent paths.
- Call `trackUsage` for every turn; nightly cron aggregates into `metricsDaily` for dashboards.

### 10. Subscriptions
- Implement Stripe Checkout (monthly/annual, trials, promo codes) via Convex actions + HTTP webhook.
- Update `subscriptions` table/status; gate premium features when inactive.

### 11. Agent Telemetry
- Add `agentRuns` and `executionLogs` mutations (latency, tool usage, outcome).
- Expose admin queries to monitor performance and costs.

---

## Phase 5 – Testing & Hardening (Week 10)

### 12. Simulation & Integration Tests
- Write `convex-test` simulations for full journeys (first contact, EMA, assessments, crisis, silence) with mocked LLM responses.
- Integration tests using Twilio test numbers + OpenAI low-temp responses.
- Load tests focusing on crisis path (target p95 < 600 ms).

### 13. Documentation & Deploy Readiness
- Update README/runbooks with env setup, seeded data instructions, and FEATURE coverage.
- Prepare migrations for assessment/intervention seeds.
- Final QA checklist: HIPAA hashing/redaction, rate limits, crisis flows, Stripe billing.
