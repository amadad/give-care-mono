# GiveCare Harness

**Version**: 0.9.0 | **Status**: Production Ready | **Architecture**: Hexagonal

---

## What's New (v0.9.0)

**Complete Architectural Rewrite - Harness Implementation**:

This release replaces the monolithic v0.8.2 implementation with a next-generation hexagonal architecture that achieves:

- **86% code reduction**: 3,086 LOC (from 21,851 LOC)
- **75% more capabilities**: 14 capabilities (vs 8 tools in v0.8.2)
- **Separation of concerns**: Runtime logic isolated from database backend
- **Swappable providers**: OpenAI, Gemini, Resend, Stripe behind driver interfaces
- **Production-ready**: Complete service integrations, RRULE scheduling, policy enforcement

**Archive Note**: The v0.8.2 monolithic implementation has been preserved in `_archive/v1-monolithic/` for reference.

---

## Architecture Overview

### Hexagonal (Ports & Adapters) Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Channel Adapters                      │
│              apps/edge-sms, apps/edge-stripe             │
└───────────────────────┬─────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   Harness Runtime                        │
│       src/harness (orchestrator, budgets)           │
└───────────┬──────────────────────────┬──────────────────┘
            ↓                          ↓
    ┌──────────────┐          ┌──────────────┐
    │ Capabilities │          │   Policies   │
    │  (14 tools)  │          │ (guardrails) │
    └──────┬───────┘          └──────────────┘
           ↓
    ┌──────────────────────────────────────┐
    │          Service Layer               │
    │  (email, resources, assessments)     │
    └──────────────┬───────────────────────┘
                   ↓
    ┌────────────────────────────────────────────────┐
    │              Driver Layer                      │
    │  Model (OAI) | Store (Convex) | Scheduler      │
    └────────────────┬───────────────────────────────┘
                     ↓
         ┌─────────────────────────┐
         │   Convex Backend        │
         │  (14 tables, 16 funcs)  │
         └─────────────────────────┘
```

### Two-Part Deployment

**Runtime Code** (`src/`, `apps/`):
- Runs on edge (Cloudflare Workers, Vercel Edge Functions, Node.js)
- Contains business logic, LLM execution, service integrations
- Swappable providers (OpenAI → Anthropic, Convex → Supabase)
- 1,890 LOC total

**Database Backend** (`convex/`):
- Runs on Convex Cloud
- Normalized schema (14 tables)
- Token-authenticated API (16 public functions)
- Cron jobs for scheduled triggers
- 1,196 LOC total

---

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Environment Variables
```bash
cp .env.example .env
# Runtime environment variables:
# - OPENAI_API_KEY (for LLM execution)
# - GEMINI_API_KEY (for resource search)
# - RESEND_API_KEY (for email notifications)
# - STRIPE_SECRET_KEY (for billing)
# - CONVEX_URL (Convex deployment URL)
# - CONVEX_TOKEN (shared secret for auth)
```

### 3. Deploy Convex Backend
```bash
npx convex dev    # Development
npx convex deploy # Production
```

Set `HARNESS_API_TOKEN` in Convex dashboard (must match `CONVEX_TOKEN` in runtime).

### 4. Run Tests
```bash
pnpm test        # Run all test suites
pnpm lint        # ESLint + Convex rules
pnpm typecheck   # TypeScript validation
```

---

## Directory Structure

```
give-care-app/
├── apps/                      # Channel adapters
│   ├── edge-sms/             # Twilio SMS handler (Cloudflare Worker)
│   └── edge-stripe/          # Stripe webhook handler
│
├── src/                  # Runtime business logic (1,890 LOC)
│   ├── agents/               # Main, crisis, assessment agent wrappers
│   ├── capabilities/         # 14 tool contracts + registry
│   ├── drivers/              # Swappable provider interfaces
│   │   ├── model/           # LLM execution (OpenAI Agents SDK)
│   │   ├── store/           # Database operations (Convex)
│   │   └── scheduler/       # RRULE trigger management
│   ├── harness/              # Orchestrator loop, budgets, runtime wiring
│   ├── policy/               # Policy bundles + evaluator + loader
│   ├── services/             # Pure domain logic (email, resources, assessments)
│   └── shared/               # Types, tracing, utilities
│
├── convex/                    # Convex backend (1,196 LOC)
│   ├── schema.ts             # 14 tables (users, sessions, messages, triggers, alerts, etc.)
│   ├── functions/            # 16 public mutations/queries (token-authenticated)
│   ├── model/                # Helper modules (assessment, trigger, wellness, etc.)
│   └── crons.ts              # Scheduled jobs (trigger processing every 5 min)
│
├── tests/                     # Test suites
│   ├── golden/               # Transcript parity fixtures
│   ├── deterministic/        # Service + policy unit tests
│   └── contract/             # Capability contract tests
│
├── docs/                      # Architecture documentation
│   ├── ARCHITECTURE.md       # Hexagonal pattern explanation
│   ├── CAPABILITIES.md       # Complete capability reference
│   └── DEPLOYMENT.md         # Production deployment guide
│
├── _archive/                  # Archived implementations
│   └── v1-monolithic/        # v0.8.2 monolithic app (21,851 LOC)
│
├── package.json               # Harness dependencies
├── eslint.config.js          # ESLint + Convex linting rules
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

