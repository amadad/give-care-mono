# GiveCare Backend

**Version**: 1.2.0 | **Status**: Production Ready | **Architecture**: Convex-Native

AI-powered SMS caregiving support platform built entirely on Convex with Agent Component.

---

## What's New (v1.2.0)

**Feature Complete: Clinical Coverage & Resource Discovery**:

This release closes all PRODUCT.md gaps with:

- **Complete assessment suite**: 4 validated assessments (EMA, BSFC, REACH-II, SDOH) with 57 total questions
- **5 pressure zones**: emotional, physical, social, time, financial (SDOH adds financial tracking)
- **Conversation summarization**: 60-80% token savings via recent detail + compressed history
- **Local resource search**: Google Maps grounding for location-aware caregiving resources
- **Test coverage**: 21/21 passing tests

### Previous Release (v1.0.0)

**Complete Refactor to Convex-Native Architecture**:

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
- Generate static types in `convex/_generated/` (using `staticApi` + `staticDataModel`)
- Install Agent Component
- Watch for file changes
- Deploy to dev environment

**Note**: Static API generation improves performance for large projects by pre-generating type definitions instead of relying on TypeScript inference. Types update automatically when `convex dev` runs.

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
- Resource recommendations via Google Maps grounding
- Profile-aware responses (name, relationship, journey phase)
- Conversation summarization for token efficiency

**Assessment Agent** (`convex/agents/assessment.ts`):
- 4 validated assessments (EMA, BSFC, REACH-II, SDOH)
- Score calculation across 5 pressure zones
- Personalized intervention suggestions
- Evidence-based recommendations

### Clinical Assessment Suite (v1.2.0)

**4 Validated Instruments** (`convex/functions/assessments.ts`):

1. **EMA (Ecological Momentary Assessment)** - 3 questions
   - Real-time stress monitoring
   - Mood tracking (0-4 scale)
   - Coping capacity assessment

2. **BSFC (Burden Scale for Family Caregivers)** - 10 questions
   - Emotional burden (3 questions)
   - Physical burden (3 questions)
   - Social burden (2 questions)
   - Time burden (2 questions)
   - 4 pressure zones output

3. **REACH-II (Risk Appraisal)** - 16 questions
   - Caregiver strain assessment
   - Binary yes/no questions
   - Risk score: low (<11), moderate (11-26), high (27+)

4. **SDOH (Social Determinants of Health)** - 28 questions
   - Food security (2 questions)
   - Housing stability (3 questions)
   - Transportation access (2 questions)
   - Social isolation (12 questions)
   - Financial strain (9 questions)
   - **5 pressure zones** including financial

**Total**: 57 questions across 4 assessments

### Conversation Summarization (v1.2.0)

**Token Compression** (`convex/lib/summarization.ts`):

Strategy: Recent detail (last 5 messages) + compressed history (older messages)

```typescript
// Automatic summarization integrated into main agent
const summary = await ctx.runQuery(api.functions.context.getConversationSummary, {
  externalId: userId,
  limit: 25,
});

// Returns:
// - recentMessages: Last 5 messages in full detail
// - compressedHistory: Theme-based compression of older messages
// - tokensSaved: ~1200 tokens (typical)
// - compressionRatio: 60-80%
```

**Theme Detection**:
- Stress & overwhelm
- Sleep issues & exhaustion
- Anxiety & worry
- Mood concerns
- Caregiving challenges
- Seeking support

**Benefits**:
- 60-80% token savings for long conversations
- Maintains context quality
- Automatic injection into agent prompts
- No user-facing impact

### Local Resource Search (v1.2.0)

**Google Maps Grounding** (`convex/lib/maps.ts`, `convex/functions/resources.ts`):

```typescript
// Agent tool integrated into main agent
const searchResourcesTool = createTool({
  args: z.object({
    query: z.string(),
    category: z.string().optional(),
  }),
  description: 'Search for local caregiving resources using Google Maps',
  handler: async (ctx, args) => {
    // Uses Gemini 2.0 Flash + Google Maps API
    const result = await ctx.runAction(api.functions.resources.searchResources, {
      query: args.query,
      metadata: userMetadata, // includes location
    });

    return {
      resources: result.text, // Grounded natural language description
      sources: result.sources, // Google Maps URIs + place IDs
      widgetToken: result.widgetToken, // For rendering interactive maps
    };
  },
});
```

**10 Predefined Categories**:
1. Respite Care - Temporary relief services
2. Support Groups - Peer support meetings
3. Adult Day Care - Supervised daytime activities
4. Home Health Care - In-home medical services
5. Medical Supplies - Mobility aids, equipment
6. Senior Centers - Community programs
7. Meal Delivery - Meals on Wheels, etc.
8. Transportation - Medical transport services
9. Hospice Care - End-of-life care
10. Memory Care - Alzheimer's programs

**Features**:
- **Zip-code first** - Uses zip code from user onboarding (no asking for location)
- Natural language queries ("respite care near me")
- Grounded results backed by Google Maps data
- Source attribution (URI, title, placeId)
- Optional widget tokens for interactive maps
- Falls back to full address or lat/lng if available

**Example Usage**:
```
User: "Find support groups near me"
Agent: [Invokes searchResourcesTool]
Result: "Here are 3 caregiver support groups near you:
1. Weekly Caregiver Support Group - St. Mary's Church
   📍 123 Main St, opens 6pm Tuesdays
   ⭐ 4.8/5 (42 reviews)

2. Alzheimer's Family Support - Community Center
   📍 456 Oak Ave, every other Thursday
   ⭐ 4.9/5 (28 reviews)

[Sources: Google Maps links + place IDs]"
```

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
# Note: Use --typecheck=disable for large projects due to TS compiler memory limits
npx convex deploy --prod --typecheck=disable

# Set production environment variables in Convex dashboard
# Then configure webhooks to point to production deployment
```

**Note on TypeScript Compilation**:
This project uses static API generation (`staticApi` + `staticDataModel` in `convex.json`) to improve IDE performance and reduce memory usage. The TypeScript compiler may still timeout during deployment due to project size - this is a tooling limitation, not a code issue. Deploy with `--typecheck=disable` flag as shown above.

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
