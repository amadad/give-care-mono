# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

GiveCare is an AI-powered SMS/RCS caregiving support platform built as a monorepo with 3 core applications:

- **give-care-app**: TypeScript/Convex multi-agent SMS backend with admin dashboard
- **give-care-site**: Next.js 15 marketing website
- **give-care-story**: Next.js presentation system

## Project Structure

```
givecare/
├── give-care-app/           # TypeScript Convex multi-agent backend ⚡
│   ├── src/                  # Agent, tools, assessments, guardrails
│   ├── convex/              # Convex database functions & schema
│   ├── admin-frontend/      # Admin dashboard (React + Convex)
│   ├── tests/               # Vitest suite (179 passing tests)
│   ├── docs/                # Comprehensive documentation
│   └── package.json         # pnpm@9.0.0
├── give-care-site/          # Next.js 15 marketing site
│   ├── app/                 # Next.js App Router
│   ├── components/          # UI components
│   ├── content/             # MDX blog posts
│   └── package.json         # pnpm@9.0.0
├── give-care-story/         # Presentation system
│   ├── app/                 # Next.js App Router
│   ├── components/slides/   # Slide component library
│   └── package.json         # pnpm@9.0.0
├── package.json             # Root workspace config
└── pnpm-workspace.yaml      # Workspace definition
```

## Tech Stack Summary

### give-care-app (Backend + Admin)
- **Framework**: Convex (serverless platform)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm@9.0.0
- **AI**: OpenAI Agents SDK v0.1.9 with GPT-5 nano
- **Database**: Convex (built-in PostgreSQL)
- **Sessions**: OpenAI SDK sessions (30-day retention)
- **SMS/RCS**: Twilio webhooks via Convex HTTP router
- **Testing**: Vitest (179 tests passing)
- **Validation**: Zod schemas + Convex validators
- **Performance**: ~900ms average response time
- **Version**: 0.7.0 (Production Ready)

**Architecture**: Multi-agent system with seamless handoffs
- **3 Specialized Agents**: Main (orchestrator), Crisis, Assessment
- **5 Agent Tools**: updateProfile, startAssessment, recordAssessmentAnswer, checkWellnessStatus, findInterventions
- **4 Clinical Assessments**: EMA, CWBS, REACH-II, SDOH
- **Burnout Calculator**: Composite scoring (0-100) → 5 pressure zones
- **20 Interventions**: Mapped to pressure zones
- **Admin Dashboard**: Live at https://dash.givecareapp.com

### give-care-site (Marketing)
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm@9.0.0
- **Styling**: Tailwind CSS v4 + DaisyUI
- **UI Components**: shadcn/ui, Radix UI
- **State**: React Query (@tanstack/react-query)
- **Content**: MDX for blog posts
- **Email**: Resend (marketing)
- **Animations**: Framer Motion
- **Testing**: Vitest + Playwright E2E
- **Version**: 0.1.0

### give-care-story (Presentations)
- **Framework**: Next.js 15.1
- **Language**: TypeScript
- **Package Manager**: pnpm@9.0.0
- **Styling**: Tailwind CSS with custom slide palette
- **Typography**: Gabarito (headings) + Alegreya (body)
- **Animations**: Framer Motion
- **Components**: Reusable slide library in `/app/components/slides/`
- **Version**: 1.0.0

## Common Commands

### Root Level (Workspace)
```bash
# Install all dependencies (ALWAYS run from root first)
pnpm install

# Run dev servers
pnpm --filter give-care-app dev        # Backend + admin
pnpm --filter give-care-site dev       # Marketing site
pnpm --filter give-care-story dev      # Presentations

# Build all projects
pnpm --recursive build

# Lint all projects
pnpm --recursive lint

# Format all projects
pnpm --recursive format

# Clean workspace
pnpm --recursive clean
rm -rf node_modules
```

