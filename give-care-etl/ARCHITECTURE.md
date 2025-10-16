# ETL Pipeline Architecture

## Overview

Automated resource discovery and curation pipeline for GiveCare caregiver support resources.

**Goal**: Discover, extract, categorize, and validate caregiver resources from authoritative sources across all 50 states.

---

## Current State (Phase 1 - MVP)

### What's Working ✅
- **Orchestrator**: Durable Object that coordinates workflow execution
- **Discovery**: Returns curated list of 5 national + 2-3 state sources (hardcoded)
- **Extraction**: Fetches HTML + uses GPT-4o-mini to extract structured data
- **Categorizer**: Maps 11 service types → 5 pressure zones (rule-based)
- **Validator**: Normalizes phones to E.164, validates URLs, assigns quality scores (0-100)
- **Dashboard**: Real-time updates with expandable workflow details

### What's NOT Working ❌
- **Discovery is hardcoded** - Only works for NY, CA, TX (not scalable)
- **Extraction is manual** - Raw HTML parsing instead of using llm-scraper-worker
- **No dynamic search** - Not using DuckDuckGo or workers-research
- **OpenAI API errors** - Current extraction failing (API key issue being debugged)

### Cost
- **Current**: ~$0.02 per record (GPT-4o-mini extraction)
- **Manual baseline**: $7.50 per record (30 min @ $15/hr)
- **Savings**: 375x cheaper than manual entry

---

## Planned Architecture (Phase 2)

### Tools & Technologies

#### Discovery Agent
**Tools:**
- **DuckDuckGo JSON API** (`https://duckduckgo.com/?q={query}&format=json`)
  - Free, no API key required
  - Returns instant answers, related topics, abstract
  - Use for: "caregiver support [state]", "respite care [city]", "eldercare services [county]"

- **workers-research** (Cloudflare package)
  - Autonomous web research agent
  - Multi-step searches with citations
  - Use for: Complex queries requiring multiple searches

- **Google Custom Search API** (fallback)
  - 100 queries/day free, then $5/1000 queries
  - More comprehensive than DuckDuckGo
  - Use for: When DDG doesn't return enough results

**Output**: List of 10-20 URLs ranked by credibility score (0-100)

