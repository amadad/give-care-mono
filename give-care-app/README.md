# GiveCare Backend

Convex backend powering the GiveCare SMS caregiving platform. Built with:
- **Convex** (backend/database)
- **Convex Agent Component** (@convex-dev/agent)
- **Gemini 2.5 Flash-Lite** (AI model - cost-efficient, low latency)
- **Twilio** (SMS integration)
- **Stripe** (subscriptions)
- **Vitest** (testing)

## Architecture

**Unified Single-Agent System (Mira)**

Single AI agent handles all interactions:
- Conversation and emotional support
- Crisis detection and intervention
- Assessment administration (EMA, SDOH-28)
- Resource search and recommendations
- Memory management with semantic search

## Core Files

```
convex/
├── agent.ts              # Main chat handler, assessment context injection
├── agents.ts             # Mira agent definition, contextHandler, usageHandler
├── tools.ts              # All 8 agent tools with Zod schemas
├── schema.ts             # Database schema (Convex validators)
├── lib/
│   ├── prompts.ts        # System prompts, trauma principles, SMS constraints
│   ├── models.ts         # LLM model configuration
│   └── ...
├── internal/             # Internal mutations/queries
└── ...
```

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:
- `CONVEX_DEPLOYMENT` - Convex deployment URL
- `GEMINI_API_KEY` - Google Gemini API (Mira agent)
- `OPENAI_API_KEY` - OpenAI API (embeddings)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOKS_SECRET` - Stripe webhook secret

### 3. Start Development Server

```bash
npx convex dev
```

This command:
- Starts Convex backend
- Generates types in `convex/_generated/`
- Watches for file changes
- Syncs schema and functions

**Critical**: Other workspaces (admin, site) import types from `_generated/`, so run this first.

## Agent Tools

All 8 tools defined in `convex/tools.ts`:

1. **getResources** - Search caregiving resources (national → local → targeted)
2. **startAssessmentTool** - Begin EMA or SDOH-28 assessment
3. **recordAssessmentAnswerTool** - Record answer, get next question
4. **getCrisisResources** - Immediate crisis hotlines (988, text line)
5. **recordMemory** - Save important context (routines, preferences, triggers)
6. **updateProfile** - Update user profile fields (name, ZIP, timezone)
7. **findInterventions** - Recommend micro-interventions by zone
8. **checkOnboardingStatus** - Check collected data, avoid re-asking

## Key Patterns

**"use node" Directive**
- Required for files importing Vercel AI SDK
- Add at top of file: `"use node";`

**Validators**
- Schema: Convex validators (`v.string()`, `v.number()`)
- Tools: Zod schemas (`z.string()`, `z.number()`)

**Prompts**
- System prompts in `convex/lib/prompts.ts`
- Template variables: `renderPrompt(template, { var: value })`
- Trauma principles: P1-P6 (Acknowledge → Answer → Advance, etc.)

**Memory**
- Agent Component handles semantic search automatically
- Use `recordMemory` tool to save context
- Retrieved via vector search when relevant

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- stripe.test.ts

# Watch mode
npm test -- --watch
```

**Test Principles**:
- No mocking - real Convex environment only
- Tests in `tests/internal/` and `tests/lib/`

## Agent Playground

Interactive UI for testing and debugging Mira agent in real-time.

### Setup

The playground is configured in `convex/playground.ts` and exposes these APIs:
- `isApiKeyValid` - Validate API keys
- `listAgents` - List available agents (Mira)
- `listUsers` - Browse users with threads
- `listThreads` - View user conversation threads
- `listMessages` - Inspect thread messages and tool calls
- `createThread` - Start new conversation
- `generateText` - Send messages and see responses
- `fetchPromptContext` - Debug context loading

### Generate API Key

**For Development:**
```bash
npx convex run --component agent apiKeys:issue '{name:"playground-dev"}'
```

**For Production:**
```bash
npx convex run --component agent apiKeys:issue '{name:"playground-prod"}' --prod
```

Note: Deploy playground to prod first with `npx convex deploy` before generating prod key.

### Access Playground

**Option 1: Local (Recommended)**
```bash
npx @convex-dev/agent-playground
```

Opens at `http://localhost:4174/` with auto-detected Convex URL from `.env.local`

**Option 2: Hosted**

Visit: https://get-convex.github.io/agent/

Manually configure:
- Deployment URL: From `.env.local` (`VITE_CONVEX_URL`)
- Playground API Path: `playground`
- API Key: From generation command above

### Using the Playground

1. **Select User** - Browse users who have threads
2. **View Threads** - See conversation history
3. **Inspect Messages** - View message content, tool calls, metadata
4. **Test Context** - Adjust context options (recent messages, search, etc.)
5. **Send Messages** - Try different prompts, see token usage
6. **Debug Tools** - See which tools are called and why

### Playground Features

**Context Options:**
- `recentMessages` - Number of recent messages to include
- `excludeToolMessages` - Hide tool call details from context
- `searchOtherThreads` - Search across user's other conversations
- `searchOptions.limit` - Max search results
- `searchOptions.vectorSearch` - Semantic search
- `searchOptions.textSearch` - Keyword search
- `messageRange` - Context padding (before/after)

**Useful for:**
- Testing prompt changes before deploying
- Debugging why agent called specific tools
- Inspecting token usage per message
- Viewing full conversation context
- Testing edge cases safely

## Deployment

### Deploy to Production

```bash
npx convex deploy
```

### Deploy with Typecheck Disabled

For large projects with TypeScript timeout issues:

```bash
npx convex deploy --typecheck=disable
```

### Skip Confirmation

```bash
npx convex deploy --yes
```

## Common Issues

**Missing types**: Run `npx convex dev` to generate `_generated/`

**EventTarget error**: Add `"use node"` directive to file

**Code not updating**: Touch parent file or run `npx convex dev --once`

**TypeScript timeout**: Use `--typecheck=disable` flag (static API generation enabled)

## Database Schema

Key tables:
- `users` - User profiles, scores, zones
- `assessments` - Completed EMA/SDOH assessments
- `scores` - Burnout scores (raw + normalized)
- `score_history` - Score changes over time
- `assessment_sessions` - In-progress assessments
- `interventions` - Evidence-based micro-interventions
- `memories` - User context with importance ratings
- `events` - Generic event log for learning loop
- `subscriptions` - Stripe subscriptions
- `alerts` - Crisis alerts and notifications

See `convex/schema.ts` for full schema.

## SMS Constraints

Mira operates under SMS constraints:
- ≤160 characters per message (SMS segment limit)
- 12-16 words max, one idea per message
- One question at a time
- Warm, empathetic tone
- Acknowledge feelings first (P1)
- Deliver value every turn (P6)

## Trauma-Informed Principles (P1-P6)

- **P1**: Acknowledge → Answer → Advance (validate feelings first)
- **P2**: Never repeat questions (respects time)
- **P3**: Respect boundaries (2 attempts max, then pause)
- **P4**: Soft confirmations ("Got it: Nadia, right?")
- **P5**: Skip is always available (users can defer any request)
- **P6**: Deliver value every turn (validation, tip, resource, progress)

## Documentation

- `CHANGELOG.md` - Version history and changes
- `/CLAUDE.md` (monorepo root) - Development guidelines
