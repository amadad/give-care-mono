# give-care-etl

**Autonomous resource discovery and curation pipeline for GiveCare**

Multi-agent system using OpenAI Agents SDK + Cloudflare Workers to discover, extract, categorize, and validate caregiver support resources.

---

## Architecture

### 5-Agent System

```
Orchestrator (gpt-5) - Planning & workflow decisions
    ↓
Discovery (gpt-5-mini) - Autonomous search using workers-research
    ↓
Extraction (gpt-5-nano) - Structured scraping via llm-scraper-worker
    ↓
Categorizer (gpt-5-nano) - Service type → Pressure zone mapping
    ↓
Validator (gpt-5-nano) - Phone/URL validation + quality scoring
    ↓
QA Dashboard (human review) → Convex staging → Production
```

### Model Allocation Strategy

| Agent | Model | Why | Cost per 100 resources |
|-------|-------|-----|------------------------|
| **Orchestrator** | gpt-5 | Complex multi-step planning, error handling, workflow decisions | $0.04 |
| **Discovery** | gpt-5-mini | Balanced speed/accuracy for search strategy | $0.02 |
| **Extraction** | gpt-5-nano | High-throughput structured extraction (Zod schemas) | $0.05 |
| **Categorizer** | gpt-5-nano | Fast classification mapping (service types → zones) | $0.03 |
| **Validator** | gpt-5-nano | Simple validation checks (E.164, URL HEAD, scoring) | $0.03 |

**Total**: ~$0.17 per 100 resources (17x cheaper than all gpt-4o)

---

## Tech Stack

- **Runtime**: Cloudflare Workers (100k requests/day free)
- **Agents**: OpenAI Agents SDK v0.1.9 with multi-agent handoffs
- **Scraping**: llm-scraper-worker + workers-research
- **Browser**: Cloudflare Browser Rendering API (Puppeteer)
- **Database**: Convex (staging + production)
- **Dashboard**: Next.js on Cloudflare Pages
- **Package Manager**: pnpm@9.0.0

---

## Project Structure

```
give-care-etl/
├── src/
│   ├── agents/
│   │   ├── orchestrator.ts      # gpt-5 (planner)
│   │   ├── discovery.ts         # gpt-5-mini (research)
│   │   ├── extraction.ts        # gpt-5-nano (scraper)
│   │   ├── categorizer.ts       # gpt-5-nano (classifier)
│   │   └── validator.ts         # gpt-5-nano (verifier)
│   ├── workers/
│   │   ├── orchestrator.worker.ts  # Entry point
│   │   ├── discovery.worker.ts     # Discovery service
│   │   ├── extraction.worker.ts    # Extraction service
│   │   ├── categorizer.worker.ts   # Categorizer service
│   │   └── validator.worker.ts     # Validator service
│   ├── schemas/
│   │   ├── discovery.ts         # Search result schema
│   │   ├── extraction.ts        # IntermediateRecord schema (from give-care-app)
│   │   ├── categorization.ts    # Service type mappings
│   │   └── validation.ts        # Validation result schema
│   ├── shared/
│   │   ├── types.ts             # Shared TypeScript types
│   │   ├── taxonomy.ts          # Service types + pressure zones
│   │   └── convexClient.ts      # Convex API client
│   └── utils/
│       ├── phoneValidator.ts    # E.164 normalization
│       ├── urlValidator.ts      # URL HEAD checks
│       └── logger.ts            # Structured logging
├── qa-dashboard/                # Next.js dashboard (Cloudflare Pages)
│   ├── app/
│   ├── components/
│   └── package.json
├── wrangler.toml               # Cloudflare Workers config
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.0.0
- Cloudflare account (free tier)
- OpenAI API key
- Convex deployment URL

### Installation

```bash
# From monorepo root
cd give-care-etl
pnpm install

# Set up environment variables
wrangler secret put OPENAI_API_KEY
wrangler secret put CONVEX_DEPLOYMENT_URL
wrangler secret put CONVEX_ADMIN_KEY

# Configure Cloudflare account ID in wrangler.toml
```

### Development

```bash
# Start local dev server
pnpm dev

# Run tests
pnpm test

# Deploy to Cloudflare Workers
pnpm deploy
```

### Testing the Pipeline

```bash
# Trigger orchestrator manually
curl -X POST https://give-care-etl.your-subdomain.workers.dev/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "discover_eldercare_resources",
    "state": "NY",
    "limit": 10
  }'
```

---

## Data Flow

### 1. Orchestrator receives task
```typescript
{
  task: "discover_eldercare_resources",
  state: "NY",
  limit: 10
}
```

### 2. Discovery Agent finds sources
```typescript
{
  sources: [
    { url: "https://eldercare.acl.gov/...", type: "government" },
    { url: "https://ny.gov/aging/...", type: "state_agency" }
  ]
}
```

### 3. Extraction Agent scrapes pages
```typescript
{
  title: "NYC Dept for the Aging - Caregiver Support",
  providerName: "NYC DFTA",
  phones: ["311", "212-442-1000"],
  website: "https://www.nyc.gov/aging",
  serviceTypes: ["caregiver_support", "respite"],
  coverage: "county"
}
```

### 4. Categorizer maps zones
```typescript
{
  ...extractedData,
  zones: ["social_support", "emotional_wellbeing", "time_management"]
}
```

### 5. Validator checks quality
```typescript
{
  ...categorizedData,
  phoneE164: ["+13112", "+12124421000"],
  urlValid: true,
  qualityScore: 85,
  status: "pending_review"
}
```

### 6. Human reviews in QA Dashboard
- Approve → Convex staging → Production
- Edit → Re-validate → Review again
- Reject → Add to blocklist

---

## Agent Prompts

### Orchestrator (gpt-5)
```
You are the Orchestrator for the GiveCare resource discovery pipeline.
Your role is to plan multi-step workflows, coordinate agent handoffs, and
handle errors gracefully. You have access to 4 specialist agents:

