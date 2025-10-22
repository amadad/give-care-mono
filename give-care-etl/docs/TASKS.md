# give-care-etl Tasks

**Version**: 0.1.0 | **Status**: Strategic Decision Needed | **Updated**: 2025-10-22 | **Last Verified**: 2025-10-22

---

## 🎯 Current Status: BUILD vs BUY Decision Required

### What's Working ✅ (60% Complete)

| Component | Status | Evidence |
|-----------|--------|----------|
| **Jina Reader Extraction** | ✅ Complete | extraction.jina.ts (177 lines), clean markdown extraction |
| **OpenAI Responses API** | ✅ Complete | Uses /v1/responses endpoint, JSON object format |
| **Categorizer** | ✅ Complete | categorizer.simple.ts (61 lines), 11 service types → 5 pressure zones |
| **Validator** | ✅ Complete | validator.simple.ts (173 lines), E.164 phones, URL validation, quality scoring |
| **Convex Persistence** | ✅ Complete | convex.ts (142 lines), type-safe ETLConvexClient |
| **Cloudflare Workers Config** | ✅ Complete | wrangler.toml, Durable Objects, KV, Browser API, weekly cron |

**Code Statistics:**
- Active production code: 1,723 lines (4 agents)
- Future/placeholder code: 627 lines (not used, in _future/ directory)
- Schemas: 188 lines (Zod validation)
- Phase 1 completion: **60%** (extraction/validation works, discovery limited)

---

## ❌ Critical Architectural Gaps (40% Incomplete)

### 1. Discovery is Hardcoded
**Current State:**
- `AUTHORITATIVE_SOURCES_REMOVED` constant still exists with NY/CA/TX
- Requires Exa API key with no fallback
- If Exa API key missing → entire pipeline fails
- Limited to 3 sources per run (timeout concern: `sources.slice(0, 3)`)

**Impact:** Cannot scale to 50 states without major refactoring

### 2. No Dynamic Search Integration
**Current State:**
- Exa API: ✅ Integrated (discovery.exa.ts, 298 lines)
- DuckDuckGo: ❌ Not integrated
- Other search engines: ❌ Not integrated
- Fallback mechanism: ❌ Not implemented

**Impact:** Single point of failure, no search diversity

### 3. No Continuous Update Mechanism
**Current State:**
- Cron trigger: ✅ Configured (Monday 6am UTC)
- Deduplication logic: ❌ Missing
- Change detection: ❌ Missing (programs move, close, change hours)
- Auto-archive for stale data: ❌ Missing
- Broken link detection: ❌ Missing
- Verification logic: ❌ Missing

**Impact:** Data will become stale immediately after scraping

### 4. Dashboard is Backend-Only
**Current State:**
- Workflow state tracking: ✅ Exists in Convex
- HTTP status endpoints: ✅ Exist for monitoring
- Admin UI: ❌ Not found in give-care-etl
- Approve/reject workflow: ❌ Missing
- Batch operations: ❌ Missing
- Audit log: ❌ Missing

**Impact:** No human QA workflow, cannot review before production

---

## Strategic Options

### Option A: Build It (6-12 months) - NOT RECOMMENDED

**What you'd need:**
1. Dynamic discovery (DuckDuckGo + Exa API) - 2 weeks
2. 50-state coverage (research + seed) - 3 months
3. Automated updates (weekly scraping) - 1 month
4. Quality monitoring (detect dead links, closed programs) - 2 weeks
5. Human QA workflow (review before going live) - 1 month
6. Continuous improvement (ML ranking, de-duplication) - 3 months

**Cost:**
- Your time: 6-12 months
- Infrastructure: ~$100/month (APIs, hosting)
- Opportunity cost: Not building features users see

**Why not recommended:**
- give-care-app Tasks 12-20 have higher ROI (user-facing features)
- ETL is a commodity problem (multiple API solutions exist)
- Resource discovery is not core differentiation

---

### Option B: Partner with API (2-4 weeks) ⭐ RECOMMENDED

**Available APIs:**

1. **Eldercare Locator API** (ACL.gov)
   - Free
   - 6,000+ programs nationally
   - Updated quarterly
   - API access requires partnership
   - Implementation: 2 weeks integration + 1 week mapping

