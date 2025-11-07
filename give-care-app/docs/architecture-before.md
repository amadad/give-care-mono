# GiveCare Architecture (Pre-Refactor Snapshot)

**Date**: November 7, 2025
**Version**: v0.9.0 (Hexagonal/Harness Architecture)

This document captures the architecture state before the Convex-native refactor (Phase 1-5).

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      External Clients                         │
│  (Twilio SMS, Stripe Webhooks, Admin Dashboard, Email)       │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                    Harness Layer (src/)                       │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐          │
│  │ Drivers    │  │  Services   │  │  Agents      │          │
│  │ (Store,    │  │ (Billing,   │  │ (Main,       │          │
│  │  Model,    │  │  Memory,    │  │  Crisis,     │          │
│  │  Scheduler)│  │  Email)     │  │  Assessment) │          │
│  └─────┬──────┘  └──────┬──────┘  └───────┬──────┘          │
│        │                 │                  │                 │
│  ┌─────▼─────────────────▼──────────────────▼──────┐         │
│  │         Capability Runtime                       │         │
│  │  (Registry, Policy, Budget, Tool Invocation)     │         │
│  └──────────────────────┬───────────────────────────┘         │
└─────────────────────────┼───────────────────────────────────┘
                          │
                ┌─────────▼─────────┐
                │ Convex Backend    │
                │  (Database, Auth, │
                │   Scheduler, etc.)│
                └───────────────────┘
```

**Authentication**: HARNESS_CONVEX_TOKEN used to auth harness → Convex calls

---

## Directory Structure

### Core Backend (`convex/`)
```
convex/
├── schema.ts                    # Convex table definitions
├── crons.ts                     # Cron job schedules
├── functions/                   # Public & internal Convex functions
│   ├── admin.ts                 # Admin queries/mutations
│   ├── analytics.ts             # Analytics aggregation
│   ├── assessments.ts           # Burnout assessment logic
│   ├── billing.ts               # Stripe integration
│   ├── context.ts               # User context hydration
│   ├── email.ts                 # Email trigger management
│   ├── logs.ts                  # Logging queries
│   ├── memory.ts                # Working memory (unused)
│   ├── messages.ts              # Message history queries
│   ├── scheduler.ts             # Trigger scheduling
│   └── watchers.ts              # Background watchers (engagement, assessments)
├── model/                       # Data access layer (schema helpers)
│   ├── context.ts
│   ├── logs.ts
│   ├── messages.ts
│   ├── security.ts
│   ├── triggers.ts
│   └── users.ts
└── internal/                    # Internal-only functions
    └── scheduler.ts             # Trigger advancement mutations
```

### Harness Layer (`src/`)
```
src/
├── agents/                      # Agent definitions
│   ├── main.ts                  # Main conversation agent
│   ├── crisis.ts                # Crisis detection/response agent
│   ├── assessment.ts            # Assessment agent
│   ├── registry.ts              # Agent registration
│   └── types.ts                 # Agent interface types
├── capabilities/                # Tool capabilities
│   ├── assessment.start.ts
│   ├── schedule.trigger.ts
│   ├── notifications.email.ts
│   ├── alerts.process.ts
│   ├── runtime.ts               # Capability runtime factory
│   └── registry.ts              # Capability registry
├── drivers/                     # Abstraction drivers
│   ├── model/
│   │   └── oai.driver.ts        # OpenAI Agents SDK wrapper
│   ├── store/
│   │   └── convex.store.ts      # Convex database driver
│   └── scheduler/
│       └── convex.scheduler.ts  # Convex scheduler driver
├── services/                    # Business logic utilities
│   ├── assessment.ts
│   ├── billing.ts               # Entitlement derivation
│   ├── email.ts
│   ├── interventions.ts
│   ├── memory.ts                # In-memory cache w/ TTL
│   ├── resources.ts
│   ├── scheduling.ts
│   └── index.ts
├── harness/                     # Orchestration runtime
│   ├── index.ts                 # Main entry (handle() function)
│   └── runtime.ts               # Runtime singleton (store, scheduler)
├── policy/                      # Intent classification & tone
│   ├── index.ts
│   └── types.ts
├── prompts/                     # Agent system prompts
│   ├── main_agent.md            # Main agent prompt
│   ├── crisis_agent.md          # Crisis agent prompt
│   ├── assessment_agent.md      # Assessment agent prompt
│   ├── index.ts                 # Prompt loader
│   └── loader.ts                # Template renderer
└── shared/
    └── types.ts                 # Shared type definitions
