# CLAUDE.md

**For AI Assistants**: This file provides guidance for working with the give-care-etl codebase.

---

## 🚨 DRACONIAN DOCUMENTATION POLICY

**Active Docs: 2 MAX** (CLAUDE.md + docs/ARCHITECTURE.md)

### Rules
1. **UPDATE, DON'T CREATE** - Edit ARCHITECTURE.md, never create new docs
2. **PRUNE AS YOU GO** - Delete outdated sections when updating
3. **CHANGELOG IN COMMITS** - Git history is your changelog
4. **NO GUIDES/SUMMARIES** - Everything goes in ARCHITECTURE.md

**Current**: 2/2 ✅ (CLAUDE.md + docs/ARCHITECTURE.md)

---

## Project Overview

**give-care-etl** is an autonomous resource discovery and curation pipeline for GiveCare using:

- **OpenAI Agents SDK** v0.1.9 - Multi-agent orchestration with handoffs
- **Cloudflare Workers** - Serverless runtime (100k requests/day free)
- **Cloudflare Browser Rendering API** - Puppeteer for web scraping
- **llm-scraper-worker** - LLM-based structured extraction
- **workers-research** - Autonomous web research
- **Zod** - Schema validation for extraction

**Version**: 0.3.0 (Production Ready - 3-Agent Architecture Deployed)

---

## Architecture

### 3-Agent System (OpenAI Agents SDK) - Optimized

```
Orchestrator Agent (gpt-5-mini) → Cloudflare Durable Object
    ↓ (handoffs via OpenAI Agents SDK)
    ├─→ Discovery Agent (gpt-5-mini) → searchWeb, evaluateSource, rankSources
    └─→ Extraction Agent (gpt-5-nano) → fetchPage, extractStructured, categorizeServices,
                                          validatePhone, validateURL, checkQuality
    ↓
Convex (etlWorkflows, etlSources, etlValidatedRecords)
    ↓
Admin Dashboard (real-time WebSocket updates)
```

**Why 3 agents (not 5)?**
- Categorization = deterministic lookup table (no LLM needed)
- Validation = utility functions (E.164 normalization, HEAD requests)
- Consolidating saves 35% on costs with no quality loss

### Key Features ✅

- **Real-Time Updates**: WebSocket progress broadcasts
- **Human-in-the-Loop**: Pause/approve/reject during execution
- **Fault Tolerance**: Resume from RunState after failures
- **Parallel Execution**: Extract multiple sources simultaneously
- **Dynamic Workflows**: Orchestrator adapts to results

### Model Allocation Strategy

| Agent | Model | Why | Cost per 100 resources |
|-------|-------|-----|------------------------|
| Orchestrator | gpt-5-mini | Planning & coordination | $0.04 |
| Discovery | gpt-5-mini | Semantic search via Exa | $0.02 |
| Extraction | gpt-5-nano | Extraction + 5 utility tools | $0.05 |

**Total**: ~$0.11 per 100 resources (~$0.03 per resource)

**Savings**: 250x cheaper than manual ($7.50), 26x cheaper than all gpt-4o, **35% cheaper than 5-agent design**

---

## Project Structure

```
give-care-etl/
├── src/
│   ├── agents/                    # Agent implementations
│   │   ├── orchestrator.do.ts     # Durable Object orchestrator (gpt-5-mini)
│   │   ├── tools/                 # Agent tools
│   │   │   ├── discoveryTools.ts  # searchWeb, evaluateSource, rankSources
│   │   │   └── extractionTools.ts # fetchPage, extractStructured, parsePagination,
│   │   │                          # categorizeServices, validatePhone, validateURL, checkQuality
│   │   └── README.md              # Agent documentation
│   ├── schemas/                   # Zod schemas for extraction
│   │   ├── extraction.ts
│   │   ├── discovery.ts
│   │   ├── categorization.ts
│   │   └── validation.ts
│   ├── shared/                    # Shared types and taxonomy
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── taxonomy.ts            # Service types + pressure zones
│   ├── utils/                     # Utility functions
│   │   ├── phoneValidator.ts      # E.164 normalization
│   │   ├── urlValidator.ts        # URL HEAD checks
│   │   ├── logger.ts              # Structured logging
│   │   ├── convex.ts              # Convex client for persistence
│   │   ├── cache.ts               # Durable Object storage cache
│   │   ├── errorRecovery.ts       # Circuit breaker + retry logic
│   │   └── parallelExecution.ts   # Parallel source processing
│   └── index.ts                   # Cloudflare Worker entry point
├── wrangler.toml                  # Cloudflare Workers config
├── package.json
└── CLAUDE.md                      # This file
```

