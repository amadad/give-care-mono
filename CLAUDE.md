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

**Note**: give-care-app uses static API generation (`staticApi` + `staticDataModel` in `convex.json`) for performance. Deploy with `--typecheck=disable` due to TypeScript compiler memory limits on large projects.

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
**Critical**: Run `npx convex dev` first - generates types in `convex/_generated/`

**Architecture**: 3-agent system (Main, Crisis, Assessment) using Convex Agent Component

**Key Patterns**:
- Files importing AI SDK need `"use node"` directive
- Use Convex validators, NOT Zod
- System prompts in `convex/lib/prompts.ts` with template variables
- Tools split into `convex/lib/tools/` directory
- Memory uses Convex Agent Component built-in storage
- No harness tokens required - fully Convex-native

**Docs**: See `give-care-app/docs/ARCHITECTURE.md` and `give-care-app/docs/FEATURES.md`

### Simulation Testing Loop

**Purpose:** Recursive real-test verification against ARCHITECTURE.md + PRODUCT.md
**Mode:** Fix-as-you-go OR document-then-fix
**No Mocks:** Real Convex environment only

**Protocol:**
1. **Run** simulation test in `tests/simulation/`
2. **Compare** failure to `ARCHITECTURE.md` (expected behavior)
3. **Classify** issue:
   - Code bug (implementation ≠ spec)
   - Test bug (test ≠ spec)
   - Spec gap (undefined behavior)
   - Edge case (new scenario)
4. **Fix** in identified file OR document in issue list
5. **Re-run** test
6. **Repeat** until all pass ✅

**Commands:**
```bash
npm test -- simulation              # Run all simulation tests
npm test -- context.simulation      # Run specific feature
npm test -- --watch simulation      # Fix-as-you-go mode
```

**Verify Against Specs:**
```typescript
// Reference ARCHITECTURE.md in every test
it('should record memory with importance', async () => {
  // ARCHITECTURE.md: "recordMemory saves to memories table with category"
  const result = await ctx.runMutation(api.functions.context.recordMemory, args);
  expect(result).toMatchArchitectureSpec();
});
```

**Edge Cases to Test:**
- Missing data (undefined, null)
- Boundary values (0, -1, MAX_INT)
- Race conditions (concurrent ops)
- Invalid input (wrong type, out of range)
- Missing dependencies (user doesn't exist)

**Success Criteria:**
- ✅ All tests pass
- ✅ Behavior matches ARCHITECTURE.md
- ✅ Edge cases documented
- ✅ No mocks used

See `tests/simulation/README.md` for full details.

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

**give-care-app**: `CONVEX_DEPLOYMENT`, `OPENAI_API_KEY`, `TWILIO_*`, `STRIPE_SECRET_KEY`
**give-care-admin**: `VITE_CONVEX_URL`
**give-care-site**: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`

## Project-Specific Docs

- `give-care-app/docs/` - Architecture, taxonomy, development guides
- `give-care-admin/README.md` - Admin dashboard setup and development
- `give-care-site/CLAUDE.md` - Component patterns, design system
- `give-care-story/CLAUDE.md` - Presentation guidelines
- `give-care-etl/CLAUDE.md` - ETL pipeline architecture