### give-care-app (Backend)
```bash
cd give-care-app

# Development
npx convex dev              # Start Convex dev server (generates types)
                            # Access at: https://YOUR_SITE.convex.site

# Testing
npm test                    # Run Vitest (179 tests)
npm run lint                # Run ESLint
npm run format              # Run Prettier

# Production
npx convex deploy --prod    # Deploy to production

# Health Checks
curl https://YOUR_SITE.convex.site/health
```

### give-care-site (Marketing)
```bash
cd give-care-site

# Development
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Production build
pnpm start                  # Run production server

# Quality
pnpm lint                   # ESLint
pnpm format                 # Prettier
pnpm type-check             # TypeScript validation

# Testing
pnpm test                   # Run tests
pnpm test:e2e               # Playwright E2E
```

### give-care-story (Presentations)
```bash
cd give-care-story

# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm lint                   # ESLint
```

## Development Workflow

### Getting Started
1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd givecare
   ```

2. **Install dependencies** (REQUIRED - run from root)
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local` in each project
   - Add required API keys (OpenAI, Twilio, Convex, Supabase, Stripe)

4. **Start development**
   ```bash
   # Terminal 1: Backend
   cd give-care-app && npx convex dev

   # Terminal 2: Marketing site (optional)
   cd give-care-site && pnpm dev

   # Terminal 3: Presentations (optional)
   cd give-care-story && pnpm dev
   ```

### Working with give-care-app (Backend)
**CRITICAL**: Always run `npx convex dev` first to generate types in `convex/_generated/`!

**Multi-Agent Architecture**:
The backend uses OpenAI Agents SDK with 3 specialized agents that seamlessly hand off to each other:
1. **Main Agent** (orchestrator) - General conversation, wellness tracking, interventions
2. **Crisis Agent** - Immediate safety support with 988/741741/911 resources
3. **Assessment Agent** - Conducts 4 clinical assessments (EMA, CWBS, REACH-II, SDOH)

Agent handoffs are invisible to users - they experience one unified conversation.

**Key Files**:
- `src/agents.ts` - 3 agent definitions with handoff configuration
- `src/tools.ts` - 5 agent tools (updateProfile, startAssessment, recordAssessmentAnswer, checkWellnessStatus, findInterventions)
- `src/context.ts` - Typed GiveCareContext (23 fields) shared across all agents
- `src/instructions.ts` - Dynamic instruction functions (NOT static strings)
- `src/assessmentTools.ts` - 4 clinical assessments with scoring logic
- `src/burnoutCalculator.ts` - Composite scoring (0-100) → 5 pressure zones
- `src/safety.ts` - Input/output guardrails (crisis, spam, medical advice, safety)
- `convex/schema.ts` - Database schema (16 tables: users, wellnessScores, assessmentSessions, etc.)
- `convex/http.ts` - HTTP router with Twilio webhook endpoint
- `convex/twilio.ts` - SMS handler calling agent system
- `admin-frontend/` - Admin dashboard (React + Convex subscriptions)

**Critical Patterns**:
- Files importing `@openai/agents` MUST have `"use node"` directive at top
- Use Convex validators (`v.object()`, `v.string()`) in `convex/` files, NOT Zod
- Agent instructions are **functions** that receive `RunContext<GiveCareContext>`, not static strings
- Agent tools use `tool({ name, description, parameters, execute })` wrapper
- Always extract `result.state?.context` after agent execution to get updated context
- Database schema uses Convex validators; 16 tables with indexes for performance

**Convex-Specific**:
- `query` = read-only database operations (client can call)
- `mutation` = write database operations (client can call)
- `action` = can call external APIs, run agents (client can call)
- `internalQuery/Mutation/Action` = backend-only, not exposed to client
- Run `npx convex dev` to auto-generate types in `convex/_generated/`
- Schema changes apply automatically on save in dev mode

**Documentation**: See `give-care-app/docs/CLAUDE.md` for complete guide

### Working with give-care-site (Marketing)
**Architecture**: Server Components first, Client Components only when needed

**Key Patterns**:
- Mobile-first responsive design
- WCAG 2.1 AA accessibility
- Core Web Vitals optimization (target: Lighthouse 90+)
- MDX for blog content
- Dynamic imports for code splitting