```

### Edge Workers (`apps/`)
```
apps/
└── (placeholder for future edge workers)
```

### Admin Dashboard (`admin/`)
```
admin/
├── src/
│   ├── routes/                  # Tanstack Router pages
│   ├── components/              # React components
│   └── lib/                     # Utilities
└── dist/                        # Vite build output
```

---

## Key Patterns & Decisions

### 1. Hexagonal Architecture (Ports & Adapters)

**Goal**: Isolate business logic from external dependencies (Convex, OpenAI, etc.)

- **Drivers**: `ModelDriver`, `StoreDriver`, `SchedulerDriver` abstract external services
- **Services**: Pure business logic (entitlements, memory, etc.)
- **Agents**: Domain-specific LLM orchestrators
- **Harness**: Dependency injection container

**Trade-off**: Added complexity/indirection vs provider portability

### 2. Agent System

Three agents following a common interface:

```typescript
interface Agent {
  name: string;
  preconditions: (ctx: HydratedContext) => boolean;
  plan: (input: AgentInput) => Promise<string>;
  run: (
    input: AgentInput,
    ctx: HydratedContext,
    caps: CapabilityRuntime,
    budget: Budget,
    deps?: AgentDeps
  ) => AsyncGenerator<string | ToolCall>;
}
```

- **Main Agent**: General caregiving conversations
- **Crisis Agent**: Emergency response (988, crisis resources)
- **Assessment Agent**: Burnout assessment scoring & interventions

**Routing**: Policy intent classification (`policy.intent()`) determines which agent runs

### 3. Capability System

Tool capabilities (like "schedule a trigger" or "send email") are:
- Registered in `src/capabilities/registry.ts`
- Invoked via `caps.invoke(name, args)`
- Validated with Zod schemas
- Budget-tracked (max tools per session)

**Current capabilities**:
- `assessment.score`
- `assessment.start`
- `schedule.trigger`
- `notifications.email`
- `alerts.process`

### 4. Convex Integration

**Schema** (`convex/schema.ts`):
- `users`, `messages`, `conversations`, `triggers`, `assessments`, `wellness_data`, `logs`, `alerts`, `stripe_customers`, etc.

**Functions**:
- Queries: Read-only (e.g., `getUserContext`, `listMessages`)
- Mutations: Write ops (e.g., `createMessage`, `updateUser`)
- Actions: Non-deterministic ops (e.g., LLM calls, webhooks)

**Cron Jobs** (`convex/crons.ts`):
- `process-scheduled-triggers`: Every 5min (scheduler watchers)
- `engagement-watchers`: Every 6hr (engagement checks)

### 5. OpenAI Agents SDK

Used in `src/drivers/model/oai.driver.ts` for:
- Streaming LLM responses
- Tool-use (function calling)
- Multi-turn conversations

**Key APIs**: `Agent`, `run()`, `tool()`, `setOpenAIAPI('responses')`

### 6. Authentication

- **HARNESS_CONVEX_TOKEN**: Secret shared between harness and Convex functions
- **Admin**: Uses Convex client w/ deployment URL (no separate auth yet)

---

## Data Flow: SMS Message Handling

1. **Twilio → Convex webhook** (`convex/functions/messages.ts:inboundSMS`)
2. **Convex → Harness** via action calling `src/harness/index.ts:handle()`
3. **Harness**:
   - Load user context (profile, history, consent, etc.)
   - Route to agent (Main/Crisis/Assessment)
   - Invoke capabilities as needed
   - Stream response chunks
4. **Harness → Convex** mutation to save assistant message
5. **Convex → Twilio** via action to send SMS reply

---

## Known Issues (Pre-Refactor)

1. **Build Pollution**: `.js`/`.d.ts`/`.map` files polluting `src/` and `convex/`
2. **Crisis Detection Broken**: Policy filters out "unsafe tokens" like "suicidal"
3. **Prompt Loader Path Bug**: Hardcoded `give-care-app/` in path (fixed in Phase 1)
4. **Token Auth Overhead**: Extra auth layer between harness and Convex
5. **Two Deployment Steps**: Harness (undefined target) + Convex backend
6. **Complexity**: 3-layer abstraction (drivers/harness/convex) for single-provider setup

---

## Migration Plan

See `docs/convex.md` for the Convex-native playbook and planned refactor phases.

**Phase 1** (this snapshot) completes:
- ✅ Cleanup build pollution
- ✅ Fix tsconfig/gitignore
- ✅ Baseline tests for agents
- ✅ Run codegen with typecheck
- ✅ Document architecture (this file)

**Next phases**: See 5-phase plan in main refactor (PR #1-5)
