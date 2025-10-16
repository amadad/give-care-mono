# give-care-etl Setup Guide

Complete setup instructions for the autonomous resource discovery pipeline.

---

## Prerequisites

- **Node.js 20+** (with pnpm 9.0.0)
- **Cloudflare account** (free tier)
- **OpenAI API key** (for gpt-5, gpt-5-mini, gpt-5-nano)
- **Convex deployment** (from give-care-app)

---

## Step 1: Install Dependencies

```bash
cd give-care-etl
pnpm install
```

---

## Step 2: Set Up Cloudflare

### 2.1 Login to Cloudflare
```bash
npx wrangler login
```

### 2.2 Create KV Namespaces
```bash
# Create ETL state KV
npx wrangler kv:namespace create ETL_STATE

# Create resource cache KV
npx wrangler kv:namespace create RESOURCE_CACHE

# For production
npx wrangler kv:namespace create ETL_STATE --preview=false
npx wrangler kv:namespace create RESOURCE_CACHE --preview=false
```

Copy the IDs from the output and update `wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "ETL_STATE", id = "YOUR_ID_HERE", preview_id = "YOUR_PREVIEW_ID" },
  { binding = "RESOURCE_CACHE", id = "YOUR_ID_HERE", preview_id = "YOUR_PREVIEW_ID" }
]
```

### 2.3 Create D1 Database (optional - for local QA)
```bash
npx wrangler d1 create give-care-etl-qa

# Copy the database ID to wrangler.toml
```

### 2.4 Update Account ID
Get your account ID from the Cloudflare dashboard and update `wrangler.toml`:

```toml
account_id = "your-cloudflare-account-id"
```

---

## Step 3: Configure Environment Variables

### 3.1 Create `.dev.vars` for local development
```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
OPENAI_API_KEY=sk-proj-your-key-here
CONVEX_URL=https://agreeable-lion-831.convex.cloud
CONVEX_ADMIN_KEY=your-convex-admin-key
ENVIRONMENT=development
LOG_LEVEL=debug
```

### 3.2 Set production secrets
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put CONVEX_URL
npx wrangler secret put CONVEX_ADMIN_KEY
```

---

## Step 4: Test Locally

```bash
# Start local dev server
pnpm dev

# In another terminal, test the orchestrator
curl -X POST http://localhost:8787/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "discover_eldercare_resources",
    "state": "NY",
    "limit": 5
  }'
```

Expected response:
```json
{
  "sessionId": "orch-1234567890",
  "status": "in_progress",
  "sources": 0,
  "extracted": 0,
  "categorized": 0,
  "validated": 0,
  "errors": 0,
  "startedAt": "2025-10-16T12:00:00.000Z"
}
```

---

## Step 5: Deploy to Cloudflare Workers

```bash
# Deploy orchestrator worker
pnpm deploy