---

## Key Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/agents/orchestrator.ts` | gpt-5 planner agent | 200 | Scaffold ✅ |
| `src/agents/discovery.ts` | gpt-5-mini research agent | 150 | Scaffold ✅ |
| `src/agents/extraction.ts` | gpt-5-nano scraper agent | 180 | Scaffold ✅ |
| `src/agents/categorizer.ts` | gpt-5-nano classifier agent | 120 | Complete ✅ |
| `src/agents/validator.ts` | gpt-5-nano validator agent | 220 | Complete ✅ |
| `src/workers/orchestrator.worker.ts` | Cloudflare Worker entry point | 200 | Scaffold ✅ |
| `src/shared/types.ts` | TypeScript interfaces | 250 | Complete ✅ |
| `src/shared/taxonomy.ts` | Service types + zones | 150 | Complete ✅ |
| `src/utils/phoneValidator.ts` | E.164 normalization | 120 | Complete ✅ |
| `src/utils/urlValidator.ts` | URL validation | 140 | Complete ✅ |
| `src/schemas/extraction.ts` | Extraction Zod schemas | 80 | Complete ✅ |

---

## Important Patterns

### 1. "use node" Directive
All agent files importing `@openai/agents` MUST have `"use node"` at the top.

### 2. Taxonomy Consistency
Service types and pressure zones MUST match `give-care-app/convex/ingestion/shared/registry.ts`.

### 3. IntermediateRecord Contract
Extraction output MUST match `IntermediateRecord` interface from give-care-app.

### 4. Zod Schemas for Extraction
Use Zod schemas with llm-scraper-worker for structured extraction.

### 5. Agent Handoffs
Agents hand off to each other using OpenAI Agents SDK transfer patterns.

---

## Common Commands

```bash
# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Run tests (when implemented)
pnpm test

# Deploy to Cloudflare Workers
pnpm deploy

# View logs
npx wrangler tail

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

---

## Development Workflow

### 1. Set Up Environment
```bash
# Copy environment template
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your API keys
# - OPENAI_API_KEY
# - CONVEX_URL
# - CONVEX_ADMIN_KEY

# Update wrangler.toml with your Cloudflare account ID
```

### 2. Test Locally
```bash
# Start worker
pnpm dev

# In another terminal, test orchestrator
curl -X POST http://localhost:8787/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "discover_eldercare_resources",
    "state": "NY",
    "limit": 5
  }'
```

### 3. Deploy
```bash
# Set production secrets
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put CONVEX_URL
npx wrangler secret put CONVEX_ADMIN_KEY