---

## Capabilities (14 Total)

The harness exposes 14 capabilities as LLM tools, automatically validated and budgeted:

### Assessment & Wellness
1. **assessment.start** - Begin clinical assessment (EMA, CWBS, REACH-II, SDOH)
2. **assessment.recordAnswer** - Record user responses
3. **assessment.score** - Calculate composite burnout score
4. **wellness.status** - Get wellness trends and pressure zones

### Profile & Memory
5. **profile.update** - Update user context (name, role, care situation)
6. **memory.record** - Save working memory entries (vector search ready)

### Interventions & Resources
7. **interventions.suggest** - Match interventions to burnout score
8. **resources.search** - Find local resources (Google Gemini + Maps grounding)

### Scheduling & Alerts
9. **schedule.trigger** - Create RRULE-based recurring events
10. **schedule.followup** - Schedule one-time follow-ups
11. **alerts.process** - Process pending alert queue

### Notifications & Admin
12. **notifications.email.send** - Send emails via Resend
13. **billing.refreshEntitlements** - Sync Stripe subscription status
14. **admin.metrics** - Fetch admin dashboard metrics

See `docs/CAPABILITIES.md` for complete reference.

---

## Service Integrations

### OpenAI Agents SDK (Model Driver)
- Full conversation memory with `conversationId`
- Tool proxying via capability runtime
- Budget enforcement (max output tokens)
- Swappable: Replace `src/drivers/model/oai.driver.ts` for other providers

**Config**:
- `OPENAI_API_KEY` - API key
- `OPENAI_MODEL` - Model name (default: `gpt-5.5-mini`)
- `OPENAI_SERVICE_TIER` - Service tier (default: `auto`)

### Google Gemini (Resource Search)
- Maps grounding for local respite resource discovery
- Latitude/longitude-based search

**Config**:
- `GEMINI_API_KEY` - API key
- `GEMINI_MODEL` - Model name (default: `gemini-2.5-flash-lite`)

### Resend (Email Notifications)
- Email delivery for alerts, summaries, notifications

**Config**:
- `RESEND_API_KEY` - API key
- `EMAIL_FROM` - From address (default: `GiveCare <care@givecare.ai>`)

### Stripe (Billing)
- Subscription management via Convex backend
- Entitlements refresh capability

**Config**:
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Webhook secret for `apps/edge-stripe`

### Convex (Database Backend)
- Token-authenticated API (16 public functions)
- Normalized schema (14 tables)
- RRULE-based scheduling with cron processing
- 15-method Store interface implementation

**Config**:
- `CONVEX_URL` - Deployment URL (e.g., `https://YOUR-DEPLOYMENT.convex.cloud`)
- `CONVEX_TOKEN` - Shared secret (must match `HARNESS_API_TOKEN` in Convex env)

---

## Deployment

### Development
```bash
# Terminal 1: Start Convex dev server
npx convex dev

# Terminal 2: Run tests
pnpm test

# Terminal 3: Run local edge worker (if testing apps/edge-sms)
cd apps/edge-sms && pnpm dev
```

### Production

**Step 1: Deploy Convex Backend**
```bash
npx convex deploy --prod
```

Set environment variables in Convex dashboard:
- `HARNESS_API_TOKEN` - Shared secret for authentication

**Step 2: Deploy Edge Workers**
```bash
# SMS handler
cd apps/edge-sms
pnpm deploy  # Cloudflare Workers or Vercel Edge

# Stripe webhook handler
cd apps/edge-stripe
pnpm deploy
```

