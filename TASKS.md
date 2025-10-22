# GiveCare Monorepo - Task Overview

**Last Updated**: 2025-10-22 | **Last Verified**: 2025-10-22

This is the master task overview for the GiveCare monorepo. Each sub-project maintains its own detailed task list.

---

## 📊 Project Status Summary

| Project | Version | Status | Completion | Tasks File |
|---------|---------|--------|------------|------------|
| **give-care-app** | 0.8.2 | ✅ Production Ready | 45% (9/20 tasks) | [give-care-app/docs/TASKS.md](give-care-app/docs/TASKS.md) |
| **give-care-site** | 0.1.0 | 🚧 Active Development | N/A | [give-care-site/docs/WEBSITE_TASKS.md](give-care-site/docs/WEBSITE_TASKS.md) |
| **give-care-story** | 1.0.0 | ✅ Stable | 100% | *(No active tasks)* |
| **give-care-etl** | 0.1.0 | 🤔 Strategic Decision | 60% | [give-care-etl/docs/TASKS.md](give-care-etl/docs/TASKS.md) |

**Overall Health:** 🟢 Healthy - Core backend stable, site growing, ETL needs strategic decision

---

## 🎯 give-care-app (Backend + Admin Dashboard)

**Focus:** AI SMS caregiving support backend + admin dashboard

### Completion Status
- ✅ 9 tasks complete (45%)
- 🚧 1 task in progress (Admin Dashboard Phase 2)
- 📋 10 tasks pending

### Recent Achievements (Verified 2025-10-22)
- ✅ **481+ tests passing** (exceeds 235+ requirement)
- ✅ Scheduled Functions (proactive messaging)
- ✅ Rate Limiter (5-layer cost protection)
- ✅ Vector Search (Convex native, 1536-dim)
- ✅ RRULE Trigger System (58 tests)
- ✅ Conversation Summarization (45 tests)
- ✅ Working Memory System (26 tests)
- ✅ Engagement Watcher (51 tests)
- ✅ DSPy Agent Optimization (TypeScript pipeline with GPT-5)
- ✅ v0.8.2 Hotfix (5 production bugs fixed)

### In Progress
- 🚧 **Admin Dashboard Phase 2** (60% complete, 1 week remaining)
  - ✅ Search/Filter, CSV export, Conversations, Wellness trends, Assessments
  - 📋 TODO: Pagination, User actions, Alert resolution, Auth

### High Priority Next (Quick Wins - Ready for Implementation)
- 📋 **Task 12: Dual-View Conversations** (3-5 hours) - 95% ready, just UI integration
- 📋 **Task 13: Caregiver Timeline** (5-7 hours) - 80% ready, needs timeline UI
- 📋 **Task 19: DSPy Assessment Questions** (2-3 days) - Pre-launch optimization
- 📋 **Task 20: DSPy Intervention Descriptions** (1-2 days) - Pre-launch optimization

### Medium Priority
- 📋 Task 4: User Dashboard (2 weeks)
- 📋 Task 5: Evaluation Framework (1 week)
- 📋 Task 14: Gratitude Loop (4 days)
- 📋 Task 15: Assessment Prep/Follow-up (6 days)
- 📋 Task 16: Intervention Cards (Web) (10 days)
- 📋 Task 17: Safety Co-Pilot Mode (15 days)

### Key Metrics
- **Test Coverage:** 481+ tests passing across 20 test files
- **Response Time:** ~900ms average
- **Deployment:** https://dash.givecareapp.com (admin)
- **Production Status:** Live and stable

**📄 Full Details:** [give-care-app/docs/TASKS.md](give-care-app/docs/TASKS.md)

---

## 🌐 give-care-site (Marketing Website)

**Focus:** Next.js 15 marketing website with blog and newsletter

### Completion Status
- 🚧 Active development (Q1 2024 features)
- ⚠️ Critical: Core Web Vitals need optimization (Lighthouse 78 → 90+ target)

### Priority Breakdown

**P0 - Critical Issues (6 hours)**
- 🔥 Core Web Vitals Optimization (4h) - LCP 3.2s → <2.5s, CLS 0.15 → <0.1
- 🔥 Mobile Navigation Bug (2h) - z-index, focus trap, iOS Safari testing

**P1 - Q1 2024 Features (13 hours)**
- 📋 Blog Search Implementation (6h) - Algolia vs MeiliSearch vs minisearch
- 📋 Newsletter Double Opt-in (4h) - GDPR/CAN-SPAM compliance
- 📋 Testimonials Carousel (3h) - Framer Motion, lazy loading

