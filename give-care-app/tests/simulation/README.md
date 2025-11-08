# Simulation Tests

**Purpose:** Real Convex environment tests - no mocks
**Compare:** Results vs ARCHITECTURE.md + PRODUCT.md
**Goal:** Find edge cases, verify specs, recursive fix

## Quick Start

```bash
# Run all simulation tests
npm test -- simulation

# Run specific feature
npm test -- context.simulation
npm test -- agents.simulation

# Watch mode (fix-as-you-go)
npm test -- --watch simulation
```

## What These Test

- Real Convex database operations
- Real agent.generateText() calls
- Real tool executions
- Real SMS workflows
- Edge cases and failure modes

## No Mocks

```typescript
// ❌ Don't do this
vi.mock('convex/functions/context');

// ✅ Do this
const result = await ctx.runMutation(api.functions.context.recordMemory, {
  userId: testUser._id,
  category: 'care_routine',
  content: 'Morning routine at 9am',
  importance: 8
});
```

## Verify Against Specs

Every test should reference:
- **ARCHITECTURE.md** - Expected behavior
- **PRODUCT.md** - Feature requirements

Example:
```typescript
// ARCHITECTURE.md says: "recordMemory saves to memories table with category"

it('should record memory with importance', async () => {
  const result = await ctx.runMutation(api.functions.context.recordMemory, args);
  
  const memory = await ctx.db.query('memories')
    .filter(q => q.eq(q.field('userId'), user._id))
    .first();
  
  expect(memory).toBeDefined();
  expect(memory.category).toBe('care_routine');
  expect(memory.importance).toBe(8);
});
```

## Loop Protocol

See CLAUDE.md for full protocol:

1. Run simulation test
2. Compare failure to ARCHITECTURE.md
3. Classify: Code bug | Test bug | Spec gap | Edge case
4. Fix or document
5. Re-run
6. Repeat until all pass ✅

## Success Criteria

- ✅ All tests pass
- ✅ Behavior matches ARCHITECTURE.md
- ✅ Edge cases documented
- ✅ No mocks used
- ✅ Real Convex environment