# Check deployment
npx wrangler tail
```

Your worker will be available at:
```
https://give-care-etl.your-subdomain.workers.dev
```

---

## Step 6: Enable Browser Rendering API

1. Go to Cloudflare dashboard
2. Navigate to Workers & Pages → Browser Rendering
3. Enable Browser Rendering API
4. Update `wrangler.toml` if needed:

```toml
browser = { binding = "BROWSER" }
```

---

## Step 7: Configure Cron Triggers

Cron triggers are defined in `wrangler.toml`:

```toml
[triggers]
crons = ["0 6 * * 1"] # Every Monday at 6am UTC
```

After deployment, cron triggers will automatically run weekly.

---

## Step 8: Verify Integration with give-care-app

The ETL pipeline outputs `ValidatedRecord` objects that match the `IntermediateRecord` contract in give-care-app.

To integrate:

1. **Staging**: Send ValidatedRecords to `convex/ingestion/staging.ts`
2. **Human QA**: Review in QA dashboard
3. **Production**: Approved records loaded via `convex/ingestion/shared/load.ts`

See `give-care-app/convex/ingestion/README_PRODUCTION_ETL.md` for details.

---

## Architecture Verification

After setup, verify the system architecture:

### ✅ 5 Agents Created
- [x] Orchestrator (gpt-5) - `src/agents/orchestrator.ts`
- [x] Discovery (gpt-5-mini) - `src/agents/discovery.ts`
- [x] Extraction (gpt-5-nano) - `src/agents/extraction.ts`
- [x] Categorizer (gpt-5-nano) - `src/agents/categorizer.ts`
- [x] Validator (gpt-5-nano) - `src/agents/validator.ts`

### ✅ Cloudflare Workers
- [x] Main worker - `src/workers/orchestrator.worker.ts`
- [ ] Discovery worker (TODO)
- [ ] Extraction worker (TODO)
- [ ] Categorizer worker (TODO)
- [ ] Validator worker (TODO)

### ✅ Schemas & Utilities
- [x] Extraction schema - `src/schemas/extraction.ts`
- [x] Discovery schema - `src/schemas/discovery.ts`
- [x] Categorization schema - `src/schemas/categorization.ts`
- [x] Validation schema - `src/schemas/validation.ts`
- [x] Phone validator - `src/utils/phoneValidator.ts`
- [x] URL validator - `src/utils/urlValidator.ts`
- [x] Logger - `src/utils/logger.ts`

### ✅ Taxonomy
- [x] Service types (11) - `src/shared/taxonomy.ts`
- [x] Pressure zones (5) - `src/shared/taxonomy.ts`
- [x] SERVICE_TO_ZONES mapping - `src/shared/taxonomy.ts`

---

## Next Steps (Implementation Roadmap)

### Phase 1: Core Agent Implementation (Week 1)
- [ ] Implement Discovery Agent with workers-research integration
- [ ] Implement Extraction Agent with llm-scraper-worker
- [ ] Implement Categorizer Agent (already has logic)
- [ ] Implement Validator Agent (already has logic)
- [ ] Complete Orchestrator workflow execution

### Phase 2: Worker Services (Week 2)
- [ ] Create discovery.worker.ts (service binding)
- [ ] Create extraction.worker.ts (service binding)
- [ ] Create categorizer.worker.ts (service binding)
- [ ] Create validator.worker.ts (service binding)
- [ ] Implement agent-to-agent communication

### Phase 3: QA Dashboard (Week 3)
- [ ] Build Next.js dashboard on Cloudflare Pages
- [ ] Human review workflow
- [ ] Edit/approve/reject functionality
- [ ] Integration with Convex staging

### Phase 4: Production Polish (Week 4)
- [ ] Error handling and retry logic
- [ ] Rate limiting and throttling
- [ ] Monitoring and alerting
- [ ] Documentation and testing

---

## Troubleshooting

### "EventTarget is not defined"
**Problem**: Missing Node.js APIs in agent files
**Solution**: Ensure `"use node"` directive at top of agent files

### Wrangler deployment fails
**Problem**: Missing environment variables or KV namespaces
**Solution**: Run `npx wrangler secret put` for all required secrets

### Browser Rendering API not available
**Problem**: Not enabled in Cloudflare account
**Solution**: Enable in Cloudflare dashboard → Workers & Pages → Browser Rendering

### Convex integration fails
**Problem**: Invalid CONVEX_URL or CONVEX_ADMIN_KEY
**Solution**: Verify credentials in give-care-app deployment

---

## Cost Estimates

### Cloudflare Workers (Free Tier)
- 100,000 requests/day
- 10ms CPU time per request
- **Cost**: $0 (within free tier)

### OpenAI API
- **Per 100 resources**: ~$0.17
  - Orchestrator (1 call): $0.04
  - Discovery (1 call): $0.02
  - Extraction (100 calls): $0.05
  - Categorizer (100 calls): $0.03
  - Validator (100 calls): $0.03

### Cloudflare Browser Rendering API
- First 1 million requests/month: Free
- **Cost**: $0 (within free tier)

### Total Monthly Cost
- 1,000 resources/month: $1.70
- 10,000 resources/month: $17
- 100,000 resources/month: $170

---

## Support

For questions or issues:
1. Check `README.md` for architecture overview
2. Review agent instructions in `src/agents/`
3. Check Cloudflare Workers logs: `npx wrangler tail`
4. See `give-care-app/convex/ingestion/README_PRODUCTION_ETL.md` for integration

---

**Last updated**: 2025-10-16
