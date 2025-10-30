# GiveCare Monorepo

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

## Monorepo Structure

AI-powered SMS caregiving platform (pnpm workspace)

```
givecare/
├── give-care-app/       # Convex backend + Twilio SMS + admin dashboard
├── give-care-site/      # Next.js 15 marketing site
├── give-care-story/     # Next.js presentations
└── give-care-etl/       # Cloudflare Workers resource pipeline
```

## Quick Start

```bash
pnpm install                           # Install all workspaces

# Dev servers
pnpm --filter give-care-app dev       # Backend (generates types first!)
pnpm --filter give-care-site dev      # Marketing site
pnpm --filter give-care-story dev     # Presentations
```

## give-care-app (Backend)

**Tech**: Convex, OpenAI Agents SDK, Twilio, Vitest
**Critical**: Run `npx convex dev` first - generates types in `convex/_generated/`

**Architecture**: 3-agent system (Main, Crisis, Assessment)

**Key Patterns**:
- Files importing `@openai/agents` need `"use node"` directive
- Use Convex validators, NOT Zod
- Use `hasContextState()` guard before accessing context

**Docs**: See `give-care-app/docs/CLAUDE.md`

## give-care-site (Marketing)

**Tech**: Next.js 15, Tailwind v4, DaisyUI, Framer Motion, MDX

**Design System**:
- Typography: `.heading-hero`, `.heading-section`
- Buttons: `.btn-editorial-primary`, `.btn-editorial-secondary`
- Colors: `bg-base-100`, `text-amber-950`, `text-amber-700`

**Monorepo Integration**: Imports Convex types, start backend first

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
**Context undefined**: Use `hasContextState()` type guard
**Code not updating**: Touch parent file: `touch convex/twilio.ts && npx convex dev --once`

## Environment Variables

See `.env.example` in each project. Never commit secrets.

**give-care-app**: `CONVEX_DEPLOYMENT`, `OPENAI_API_KEY`, `TWILIO_*`, `STRIPE_SECRET_KEY`
**give-care-site**: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`

## Project-Specific Docs

- `give-care-app/docs/` - Architecture, taxonomy, development guides
- `give-care-site/CLAUDE.md` - Component patterns, design system
- `give-care-story/CLAUDE.md` - Presentation guidelines
- `give-care-etl/CLAUDE.md` - ETL pipeline architecture