**Documentation**: See `give-care-site/CLAUDE.md` for guidelines

### Working with give-care-story (Presentations)
**Architecture**: Component-first slide decks

**Key Files**:
- `app/components/slides/` - Reusable slide library
- `app/[presentation]/` - Individual presentation folders

**Documentation**: See `give-care-story/CLAUDE.md` for component patterns

## Architecture Philosophy

The GiveCare monorepo separates concerns:

1. **Backend** (give-care-app): AI SMS agent + admin dashboard
2. **Marketing** (give-care-site): Public-facing content + SEO
3. **Presentations** (give-care-story): Slide decks + storytelling

This enables:
- Independent scaling and deployment
- Technology-specific optimizations
- Clear boundaries between public, internal, and backend systems
- Specialized development workflows per application type

## Monorepo Integration (Convex + Stripe)

**Shared Backend Architecture**: give-care-site connects to give-care-app's Convex backend.

### How It Works

```
give-care-site (Marketing)  →  give-care-app (Convex Backend)
  Signup form calls              ↓
  api.stripe.createCheckoutSession → Stripe checkout created
                                 ↓
                              User pays via Stripe
                                 ↓
                              Webhook → Update user + Send SMS
```

### Key Setup

1. **Workspace dependency** in `give-care-site/package.json`:
   ```json
   "give-care-app": "workspace:*"
   ```

2. **Import Convex API** in give-care-site:
   ```typescript
   import { api } from "give-care-app/convex/_generated/api"
   ```

3. **Shared Convex deployment**:
   - Both projects use `https://agreeable-lion-831.convex.cloud`
   - give-care-site calls actions (createCheckoutSession)
   - give-care-app handles webhooks and SMS

### Environment Variables

**give-care-site** needs:
- `NEXT_PUBLIC_CONVEX_URL` - Convex backend URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key

**give-care-app** needs:
- `STRIPE_KEY` - Stripe secret key (backend)
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- `TWILIO_*` - SMS credentials

**Important**: Always start `give-care-app` Convex dev server before `give-care-site` to ensure types are generated.

See `MONOREPO_INTEGRATION.md` for complete integration guide.

## Package Manager: pnpm

**All projects use pnpm@9.0.0**

**Why pnpm?**
- Shared dependencies across workspace (saves disk space)
- Faster installs than npm
- Stricter dependency resolution
- Built-in workspace support

**Important**: Always run `pnpm install` from root to set up workspace correctly.

## Environment Variables

Each project has its own `.env.local` (or `.env`) file:

**give-care-app (.env.local)**:
- `CONVEX_DEPLOYMENT` - Convex deployment URL
- `OPENAI_API_KEY` - OpenAI API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `STRIPE_SECRET_KEY` - Stripe secret key

