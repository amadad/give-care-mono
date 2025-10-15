# CLAUDE.md

**For AI Assistants**: This file provides guidance for working with the give-care-type codebase.

**📖 Full Documentation**: See **[`docs/CLAUDE.md`](docs/CLAUDE.md)** for complete instructions, doc navigation, and development rules.

---

## Quick Start (5 minutes)

### 1. Generate Convex Types (REQUIRED)
```bash
npx convex dev  # MUST run first - generates convex/_generated/ types
```

Without this step, you'll see hundreds of false TypeScript errors.

### 2. Read Core Docs
- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** - Multi-agent system design
- **[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)** - Local dev setup
- **[`docs/TAXONOMY.md`](docs/TAXONOMY.md)** - Nomenclature & classification systems

### 3. Key Commands
```bash
npm run lint      # Run linter
npm run format    # Format code
npm test          # Run tests (Vitest)
npx convex deploy --prod  # Deploy to production
```

---

## Project Overview

**GiveCare TypeScript** is a production-ready AI-powered SMS caregiving support platform:

- **Tech Stack**: OpenAI Agents SDK 0.1.9 (GPT-5 nano) + Convex 1.11.0 (serverless) + Twilio (SMS/RCS)
- **Version**: 0.7.0 (Production Ready)
- **Performance**: ~900ms average response time (50% faster than Python reference)
- **Architecture**: 3-agent system (main, crisis, assessment) with seamless handoffs
- **Assessments**: 4 clinical tools (EMA, CWBS, REACH-II, SDOH) → Composite burnout score (0-100)
- **Interventions**: 20 curated strategies mapped to 5 pressure zones
- **Admin Dashboard**: Live at https://dash.givecareapp.com (Cloudflare Pages)

---

## Documentation Index

| Doc | Purpose | Lines |
|-----|---------|-------|
| **[CLAUDE.md](docs/CLAUDE.md)** | Documentation navigation | 80 |
| **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** | System design (engineers) | 540 |
| **[SYSTEM_OVERVIEW.md](docs/SYSTEM_OVERVIEW.md)** | Product overview (non-technical) | 520 |
| **[TAXONOMY.md](docs/TAXONOMY.md)** | Nomenclature + visual reference | 1,700 |
| **[ASSESSMENTS.md](docs/ASSESSMENTS.md)** | Clinical tools | 360 |
| **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** | Dev setup | 190 |
| **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** | Production deploy | 186 |
| **[SCHEDULING.md](docs/SCHEDULING.md)** | Proactive messaging | 280 |
| **[RATE_LIMITS.md](docs/RATE_LIMITS.md)** | Rate limiting | 220 |
| **[SOP.md](docs/SOP.md)** | Standard procedures | 400 |
| **[TASKS.md](docs/TASKS.md)** | Active sprint (3 remaining) | 130 |
| **[CHANGELOG.md](docs/CHANGELOG.md)** | Version history | 300 |
| **[ADMIN_DASHBOARD_GUIDE.md](docs/ADMIN_DASHBOARD_GUIDE.md)** | Dashboard operations | 250 |
| **[STRIPE_PRODUCTION_GUIDE.md](docs/STRIPE_PRODUCTION_GUIDE.md)** | Payment integration | 400 |

---

## Critical Architectural Concepts

### 1. "use node" Directive
Files that import `@openai/agents` MUST have `"use node"` at the top to access Node.js runtime APIs.

### 2. GiveCareContext
Typed context object (23 fields) shared across all 3 agents. See `src/context.ts`.

### 3. Dynamic Instructions
Agent instructions are **functions** that receive `RunContext<GiveCareContext>`, not static strings.

### 4. Convex Function Types
- `query` / `mutation` / `action` - Public (client callable)
- `internalQuery` / `internalMutation` / `internalAction` - Internal only

---

## Common Pitfalls

❌ **Forgetting to run `npx convex dev`** → Hundreds of false TypeScript errors
❌ **Missing "use node" directive** → EventTarget is not defined errors
❌ **Using Zod in convex/ files** → Use Convex validators (`v.object()`) instead
❌ **Forgetting to extract `result.state?.context`** → Context updates not saved

✅ **Solution**: Read [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for troubleshooting guide

---

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `index.ts` | Entry point (unused in Convex, but kept for exports) | 23 |
| `convex/http.ts` | HTTP router with Twilio webhook | 80 |
| `convex/twilio.ts` | SMS handler + agent execution | 250 |
| `src/agents.ts` | 3-agent definitions | 90 |
| `src/tools.ts` | 5 agent tools | 360 |
| `src/context.ts` | Typed context schema | 117 |
| `src/assessmentTools.ts` | 4 clinical assessments | 600 |
| `src/burnoutCalculator.ts` | Composite scoring + pressure zones | 315 |
| `src/interventionData.ts` | 20 curated interventions | 55 |

---

## Testing

```bash
npm test                    # Run all tests (Vitest)
npm test -- burnout        # Run specific test file
npm test -- --coverage     # Coverage report
```

**Test Files**:
- `tests/burnout.test.ts` - Band threshold validation (21 tests)
- `tests/burnout.pressure-zones.test.ts` - Pressure zone integration (29 tests)
- `tests/interventions.integration.test.ts` - Intervention pipeline (11 tests)
- `tests/assessmentTools.nan-fix.test.ts` - NaN edge cases (25 tests)
- `tests/zoneFormatting.test.ts` - Zone formatting (14 tests)
- `tests/assessments.test.ts` - Assessment scoring (79 tests)

**Total**: 179 tests passing | 3 skipped

---

## When Making Changes

### Adding a New Agent Tool
1. Define tool in `src/tools.ts` with `tool()` wrapper
2. Add Zod schema for parameters
3. Implement `execute` function with `RunContext<GiveCareContext>` signature
4. Add tool to agent's `tools` array in `src/agents.ts`
5. Write tests

### Modifying Taxonomy
1. Update `src/burnoutCalculator.ts` (bands, zones)
2. Update `docs/TAXONOMY.md` (reference)
3. Update tests to match new taxonomy
4. Check backward compatibility (add legacy mappings if needed)
5. Update `docs/CHANGELOG.md`

### Changing Database Schema
1. Edit `convex/schema.ts`
2. Run `npx convex dev` (applies schema automatically)
3. Update corresponding Convex functions
4. Update `GiveCareContext` if agent needs access
5. Test with sample data in Convex dashboard

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| **0.7.0** | 2025-10-10 | Added: Admin dashboard deployment (Cloudflare Pages), build automation |
| **0.6.0** | 2025-10-10 | Fixed: Inverted bands, NaN handling, pressure zones, interventions, formatting. Added: TAXONOMY docs |
| **0.5.0** | 2025-10-10 | Added: 5-layer rate limiting (token bucket algorithm) |
| **0.4.0** | 2025-10-10 | Added: Scheduled functions (wellness check-ins, dormant reactivation) |
| **0.3.0** | 2025-10-09 | Initial: Production-ready TypeScript implementation |

---

## Getting Help

- **Development issues**: See [`docs/SOP.md`](docs/SOP.md) (troubleshooting guide)
- **Architecture questions**: See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Nomenclature confusion**: See [`docs/TAXONOMY.md`](docs/TAXONOMY.md) or [`docs/TAXONOMY_VISUAL.md`](docs/TAXONOMY_VISUAL.md)
- **Deployment problems**: See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

**For complete instructions, read [`docs/CLAUDE.md`](docs/CLAUDE.md) first.**

**Last updated**: 2025-10-11 (v0.7.1 - Documentation MECE compliance)
