# GiveCare ETL - Autonomous Resource Discovery

## Quick Start

```bash
pnpm install                # Install dependencies
pnpm dev                    # Start local dev server
pnpm deploy                 # Deploy to Cloudflare Workers
npx wrangler tail          # View logs
```

## Tech Stack

- **OpenAI Agents SDK** v0.1.9 - Multi-agent orchestration
- **Cloudflare Workers** - Serverless runtime
- **Cloudflare Browser Rendering API** - Puppeteer for scraping
- **Zod** - Schema validation

**Version**: 0.3.0 (Production Ready)

## Architecture

### 3-Agent System (Optimized - 35% cost savings)

```
Orchestrator (gpt-5-mini) → Cloudflare Durable Object
    ↓
Discovery Agent (gpt-5-mini) → searchWeb, evaluateSource, rankSources
    ↓
Extraction Agent (gpt-5-nano) → fetchPage, extractStructured, categorizeServices

→ Convex (etlWorkflows, etlSources, etlValidatedRecords)
```

**Why 3 agents**: Categorization = lookup table, Validation = utilities (no LLM needed)

## Critical Patterns

### Files importing `@openai/agents` MUST have `"use node"` directive
### Service types and zones MUST match `give-care-app/convex/ingestion/shared/registry.ts`
### Extraction output MUST match `IntermediateRecord` interface
### Use Zod schemas with llm-scraper-worker

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/agents/orchestrator.do.ts` | Durable Object orchestrator | 200 |
| `src/agents/tools/discoveryTools.ts` | Web research tools | 150 |
| `src/agents/tools/extractionTools.ts` | Scraper + validation tools | 180 |
| `src/shared/types.ts` | TypeScript interfaces | 250 |
| `src/shared/taxonomy.ts` | Service types + zones | 150 |
| `src/utils/phoneValidator.ts` | E.164 normalization | 120 |
| `src/utils/urlValidator.ts` | URL validation | 140 |

## Taxonomy (MUST MATCH give-care-app)

**Service Types (11)**: respite, support_group, counseling, crisis_support, financial_aid, medicare_help, legal_planning, navigation, equipment_devices, education_training, caregiver_support

**Pressure Zones (5)**: physical_health, emotional_wellbeing, financial_concerns, time_management, social_support

## Environment Variables

Required for deployment:
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put CONVEX_URL
npx wrangler secret put CONVEX_ADMIN_KEY
```

See `.dev.vars.example` for local development.

## Common Issues

**EventTarget error**: Add `"use node"` directive to agent files
**Taxonomy mismatch**: Sync with `give-care-app/convex/ingestion/shared/registry.ts`
**Deployment fails**: Set secrets with `npx wrangler secret put`
**Browser API not working**: Enable in Cloudflare dashboard → Workers & Pages

## Cost Optimization

**Per 100 resources**: ~$0.11 (Orchestrator $0.04 + Discovery $0.02 + Extraction $0.05)
**Monthly**: 1K resources = $1.70, 10K = $17, 100K = $170
**Savings**: 250x vs manual, 35% vs 5-agent design

## Documentation

See `docs/ARCHITECTURE.md` for detailed system design and integration patterns.

## Documentation Policy

**Active Docs: 2 MAX** (CLAUDE.md + docs/ARCHITECTURE.md)

### Rules
- UPDATE, DON'T CREATE
- PRUNE AS YOU GO
- CHANGELOG IN COMMITS
