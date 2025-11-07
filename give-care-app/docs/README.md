# GiveCare Backend

**Version**: 1.0.0 | **Status**: Production Ready | **Architecture**: Convex-Native

AI-powered SMS caregiving support platform built entirely on Convex with Agent Component.

---

## What's New (v1.0.0)

**Complete Refactor to Convex-Native Architecture**:

This release replaces the hexagonal harness implementation (v0.9.0) with a streamlined Convex-native architecture that achieves:

- **40% code reduction**: 2,894 LOC (from 4,824 LOC)
- **Simplified architecture**: 3 layers (from 5)
- **Better persistence**: Automatic thread/message tracking via Agent Component
- **Faster builds**: 2.67s (20% improvement)
- **Provider flexibility**: Vercel AI SDK enables easy provider switching

**Archive Notes**:
- v0.9.0 hexagonal harness → `_archive/src-harness-20251107/`, `_archive/apps-harness-20251107/`
- v0.8.2 monolithic → `_archive/v1-monolithic/`

---

## Architecture Overview

### Convex-Native Stack

```
┌─────────────────────────────────────────┐
│     Twilio SMS / Stripe Webhooks        │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────▼──────────────────────────┐
│         convex/http.ts                   │  HTTP Router
│  - Twilio SMS webhook                   │
│  - Stripe webhook                       │
│  - Health check                         │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────▼──────────────────────────┐
│       convex/agents/                     │  Agent Actions
│  - crisis.ts    (Agent Component)       │
│  - main.ts      (Agent Component)       │
│  - assessment.ts (Agent Component)      │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────▼──────────────────────────┐
│         convex/lib/                      │  Business Logic
│  - policy.ts   (routing, tone)          │
│  - prompts.ts  (system prompts)         │
│  - billing.ts  (entitlements)           │
│  - memory.ts   (caching)                │
│  - types.ts    (shared types)           │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────▼──────────────────────────┐
│      convex/functions/                   │  Data Layer
│  Queries (read), Mutations (write)      │
│  Internal (cron/scheduler helpers)      │
└──────────────┬──────────────────────────┘
               ↓
┌──────────────▼──────────────────────────┐
│       convex/schema.ts                   │  Database
│  - users, messages, sessions            │
│  - assessments, triggers, alerts        │
│  - 20+ tables with indexes              │
└──────────────────────────────────────────┘
```

### Technology Stack

**AI Agent Layer**:
```
Convex Agent Component (@convex-dev/agent)
    ↓ uses
Vercel AI SDK (ai)
    ↓ uses provider
@ai-sdk/openai
    ↓ calls
OpenAI API (gpt-4o-mini)
```

**Benefits**:
- Automatic thread persistence (no manual tracking)
- Built-in conversation history
- Provider-agnostic (swap OpenAI for Claude/Gemini easily)
- Vector search ready
- Usage tracking & rate limiting included

---

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Environment Variables
```bash
# Create .env.local (Convex will use this)
cat > .env.local <<EOF
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name

# OpenAI (for Agent Component)
OPENAI_API_KEY=sk-...

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...

# Resend (optional)
RESEND_API_KEY=re_...
EOF
```

### 3. Start Convex Development Server
```bash
npx convex dev
```

This will:
- Generate types in `convex/_generated/`
- Install Agent Component
- Watch for file changes
- Deploy to dev environment