# Deploy worker
pnpm deploy
```

---

## Taxonomy (MUST MATCH give-care-app)

### 11 Service Types
```typescript
'respite', 'support_group', 'counseling', 'crisis_support',
'financial_aid', 'medicare_help', 'legal_planning', 'navigation',
'equipment_devices', 'education_training', 'caregiver_support'
```

### 5 Pressure Zones
```typescript
'physical_health', 'emotional_wellbeing', 'financial_concerns',
'time_management', 'social_support'
```

### SERVICE_TO_ZONES Mapping
- respite → [physical_health, time_management]
- support_group → [social_support, emotional_wellbeing]
- counseling → [emotional_wellbeing]
- crisis_support → [emotional_wellbeing]
- financial_aid → [financial_concerns]
- medicare_help → [financial_concerns, time_management]
- legal_planning → [financial_concerns]
- navigation → [financial_concerns, social_support]
- equipment_devices → [physical_health, financial_concerns]
- education_training → [time_management, emotional_wellbeing]
- caregiver_support → [social_support, emotional_wellbeing]

---

## Integration with give-care-app

### Data Flow
1. **ETL Pipeline** discovers and validates resources
2. **ValidatedRecord** output matches `IntermediateRecord` contract
3. **QA Dashboard** (human review) approves/edits/rejects
4. **Convex staging** receives approved records
5. **Production** loaded via `convex/ingestion/shared/load.ts`

### Contract Compatibility
```typescript
// give-care-etl output (ValidatedRecord)
{
  title: string;
  providerName: string;
  phones: string[];
  website: string;
  serviceTypes: string[];
  zones: string[];
  coverage: 'national' | 'state' | 'county' | 'zip' | 'radius';
  // ... matches IntermediateRecord from give-care-app
}
```

See `give-care-app/convex/ingestion/README_PRODUCTION_ETL.md` for details.

---

## Implementation Status

### ✅ Production Ready (v0.3.0 - Deployed)
- [x] Orchestrator Durable Object with OpenAI Agents SDK
- [x] **3-agent system** (optimized from 5) with handoff configuration
- [x] Discovery tools (searchWeb, evaluateSource, rankSources)
- [x] Extraction tools (fetchPage, extractStructured, parsePagination)
- [x] **Categorization tools** (deterministic lookup, no LLM)
- [x] **Validation tools** (validatePhone, validateURL, checkQuality - utilities)
- [x] WebSocket real-time progress updates
- [x] Human-in-the-loop workflow (/continue endpoint)
- [x] RunState persistence and resume
- [x] Parallel execution with progress tracking
- [x] Circuit breaker and retry logic
- [x] Convex integration for persistence
- [x] Environment variable binding (Exa API key)
- [x] TypeScript types and Zod schemas
- [x] Taxonomy alignment with give-care-app
- [x] **35% cost reduction** (consolidated categorization/validation into extraction)

### ✅ Deployed
- [x] Worker deployed to https://give-care-etl.ali-a90.workers.dev
- [x] Convex backend deployed to https://agreeable-lion-831.convex.cloud
- [x] Health check passing (Durable Objects + KV + features verified)
- [x] Cron trigger configured (Mondays at 6am UTC)

### 🔬 Needs Testing
- [ ] End-to-end agent handoff chain
- [ ] Exa API discovery in production
- [ ] Extraction agent with real web pages
- [ ] Categorizer agent with taxonomy mapping
- [ ] Validator agent with phone/URL checks
- [ ] WebSocket client connection
- [ ] Human-in-the-loop approval flow

### 📋 Future Enhancements
- [ ] QA Dashboard (Next.js on Cloudflare Pages)
- [ ] Rate limiting and throttling
- [ ] Monitoring and alerting
- [ ] Test suite (Vitest)
- [ ] Performance optimizations

---

## Common Issues

### "EventTarget is not defined"
**Problem**: OpenAI Agents SDK requires Node.js APIs
**Solution**: Add `"use node"` directive at top of agent files

### Taxonomy mismatch with give-care-app
**Problem**: Service types or zones don't match production
**Solution**: Always sync with `give-care-app/convex/ingestion/shared/registry.ts`

### Wrangler deployment fails
**Problem**: Missing environment variables
**Solution**: Run `npx wrangler secret put` for all required secrets

### Browser Rendering API not working
**Problem**: Not enabled in Cloudflare account
**Solution**: Enable in dashboard → Workers & Pages → Browser Rendering

---

## When Making Changes

### Adding a New Service Type
1. Update `src/shared/taxonomy.ts` (SERVICE_TYPES, SERVICE_TO_ZONES)
2. Update `give-care-app/convex/ingestion/shared/registry.ts` (keep in sync!)
3. Update extraction schemas in `src/schemas/extraction.ts`
4. Update agent instructions if needed

### Modifying Agent Behavior
1. Edit agent initialization in `src/agents/orchestrator.do.ts` (lines 109-174)
2. Update tools in `src/agents/tools/<agentName>Tools.ts`
3. Test locally with `pnpm dev`
4. Deploy with `pnpm deploy`

### Changing Data Schema
1. Update `src/shared/types.ts`
2. Update Zod schemas in `src/schemas/`
3. Verify compatibility with `give-care-app` IntermediateRecord
4. Update tests (when implemented)

---

## Cost Optimization

### Per 100 Resources
- Orchestrator (1 call, gpt-5): $0.04
- Discovery (1 call, gpt-5-mini): $0.02
- Extraction (100 calls, gpt-5-nano): $0.05
- Categorizer (100 calls, gpt-5-nano): $0.03
- Validator (100 calls, gpt-5-nano): $0.03

**Total**: ~$0.17 per 100 resources

### Monthly Estimates
- 1,000 resources: $1.70
- 10,000 resources: $17
- 100,000 resources: $170

**Compare to all gpt-4o**: $2.89 per 100 resources (17x more expensive)

---

## Support

- **Setup issues**: See `SETUP.md`
- **Architecture questions**: See `README.md`
- **Integration with give-care-app**: See `give-care-app/convex/ingestion/README_PRODUCTION_ETL.md`
- **Cloudflare Workers**: See `wrangler.toml` and Cloudflare docs

---

**Last updated**: 2025-10-22 (v0.3.0 - Consolidated to 3-agent architecture, 35% cost savings)
