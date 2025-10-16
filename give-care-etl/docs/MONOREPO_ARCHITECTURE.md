# Monorepo Architecture for give-care-etl

How give-care-etl integrates with the GiveCare monorepo.

---

## Directory Structure

```
givecare/ (monorepo root)
├── give-care-app/           # TypeScript backend + admin
├── give-care-site/          # Next.js marketing site
├── give-care-story/         # Presentations
└── give-care-etl/          # Resource discovery pipeline ← NEW
    ├── src/
    │   ├── agents/          # 5 agents (imported as modules)
    │   ├── workers/         # Cloudflare Worker entry point
    │   ├── schemas/         # Zod schemas
    │   ├── shared/          # Types & taxonomy
    │   └── utils/           # Validators, logger
    └── wrangler.toml        # Cloudflare config
```

---

## Module Import Strategy

### ✅ Direct Imports (Monorepo)

Since all projects are in the same monorepo, agents import directly:

```typescript
// src/workers/orchestrator.worker.ts
import { executeDiscoveryWorkflow } from '../agents/discovery';
import { executeExtractionWorkflow } from '../agents/extraction';
import { executeCategorizationWorkflow } from '../agents/categorizer';
import { executeValidationWorkflow } from '../agents/validator';

// All agents are local modules - no service bindings needed!
```

### ❌ NOT Using Service Bindings

We don't need Cloudflare Workers for Platforms service bindings because:
1. All code is in the same monorepo
2. All agents are imported as TypeScript modules
3. Everything bundles into a single worker
4. Simpler deployment (one worker, not five)

---

## Shared Dependencies with give-care-app

### Taxonomy Compatibility

`give-care-etl` shares taxonomy with `give-care-app`:

```typescript
// give-care-etl/src/shared/taxonomy.ts
export const SERVICE_TO_ZONES: Record<ServiceType, PressureZone[]> = {
  respite: ['physical_health', 'time_management'],
  // ... matches give-care-app/convex/ingestion/shared/registry.ts
};
```

**Important**: Keep these files in sync manually or use workspace imports.

### Type Compatibility

`ValidatedRecord` from give-care-etl matches `IntermediateRecord` from give-care-app:

```typescript
// give-care-etl output
interface ValidatedRecord extends IntermediateRecord {
  phoneE164?: string[];
  urlValid: boolean;
  qualityScore: number;
  status: 'approved' | 'pending_review' | 'rejected';
}

// give-care-app input
interface IntermediateRecord {
  title: string;
  providerName: string;
  phones?: string[];
  website?: string;
  serviceTypes: string[];
  zones: string[];
  coverage: 'national' | 'state' | 'county' | 'zip' | 'radius';
  // ... matches perfectly ✅
}
```

---

## Workspace Configuration (Optional)

If you want to share code between projects, add workspace imports:

### Option 1: pnpm Workspace (Recommended)

Add to root `pnpm-workspace.yaml`:
```yaml
packages:
  - 'give-care-app'
  - 'give-care-site'
  - 'give-care-story'
  - 'give-care-etl'  # ← Add this
```

Then import shared types:
```typescript
// In give-care-etl
import type { IntermediateRecord } from 'give-care-app/convex/ingestion/shared/types';
```

### Option 2: Keep Separate (Current Setup)

Copy shared types/taxonomy manually:
- `give-care-etl/src/shared/types.ts` ← Copy from give-care-app
- `give-care-etl/src/shared/taxonomy.ts` ← Copy from give-care-app

**Trade-off**: Manual sync required, but simpler deployment.

---

## Deployment Strategy

### Single Worker Deployment

Everything bundles into one worker:

```bash
cd give-care-etl
pnpm deploy
```

Wrangler bundles:
- All 5 agents (orchestrator, discovery, extraction, categorizer, validator)
- All utilities (phone validator, URL validator, logger)
- All schemas (Zod definitions)
- Main worker entry point

**Result**: One deployed worker with all functionality.

### Why Not Multiple Workers?

We could deploy separate workers:
- `give-care-etl-orchestrator.workers.dev`
- `give-care-etl-discovery.workers.dev`
- `give-care-etl-extraction.workers.dev`
- etc.

But this adds complexity:
- 5 deployments instead of 1
- Service bindings between workers
- More complex debugging
- No performance benefit (agents are fast)

**Decision**: Keep everything in one worker for simplicity.

---

## Integration with give-care-app

### Data Flow

