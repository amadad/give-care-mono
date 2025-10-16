# CLAUDE.md

**For AI Assistants**: This file provides guidance for working with the give-care-etl codebase.

---

## Project Overview

**give-care-etl** is an autonomous resource discovery and curation pipeline for GiveCare using:

- **OpenAI Agents SDK** v0.1.9 - Multi-agent orchestration with handoffs
- **Cloudflare Workers** - Serverless runtime (100k requests/day free)
- **Cloudflare Browser Rendering API** - Puppeteer for web scraping
- **llm-scraper-worker** - LLM-based structured extraction
- **workers-research** - Autonomous web research
- **Zod** - Schema validation for extraction

**Version**: 0.1.0 (Scaffold Complete, Implementation In Progress)

---

## Architecture

### 5-Agent System

```
Orchestrator (gpt-5) → Planning & workflow coordination
    ↓
Discovery (gpt-5-mini) → Find authoritative sources
    ↓
Extraction (gpt-5-nano) → Scrape structured data
    ↓
Categorizer (gpt-5-nano) → Map service types → pressure zones
    ↓
Validator (gpt-5-nano) → Verify phones/URLs, quality scoring
    ↓
QA Dashboard (human) → Approve/edit/reject
    ↓
Convex (staging) → Production
```

### Model Allocation Strategy

| Agent | Model | Why | Cost per 100 resources |
|-------|-------|-----|------------------------|
| Orchestrator | gpt-5 | Complex planning, error handling | $0.04 |
| Discovery | gpt-5-mini | Balanced search strategy | $0.02 |
| Extraction | gpt-5-nano | High-throughput extraction | $0.05 |
| Categorizer | gpt-5-nano | Fast classification | $0.03 |
| Validator | gpt-5-nano | Simple validation checks | $0.03 |

**Total**: ~$0.17 per 100 resources (17x cheaper than all gpt-4o)

---

## Project Structure

```
give-care-etl/
├── src/
│   ├── agents/                    # 5 agent definitions
│   │   ├── orchestrator.ts        # gpt-5 (planner)
│   │   ├── discovery.ts           # gpt-5-mini (research)
│   │   ├── extraction.ts          # gpt-5-nano (scraper)
│   │   ├── categorizer.ts         # gpt-5-nano (classifier)
│   │   └── validator.ts           # gpt-5-nano (verifier)
│   ├── workers/                   # Cloudflare Worker entry points
│   │   └── orchestrator.worker.ts # Main worker
│   ├── schemas/                   # Zod schemas for extraction
│   │   ├── extraction.ts
│   │   ├── discovery.ts
│   │   ├── categorization.ts
│   │   └── validation.ts
│   ├── shared/                    # Shared types and taxonomy
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── taxonomy.ts            # Service types + pressure zones
│   └── utils/                     # Utility functions
│       ├── phoneValidator.ts      # E.164 normalization
│       ├── urlValidator.ts        # URL HEAD checks
│       └── logger.ts              # Structured logging
├── wrangler.toml                  # Cloudflare Workers config
├── package.json
├── README.md                      # Architecture overview
├── SETUP.md                       # Complete setup guide
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

### ✅ Complete (Scaffolded)
- [x] Project structure
- [x] TypeScript types (`src/shared/types.ts`)
- [x] Taxonomy (`src/shared/taxonomy.ts`)
- [x] Zod schemas (`src/schemas/`)
- [x] Phone validator (`src/utils/phoneValidator.ts`)
- [x] URL validator (`src/utils/urlValidator.ts`)
- [x] Logger (`src/utils/logger.ts`)
- [x] Categorizer agent (complete with logic)
- [x] Validator agent (complete with logic)
- [x] Worker entry point (`src/workers/orchestrator.worker.ts`)
- [x] Wrangler config (`wrangler.toml`)
- [x] Documentation (`README.md`, `SETUP.md`, `CLAUDE.md`)

### 🚧 In Progress (Needs Implementation)
- [ ] Orchestrator agent execution (OpenAI Agents SDK integration)
- [ ] Discovery agent (workers-research integration)
- [ ] Extraction agent (llm-scraper-worker integration)
- [ ] Service worker bindings (discovery.worker.ts, etc.)
- [ ] Agent-to-agent handoffs
- [ ] Cron trigger logic

### 📋 TODO (Phase 3+)
- [ ] QA Dashboard (Next.js on Cloudflare Pages)
- [ ] Error handling and retry logic
- [ ] Rate limiting and throttling
- [ ] Monitoring and alerting
- [ ] Test suite (Vitest)

---

## Next Steps (Implementation Roadmap)

### Week 1: Core Agent Implementation
1. Implement Orchestrator workflow execution
2. Integrate workers-research for Discovery Agent
3. Integrate llm-scraper-worker for Extraction Agent
4. Test end-to-end workflow locally

### Week 2: Worker Services
1. Create discovery.worker.ts (service binding)
2. Create extraction.worker.ts (service binding)
3. Create categorizer.worker.ts (service binding)
4. Create validator.worker.ts (service binding)
5. Implement agent-to-agent communication

### Week 3: QA Dashboard
1. Build Next.js dashboard on Cloudflare Pages
2. Human review workflow (approve/edit/reject)
3. Integration with Convex staging

### Week 4: Production Polish
1. Error handling and retry logic
2. Rate limiting and throttling
3. Monitoring and alerting
4. Documentation and testing

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
1. Edit agent instructions in `src/agents/<agent>.ts`
2. Update tools array if adding new capabilities
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

**Last updated**: 2025-10-16 (Scaffold complete, implementation in progress)
