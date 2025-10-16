# ETL Agents

## Phase 1 - Active Files ✅

These files are currently in use:

### Entry Point
- **`orchestrator.do.ts`** - Durable Object that handles HTTP requests and executes the pipeline

### Pipeline Orchestration
- **`pipeline.ts`** - Coordinates the 4 agents sequentially with Convex integration

### Agent Implementations (Phase 1 Simplified)
- **`discovery.simple.ts`** - Returns curated list of authoritative caregiver resource sources
- **`extraction.simple.ts`** - Uses GPT-4o-mini to extract structured data from HTML
- **`categorizer.simple.ts`** - Maps 11 service types → 5 pressure zones (rule-based)
- **`validator.simple.ts`** - Validates phones (E.164), URLs (HEAD check), assigns quality scores

## Data Flow

```
HTTP Request
    ↓
orchestrator.do.ts (Durable Object)
    ↓
pipeline.ts
    ↓
    ├─→ discovery.simple.ts → 5-10 authoritative sources
    ├─→ extraction.simple.ts → Extract records with GPT-4o-mini
    ├─→ categorizer.simple.ts → Map to pressure zones
    └─→ validator.simple.ts → Validate & score
    ↓
Convex (etlWorkflows, etlSources, etlValidatedRecords)
    ↓
Admin Dashboard (real-time updates)
```

## Phase 2 - Future Enhancements 📋

Files in `_future/` directory are placeholders for Phase 2:

- **OpenAI Agents SDK Integration** (`*.ts` files)
  - Multi-agent conversations with handoffs
  - Dynamic planning and error recovery
  - Context persistence across agent calls

- **Durable Objects per Agent** (`*.do.ts` files)
  - Persistent state for each agent type
  - Parallel execution with state management
  - More sophisticated retry logic

## Why Two Implementations?

**Phase 1 (Current)**: Simple, fast, cost-effective
- Direct function calls
- Rule-based categorization
- Single Durable Object (orchestrator only)
- **Cost**: ~$0.02 per record

**Phase 2 (Future)**: More sophisticated, handles edge cases
- OpenAI Agents SDK with handoffs
- AI-powered categorization
- Multiple Durable Objects with state
- **Cost**: ~$0.05 per record (but better quality)

Phase 1 is sufficient for 80% of use cases. Phase 2 adds sophistication for complex edge cases.

---

**Last updated**: 2025-10-16 (Phase 1 complete, Phase 2 placeholder)