```
1. give-care-etl (Cloudflare Worker)
   ↓ Discovers resources
   ↓ Validates & scores
   ↓ Outputs ValidatedRecord

2. Store in KV or D1 (temporary)
   ↓

3. QA Dashboard (Next.js - future)
   ↓ Human review
   ↓ Approve/edit/reject

4. Push to Convex (give-care-app)
   ↓ Call convex/ingestion/staging.ts
   ↓ Use normalizeRecord() & loadNormalizedRecords()

5. Production (give-care-app)
   ↓ Resources queryable via resourcesGeoLite.ts
   ↓ Available to users via SMS
```

### API Integration

```typescript
// In give-care-etl worker
async function pushToConvex(record: ValidatedRecord) {
  const convexUrl = env.CONVEX_URL;
  const adminKey = env.CONVEX_ADMIN_KEY;

  // Call Convex staging mutation
  const response = await fetch(`${convexUrl}/api/mutations/ingestion/staging/addResource`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminKey}`
    },
    body: JSON.stringify({
      intermediateRecord: record
    })
  });

  return response.json();
}
```

---

## Development Workflow

### Local Development

```bash
# Terminal 1: give-care-app (backend)
cd give-care-app
npx convex dev

# Terminal 2: give-care-etl (ETL pipeline)
cd give-care-etl
pnpm dev

# Terminal 3: Test
curl -X POST http://localhost:8787/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"task":"discover_eldercare_resources","state":"NY","limit":5}'
```

### Testing Integration

1. Run ETL pipeline locally → generates ValidatedRecords
2. Save to KV or return as JSON
3. Manually test with Convex staging
4. Verify resources appear in give-care-app

---

## Environment Variables

### give-care-etl (.dev.vars)
```
OPENAI_API_KEY=sk-proj-...
CONVEX_URL=https://agreeable-lion-831.convex.cloud
CONVEX_ADMIN_KEY=your-admin-key
ENVIRONMENT=development
LOG_LEVEL=debug
```

### give-care-app (.env.local)
```
CONVEX_DEPLOYMENT=https://agreeable-lion-831.convex.cloud
OPENAI_API_KEY=sk-proj-...
```

Both projects share:
- Same Convex deployment
- Same OpenAI API key (or separate keys for cost tracking)

---

## Cost Allocation

### By Project
- **give-care-app**: SMS users, agent conversations (~$X/month)
- **give-care-etl**: Resource discovery (~$0.17 per 100 resources)

### By Service
- **OpenAI API**: Separate keys per project for tracking
- **Convex**: Single deployment, shared database
- **Cloudflare**: Workers free tier (100k req/day)

---

## File Sharing Strategy

### Shared Files (Keep in Sync)

| File | give-care-app | give-care-etl | Sync Strategy |
|------|---------------|---------------|---------------|
| Service types | `convex/ingestion/shared/registry.ts` | `src/shared/taxonomy.ts` | Manual copy |
| IntermediateRecord | `convex/ingestion/shared/types.ts` | `src/shared/types.ts` | Manual copy |
| Phone validator | `convex/ingestion/shared/validation.ts` | `src/utils/phoneValidator.ts` | Manual copy |

### Project-Specific Files (No Sharing)

| File | Project | Purpose |
|------|---------|---------|
| `src/agents/` | give-care-etl | OpenAI Agents SDK agents |
| `src/workers/` | give-care-etl | Cloudflare Worker entry point |
| `convex/twilio.ts` | give-care-app | SMS handler |
| `src/agents.ts` | give-care-app | Conversational agents |

---

## Advantages of Monorepo Approach

✅ **Simplicity**: All code in one place, easy to reference
✅ **Shared types**: TypeScript ensures compatibility
✅ **Single deployment**: One `pnpm deploy` for ETL pipeline
✅ **Easier debugging**: Can trace from ETL → Convex → SMS
✅ **Consistent tooling**: Same TypeScript, ESLint, Prettier config

---

## When to Split into Separate Repos

Consider splitting if:
- ETL pipeline needs separate team/ownership
- Different release cadence required
- Want stricter API boundaries
- Scaling to multiple data sources (each with own repo)

For now, monorepo is the right choice.

---

## Next Steps

1. ✅ Scaffold complete (monorepo structure)
2. 🚧 Implement agent execution (Phase 1)
3. 📋 Build QA dashboard (Phase 3)
4. 📋 Integrate with Convex staging (Phase 3)
5. 📋 Deploy to production

---

**Last updated**: 2025-10-16
