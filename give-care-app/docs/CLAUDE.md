# GiveCare Backend - Convex + OpenAI Agents

## Quick Start

**IMPORTANT**: Run `npx convex dev` first - generates required types in `convex/_generated/`

```bash
npx convex dev              # Start backend + type generation
npm test                    # Run tests
npx convex deploy --prod    # Deploy to production
```

## Critical Patterns

### Files importing `@openai/agents` MUST have `"use node"` directive at top
### Use Convex validators in `convex/` files, NOT Zod
### System prompts are markdown files in `src/prompts/` with template variables
### Agent instructions load prompts at runtime via `loadPrompt()` and `replaceVariables()`
### Use `hasContextState()` guard before accessing `result.state.context`
### Touch parent file to trigger rebuild: `touch convex/twilio.ts && npx convex dev --once`

## Architecture

**3-agent system**: Main → Crisis → Assessment (with seamless handoffs)
- Main Agent: General support, tools, routing
- Crisis Agent: Safety-focused, resource connections
- Assessment Agent: EMA, CWBS, REACH-II, SDOH scoring

**Tech Stack**: Convex (serverless), OpenAI Agents SDK, Twilio, Vitest

## Code Style

- Destructure imports: `import { api } from "convex/_generated/api"`
- Use Convex validators: `v.object({ name: v.string() })`
- Async background logging (0ms user-facing latency)
- Server Components first, Client Components only when needed

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema |
| `src/instructions.ts` | Agent instruction loaders |
| `src/prompts/*.md` | System prompts (main, crisis, assessment) |
| `src/prompts/loader.ts` | Prompt loader utility |
| `src/tools.ts` | Agent tools |
| `convex/twilio.ts` | SMS handling |
| `convex/agents.ts` | Agent initialization |

## Documentation

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Multi-agent system design, data flow |
| [ASSESSMENTS.md](ASSESSMENTS.md) | Clinical assessment tools, scoring |
| [TAXONOMY.md](TAXONOMY.md) | Naming conventions, bands, zones |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Dev setup, testing, debugging |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment process |
| [SCHEDULING.md](SCHEDULING.md) | Cron jobs, proactive messaging |
| [RATE_LIMITS.md](RATE_LIMITS.md) | Rate limiting, cost protection |
| [SOP.md](SOP.md) | Troubleshooting procedures |

## Environment Variables

See `.env.example` in project root. Required:
- `CONVEX_DEPLOYMENT`
- `OPENAI_API_KEY`
- `TWILIO_*` (account SID, auth token, phone)
- `STRIPE_SECRET_KEY`

## Common Issues

**Missing types**: Run `npx convex dev`
**EventTarget error**: Add `"use node"` directive
**Context undefined**: Use `hasContextState()` guard
**Code not updating**: Touch parent file to trigger rebuild

## Documentation Policy

**Active Docs: 15 MAX** (Current: 15/15 ✅)

### Rules
- UPDATE, DON'T CREATE - Edit existing files
- PRUNE AS YOU GO - Delete outdated sections
- ONE TRUTH - One topic = one file
- CHANGELOG IS HISTORY - Implementation details in git

### Never Create Docs For
- Bug fixes → CHANGELOG.md
- Task planning → Delete after completion
- Research → External tools
- Status updates → Git commits

## Workflow

- Plan in planning mode before implementing
- Run `npm test` before committing
- Commit often in logical groups
- Use specific file paths with `git add`, never `git add .`
- Sacrifice grammar for concision in commits
