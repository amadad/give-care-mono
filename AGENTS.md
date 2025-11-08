# Agent Guidelines

**Purpose:** Quick reference for AI agents working on GiveCare
**Last Updated:** 2025-01-08 (v1.4.0)

---

## Read First

| Doc | Purpose |
|-----|---------|
| `ARCHITECTURE.md` | Complete system reference (one-liner per function) |
| `CLAUDE.md` | Monorepo guide + simulation testing loop |
| `tests/simulation/README.md` | Testing protocol |

---

## Rules

| Rule | Details |
|------|---------|
| **No mocks** | Use `convexTest(schema)` - real Convex environment only |
| **Read ARCHITECTURE.md first** | Understand expected behavior before coding |
| **Reference specs** | Every test comment cites `ARCHITECTURE.md` |
| **P1-P6 principles** | Trauma-informed communication (see prompts) |
| **One thing at a time** | Never batch questions in user-facing features |
| **Convex validators** | Use `v.string()`, not Zod (except in agent tools) |
| **"use node" directive** | Only when importing `@openai/agents` |
| **Update docs** | ARCHITECTURE.md + CHANGELOG.md when behavior changes |

---

## Trauma-Informed Principles (P1-P6)

| Principle | Rule |
|-----------|------|
| P1: Acknowledge > Answer > Advance | Validate, respond, guide |
| P2: Never Repeat | Don't ask same question twice |
| P3: Respect Boundaries | Max 2 attempts per field, offer skip |
| P4: Soft Confirmations | "Got it: Nadia, right?" not assumptions |
| P5: Always Offer Skip | Every request allows deferral |
| P6: Deliver Value Every Turn | Validation, tip, resource, or progress |

---

## Simulation Testing Loop

```bash
# 1. Run test
npm test -- [feature].simulation

# 2. Compare failure to ARCHITECTURE.md
# 3. Classify: Code bug | Test bug | Spec gap | Edge case
# 4. Fix in identified file
# 5. Re-run test
# 6. Repeat until pass ✅
```

**Modes:**
- Fix-as-you-go: `npm test -- --watch simulation`
- Document-then-fix: List all failures, prioritize, batch fix

---

## Common Tasks

| Task | Steps |
|------|-------|
| **Add agent tool** | 1. Read ARCHITECTURE.md "Agent Tools" <br> 2. Create tool in `convex/agents/main.ts` <br> 3. Update `MAIN_PROMPT` in `convex/lib/prompts.ts` <br> 4. Write simulation test <br> 5. Update ARCHITECTURE.md table |
| **Fix test** | 1. Read ARCHITECTURE.md expected behavior <br> 2. Run test <br> 3. Classify issue <br> 4. Fix <br> 5. Re-run <br> 6. Document edge case |
| **Update prompt** | 1. Verify P1-P6 alignment <br> 2. Maintain template variables <br> 3. Test with simulation <br> 4. Update CHANGELOG.md |
| **Add Convex function** | 1. Choose location (functions/ or lib/) <br> 2. Use Convex validators <br> 3. Add to ARCHITECTURE.md <br> 4. Write test <br> 5. Run `npx convex dev` |

---

## Key Patterns

| Pattern | Right ✅ | Wrong ❌ |
|---------|---------|---------|
| **Testing** | `convexTest(schema)` | `vi.mock('convex/...')` |
| **Context** | `contextHandler: async (ctx, args) => {...}` | Manual prompt building |
| **Tools** | `createTool({ args: z.object({...}) })` | Free-form generation |
| **Usage** | `...sharedAgentConfig` | No tracking |
| **Rate limits** | `checkMessageRateLimit` then `consume` | Direct send |

---

## File Rules

| File/Dir | Rules |
|----------|-------|
| `convex/lib/prompts.ts` | Include P1-P6, use template variables, SMS ≤150 chars |
| `convex/agents/*.ts` | "use node" directive, `sharedAgentConfig`, profile helpers |
| `convex/functions/*.ts` | Convex validators, add to ARCHITECTURE.md, verify ownership |
| `convex/schema.ts` | Define indexes, document purpose, update ARCHITECTURE.md |
| `tests/simulation/*.ts` | NO mocks, reference ARCHITECTURE.md, test edge cases |

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Using mocks | Use `convexTest(schema)` |
| Skipping ARCHITECTURE.md | Read it first |
| Batching questions | One thing at a time (P2) |
| Manual prompt building | Use `renderPrompt()` |
| Duplicate code | Use profile helpers |

---

## Development

```bash
# Start
cat ARCHITECTURE.md              # Read spec
npx convex dev                   # Generate types
git checkout -b feature/name     # Branch
npm test -- --watch [feature].simulation  # TDD

# Change
# 1. Edit code
# 2. npm test -- simulation
# 3. Verify vs ARCHITECTURE.md
# 4. Update docs
# 5. git add [specific-files] && git commit

# Deploy
npx convex deploy
```

---

## Quick Ref

**Primary:** ARCHITECTURE.md (system), CLAUDE.md (patterns), CHANGELOG.md (changes)
**Agents:** `convex/agents/` (main, crisis, assessment)
**Prompts:** `convex/lib/prompts.ts` (P1-P6 principles)
**Utils:** `convex/lib/profile.ts` (helpers), `usage.ts` (tracking), `rateLimiting.ts` (limits)

---

**Last Updated:** v1.4.0 (2025-01-08)