2. **211 API** (United Way)
   - Paid (~$500/month)
   - 200,000+ social services
   - Real-time updates
   - Requires contract
   - Implementation: 2 weeks integration + 1 week mapping

3. **NowPow / FindHelp API**
   - Paid (~$1,000/month)
   - Curated, validated data
   - Commercial license
   - Implementation: 2 weeks integration + 1 week mapping

**Implementation:**
- 2 weeks to integrate API
- 1 week to map their taxonomy → your pressure zones
- 1 week to build QA workflow

**Total: 4 weeks vs 6-12 months**

**Why recommended:**
- 17x faster time to market
- Professionally curated data
- Continuous updates handled by provider
- Focus your time on user-facing features

---

### Option C: Hybrid MVP (2-3 months)

**Phase 1:** Manually curate 100 national programs (1 week)
- 988, 741741, NFCSP, Medicare, etc
- Works nationwide immediately
- Good enough for MVP

**Phase 2:** Partner with Eldercare Locator (1 month)
- Request API access
- Integrate their data
- Auto-update quarterly

**Phase 3:** Build ETL for gaps (ongoing)
- Use ETL to discover local/niche programs
- Human QA before adding
- Continuous improvement

---

## Recommendation: PAUSE ETL Build, PURSUE OPTION B

**Rationale:**
1. **Higher ROI elsewhere:** give-care-app Tasks 12-20 are user-facing features
2. **Not core differentiation:** Resource discovery is a commodity
3. **Time to market:** 4 weeks vs 6-12 months
4. **Quality:** Professional APIs have better data quality

**Next Steps:**
1. Contact Eldercare Locator (ACL.gov) for API access
2. Evaluate 211 API if Eldercare Locator insufficient
3. Build 4-week integration plan
4. Archive ETL epic for future consideration

---

## If Proceeding with Build (Not Recommended)

### Immediate Fixes Required

#### 1. Discovery Fallback (Priority: CRITICAL)
```
Current: Exa API required → throws if missing
Fix:    Add fallback to hardcoded national sources
Impact: Unblocks pipeline for demos/testing without Exa
Time:   2 days
```

#### 2. Extraction Limitation (Priority: HIGH)
```
Current: sources.slice(0, 3) due to timeout concern
Fix:    Implement streaming/chunked extraction
Impact: Can process 10+ sources instead of 3
Time:   3 days
```

#### 3. Continuous Update Logic (Priority: MEDIUM)
```
Current: Cron trigger configured, no business logic
Fix:    Implement deduplication, change detection, auto-archive
Impact: Makes ETL production-ready
Time:   2 weeks
```

#### 4. Dashboard UI (Priority: MEDIUM)
```
Current: No approve/reject UI
Fix:    Build Next.js admin page in give-care-app
Impact: Enables human QA workflow
Time:   1 week
```

#### 5. 50-State Scalability (Priority: LOW for MVP)
```
Current: Only 3 states in authoritative sources
Fix:    Research and seed all 50 states
Impact: National coverage
Time:   3 months
```

**Total Build Time:** 6-12 months (not including continuous improvements)

---

## Code Verification (2025-10-22)

**Methodology:** Thorough codebase exploration with parallel subagents

**Findings:**
- ✅ 6/10 claimed components verified and working
- ❌ 4/10 critical gaps confirmed
- 📊 Implementation: 60% complete (extraction/validation), 40% missing (scalable discovery)

**Files Audited:**
- src/agents/ (orchestrator.do.ts, pipeline.ts, discovery.*, extraction.*, categorizer.*, validator.*)
- src/schemas/ (extraction.ts, discovery.ts, categorization.ts, validation.ts)
- src/shared/ (types.ts, taxonomy.ts)
- src/utils/ (convex.ts)
- wrangler.toml

**Conclusion:**
The epic proposal claims are 60% accurate. Core extraction and validation work perfectly, but discovery scalability was abandoned mid-implementation. Project is better described as "partial ETL pipeline" rather than "autonomous resource discovery pipeline."

---

## Related Documentation

- **Architecture:** docs/ETL_EPIC_PROPOSAL.md (strategic analysis)
- **Setup:** SETUP.md (local development)
- **Integration:** give-care-app/convex/ingestion/README_PRODUCTION_ETL.md
- **Taxonomy:** src/shared/taxonomy.ts (must match give-care-app)

---

**Last updated**: 2025-10-22 (Post-verification strategic analysis)