#### Extraction Agent
**Tools:**
- **llm-scraper-worker** ([npm](https://www.npmjs.com/package/llm-scraper-worker))
  - Cloudflare Worker optimized for LLM-based scraping
  - Uses Zod schemas for type safety
  - Built-in retry logic and rate limiting
  - Handles pagination automatically

- **Cloudflare Browser Rendering API**
  - Puppeteer in Cloudflare Workers
  - For JavaScript-heavy sites (React, Angular, etc.)
  - Costs: $5 per 1000 renders

- **GPT-4o-mini** (current approach)
  - Fallback for simple HTML extraction
  - Faster and cheaper than llm-scraper for basic pages

**Output**: IntermediateRecord with all fields extracted

#### Categorizer Agent
**Current**: Rule-based mapping (SERVICE_TO_ZONES)
**Phase 2**: GPT-4o-mini with few-shot examples for edge cases

#### Validator Agent
**Current**: E.164 phone normalization + HEAD request URL validation
**Phase 2**:
- Twilio Lookup API for phone verification ($0.005/lookup)
- Email validation with SMTP check
- Address geocoding with Google Maps API

---

## Data Flow

### Phase 1 (Current)
```
User triggers workflow via dashboard
    ↓
Orchestrator DO creates workflow in Convex
    ↓
pipeline.ts executes sequentially:
    ├─→ discovery.simple.ts → Returns hardcoded 5-7 sources
    ├─→ extraction.simple.ts → Fetch HTML + GPT-4o-mini extraction
    ├─→ categorizer.simple.ts → Rule-based SERVICE_TO_ZONES mapping
    └─→ validator.simple.ts → Phone/URL validation + quality scoring
    ↓
Convex (etlWorkflows, etlSources, etlValidatedRecords)
    ↓
Admin Dashboard shows real-time progress
    ↓
Human QA review (approve/reject/edit)
    ↓
Approved records → Production resources table
```

### Phase 2 (Planned)
```
User triggers workflow OR Cron schedule
    ↓
Orchestrator Agent (OpenAI Agents SDK)
    ↓
Discovery Agent (autonomous):
    ├─→ DuckDuckGo JSON API ("caregiver support NY")
    ├─→ Extract URLs from results
    ├─→ Score credibility (government = 95, nonprofit = 85, etc.)
    └─→ Return top 20 sources
    ↓
Extraction Agent (parallel):
    ├─→ For each source URL:
    │   ├─→ Check if JavaScript-heavy → Use Browser Rendering API
    │   ├─→ Else → Use llm-scraper-worker with Zod schema
    │   └─→ Fallback to GPT-4o-mini if scraper fails
    └─→ Return IntermediateRecord[]
    ↓
Categorizer Agent:
    ├─→ Check SERVICE_TO_ZONES map first (fast path)
    └─→ If uncertain → Use GPT-4o-mini with few-shot examples
    ↓
Validator Agent:
    ├─→ Twilio Lookup API for phone verification
    ├─→ URL validation with redirects
    ├─→ Email SMTP check
    └─→ Quality scoring + status assignment
    ↓
Convex persistence
    ↓
Dashboard QA review
```

---

## Agent Breakdown

### 1. Discovery Agent

**Responsibility**: Find authoritative sources of caregiver resources

**Current Implementation** (`discovery.simple.ts`):
```typescript
// Hardcoded list
const AUTHORITATIVE_SOURCES = {
  national: [
    { url: "https://eldercare.acl.gov/...", credibilityScore: 95 },
    { url: "https://www.caregiver.org/...", credibilityScore: 90 },
    // ... 5 national sources
  ],
  NY: [
    { url: "https://aging.ny.gov/...", credibilityScore: 95 },
    // ... 2 NY sources
  ]
}
```

**Phase 2 Implementation** (`discovery.ts` with OpenAI Agents SDK):
```typescript
async function discoverWithDuckDuckGo(query: string) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
  const response = await fetch(url);
  const data = await response.json();

  // Extract URLs from:
  // - data.AbstractURL (main result)
  // - data.RelatedTopics[].FirstURL
  // - data.Results[].FirstURL

  return urls.map(url => ({
    url,
    credibilityScore: scoreCredibility(url), // gov = 95, .org = 85, etc.
    sourceType: detectSourceType(url)
  }));
}
```

**Search Queries**:
- "caregiver support resources [state]"
- "family caregiver services [state]"
- "respite care programs [state]"
- "eldercare support [state]"

**Credibility Scoring**:
- `.gov` = 95
- `.edu` = 90
- Known nonprofits (AARP, Alzheimer's Assoc) = 90
- `.org` = 85
- State agencies = 95
- Unknown = 50

---

### 2. Extraction Agent

**Responsibility**: Extract structured IntermediateRecord data from HTML

**Current Implementation** (`extraction.simple.ts`):
```typescript
async function extractResourceFromUrl(url: string, apiKey: string) {
  // 1. Fetch raw HTML
  const response = await fetch(url);
  const html = await response.text();

  // 2. Strip tags, limit to 8000 chars
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .substring(0, 8000);

  // 3. Call GPT-4o-mini with extraction prompt
  const data = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: extractionPrompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(data.choices[0].message.content);
}
```

**Problems**:
- ❌ Manual HTML stripping (loses structure)
- ❌ 8000 char limit (may cut off important info)
- ❌ No retry logic
- ❌ Can't handle JavaScript-heavy sites
- ❌ No pagination support

**Phase 2 Implementation** (`extraction.ts` with llm-scraper-worker):
```typescript
import { LLMScraper } from 'llm-scraper-worker';

const scraper = new LLMScraper({
  openaiApiKey: env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  schema: intermediateRecordSchema, // Zod schema
  retries: 3,
  timeout: 30000
});

async function extractResourceFromUrl(url: string) {
  try {
    // Automatically handles pagination, retries, and validation
    const record = await scraper.scrape(url);
    return record; // Type-safe IntermediateRecord
  } catch (error) {
    // Fallback to Browser Rendering API for JS-heavy sites
    if (error.type === 'javascript_required') {
      return await extractWithBrowser(url);
    }
    throw error;
  }
}
```

**Benefits**:
- ✅ Type-safe with Zod schemas
- ✅ Automatic retries
- ✅ Better HTML parsing
- ✅ Pagination support
- ✅ Optimized prompts

---

### 3. Categorizer Agent

**Responsibility**: Map service types to pressure zones

**Current Implementation** (`categorizer.simple.ts`):
```typescript
const SERVICE_TO_ZONES = {
  respite: ['physical_health', 'time_management'],
  support_group: ['social_support', 'emotional_wellbeing'],
  counseling: ['emotional_wellbeing'],
  // ... 11 service types total
};

function categorizeRecord(record: IntermediateRecord) {
  const zones = new Set();
  for (const serviceType of record.serviceTypes) {
    const serviceZones = SERVICE_TO_ZONES[serviceType];
    if (serviceZones) {
      serviceZones.forEach(zone => zones.add(zone));
    }
  }
  return { ...record, zones: Array.from(zones) };
}
```

**Phase 2 Enhancement**:
- Keep rule-based mapping for known service types (fast path)
- Add GPT-4o-mini for edge cases and ambiguous services
- Few-shot examples for better classification

---

### 4. Validator Agent

**Responsibility**: Validate data quality and assign scores

**Current Implementation** (`validator.simple.ts`):
```typescript
async function validateRecord(record: CategorizedRecord) {
  // 1. Normalize phones to E.164
  const phoneE164 = record.phones?.map(normalizePhone);

  // 2. Validate URL with HEAD request
  const urlValid = await validateUrl(record.website);

  // 3. Calculate quality score (0-100)
  let qualityScore = 0;
  if (phoneE164?.length > 0) qualityScore += 10;
  if (urlValid) qualityScore += 10;
  if (record.zip) qualityScore += 10;
  if (record.description?.length > 50) qualityScore += 10;
  if (record.zones.length > 0) qualityScore += 10;
  // ... more scoring logic

  // 4. Assign status
  const status = qualityScore >= 70 ? 'approved'
    : qualityScore >= 30 ? 'pending_review'
    : 'rejected';

  return { ...record, phoneE164, urlValid, qualityScore, status };
}
```

**Quality Score Breakdown** (0-100):
- **Contact info** (30 pts): phone (10), website (10), email (10)
- **Location** (20 pts): ZIP (10), full address (10)
- **Description** (30 pts): description (10), eligibility (5), hours (5), languages (5), service types (5)
- **Categorization** (20 pts): zones present (10), high confidence (10)

**Status Assignment**:
- **approved** (70+): Ready for production
- **pending_review** (30-69): Needs human QA
- **rejected** (<30): Insufficient data

**Phase 2 Enhancements**:
- Twilio Lookup API for phone verification ($0.005/lookup)
- Email validation with SMTP check
- Address geocoding with Google Maps API
- Duplicate detection (fuzzy matching)

---

## Schema

### IntermediateRecord (Extraction Output)
```typescript
interface IntermediateRecord {
  // REQUIRED
  title: string;
  providerName: string;
  phones: string[];
  website?: string;
  email?: string;

  // SERVICE CATEGORIZATION
  serviceTypes: string[]; // 11 types: respite, support_group, counseling, etc.
  zones: string[];        // 5 zones: physical_health, emotional_wellbeing, etc.

  // COVERAGE
  coverage: 'national' | 'state' | 'county' | 'zip' | 'radius';

  // LOCATION
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // OPTIONAL ENRICHMENT
  description?: string;
  eligibility?: string;
  hours?: string;
  languages?: string[];

  // METADATA
  dataSourceType: 'scraped' | 'manual_entry' | 'api';
  aggregatorSource: 'eldercare' | '211' | 'carelinq' | 'other';
  sourceUrl?: string;
  lastVerified?: string; // ISO 8601
}
```

### ValidatedRecord (Validator Output)
```typescript
interface ValidatedRecord extends CategorizedRecord {
  phoneE164?: string[];   // Normalized to E.164 format (+1XXXXXXXXXX)
  urlValid: boolean;      // HEAD request succeeded
  urlRedirects?: string;  // Final URL after redirects
  qualityScore: number;   // 0-100
  validationErrors: string[];
  validationWarnings: string[];
  status: 'approved' | 'pending_review' | 'rejected';
}
```

---

## Service Types (11 Total)

Matches `give-care-app/convex/ingestion/shared/registry.ts`:

1. **respite** - Temporary care relief
2. **support_group** - Peer support, caregiver groups
3. **counseling** - Therapy, mental health
4. **crisis_support** - 24/7 hotlines, emergency
5. **financial_aid** - Grants, subsidies
6. **medicare_help** - Insurance, benefits
7. **legal_planning** - Wills, power of attorney
8. **navigation** - Case management, referrals
9. **equipment_devices** - Wheelchair, assistive devices
10. **education_training** - Workshops, classes
11. **caregiver_support** - General family support

---

## Pressure Zones (5 Total)

Matches `give-care-app/src/burnoutCalculator.ts`:

1. **physical_health** - Physical strain, health issues
2. **emotional_wellbeing** - Stress, anxiety, depression
3. **financial_concerns** - Money, insurance, costs
4. **time_management** - Work-life balance, scheduling
5. **social_support** - Isolation, lack of help

### SERVICE_TO_ZONES Mapping
```typescript
const SERVICE_TO_ZONES = {
  respite: ['physical_health', 'time_management'],
  support_group: ['social_support', 'emotional_wellbeing'],
  counseling: ['emotional_wellbeing'],
  crisis_support: ['emotional_wellbeing'],
  financial_aid: ['financial_concerns'],
  medicare_help: ['financial_concerns', 'time_management'],
  legal_planning: ['financial_concerns'],
  navigation: ['financial_concerns', 'social_support'],
  equipment_devices: ['physical_health', 'financial_concerns'],
  education_training: ['time_management', 'emotional_wellbeing'],
  caregiver_support: ['social_support', 'emotional_wellbeing']
};
```

---

## Deployment

### Current Setup
- **Platform**: Cloudflare Workers
- **Runtime**: Node.js compatibility mode
- **Entry Point**: `src/index.ts` exports Durable Objects
- **Deployment**: `npx wrangler deploy`

### Environment Variables
**Secrets** (set via `npx wrangler secret put`):
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o-mini

**Vars** (in `wrangler.toml`):
- `CONVEX_URL` - Convex backend URL
- `ENVIRONMENT` - "development" or "production"

### Durable Objects
- **OrchestratorAgent** - Main coordinator (1 instance per workflow)

### Bindings
- `CONVEX_URL` - HTTP binding to Convex

---

## Cost Breakdown

### Phase 1 (Current - Hardcoded Discovery)
Per 100 resources:
- Discovery: **Free** (hardcoded list)
- Extraction: **$0.60** (100 calls × $0.006 per GPT-4o-mini call)
- Categorization: **Free** (rule-based)
- Validation: **Free** (HTTP checks)

**Total**: ~$0.60 per 100 resources = **$0.006 per resource**

### Phase 2 (Planned - Dynamic Discovery)
Per 100 resources:
- Discovery: **$0.10** (DuckDuckGo free + workers-research)
- Extraction: **$0.80** (llm-scraper-worker + Browser Rendering API fallback)
- Categorization: **$0.05** (GPT-4o-mini for edge cases)
- Validation: **$0.50** (Twilio Lookup API: $0.005 × 100 phones)

**Total**: ~$1.45 per 100 resources = **$0.015 per resource**

### Manual Baseline
- Human data entry: **$7.50 per resource** (30 min @ $15/hr)

### Savings
- Phase 1: **1,250x cheaper** than manual
- Phase 2: **500x cheaper** than manual

---

## Monitoring & Observability

### Convex Dashboard
- Real-time workflow status
- Source discovery counts
- Extraction success rates
- Validation scores

### Cloudflare Logs
- `npx wrangler tail` - Live log streaming
- Structured JSON logs with levels (info, warn, error)
- Agent execution traces

### Metrics to Track
- **Workflows per day**
- **Sources discovered** (total)
- **Extraction success rate** (%)
- **Average quality score** (0-100)
- **Records pending QA**
- **Records approved to production**

---

## Testing

### Local Development
```bash
# Start Convex dev server (for real-time updates)
cd ../give-care-app && npx convex dev

# Start ETL worker
cd ../give-care-etl && npx wrangler dev

# Trigger workflow
curl -X POST http://localhost:8787/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"task": "discover_caregiver_resources", "state": "NY", "limit": 5}'

# Check status
curl http://localhost:8787/orchestrate/status
```

### Production Testing
```bash
# Trigger workflow
curl -X POST https://give-care-etl.ali-a90.workers.dev/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"task": "discover_caregiver_resources", "state": "CA", "limit": 10}'

# View logs
npx wrangler tail --format pretty

# Check dashboard
open https://dash.givecareapp.com/etl
```

---

## Next Steps (Prioritized)

### Immediate (Fix Phase 1)
1. ✅ Fix OpenAI API errors (API key issue)
2. ✅ Test end-to-end extraction with working API key
3. ✅ Verify records appear in QA queue

### Phase 2 (Dynamic Discovery)
1. **Install llm-scraper-worker**
   ```bash
   pnpm add llm-scraper-worker
   ```

2. **Implement DuckDuckGo discovery**
   - Replace hardcoded list with API calls
   - Implement credibility scoring
   - Add all 50 states

3. **Replace extraction with llm-scraper-worker**
   - Define Zod schema
   - Update extraction.simple.ts to use scraper
   - Add Browser Rendering API fallback

4. **Add workers-research for complex queries**
   - Multi-step searches
   - Citation tracking
   - Quality ranking

### Phase 3 (Production Scale)
1. **Cron scheduling** - Daily/weekly automated runs
2. **Deduplication** - Fuzzy matching to avoid duplicates
3. **Incremental updates** - Only scrape new/changed pages
4. **Rate limiting** - Respect robots.txt
5. **Error recovery** - Automatic retries with backoff
6. **Expand coverage** - All 50 states + territories

---

## References

- [llm-scraper-worker on npm](https://www.npmjs.com/package/llm-scraper-worker)
- [DuckDuckGo Instant Answer API](https://duckduckgo.com/api)
- [Cloudflare Browser Rendering API](https://developers.cloudflare.com/browser-rendering/)
- [OpenAI Agents SDK](https://github.com/openai/agents-sdk)
- [Convex](https://www.convex.dev/)

---

**Last updated**: 2025-10-16 (Phase 1 complete, Phase 2 planned)