**give-care-site (.env.local)**:
- `NEXT_PUBLIC_CONVEX_URL` - Convex URL (public)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` - Monthly subscription price ID
- `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID` - Annual subscription price ID
- `RESEND_API_KEY` - Resend email API key

**give-care-story**: No environment variables required

**Security**: Never commit `.env*` files (except `.env.example`)

## Testing

**give-care-app**: 179 tests passing
```bash
cd give-care-app
npm test                              # All tests
npm test -- burnout                   # Specific test file
npm test -- --coverage                # Coverage report
```

**give-care-site**: Vitest + Playwright
```bash
cd give-care-site
pnpm test                             # Unit tests
pnpm test:e2e                         # E2E tests
```

## Deployment

**give-care-app (Backend)**:
```bash
cd give-care-app
npx convex deploy --prod              # Deploy to Convex
```

**give-care-site (Marketing)** - Cloudflare Pages:
```
Domain: givecareapp.com
Build command: pnpm install && pnpm --filter give-care-site build
Build output: give-care-site/out
Root directory: give-care-site
Framework: Next.js (Static Export)
```

**give-care-story (Presentations)** - Cloudflare Pages:
```
Domain: story.givecareapp.com
Build command: pnpm install && pnpm --filter give-care-story build
Build output: give-care-story/out
Root directory: give-care-story
Framework: Next.js (Static Export)
```

**Note**: Both Next.js apps use `output: 'export'` for static HTML generation, optimized for Cloudflare Pages global CDN.

See `MONOREPO_INTEGRATION.md` for complete deployment guide.

## Key Documentation Locations

**Root (Monorepo)**:
- `CLAUDE.md` - This file - Monorepo overview and setup
- `MONOREPO_INTEGRATION.md` - Complete Convex + Stripe integration guide
- `README.md` - Project introduction

**Backend (give-care-app)**:
- `docs/CLAUDE.md` - AI assistant guide
- `docs/ARCHITECTURE.md` - System design (540 lines)
- `docs/TAXONOMY.md` - Nomenclature (1,700 lines)
- `docs/DEVELOPMENT.md` - Dev setup
- `docs/DEPLOYMENT.md` - Production deploy
- `docs/TASKS.md` - Active sprint tasks

**Marketing (give-care-site)**:
- `CLAUDE.md` - AI assistant guide
- Feature implementation system guidelines

**Presentations (give-care-story)**:
- `CLAUDE.md` - Component development guide

## Project Status

**give-care-app**: ✅ Production-ready v0.7.0
- 179 tests passing
- ~900ms response time
- Admin dashboard live at https://dash.givecareapp.com

**give-care-site**: 🚧 Active development v0.1.0
- Marketing website optimization
- Content expansion

**give-care-story**: ✅ Stable v1.0.0
- Component library mature
- Multiple presentations deployed

## Contributing Guidelines

1. **Always install from root first**: `pnpm install`
2. **Use pnpm for all package operations**
3. **Follow project-specific coding standards** (see project CLAUDE.md files)
4. **Run tests before committing**
5. **Update documentation when changing architecture**

## Common Issues

### TypeScript errors in give-care-app
**Problem**: Hundreds of type errors about missing Convex types (`convex/_generated/api`, `convex/_generated/dataModel`)
**Solution**: Run `npx convex dev` to auto-generate types in `convex/_generated/`

### "EventTarget is not defined" in give-care-app
**Problem**: OpenAI Agents SDK requires Node.js APIs
**Solution**: Add `"use node"` directive at the top of any file importing from `@openai/agents`

### Dependency installation fails
**Problem**: Dependencies out of sync after git pull
**Solution**: Delete all `node_modules/` directories and `pnpm-lock.yaml`, then run `pnpm install` from root

### Workspace dependency not found (give-care-app import fails in give-care-site)
**Problem**: Cross-project import fails
**Solution**: Ensure package name in `give-care-app/package.json` is `"give-care-app"` and matches the import

### pnpm command not found
**Problem**: Developer doesn't have pnpm installed globally
**Solution**: Install pnpm: `npm install -g pnpm@9.0.0`

### Convex deployment fails
**Problem**: Missing environment variables in production
**Solution**: Set env vars in Convex dashboard (Settings → Environment Variables). Never commit secrets to code.

## Quick Reference

### Navigate to a Project
```bash
cd give-care-app      # Backend + admin
cd give-care-site     # Marketing website
cd give-care-story    # Presentations
```

### Install Dependencies
```bash
# From root (ALWAYS DO THIS FIRST)
pnpm install

# Individual project (if needed)
cd give-care-app && pnpm install
```

### Run Development Server
```bash
# Backend
cd give-care-app && npx convex dev

# Marketing
cd give-care-site && pnpm dev

# Presentations
cd give-care-story && pnpm dev
```

### Run Tests
```bash
# Backend
cd give-care-app && npm test

# Marketing
cd give-care-site && pnpm test
```

## Contact & Support

- **Primary Backend**: give-care-app (TypeScript/Convex)
- **Admin Dashboard**: https://dash.givecareapp.com
- **Marketing Site**: give-care-site (Next.js 15)
- **Presentations**: give-care-story (Next.js)

For project-specific questions, see the CLAUDE.md file in each project directory.

---

**Last updated**: 2025-10-14 (Monorepo consolidation to 3 apps)
