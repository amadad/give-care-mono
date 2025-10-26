# CLAUDE.md

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

GiveCare: AI-powered SMS caregiving platform (pnpm workspace)

```
givecare/
├── give-care-app/       # Convex backend + Twilio SMS + admin dashboard
├── give-care-site/      # Next.js 15 marketing site
├── give-care-story/     # Next.js presentations
└── give-care-etl/       # Cloudflare Workers resource pipeline
```

## Quick Start

```bash
# Install (from root)
pnpm install

# Dev servers
pnpm --filter give-care-app dev   # Backend (generates types first!)
pnpm --filter give-care-site dev  # Marketing
pnpm --filter give-care-story dev # Presentations
```

## give-care-app (Backend)

**Tech**: Convex, TypeScript, OpenAI Agents SDK, Twilio, Vitest
**Critical**: Run `npx convex dev` first - generates types in `convex/_generated/`

**Architecture**: 3-agent system (Main, Crisis, Assessment) with seamless handoffs

**Key patterns**:
- Files importing `@openai/agents` need `"use node"` directive
- Use Convex validators in `convex/` files, NOT Zod
- Agent instructions are functions, not strings
- Use `hasContextState()` guard before accessing `result.state.context`

**Commands**:
```bash
npx convex dev              # Dev + type generation
npm test                    # Run tests
npx convex deploy --prod    # Production deploy
```

**Docs**: `give-care-app/docs/CLAUDE.md` has full details

## give-care-site (Marketing)

**Tech**: Next.js 15, Tailwind v4, DaisyUI, Framer Motion, MDX
**Design System**: Editorial style in `app/globals.css`

**Key patterns**:
- Server Components first, Client Components only when needed
- Typography: `.heading-hero`, `.heading-section` classes
- Buttons: `.btn-editorial-primary`, `.btn-editorial-secondary`
- Spacing: `.section-standard`, `.section-hero`
- Colors: `bg-base-100`, `text-amber-950`, `text-amber-700`
- Mobile-first, WCAG 2.1 AA

**Monorepo integration**:
- Imports Convex backend: `import { api } from "give-care-app/convex/_generated/api"`
- Start backend first to generate types

**Commands**:
```bash
pnpm dev        # Dev server
pnpm build      # Production build
pnpm test:e2e   # Playwright tests
```

**Docs**: `give-care-site/CLAUDE.md` has component guidelines

## give-care-story (Presentations)

**Tech**: Next.js 15, Tailwind, Framer Motion
**Fonts**: Gabarito (headings), Alegreya (body)

## Common Issues

**Missing Convex types**: Run `npx convex dev`
**EventTarget error**: Add `"use node"` directive to file
**Workspace import fails**: Check package name matches in `package.json`
**Context undefined**: Use `hasContextState()` type guard
**Code not updating**: Touch parent file: `touch convex/twilio.ts && npx convex dev --once`

## Environment Variables

See `.env.example` in each project. Never commit secrets.

**give-care-app**: `CONVEX_DEPLOYMENT`, `OPENAI_API_KEY`, `TWILIO_*`, `STRIPE_SECRET_KEY`
**give-care-site**: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`

## Project-Specific Docs

- `give-care-app/docs/` - Architecture, taxonomy, development guides
- `give-care-site/CLAUDE.md` - Component patterns, design system
- `MONOREPO_INTEGRATION.md` - Convex + Stripe integration