**P2 - Technical Improvements (13 hours)**
- 📋 Component Documentation (4h) - Storybook 7.x setup
- 📋 E2E Test Suite (6h) - Cypress with TypeScript
- 📋 Image Optimization Pipeline (3h) - WebP conversion, CDN

**P3 - Growth Features (10 hours)**
- 📋 A/B Testing Framework (8h) - Feature flags, analytics
- 📋 Blog Content Calendar (2h) - Draft/published states, authors

### Recent Completions
- ✅ Next.js 15 Migration (40% faster builds)
- ✅ Responsive Design System (100% mobile responsive)
- ✅ Newsletter Integration (15% conversion rate)
- ✅ SEO Foundation (25% organic traffic increase)
- ✅ Component Library Setup (30+ reusable components)

### Key Metrics
- **Lighthouse Score:** 78 (Target: 90+)
- **Monthly Visitors:** 8,500
- **Newsletter Signups:** 1,275 (15% conversion)
- **Blog Engagement:** 2:30 average read time

### ⚠️ Documentation Note
- **INVALID FILE ARCHIVED:** `docs/TASKS.md.INVALID_PYTHON_BACKEND.archive` contained Python backend tasks from different codebase
- **CORRECT FILE:** `docs/WEBSITE_TASKS.md` contains actual marketing site tasks

**📄 Full Details:** [give-care-site/docs/WEBSITE_TASKS.md](give-care-site/docs/WEBSITE_TASKS.md)

---

## 📖 give-care-story (Presentations)

**Focus:** Next.js presentation system for storytelling

### Status
- ✅ **Stable v1.0.0** - No active tasks
- Component library mature and feature-complete
- Multiple presentations deployed
- Maintenance as-needed basis

**📄 Documentation:** [give-care-story/CLAUDE.md](give-care-story/CLAUDE.md)

---

## 🔧 give-care-etl (Resource Discovery Pipeline)

**Focus:** Autonomous caregiver resource discovery and curation

### Strategic Decision Required: BUILD vs BUY

**Current Status:** 60% complete (extraction/validation work, discovery limited)

### What's Working ✅
- ✅ Jina Reader Extraction (clean markdown)
- ✅ OpenAI Responses API (JSON structuring)
- ✅ Categorizer (service types → pressure zones)
- ✅ Validator (E.164 phones, URL validation, quality scoring)
- ✅ Convex Persistence (type-safe client)
- ✅ Cloudflare Workers Config (Durable Objects, KV, Browser API)

### Critical Gaps ❌
- ❌ Discovery is hardcoded (only NY/CA/TX, requires Exa API)
- ❌ Cannot scale to 50 states (architectural limitation)
- ❌ No continuous updates (cron exists, no deduplication/change detection)
- ❌ Dashboard is backend-only (no admin UI for human QA)

### Options

**Option A: Build It (6-12 months)** - NOT RECOMMENDED
- Dynamic discovery across 50 states
- Continuous update mechanisms
- Quality monitoring and human QA workflow
- **Time:** 6-12 months
- **Cost:** ~$100/month infrastructure
- **Opportunity Cost:** Not building user-facing features

**Option B: Partner with API (2-4 weeks)** - ⭐ RECOMMENDED
- Eldercare Locator API (free, 6,000+ programs)
- 211 API ($500/month, 200,000+ services)
- NowPow/FindHelp API ($1,000/month, curated data)
- **Time:** 4 weeks integration
- **Benefit:** Professionally curated, continuously updated

**Option C: Hybrid MVP (2-3 months)**
- Phase 1: Manually curate 100 national programs (1 week)
- Phase 2: Partner with Eldercare Locator (1 month)
- Phase 3: Build ETL for gaps (ongoing)

### Recommendation
🎯 **Pursue Option B (API Partnership)** and focus development time on give-care-app Tasks 12-20 (higher ROI, user-facing features)

**📄 Full Details:** [give-care-etl/docs/TASKS.md](give-care-etl/docs/TASKS.md)

---

## 🗓️ Recommended Sprint Plan

### Sprint 0: Pre-Launch Polish (2 weeks)
**Focus:** give-care-app + give-care-site critical issues

1. ✅ Finish Admin Dashboard Phase 2 (1w) - give-care-app
2. 🎯 DSPy Assessment Questions (2-3d) - give-care-app
3. 🎯 DSPy Intervention Descriptions (1-2d) - give-care-app
4. 🔥 Core Web Vitals Optimization (4h) - give-care-site
5. 🔥 Mobile Navigation Bug (2h) - give-care-site