1. Discovery Agent - Find authoritative sources
2. Extraction Agent - Scrape structured data
3. Categorizer Agent - Map service types to pressure zones
4. Validator Agent - Verify contact info and quality

When you receive a task, break it down into steps, delegate to specialists,
and ensure data flows correctly through the pipeline. Always include error
handling and quality checks.
```

### Discovery Agent (gpt-5-mini)
```
You are the Discovery Agent. Your job is to find high-quality, authoritative
sources of caregiver support resources using autonomous web research.

Use workers-research to:
1. Query DuckDuckGo for relevant sources
2. Evaluate source credibility (government, nonprofits, trusted aggregators)
3. Return a prioritized list of URLs to scrape

Prioritize: Federal agencies > State agencies > Local AAAs > Verified nonprofits
Avoid: Commercial directories, ads, low-quality content farms
```

### Extraction Agent (gpt-5-nano)
```
You are the Extraction Agent. Given a URL, extract structured resource data
using llm-scraper-worker with Zod schemas.

Extract these required fields:
- title (string)
- providerName (string)
- phones (string[])
- website (string)
- serviceTypes (string[])
- coverage ("national" | "state" | "county" | "zip")

Return data matching IntermediateRecord schema. If extraction fails, return
error details for orchestrator to handle.
```

### Categorizer Agent (gpt-5-nano)
```
You are the Categorizer Agent. Map service types to pressure zones using
the SERVICE_TO_ZONES taxonomy.

11 service types → 5 pressure zones:
- respite → [physical_health, time_management]
- support_group → [social_support, emotional_wellbeing]
- counseling → [emotional_wellbeing]
- financial_aid → [financial_concerns]
- medicare_help → [financial_concerns, time_management]
... (see src/shared/taxonomy.ts for complete mapping)

Return CategorizedRecord with zones array populated.
```

### Validator Agent (gpt-5-nano)
```
You are the Validator Agent. Verify data quality before human review.

Validation checks:
1. Phone normalization to E.164 format (+1XXXXXXXXXX)
2. URL HEAD request (200 OK? Redirects? SSL valid?)
3. Quality scoring (0-100):
   - Has phone AND website: +40 points
   - Government/nonprofit: +20 points
   - Multiple contact methods: +15 points
   - Complete address: +15 points
   - Recent lastVerified: +10 points

Return ValidatedRecord with phoneE164, urlValid, qualityScore, status.
```

---

## Taxonomy

### 11 Service Types
- `respite` - Temporary care relief
- `support_group` - Peer support
- `counseling` - Mental health
- `crisis_support` - Emergency help
- `financial_aid` - Grants, vouchers
- `medicare_help` - Medicare navigation
- `legal_planning` - Legal assistance
- `navigation` - Care coordination
- `equipment_devices` - DME
- `education_training` - Caregiver training
- `caregiver_support` - General support

### 5 Pressure Zones
- `physical_health` - Care recipient health management
- `emotional_wellbeing` - Caregiver stress, grief, isolation
- `financial_concerns` - Cost of care, benefits, planning
- `time_management` - Balancing caregiving with life
- `social_support` - Connection, community, respite

See `src/shared/taxonomy.ts` for complete mapping.

---

## Cost Analysis

**Per 100 resources**:
- Orchestrator (1 call): $0.04
- Discovery (1 call): $0.02
- Extraction (100 calls): $0.05
- Categorizer (100 calls): $0.03
- Validator (100 calls): $0.03

**Total**: ~$0.17 per 100 resources

**Monthly estimates**:
- 1,000 resources/month: $1.70
- 10,000 resources/month: $17
- 100,000 resources/month: $170

**Compare to all gpt-4o**: $2.89 per 100 resources (17x more expensive)

---

## Deployment

### Cloudflare Workers
```bash
# Deploy all workers
wrangler deploy

# Deploy specific worker
wrangler deploy --name give-care-etl-orchestrator

# View logs
wrangler tail
```

### QA Dashboard (Cloudflare Pages)
```bash
cd qa-dashboard
pnpm build
npx wrangler pages deploy out --project-name give-care-etl-qa
```

---

## Integration with give-care-app

Resources flow from ETL pipeline → QA Dashboard → Convex staging → Production:

1. **Staging**: `convex/ingestion/staging.ts` receives ValidatedRecords
2. **Human QA**: Review in dashboard, approve/edit/reject
3. **Production**: Approved records loaded via `convex/ingestion/shared/load.ts`
4. **Query API**: Resources available via `convex/functions/resourcesGeoLite.ts`

See `give-care-app/convex/ingestion/README_PRODUCTION_ETL.md` for integration details.

---

## License

MIT

---

## Related Projects

- **give-care-app**: TypeScript/Convex backend with AI agents
- **give-care-site**: Next.js marketing website
- **give-care-story**: Presentation system

Part of the [GiveCare monorepo](../README.md).