Set environment variables in edge worker config:
- `CONVEX_URL`
- `CONVEX_TOKEN`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`

**Step 3: Configure Webhooks**
- Twilio SMS webhook: `https://YOUR-EDGE-WORKER.workers.dev/sms`
- Stripe webhook: `https://YOUR-EDGE-WORKER.workers.dev/stripe`

See `docs/DEPLOYMENT.md` for complete guide.

---

## Development Workflow

### Adding New Capabilities

1. Create capability definition in `src/capabilities/`:
```typescript
// src/capabilities/example.ts
export const exampleCapability: CapabilityDefinition<InputSchema, OutputSchema> = {
  name: 'example.action',
  description: 'Does something useful',
  schema: z.object({ input: z.string() }),
  requiredConsent: ['basic'],
  budgetCost: { calls: 1 },
  handler: async (input, { store }) => {
    // Implementation
    return { result: 'success' };
  },
};
```

2. Register in `src/capabilities/registry.ts`:
```typescript
import { exampleCapability } from './example.js';

const capabilities: CapabilityDefinition<any, any>[] = [
  // ... existing capabilities
  exampleCapability,
];
```

3. The capability is now automatically exposed as an LLM tool.

### Swapping Providers

**Replace OpenAI with Anthropic**:
1. Implement `ModelDriver` interface in `src/drivers/model/anthropic.driver.ts`
2. Update `src/harness/runtime.ts` to use new driver

**Replace Convex with Supabase**:
1. Implement `Store` interface in `src/drivers/store/supabase.store.ts`
2. Update `src/harness/runtime.ts` to use new driver

All business logic remains unchanged.

---

## Testing

### Test Suites

**Golden Tests** (`tests/golden/`):
- Transcript parity with v0.8.2
- Ensures tone, crisis handling, and assessment accuracy
- Fixtures: crisis scenarios, assessment flows, intervention suggestions

**Deterministic Tests** (`tests/deterministic/`):
- Service unit tests (email, resources, assessments)
- Policy evaluation tests (guardrails)
- Pure functions only (no LLM calls)

**Contract Tests** (`tests/contract/`):
- Capability contract validation
- Zod schema enforcement
- Budget constraint verification

```bash
pnpm test              # Run all tests
pnpm test:golden       # Transcript parity only
pnpm test:deterministic # Service + policy tests
pnpm test:contract     # Capability contracts
```

---

## Code Metrics

### v0.9.0 Harness
- **Total**: 3,086 LOC
- **Runtime** (`src/`): 1,890 LOC
- **Backend** (`convex/`): 1,196 LOC
- **Capabilities**: 14 (vs 8 in v0.8.2)
- **Code reduction**: 86% (from 21,851 LOC)

### v0.8.2 Monolithic (archived)
- **Total**: 21,851 LOC
- **Convex**: 12,267 LOC
- **Src**: 9,584 LOC
- **Tools**: 8
- **Location**: `_archive/v1-monolithic/`

---

## Migration from v0.8.2

The monolithic v0.8.2 implementation is preserved in `_archive/v1-monolithic/` for reference.

**Key Changes**:
1. **Architecture**: Monolithic → Hexagonal (ports & adapters)
2. **Deployment**: Single Convex app → Runtime + Backend separation
3. **Capabilities**: 8 tools → 14 capabilities
4. **Code**: 21,851 LOC → 3,086 LOC (86% reduction)
5. **Services**: All integrated (OpenAI, Gemini, Resend, Stripe)

**Compatibility**:
- Database schema is normalized but semantically equivalent
- All v0.8.2 features are implemented in harness
- Golden tests ensure transcript parity

---

## References

- [OpenAI Agents SDK Docs](https://openai.github.io/openai-agents-js/)
- [Convex Docs](https://docs.convex.dev/)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Resend Docs](https://resend.com/docs)
- [Stripe API](https://stripe.com/docs/api)

**Architecture Docs**:
- `docs/ARCHITECTURE.md` - Hexagonal pattern explanation
- `docs/CAPABILITIES.md` - Complete capability reference
- `docs/DEPLOYMENT.md` - Production deployment guide
- `docs/MIGRATION.md` - v0.8.2 → v0.9.0 migration guide

---

## Contributing

1. Follow hexagonal architecture principles (domain logic in `services/`, infrastructure in `drivers/`)
2. Use Convex validators (`v.string()`, `v.id()`) not Zod in Convex functions
3. All capabilities must have Zod schemas for validation
4. Add golden tests for new conversation flows
5. Update `docs/CAPABILITIES.md` when adding capabilities

---

## License

MIT