### 4. Test the API
```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

---

## Directory Structure

```
give-care-app/
├── convex/                      2,894 LOC (Production Code)
│   ├── agents/                    177 LOC
│   │   ├── crisis.ts            # Crisis support agent
│   │   ├── main.ts              # General caregiver support
│   │   └── assessment.ts        # Burnout assessment specialist
│   │
│   ├── functions/               1,042 LOC
│   │   ├── admin.ts             # Dashboard queries
│   │   ├── alerts.ts            # Alert processing
│   │   ├── analytics.ts         # Metrics & reporting
│   │   ├── assessments.ts       # Assessment scoring
│   │   ├── billing.ts           # Stripe integration
│   │   ├── context.ts           # Session hydration
│   │   ├── email.ts             # Email notifications
│   │   ├── logs.ts              # Agent run logging
│   │   ├── memory.ts            # User memory/notes
│   │   ├── messages.ts          # Conversation history
│   │   ├── scheduler.ts         # Follow-ups & triggers
│   │   ├── watchers.ts          # Background processing
│   │   └── wellness.ts          # Wellness tracking
│   │
│   ├── lib/                       226 LOC
│   │   ├── billing.ts           # Entitlement logic
│   │   ├── memory.ts            # In-memory cache
│   │   ├── policy.ts            # Intent detection & routing
│   │   ├── prompts.ts           # System prompt templates
│   │   └── types.ts             # Shared TypeScript types
│   │
│   ├── model/                     350 LOC
│   │   ├── context.ts           # Session context helpers
│   │   ├── logs.ts              # Logging helpers
│   │   ├── messages.ts          # Message CRUD operations
│   │   ├── security.ts          # Redaction & validation
│   │   ├── triggers.ts          # Scheduler helpers
│   │   └── users.ts             # User management
│   │
│   ├── internal/                   65 LOC
│   │   └── scheduler.ts         # Internal scheduler actions
│   │
│   ├── http.ts                     44 LOC
│   │   └── Webhook router (Twilio, Stripe, health)
│   │
│   ├── schema.ts                  371 LOC
│   │   └── Database tables & indexes
│   │
│   ├── crons.ts                    83 LOC
│   │   └── Scheduled jobs (daily metrics, watchers)
│   │
│   └── convex.config.ts             8 LOC
│       └── Agent Component config
│
├── admin/                        14M
│   └── Dashboard (Cloudflare Pages, separate app)
│
├── tests/
│   └── prompts.test.ts          # Prompt rendering tests
│
├── docs/
│   ├── convex.md                # Convex playbook (MANDATORY)
│   ├── architecture-before.md   # Pre-refactor documentation
│   └── *.md                     # Other docs
│
├── _archive/                    272K
│   ├── src-harness-20251107/    # v0.9.0 hexagonal architecture
│   ├── apps-harness-20251107/   # v0.9.0 edge functions
│   └── v1-monolithic/           # v0.8.2 original implementation
│
├── REFACTOR_AUDIT.md            # Detailed refactor analysis
├── REFACTOR_COMPLETE.md         # Migration summary
├── CHANGELOG.md                 # Version history
├── package.json                 # Dependencies
├── eslint.config.js             # Linting rules
├── tsconfig.json                # TypeScript config
└── README.md                    # This file
```

---

## Core Features

### 3 AI Agents (Convex Agent Component)

**Crisis Agent** (`convex/agents/crisis.ts`):
- Detects crisis situations (suicide risk, severe distress)
- Provides 988 hotline and crisis resources
- Safety-focused, empathetic responses
- Logs all interactions for monitoring

**Main Agent** (`convex/agents/main.ts`):
- General caregiving conversation & support
- Burnout prevention & stress management
- Resource recommendations
- Profile-aware responses (name, relationship, journey phase)

**Assessment Agent** (`convex/agents/assessment.ts`):
- Burnout assessment interpretation
- Score calculation (low/moderate/high burnout)
- Personalized intervention suggestions
- Pressure zone-specific recommendations

### Automatic Thread Persistence

**How It Works**:
```typescript
// Create or continue thread (Agent Component handles history)
const thread = threadId
  ? await agent.continueThread(ctx, { threadId, userId })
  : await agent.createThread(ctx, { userId });

// Generate response (full conversation context included automatically)
const result = await thread.generateText({
  prompt: userMessage,
  system: dynamicSystemPrompt,
});

// Return thread ID for next message
return { text: result.text, threadId: thread.threadId };
```

No manual conversation tracking required!

### Dynamic System Prompts

Agents use personalized system prompts with template variables:

```typescript
// Template in convex/lib/prompts.ts
export const MAIN_PROMPT = `
You are a compassionate AI caregiver assistant.

Context:
- User: {{userName}}
- Caring for: {{careRecipient}}
- Journey phase: {{journeyPhase}}
- Total interactions: {{totalInteractionCount}}
`;

// Rendered per request with real data
const systemPrompt = renderPrompt(MAIN_PROMPT, {
  userName: 'Sarah',
  careRecipient: 'her mother',
  journeyPhase: 'active',
  totalInteractionCount: '47',
});
```

### Policy-Based Routing

**Intent Detection** (`convex/lib/policy.ts`):
- Detects crisis keywords → routes to crisis agent
- Detects assessment requests → routes to assessment agent
- Default → routes to main agent

**Tone Selection**:
- Crisis: Calm, directive, resource-focused
- Moderate distress: Empathetic, validating
- Stable: Warm, solution-oriented

### SMS Integration

**Twilio Webhook** (`convex/http.ts`):
```typescript
http.route({
  path: '/twilio/sms',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { From, Body } = await parseTwilioWebhook(request);

    // Route to appropriate agent
    const agent = routeToAgent(Body, context);
    const response = await agent.run(ctx, { text: Body, userId });

    // Send SMS reply via Twilio
    return sendTwiMLResponse(response.text);
  }),
});
```

---

## Development Workflow

### Adding a New Query

```typescript
// convex/functions/myFeature.ts
import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getMyData = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query('myTable')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
  },
});
```

### Adding a New Mutation

```typescript
// convex/functions/myFeature.ts
import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const updateMyData = mutation({
  args: {
    userId: v.id('users'),
    value: v.string(),
  },
  handler: async (ctx, { userId, value }) => {
    await ctx.db.insert('myTable', { userId, value });
  },
});
```

### Adding a New Agent Tool

```typescript
// convex/agents/main.ts
import { createTool } from '@convex-dev/agent';

