## Production-Safe ETL Pipeline

**Last Updated:** 2025-10-15
**Status:** MVP Ready

---

## What We Built (9 Production Moves)

### ✅ 1. Locked Contract (`types.ts`)

**IntermediateRecord** is now production-safe with:
- **Required fields**: `title`, `providerName`, `serviceTypes`, `zones`, `coverage`, `dataSourceType`, `aggregatorSource`
- **Contact validation**: At least one of `phones` or `website` required
- **Strict types**: Enums for `coverage`, `dataSourceType`, `aggregatorSource`, `fundingSource`
- **Metadata**: `lastVerified`, `license`, `sourceUrl`

### ✅ 2. Idempotency (`validation.ts`)

**canonicalKey** for deduplication:
```typescript
canonicalKey = `${providerName}:${phone}:${geo}`
```
Safe to run imports multiple times without creating duplicates.

### ✅ 3. Validation Gates (`validation.ts`)

Before any record is imported:
- ✅ Phone normalization to E.164 format
- ✅ URL validation
- ✅ Required field checks
- ✅ Fail-fast with clear error messages
- ✅ Warnings for missing recommended fields

### ✅ 4. RBI Scoring (`scoring.ts`)

Resources ranked by:
- **Zone match** (50% weight): Matches user's pressure zones?
- **Coverage precision** (30% weight): ZIP > county > state > national
- **Freshness** (15% weight): Days since last verification
- **Verification** (5% bonus): Verified vs unverified

Score: 0-100 (higher = better match)

### ✅ 5. Service → Zone Mapping (`registry.ts`)

Auto-categorization when zones not provided:
```typescript
respite → [physical_health, time_management]
support_group → [social_support, emotional_wellbeing]
financial_aid → [financial_concerns]
medicare_help → [financial_concerns, time_management]
```

### ✅ 6. Source Registry (`registry.ts`)

Metadata for each data source:
```typescript
eldercare: { license: 'public', refreshCadenceDays: 90 }
211: { license: 'terms', refreshCadenceDays: 30 }
manual: { license: 'owner', refreshCadenceDays: 180 }
```

### ✅ 7. Query Fallback Logic (`resourcesGeoLite.ts`)

Never returns empty:
1. **Try ZIP + zones** (most specific)
2. **Fallback to state + zones** (if ZIP has no results)
3. **Fallback to national + zones**
4. **Fallback to national (no zone filter)** (always returns something)

### ✅ 8. Disclosure on Every Result

Every resource shows:
- `lastVerified`: "10/15/2025" or "Unknown"
- `disclaimer`: "Availability changes. Please call to confirm."

### ✅ 9. ZIP3 → State Map (`resourcesGeoLite.ts`)

Offline mapping for top 100 US ZIP prefixes:
```typescript
"100" → "NY"
"900" → "CA"
"600" → "IL"
```
Expands to full 50 states when needed.

---

## File Structure

```
convex/ingestion/
├── shared/
│   ├── types.ts           # IntermediateRecord + NormalizedRecord contracts
│   ├── validation.ts      # Validation gates + canonicalKey + E.164 normalization
│   ├── scoring.ts         # RBI scoring algorithm
│   ├── registry.ts        # Source metadata + service→zone mapping
│   ├── normalize.ts       # Transform pipeline (IntermediateRecord → NormalizedRecord)
│   └── load.ts            # Database loader (NormalizedRecord → Convex tables)
│
├── federalProgramsSeed.ts # 15 federal programs ready to import
├── eldercare_scraper.ts   # Example adapter for Eldercare Locator
└── README_PRODUCTION_ETL.md # This file

convex/functions/
└── resourcesGeoLite.ts    # Geo-Lite query with fallback logic
```

---

## How to Import 15 Federal Programs

### Step 1: Start Convex Dev

```bash
cd give-care-app
npx convex dev
```

### Step 2: Open Convex Dashboard

Visit the URL shown in terminal (e.g., `https://agreeable-lion-831.convex.cloud`)

### Step 3: Run Import

Go to **Functions** → `ingestion/federalProgramsSeed` → `importFederalPrograms`

Click **Run**

### Step 4: Check Results

```json
{
  "total": 15,
  "normalized": 15,
  "imported": 15,
  "failed": 0,
  "normalizationErrors": [],
  "loadErrors": [],
  "success": [
    {
      "provider": "SAMHSA",
      "program": "988 Suicide & Crisis Lifeline",
      "providerId": "...",
      "resourceId": "..."
    },
    // ... 14 more
  ]
}
```

---

## Query Resources (Test)

### Find resources by ZIP + zones

