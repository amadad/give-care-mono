# Convex Backend Architecture

AI-powered SMS caregiving platform backend built on Convex, OpenAI Agents SDK, and Twilio.

## Architecture Principles

### Goals

- Keep reads reactive and bounded (queries <100ms; < a few hundred docs)
- Centralize access control; no public function without validators + checks
- Compose business logic via a model layer of plain TypeScript helpers
- Reserve actions for Node-only work or external components
- Prefer internal.* over api.* in server code to prevent public entrypoints from being callable internally by mistake
- Avoid .collect() on large/unbounded sets; prefer index-limited scans and pagination

### Boundaries

- **Public API**: query/mutation/action files only validate args and call model helpers
- **Internal API**: internalQuery/internalMutation for intra‑Convex calls and scheduler
- **Model Layer**: plain TS helpers that accept QueryCtx/MutationCtx/ActionCtx
- **Components/Integrations**: Twilio/Stripe/Resend/OpenAI live behind helpers and actions

### Security

- Use validators (args, and optional returns) for every public function
- **Ownership**: use verifyUserOwnership(ctx, userId) for user-scoped reads/writes
- **Admin**: use ensureAdmin(ctx) for admin-only operations; set ADMIN_USER_IDS env (comma-separated)
- Prefer internalMutation for server-driven jobs; expose thin public wrappers only when necessary

### Performance Patterns

- **Index-first**: design queries around indexes; add indexes before .filter
- **Bounded reads**: use .take(N) or .paginate; never rely on full-table .collect for pages/metrics
- **Batch**: replace N+1 patterns with internal batch queries/mutations
- **Background**: use ctx.scheduler.runAfter for workflow steps that don't need to be synchronous

### Runtime

- Actions only when you need Node.js (SDKs, components) or external network access
- Replace action→action calls with plain helpers whenever runtimes match
- Keep actions thin and side-effect free beyond their intent

### Key Indexes

- conversations: by_timestamp (for time-window analytics)
- triggers: by_enabled_next (enabled=true, nextOccurrence range scan)
- alerts: by_user_type (duplicate detection)

## File Structure

```
convex/
├── _generated/              # Auto-generated Convex types and API
│   ├── api.d.ts            # Type-safe API references for server code
│   ├── api.js              # Runtime API for calling functions
│   ├── dataModel.d.ts      # Database schema types
│   ├── server.d.ts         # Server context types (QueryCtx, MutationCtx, etc)
│   └── server.js           # Runtime server helpers
│
├── actions/                 # Node.js runtime actions for external services
│   ├── messageProcessing.ts # Wraps MessageHandler for inbound SMS processing
│   └── twilio.ts           # Twilio SMS sending helper (uses Twilio SDK)
│
├── email/                   # Email templates and rendering
│   └── templates/
│       └── AssessmentResults.tsx  # React Email template for assessment results
│
├── functions/               # Public/internal API endpoints (thin wrappers)
│   ├── admin.ts            # Admin dashboard queries (metrics, user listings)
│   ├── analytics.ts        # Analytics queries (charts, trends, feedback)
│   ├── assessmentEmailActions.ts  # Send assessment results via email
│   ├── assessmentResults.ts # Assessment result queries and mutations
│   ├── assessments.ts      # Assessment lifecycle (create, update, complete)
│   ├── campaigns.ts        # Email campaign management
│   ├── cleanup.ts          # Data cleanup jobs (old messages, expired sessions)
│   ├── conversations.ts    # Conversation queries (recent, analytics)
│   ├── emailContacts.ts    # Newsletter subscriber management
│   ├── emailContent.ts     # Email content CRUD
│   ├── embeddings.ts       # Vector embeddings for semantic search
│   ├── messages.ts         # Message queries and mutations
│   ├── memories.ts         # User memory storage (preferences, context)
│   ├── newsletter.ts       # Newsletter rendering and delivery
│   ├── newsletterActions.ts # Newsletter send actions
│   ├── rateLimitMonitoring.ts # Rate limit tracking and alerts
│   ├── resources.ts        # Resource matching and search
│   ├── resourcesGeoLite.ts # Geolocation-based resource filtering
│   ├── scheduling.ts       # Trigger/reminder scheduling
│   ├── seedKnowledgeBase.ts # Development data seeding for RAG
│   ├── seedResources.ts    # Development data seeding for resources
│   ├── users.ts            # User CRUD and authentication
│   ├── vectorSearch.ts     # Vector similarity search
│   └── wellness.ts         # Wellness score tracking and queries
│
├── lib/                     # Shared utilities and helpers
│   ├── auth.ts             # Authentication helpers (verifyUserOwnership, ensureAdmin)
│   └── scoring.ts          # Resource scoring algorithms
│
├── migrations/              # Database migrations
│   └── denormalizeUsers.ts # PHASE 1: Consolidate user data into single table
│
├── model/                   # Business logic layer (plain TypeScript)
│   ├── admin.ts            # Admin metrics and dashboard data
│   ├── analytics.ts        # Analytics calculations and aggregations
│   ├── conversations.ts    # Conversation insert, batch, recent queries
│   ├── resources.ts        # Resource finding and scoring logic
│   ├── triggers.ts         # Trigger scheduling helpers
│   ├── users.ts            # User patch, lookup, lastContact updates
│   ├── wellness.ts         # Wellness score reads and writes
│   └── README.md           # Model layer documentation
│
├── resources/               # Resource matching algorithms
│   └── matchResources.ts   # Multi-factor scoring (needs, preferences, geo)
│
├── services/                # Complex orchestration services
│   └── MessageHandler.ts   # SMS message processing pipeline (7-step flow)
│
├── utils/                   # Low-level utilities
│   └── logger.ts           # Safe logging with PII redaction
│
├── ARCHITECTURE.md          # (Consolidated into this README)
├── README.md               # This file
│
├── auth.config.ts          # Convex Auth configuration
├── auth.ts                 # Auth endpoints (phone, magic link, etc)
├── batchJobs.ts            # Background batch processing jobs
├── convex.config.ts        # Convex deployment configuration
├── crons.ts                # Scheduled cron jobs
├── feedback.ts             # User feedback collection
├── http.ts                 # HTTP endpoints (Twilio webhooks, Stripe webhooks)
├── messages.ts             # Message processing entry point
├── rateLimits.config.ts    # Rate limiting configuration (5-layer strategy)
├── schema.ts               # Database schema (denormalized PHASE 1)
├── stripe.ts               # Stripe webhook handlers and helpers
├── subscriptions.ts        # Subscription management (create, update, cancel)
├── triggers.ts             # Reminder/alert trigger system
├── twilio.ts               # Twilio webhook handlers
└── watchers.ts             # Database watchers for reactive updates
```

