# ETL Pipeline - Epic Proposal for TASKS.md

**Current State:** Partially working (3 states hardcoded), not scalable  
**Goal:** Autonomous discovery of caregiver programs across all 50 states  
**Scope:** This is a **multi-month epic**, not a quick task

---

## Reality Check

**You built a Ferrari but it's missing the engine:**

✅ **What works:**
- Jina Reader extracts clean content
- OpenAI Responses API structures data
- Categorizer maps service types → pressure zones
- Validator normalizes phones/URLs
- Dashboard shows workflow status
- Convex persistence

❌ **What doesn't:**
- **Discovery is hardcoded** (only NY, CA, TX sources)
- No dynamic search (DuckDuckGo, Exa not integrated)
- Can't scale to 50 states
- No continuous updates (programs close, move, change)

---

## The Bigger Picture

**ETL is a "build vs buy" decision:**

### Option A: Build It (6-12 months)

**What you'd need:**
1. **Dynamic discovery** (DuckDuckGo + Exa API) - 2 weeks
2. **50-state coverage** (research + seed) - 3 months
3. **Automated updates** (weekly scraping) - 1 month
4. **Quality monitoring** (detect dead links, closed programs) - 2 weeks
5. **Human QA workflow** (review before going live) - 1 month
6. **Continuous improvement** (ML ranking, de-duplication) - 3 months

**Cost:**
- Your time: 6-12 months
- Infrastructure: ~$100/month (APIs, hosting)
- Opportunity cost: Not building features users see

---

### Option B: Partner with Existing Database (2-4 weeks)

**Available APIs:**
1. **Eldercare Locator API** (ACL.gov)
   - Free
   - 6,000+ programs nationally
   - Updated quarterly
   - API access requires partnership

2. **211 API** (United Way)
   - Paid (~$500/month)
   - 200,000+ social services
   - Real-time updates
   - Requires contract

3. **NowPow / FindHelp API**
   - Paid (~$1,000/month)
   - Curated, validated data
   - Commercial license

**Implementation:**
- 2 weeks to integrate API
- 1 week to map their taxonomy → your pressure zones
- 1 week to build QA workflow

**Total: 4 weeks vs 6-12 months**

---

### Option C: Hybrid (MVP Approach)

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

## Recommendation: PAUSE ETL Build

**Why:**
1. **You have 2 users** - Don't optimize for scale yet
2. **Manual curation works** - 100 interventions covers 90% of needs
3. **Partnerships are faster** - 4 weeks vs 12 months
4. **Your time is precious** - Focus on user acquisition, not data pipelines

**What to do instead:**

### Immediate (This Week):
- [ ] Manually curate 50-100 national interventions
- [ ] Load into knowledgeBase
- [ ] Generate embeddings
- [ ] Ship vector search

### Short-term (Month 1):
- [ ] Research Eldercare Locator API partnership
- [ ] Reach out to 211 for API access
- [ ] Build import script for partner data

### Long-term (Month 3+):
- [ ] If partners don't work out, THEN build ETL
- [ ] Or hire VA to manually seed 1,000 programs
- [ ] Focus ETL on niche programs partners miss

---

## ETL as Epic in TASKS.md

If you insist on building it, here's the breakdown:

### Epic: Resource Discovery Pipeline (6-12 months)

**Phase 1: Dynamic Discovery (2 weeks)**
- [ ] Integrate DuckDuckGo JSON API
- [ ] Integrate Exa API for research
- [ ] Build credibility scoring
- [ ] Test on 10 states

**Phase 2: Extraction at Scale (1 month)**
- [ ] Handle pagination (multi-page programs)
- [ ] Handle JavaScript rendering (React/Angular sites)
- [ ] Error recovery (retries, fallbacks)
- [ ] Rate limiting (don't get blocked)

**Phase 3: Data Quality (1 month)**
- [ ] Detect duplicates (same org, multiple URLs)
- [ ] Normalize addresses (geocoding)
- [ ] Verify phone numbers (Twilio Lookup API)
- [ ] Monitor link health (weekly checks)

**Phase 4: Human QA Workflow (2 weeks)**
- [ ] Build QA dashboard (approve/reject/edit)
- [ ] Notification system (email when ready for review)
- [ ] Batch operations (approve 10 at once)
- [ ] Audit log (who approved what)

**Phase 5: Continuous Updates (1 month)**
- [ ] Weekly scraping schedule
- [ ] Detect changes (program closed, moved)
- [ ] Auto-archive stale data
- [ ] Alert on broken links

**Phase 6: Coverage Expansion (3 months)**
- [ ] Research sources for all 50 states
- [ ] Build state-specific scrapers
- [ ] Handle county-level programs
- [ ] Multilingual support (Spanish, Chinese)

---

## My Brutal Take

**You're pre-revenue, pre-product-market-fit.**

Building a data pipeline is:
- ✅ Intellectually satisfying
- ✅ Technically impressive
- ❌ Not what gets you to 100 users
- ❌ Not what gets you to $1k MRR

**Priorities:**
1. **Acquisition** - Get 100 users (marketing, SEO, content)
2. **Retention** - Keep them paying (onboarding, progress)
3. **Intervention quality** - 50 great interventions > 10,000 mediocre ones
4. **Data pipeline** - Once you have proof people want this

---

## Minimal ETL for TASKS.md

If you must work on it, make it minimal:

### Task: ETL V1 - Manual Seed + Partner API (4 weeks)

**Week 1:** Manual curation
- [ ] Research top 50 national programs
- [ ] Document: title, description, phone, website, zones
- [ ] Load into knowledgeBase
- [ ] Test vector search

**Week 2:** Partner research
- [ ] Email Eldercare Locator (ACL.gov) for API access
- [ ] Email 211 for pricing
- [ ] Research NowPow/FindHelp licensing

**Week 3:** Import script
- [ ] Build CSV → knowledgeBase importer
- [ ] Map partner taxonomy → pressure zones
- [ ] Validate data quality
- [ ] Generate embeddings

**Week 4:** QA workflow
- [ ] Add "pending" status to knowledgeBase
- [ ] Build approve/reject buttons in admin dashboard
- [ ] Test end-to-end

**Deliverable:** 500-1000 interventions from partner data, human-reviewed

---

## Bottom Line

**ETL is a 6-12 month project.**

**Options:**
1. **Pause it** - Focus on users (recommended)
2. **Partner** - Use existing APIs (4 weeks)
3. **Build it** - Make it an epic in TASKS.md (6-12 months)

**Don't half-ass it.** Either commit to building world-class discovery, or use someone else's data.

---

**What do you want to do with ETL?**