```typescript
await ctx.runQuery(api.functions.resourcesGeoLite.findResourcesGeoLite, {
  zip: "10001",
  zones: ["emotional_wellbeing"],
  limit: 3
});
```

**Result:**
```json
[
  {
    "title": "988 Suicide & Crisis Lifeline",
    "provider": "SAMHSA",
    "description": "24/7 free and confidential support...",
    "phone": "988",
    "website": "https://988lifeline.org",
    "location": "Nationwide",
    "rbiScore": 85,
    "lastVerified": "10/15/2025",
    "disclaimer": "Availability changes. Please call to confirm."
  },
  // ... 2 more
]
```

### Get resources for a specific user

```typescript
await ctx.runQuery(api.functions.resourcesGeoLite.getResourcesForUser, {
  userId: ctx.auth.getUserIdentity()._id,
  limit: 3
});
```

Uses user's ZIP + pressure zones automatically.

---

## How to Add External Data

### Any Format Works

Just write an adapter that converts your format → `IntermediateRecord`:

```typescript
// Example: CSV adapter
function parseCSV(row: any): IntermediateRecord {
  return {
    title: row.serviceName,
    providerName: row.organization,
    phones: [row.phone],
    website: row.url,
    serviceTypes: row.category.split(","),
    zones: [], // Will be auto-mapped from serviceTypes
    coverage: "county",
    dataSourceType: "scraped",
    aggregatorSource: "eldercare",
    lastVerified: new Date().toISOString()
  };
}

// Then use shared pipeline
const normalized = rows.map(row => normalizeRecord(parseCSV(row)));
await loadNormalizedRecords(ctx, normalized);
```

---

## Supported External Formats

| Format | Adapter Needed | Example |
|--------|----------------|---------|
| CSV | Parse rows → IntermediateRecord | Eldercare Locator export |
| JSON API | Map response → IntermediateRecord | 211 API, CarelinQ |
| HTML Scrape | Extract DOM → IntermediateRecord | State aging websites |
| Google Sheets | Row array → IntermediateRecord | Manual curation |
| Excel | Read cells → IntermediateRecord | State program lists |
| Manual Entry | Type object → IntermediateRecord | Federal programs (done) |

---

## Definition of Done (MVP)

### User Experience
- ✅ User can text "respite" or pick a pressure zone
- ✅ Get 3-5 high-quality resources in <1s
- ✅ Every item shows phone/URL + lastVerified + disclaimer
- ✅ If ZIP unknown, returns state/national resources

### Data Quality
- ✅ 15 federal programs imported
- ✅ All records validated before import
- ✅ Scoring algorithm ranks results by relevance
- ✅ Fallback logic ensures never-empty results

### Production Safety
- ✅ Idempotent imports (safe to re-run)
- ✅ Validation gates (fail fast with reasons)
- ✅ Error reporting (partial failures logged)
- ✅ Dry-run mode (validateOnly flag)

---

## Next Steps (Week 2+)

### Short Term (When Ready)
1. **Add state overrides** - Seed 1-2 high-traffic states
2. **Event tracking** - `resource_shown`, `tel_clicked`, `url_clicked`, `helpfulness_vote`
3. **Expand ZIP3→State map** - Full 50 states (1,000 ZIP prefixes)

### Long Term (Q1 2026)
1. **Add 211 adapter** - Integrate local 211 directories
2. **Add Eldercare adapter** - Scrape Area Agencies on Aging
3. **HTTP HEAD checks** - Validate URLs are reachable
4. **Geocoding API** - Add lat/lng for radius search

---

## Budget Impact

**Phase 1 (MVP - Done):** $0 (no API costs, manual entry)

**Phase 2 (State overrides):** $0 (manual curation)

**Phase 3 (API integration):** $7k-19k/year (CarelinQ or 211 APIs)

---

## What You Can Claim (Honestly)

### ✅ RIGHT NOW
- "15 verified federal caregiver programs"
- "Resources matched to your pressure zones"
- "National hotlines updated quarterly"
- "Works for caregivers nationwide"

### 🚧 COMING SOON
- "Expanding to state-specific resources (Q1 2026)"
- "Local resource directory with ZIP-based filtering (Q1 2026)"

### ❌ DO NOT CLAIM
- "Local resources in your area" (not yet)
- "ZIP-based filtering" (fallback only)
- "10,000+ resources" (only 15 federal programs)

---

## Support

Questions? Check:
- `convex/ingestion/shared/types.ts` - Contract definitions
- `convex/ingestion/shared/validation.ts` - Validation rules
- `convex/ingestion/federalProgramsSeed.ts` - Example seed data
- `convex/functions/resourcesGeoLite.ts` - Query API

**Last updated:** 2025-10-15 (MVP launch)