## Directory Responsibilities

### `actions/` - Node.js Runtime

Files here use `'use node'` directive and can access Node.js SDKs (Twilio, OpenAI, Stripe).

- **messageProcessing.ts**: Wraps MessageHandler service for inbound SMS orchestration
- **twilio.ts**: Sends outbound SMS via Twilio SDK

### `functions/` - Public/Internal API

Thin wrappers that:
1. Validate arguments with Convex validators
2. Apply access control (verifyUserOwnership, ensureAdmin)
3. Delegate to model layer helpers

Never write business logic here - delegate to `model/` instead.

### `model/` - Business Logic

Plain TypeScript functions that:
- Accept QueryCtx/MutationCtx/ActionCtx
- Implement business rules and data transformations
- Use index-first, bounded queries (.withIndex + .take/.paginate)
- Are easily testable without crossing function boundaries

See `model/README.md` for detailed guidelines.

### `services/` - Complex Orchestration

Multi-step workflows that coordinate across multiple domains:

- **MessageHandler**: 7-step SMS processing pipeline (validation → rate limiting → auth → context building → agent execution → persistence → scheduling)

### Key Files

#### `schema.ts`

Denormalized database schema (PHASE 1). Users table consolidates:
- Auth identity
- Caregiver profile
- Billing data
- Conversation state

Legacy tables marked for PHASE 2 removal.

#### `http.ts`

HTTP endpoint handlers:
- Twilio inbound SMS webhooks
- Stripe payment webhooks
- Health checks

#### `rateLimits.config.ts`

5-layer rate limiting strategy:
1. Global (1000 req/hour)
2. Per-user (20 req/hour)
3. Per-message (1 req/10s)
4. Suspicious pattern detection
5. Emergency circuit breaker

#### `crons.ts`

Scheduled jobs:
- Trigger/reminder processing
- Cleanup of old data
- Analytics aggregation

#### `watchers.ts`

Database watchers for reactive side effects:
- Send welcome message on new user
- Update analytics on conversation change

## Archived Components

Moved to `convex/_archive/` and removed from cron wiring:
- batchSummarization.ts, summarization.ts, summarizationActions.ts
- emailActions.ts, email/campaigns.ts, email/sequences.ts
- etl.ts

Can be reintroduced later behind explicit toggles.

## Development Guidelines

### Linting/DX

- Enable no-floating-promises and @typescript-eslint for server code
- Prefer types from `convex/_generated/dataModel` and validators via `Infer`
- Files importing `@openai/agents` need `'use node'` directive

### Common Patterns

**Query with index:**
```typescript
const user = await ctx.db
  .query('users')
  .withIndex('by_phone', q => q.eq('phoneNumber', phone))
  .first()
```

**Bounded pagination:**
```typescript
const messages = await ctx.db
  .query('messages')
  .withIndex('by_timestamp')
  .order('desc')
  .take(100)
```

**Background scheduling:**
```typescript
await ctx.scheduler.runAfter(0, internal.triggers.processReminders)
```

**Access control:**
```typescript
import { verifyUserOwnership } from './lib/auth'
await verifyUserOwnership(ctx, userId)
```

## Critical Reminders

1. **Run `npx convex dev` first** - generates types in `_generated/`
2. **Never `git add .`** - stage specific files only
3. **No emojis in commits/PRs**
4. **Use Convex validators, NOT Zod** (except in ETL workers)
5. **Touch parent file to force rebuild**: `touch convex/twilio.ts && npx convex dev --once`
6. **Check `hasContextState()` before accessing agent context**

## Environment Variables

See `../.env.example`:
- `CONVEX_DEPLOYMENT`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `STRIPE_SECRET_KEY`
- `ADMIN_USER_IDS` (comma-separated)
