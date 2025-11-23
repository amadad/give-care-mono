# GiveCare Monorepo

Use subagents to kick off user requests
Parallelize subagents for non-overlapping requests

## Code Quality Rules
- No emojis in PRs/commits
- Git: `git add [specific-files]` never `git add .`
- Commit often in logical groups
- Never work on main unless given permission
- Sacrifice grammar for concision
- List unresolved questions at end if any
- No fake case studies or numbers
- No mocking in tests - real tests only
- Plan mode must include writing tests

## Tool Usage Guidelines

### Bash Tool Limitations
- ❌ NO command substitution: `$(find ...)` gets mangled by escaping
- ❌ NO complex loops: `for file in $(cmd); do ... done` fails
- ❌ NO multiple pipes in loops
- ✅ USE simple commands: `find ... -exec ... {} \;`
- ✅ USE sequential commands: `cmd1 && cmd2`
- ✅ BREAK complex operations into multiple simple Bash calls

**Wrong:**
```bash
for file in $(find . -name "*.ts"); do grep "export" "$file"; done
```

**Correct:**
```bash
find . -name "*.ts" -exec grep "export" {} \;
```

### CLI Flag Verification
- ALWAYS check `--help` output before using CLI flags
- NEVER assume flag names (e.g., `--prod` doesn't exist for `convex deploy`)
- VERIFY syntax with actual CLI documentation

### Convex Deploy Commands
- ✅ `npx convex deploy` (deploys to prod by default)
- ✅ `npx convex deploy --yes` (skip confirmation)
- ✅ `npx convex deploy --typecheck=disable` (for large projects with TS timeout issues)
- ✅ `npx convex dev` (dev deployment)
- ❌ `npx convex deploy --prod` (flag doesn't exist)

## Monorepo Structure

AI-powered SMS caregiving platform (pnpm workspace)

```
givecare/
├── give-care-app/       # Convex backend + Twilio SMS
├── give-care-admin/     # Admin dashboard (Vite + React)
├── give-care-site/      # Next.js 16 marketing site
├── give-care-story/     # Next.js presentations
└── give-care-etl/       # Cloudflare Workers resource pipeline
```

## Quick Start

```bash
pnpm install                                # Install all workspaces

# Dev servers
pnpm --filter give-care-app dev            # Backend (generates types first!)
pnpm --filter give-care-admin-dashboard dev # Admin dashboard
pnpm --filter give-care-site dev           # Marketing site
pnpm --filter give-care-story dev          # Presentations
```

## give-care-app (Backend)

**Tech**: Convex, Convex Agent Component (@convex-dev/agent), Vercel AI SDK, Twilio, Vitest
**Model**: Gemini 2.5 Flash-Lite (cost-efficient, low latency)
**Critical**: Run `npx convex dev` first - generates types in `convex/_generated/`

**Architecture**: Unified single-agent system (Mira) using Convex Agent Component

**Key Patterns**:
- Files importing AI SDK need `"use node"` directive
- Use Convex validators in schema, Zod for tool definitions (convex/tools.ts)
- System prompts in `convex/lib/prompts.ts` (UNIFIED_PROMPT, TRAUMA_PRINCIPLES)
- All 8 tools defined in `convex/tools.ts` (getResources, startAssessmentTool, recordAssessmentAnswerTool, getCrisisResources, recordMemory, updateProfile, findInterventions, checkOnboardingStatus)
- Memory uses Convex Agent Component built-in storage with semantic search
- No harness tokens required - fully Convex-native

**Core Files**:
- `convex/agent.ts` - Main chat handler, injects assessment context
- `convex/agents.ts` - Mira agent definition, contextHandler, usageHandler
- `convex/tools.ts` - All agent tools with Zod schemas
- `convex/schema.ts` - Database schema with Convex validators
- `convex/lib/prompts.ts` - System prompts, trauma principles, SMS constraints

**Testing**:
- `tests/internal/` - Internal function tests (Stripe, utils)
- `tests/lib/` - Library function tests
- No mocking - real Convex environment only

## give-care-admin (Admin Dashboard)

**Tech**: Vite, React 19, TanStack Router, Convex React, Tailwind CSS 4, shadcn/ui

**Architecture**: Frontend-only dashboard consuming Convex backend

**Key Patterns**:
- Imports Convex types from `give-care-app/convex/_generated/`
- Uses `@convex-dev/auth` for authentication
- TanStack Router for file-based routing
- shadcn/ui components for UI

**Build**: CI/CD handled by `scripts/setup-convex.js` prebuild

**Docs**: See `give-care-admin/README.md`

## give-care-site (Marketing)

**Tech**: Next.js 15, Tailwind v4.1.7, DaisyUI, Framer Motion, MDX, Stripe, Resend

**Design System**:
- Typography: `.heading-hero`, `.heading-section`
- Buttons: `.btn-editorial-primary`, `.btn-editorial-secondary`
- Colors: `bg-base-100`, `text-amber-950`, `text-amber-700`

**Key Integrations**:
- Imports Convex types from `give-care-app/convex/_generated/`
- Stripe checkout for subscriptions
- Resend for email delivery
- Start backend first to generate types

**Docs**: See `give-care-site/CLAUDE.md`

## give-care-story (Presentations)

**Tech**: Next.js 15, Tailwind, Framer Motion
**Fonts**: Gabarito (headings), Alegreya (body)

**Docs**: See `give-care-story/CLAUDE.md`

## give-care-etl (Resource Pipeline)

**Tech**: Cloudflare Workers, OpenAI Agents SDK, Zod
**Architecture**: 3-agent system (Orchestrator, Discovery, Extraction)

**Critical**: Service types must match `give-care-app/convex/ingestion/shared/registry.ts`

**Docs**: See `give-care-etl/CLAUDE.md`

## Common Issues

**Missing Convex types**: Run `npx convex dev` in give-care-app
**EventTarget error**: Add `"use node"` directive to file
**Workspace import fails**: Check package name in `package.json`
**Code not updating**: Touch parent file or run `npx convex dev --once`
**TypeScript timeout**: Deploy with `--typecheck=disable` flag (static API generation enabled)

## Environment Variables

See `.env.example` in each project. Never commit secrets.

**give-care-app**: `CONVEX_DEPLOYMENT`, `GEMINI_API_KEY` (Mira agent), `OPENAI_API_KEY` (embeddings), `TWILIO_*`, `STRIPE_SECRET_KEY`
**give-care-admin**: `VITE_CONVEX_URL`
**give-care-site**: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`

## Project-Specific Docs

- `give-care-app/CHANGELOG.md` - Version history and changes
- `give-care-admin/README.md` - Admin dashboard setup and development
- `give-care-site/CLAUDE.md` - Component patterns, design system
- `give-care-story/CLAUDE.md` - Presentation guidelines
- `give-care-etl/CLAUDE.md` - ETL pipeline architecture