const myTool = createTool({
  args: z.object({ input: z.string() }),
  description: 'Does something useful',
  handler: async (ctx, args) => {
    // Call Convex functions
    const data = await ctx.runQuery(api.functions.myFeature.getMyData, {
      userId: ctx.userId,
    });
    return { result: data };
  },
});

const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: openai.chat('gpt-4o-mini'),
  tools: { myTool }, // Add tool here
});
```

---

## Configuration

### Convex Environment Variables

Set in Convex dashboard (Settings → Environment Variables):

```bash
# OpenAI (required for agents)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # optional, default shown

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...

# Resend (optional)
RESEND_API_KEY=re_...
EMAIL_FROM=GiveCare <care@givecare.ai>  # optional

# Twilio (optional, for SMS replies)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Deployment

### Development
```bash
npx convex dev
```

### Production
```bash
# Deploy to production
npx convex deploy --prod

# Set production environment variables in Convex dashboard
# Then configure webhooks to point to production deployment
```

### Webhook URLs

After deployment, configure these webhooks:

**Twilio**:
- URL: `https://YOUR-DEPLOYMENT.convex.site/twilio/sms`
- Method: POST

**Stripe**:
- URL: `https://YOUR-DEPLOYMENT.convex.site/stripe/webhook`
- Method: POST
- Events: `customer.subscription.*`, `invoice.*`

---

## Testing

```bash
# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Fix lint issues
pnpm lint:fix
```

**Note**: Basic prompt rendering tests available in `tests/prompts.test.ts`. Agent integration tests pending.

---

## Code Metrics

### Current (v1.0.0 - Convex-Native)
- **Total**: 2,894 LOC
- **Agents**: 177 LOC (3 agents)
- **Functions**: 1,042 LOC (queries, mutations, actions)
- **Lib**: 226 LOC (business logic)
- **Model**: 350 LOC (data access)
- **Schema**: 371 LOC (database)
- **HTTP/Crons/Config**: 135 LOC
- **Build time**: 2.67s

### Previous (v0.9.0 - Hexagonal Harness)
- **Total**: 4,824 LOC (archived)
- **Runtime**: 1,930 LOC
- **Backend**: 2,894 LOC
- **Architecture**: 5 layers (harness, capabilities, drivers, services, backend)
- **Build time**: 3.36s

### Improvement
- **40% less code** (1,930 LOC removed)
- **20% faster builds** (2.67s vs 3.36s)
- **50% fewer layers** (3 vs 5)
- **Better persistence** (automatic vs manual)

---

## Migration Notes

### From v0.9.0 Hexagonal Harness

The hexagonal architecture has been archived to `_archive/src-harness-20251107/` and `_archive/apps-harness-20251107/`.

**Key Changes**:
1. ❌ Removed `src/` directory (harness, drivers, capabilities)
2. ❌ Removed `apps/` directory (edge functions)
3. ✅ Agents now in `convex/agents/` using Agent Component
4. ✅ HTTP webhooks in `convex/http.ts`
5. ✅ Business logic in `convex/lib/`
6. ✅ Data layer in `convex/functions/` and `convex/model/`

**What Stayed**:
- Database schema (improved with optional fields)
- Agent behavior (crisis, main, assessment)
- Service integrations (Stripe, Resend, Twilio)
- All functionality intact

**What Improved**:
- Automatic thread persistence
- Provider-agnostic AI SDK
- Simpler architecture (3 layers vs 5)
- Faster builds (20% improvement)
- Less code to maintain (40% reduction)

See `REFACTOR_COMPLETE.md` for full migration analysis.

---

## Documentation

- **`docs/convex.md`** - MANDATORY playbook for Convex development
- **`REFACTOR_AUDIT.md`** - Detailed before/after analysis
- **`REFACTOR_COMPLETE.md`** - Complete refactor summary
- **`CHANGELOG.md`** - Version history

---

## Contributing

**Before Making Changes**:
1. Read `docs/convex.md` (MANDATORY)
2. Understand the 3-layer architecture (agents → lib → functions)
3. Use Convex validators (`v.*`), not Zod
4. Always add indexes before querying
5. Keep actions under 60s, mutations deterministic

**Adding Features**:
1. New queries/mutations → `convex/functions/`
2. Shared business logic → `convex/lib/`
3. Data access helpers → `convex/model/`
4. Agent tools → Add to agent's `tools` config
5. New tables → Update `convex/schema.ts` with indexes

**Testing**:
1. Test queries/mutations directly with Convex CLI
2. Run `pnpm test` for prompt rendering tests
3. Run `pnpm typecheck` before committing
4. Ensure `npx convex dev --once` succeeds

---

## Support

**Documentation**:
- [Convex Docs](https://docs.convex.dev)
- [Convex Agent Component](https://docs.convex.dev/agents)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [OpenAI API](https://platform.openai.com/docs)

**Issues**:
- Report bugs via GitHub Issues
- Check `_archive/` if you need to reference old implementations

---

## License

MIT
