# GiveCare TypeScript - Documentation Index

**For AI Assistants**: Use this to navigate the give-care-type codebase.

---

## 🚨 DRACONIAN DOCUMENTATION POLICY

### Golden Rules
1. **UPDATE, DON'T CREATE** - Edit existing files. New docs require explicit approval.
2. **PRUNE AS YOU GO** - Delete outdated sections when updating. History lives in git, not docs.
3. **ONE TRUTH** - Each topic gets ONE file. No duplicates, summaries, or "guides."
4. **CHANGELOG IS HISTORY** - Don't document implementation details. Log what changed, why it matters.

### When to Create a New Doc (NEVER without approval)
- ✅ New architectural domain (e.g., first billing system) - still needs approval
- ❌ Bug fixes (→ CHANGELOG.md)
- ❌ Task planning (→ TASKS.md, delete after)
- ❌ "Summary" docs (→ update source)
- ❌ "Guide" docs (→ merge into existing)
- ❌ Research (→ external tools)
- ❌ Archive/internal folders (→ git history)

### Active Docs: 15 MAX (Current: 21 ⚠️ OVER LIMIT - Cleanup Required)

**Enforcement**:
- Before creating: Must delete existing doc OR prove it's new domain
- Weekly: Delete completed task details, prune old sections
- Monthly: Consolidate overlapping docs, archive >6mo content

**What NEVER needs a doc**:
- Bug fixes → CHANGELOG.md (1-2 lines)
- Tasks → TASKS.md (delete details after completion)
- Research → External (Notion, Google Docs)
- Summaries → Update source doc instead
- Status → CHANGELOG.md or TASKS.md

---

## Quick Start

1. **Run `npx convex dev` first** - Generates required types
2. Read [DEVELOPMENT.md](DEVELOPMENT.md) - Development setup
3. Read [ARCHITECTURE.md](ARCHITECTURE.md) - System design

---

## Current Doc Roster (15/15 ✅)

### Core (6 - Never Delete)
1. CLAUDE.md - AI navigation
2. ARCHITECTURE.md - System design
3. DEVELOPMENT.md - Dev setup
4. DEPLOYMENT.md - Production
5. CHANGELOG.md - History
6. TASKS.md - Active sprint

### Domain (2)
7. ASSESSMENTS.md - Clinical tools
8. TAXONOMY.md - Nomenclature

### Operations (4)
9. SOP.md - Troubleshooting
10. SCHEDULING.md - Cron jobs
11. RATE_LIMITS.md - Rate limiting
12. LOGGING_GUIDE.md - Logging

### Product (1)
13. FEATURES.md - Feature status

### Integrations (2)
14. ADMIN_DASHBOARD_GUIDE.md - Admin
15. STRIPE_PRODUCTION_GUIDE.md - Payments

### ⚠️ CANDIDATES FOR DELETION (6 docs over limit):
16. **IMPLEMENTATION_GUIDE.md** → Merge into ARCHITECTURE.md or DEVELOPMENT.md
17. **MAPS_GROUNDING_INTEGRATION.md** → Merge into ARCHITECTURE.md (Google Maps Grounding section)
18. **MINIMAL_ONBOARDING.md** → Delete (completed task, info in FEATURES.md)
19. **MINIMAL_RETENTION.md** → Delete (completed task, info in FEATURES.md)
20. **PAPER_REVIEW_COMPREHENSIVE.md** → Move to archive/ (research, not operational)
21. **VECTOR_SEARCH_SETUP.md** → Delete (setup complete, info in ARCHITECTURE.md)

---

## Documentation Map

### What / How / Why

| Doc | What | How | Why |
|-----|------|-----|-----|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Multi-agent system design | 3 agents (main/crisis/assessment), 5 tools, Convex DB | Understand system components & data flow |
| **[ASSESSMENTS.md](ASSESSMENTS.md)** | Clinical tools | 4 assessments (EMA, CWBS, REACH-II, SDOH) with scoring algorithms | Understand wellness measurement |
| **[TAXONOMY.md](TAXONOMY.md)** | Nomenclature & visual reference | Scores, bands, zones, phases, tiers, formatting rules + visual diagrams | Understand naming conventions across systems |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Local dev setup | Commands, testing, debugging | Get started coding |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment | Convex deploy, Twilio config, env vars | Ship to production |
| **[SOP.md](SOP.md)** | Standard procedures | Troubleshooting, workflows, checklists | Fix issues & follow best practices |
| **[TASKS.md](TASKS.md)** | Current sprint | 3 features: scheduled functions, vector search, rate limiting | Know what's being built now |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history | What changed in each release | Track progress & features |
| **[ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md)** | Admin dashboard | Production URL, deployment, operations | Manage admin dashboard |
| **[STRIPE_PRODUCTION_GUIDE.md](STRIPE_PRODUCTION_GUIDE.md)** | Stripe integration | Pricing, coupons, checkout, troubleshooting | Manage subscriptions |

### Specialized Folders

- **[business/](business/)** - Business strategy, GTM, pricing analysis, reimbursement roadmaps
- **[internal/](internal/)** - Internal tooling, dashboards, evaluation frameworks
- **[archive/](archive/)** - Completed work, one-time fixes, planning docs
  - `admin-dashboard-2025-10-11/` - Admin dashboard build process
  - `stripe-setup-2025-10-11/` - Stripe integration setup
  - Planning docs from 2025-10-10

---

## Documentation Rules (MECE)

### Don't Create New Docs For:
- ❌ **One-time fixes** → Move to `archive/` with date prefix (e.g., `2025-10-10_FIX_NAME.md`)
- ❌ **Config details** → Merge into parent doc (e.g., service_tier → ARCHITECTURE.md)
- ❌ **Planning/meta-docs** → Delete after execution or archive
- ❌ **Subsets of code** → Just read the source (e.g., profile fields → `convex/schema.ts`)

### Do Create/Update These Docs:
- ✅ **ARCHITECTURE.md** → System design changes (agents, database, flows)
- ✅ **ASSESSMENTS.md** → New clinical tools or scoring changes
- ✅ **TAXONOMY.md** → Nomenclature, classification systems, display conventions
- ✅ **DEVELOPMENT.md** → Developer workflow changes
- ✅ **DEPLOYMENT.md** → Production process changes
- ✅ **TASKS.md** → Current sprint (delete after completion)
- ✅ **CHANGELOG.md** → Version releases

### Line Limits:
- **Architecture**: 600 lines max
- **Others**: 500 lines max
- **Over limit?** → Split into focused files or move historical content to archive

### When in Doubt:
Ask: "Does this fit in an existing doc?"
- If **yes** → Add section to existing doc
- If **no** → Only create if it's architecture, domain knowledge, or operational guide

---

## Quick Reference

| Find... | In... |
|---------|-------|
| Agent config | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Database schema | `convex/schema.ts` |
| Assessment scoring | [ASSESSMENTS.md](ASSESSMENTS.md) |
| Nomenclature (bands, zones, tiers) | [TAXONOMY.md](TAXONOMY.md) |
| Display formatting rules | [TAXONOMY.md](TAXONOMY.md) |
| Troubleshooting | [SOP.md](SOP.md) |
| What's being built | [TASKS.md](TASKS.md) |