### Sprint 1: Quick Wins (1-2 days)
**Focus:** give-care-app transparency features (95% ready)

1. Task 12: Dual-View Conversations (3-5h)
2. Task 13: Caregiver Timeline (5-7h)

### Sprint 2: Core UX (3 weeks)
**Focus:** give-care-app user experience + give-care-site features

1. Task 15: Assessment Prep/Follow-up (6d) - give-care-app
2. Task 16: Intervention Cards (10d) - give-care-app
3. Blog Search Implementation (6h) - give-care-site
4. Newsletter Double Opt-in (4h) - give-care-site

### Sprint 3: Safety & Infrastructure (3 weeks)
**Focus:** give-care-app safety + give-care-site testing

1. Task 17: Safety Co-Pilot Mode (15d) - give-care-app
2. Task 4: User Dashboard (2w parallel) - give-care-app
3. E2E Test Suite (6h) - give-care-site
4. Component Documentation (4h) - give-care-site

### Sprint 4: Quality & Optimization (2 weeks)
**Focus:** Evaluation and performance

1. Task 5: Evaluation Framework (1w) - give-care-app
2. Image Optimization Pipeline (3h) - give-care-site
3. A/B Testing Framework (8h) - give-care-site

### Parallel Track: ETL Strategic Decision
**Timeline:** 2-4 weeks (if Option B chosen)

1. Contact Eldercare Locator for API access
2. Evaluate 211 API if needed
3. Build integration plan
4. Implement API adapter layer

---

## 📈 Key Observations

### ✅ give-care-app (Backend)
- **Strength:** Excellent test coverage (481+ tests), production-ready
- **Focus:** UX improvements and pre-launch optimization
- **Risk:** None - stable production system
- **Code Quality:** 90%+ verification accuracy

### ⚠️ give-care-site (Marketing)
- **Strength:** Solid foundation with Next.js 15, good engagement metrics
- **Focus:** Performance optimization (Lighthouse 78 → 90+)
- **Risk:** Low - mostly polish and features
- **Documentation:** Clean separation (WEBSITE_TASKS.md vs archived Python backend tasks)

### ✅ give-care-story (Presentations)
- **Status:** Stable and mature
- **Focus:** Maintenance only
- **Risk:** None

### 🤔 give-care-etl (Resource Discovery)
- **Status:** 60% complete, strategic inflection point
- **Decision:** Build (6-12mo) vs Buy (2-4wk)
- **Recommendation:** Partner with API, focus on user-facing features
- **Risk:** Medium - architectural limitation requires either refactor or API partnership

---

## 💡 Strategic Recommendations

1. **Complete Pre-Launch Tasks First** (Sprint 0)
   - DSPy optimizations have highest ROI for give-care-app
   - Core Web Vitals critical for give-care-site SEO

2. **Prioritize give-care-app Quick Wins** (Sprint 1)
   - Tasks 12-13 are 80-95% ready, just need UI integration
   - High value transparency features

3. **Consider API Partnership for ETL**
   - 4 weeks vs 6-12 months build time
   - Professionally curated data
   - Focus dev time on user-facing features

4. **Maintain give-care-story As-Is**
   - Already stable and mature
   - No action needed

5. **Invest in give-care-site Performance**
   - Lighthouse 78 → 90+ affects SEO rankings
   - Mobile experience critical (40% of traffic)

---

## 📞 Contact & Support

**Project Lead:** See individual project CLAUDE.md files

**Documentation:**
- Architecture: [give-care-app/docs/ARCHITECTURE.md](give-care-app/docs/ARCHITECTURE.md)
- Development: [give-care-app/docs/DEVELOPMENT.md](give-care-app/docs/DEVELOPMENT.md)
- Deployment: [give-care-app/docs/DEPLOYMENT.md](give-care-app/docs/DEPLOYMENT.md)
- Monorepo Setup: [CLAUDE.md](CLAUDE.md)

**Live URLs:**
- Admin Dashboard: https://dash.givecareapp.com
- Marketing Site: https://givecareapp.com (Cloudflare Pages)
- Presentations: https://story.givecareapp.com (Cloudflare Pages)

---

**Total Remaining Work Across All Projects:** ~12-14 weeks

**Highest Impact:** give-care-app Tasks 12-20 (UX & pre-launch optimization)

**Biggest Risk:** give-care-site Core Web Vitals + give-care-etl strategic decision

---

*This master task file is updated regularly as sub-project tasks progress. For detailed task breakdowns, see individual project TASKS.md files.*
