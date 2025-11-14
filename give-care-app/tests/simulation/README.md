# Simulation Tests - E2E Testing Framework

## Purpose
End-to-end tests that verify every critical path in the GiveCare platform by running real Convex functions against an in-memory database.

**NO MOCKS** - These tests exercise actual code paths, detect real bugs, and verify behavior matches `ARCHITECTURE.md` specifications.

## Current Status (v1.0 - Functional E2E)

### ✅ What Works (E2E Verified)
- **User Creation**: Creates real users in test database via `internal.internal.users.upsertUserFromSignup`
- **Subscription Setup**: Creates active subscriptions via `internal.internal.subscriptions.createTestSubscription`
- **Message Validation**: Sends properly formatted Twilio webhook messages
- **Crisis Detection Logic**: Real `detectCrisis()` function verifies (✓ 3/3 tests passing)
- **Database Queries**: All indexes verified (`by_user`, `by_user_and_importance`, etc.)
- **Cleanup**: Deletes all test data from 6+ tables automatically

### 🔧 In Progress
- **Scheduled Functions**: `finishAllScheduledFunctions()` needs `advanceTimers` support
- **Agent Execution**: Agents aren't running yet (blocked on scheduled functions)
- **Alert Creation**: Crisis alerts not created (blocked on agent execution)

### Current Test Results
```
✓ Step 2: crisisDetected       (crisis detection logic works!)
✓ Step 3: wait (1001ms)         (timing logic works!)
✗ Step 1: advanceTimers is not a function
✗ Step 3: No agent runs found   (agent not executing - blocked)
✗ Step 7: No alert created      (blocked on agent execution)
```

## Test Architecture

### Runner (`runner.ts`)
- **Real User Setup**: Creates Convex users with subscriptions
- **Real Message Processing**: Calls `internal.inbound.handleIncomingMessage`
- **Real Database Queries**: Checks `agent_runs`, `alerts`, `assessments` tables
- **Real Cleanup**: Deletes all test data via `ctx.db.delete()`

### Scenarios (`scenarios/`)
- **Crisis**: Immediate response, escalation, false positives, follow-up
- **Onboarding**: Happy path, profile completion, assessment flow
- **Future**: Progressive onboarding, resource search, check-ins

## How to Run

```bash
# Run all simulation tests
npm test -- simulation

# Run specific test file
npm test -- tests/simulation/simulation.test.ts

# Run in watch mode
npm test -- simulation --watch

# Run single scenario
npm test -- context.simulation
```

## Test Scenarios

### Crisis Scenarios
1. **Immediate Response** - User sends crisis message, receives 988 + resources
2. **Escalation** - Normal chat → crisis thoughts → crisis agent
3. **Multiple Terms** - Various crisis phrases trigger detection
4. **False Positives** - Normal grief messages don't trigger crisis
5. **Follow-up** - Continued support after crisis response

### Onboarding Scenarios
1. **Happy Path** - Subscribe → profile → assessment → personalized support
2. **No Subscription** - Paywall message for free users
3. **Progressive** - Contextual profile questions (ZIP code when needed)
4. **Skip** - User skips questions, system uses defaults

## Next Steps

### Immediate Fixes Needed
1. **Fix Scheduled Functions** - Resolve `advanceTimers` issue in convex-test
2. **Enable Agent Execution** - Verify agents run and create `agent_runs` records
3. **Verify Crisis Flow** - Ensure crisis agent creates alerts

### Expansion Roadmap
4. **Add Resource Search Tests** - ZIP code persistence, Google Maps grounding
5. **Add Check-in Tests** - Scheduled check-ins, wellness trends
6. **Add Intervention Tests** - Intervention suggestions, preference tracking
7. **Add Memory Tests** - Context persistence, importance scoring
8. **Add Progressive Onboarding** - P2-compliant field collection

## Test Coverage Goals

### Critical Paths to Test
- [x] User creation and subscription setup
- [x] Crisis detection logic
- [ ] Crisis agent response with 988
- [ ] Crisis alert creation
- [ ] Main agent conversation flow
- [ ] Assessment completion
- [ ] Wellness score calculation
- [ ] Resource search with ZIP code
- [ ] Progressive profile completion
- [ ] Check-in scheduling
- [ ] Memory recording and retrieval
- [ ] Intervention suggestions

## Verification Protocol

Each test follows the pattern:
1. **Setup** - Create user with specific state
2. **Action** - Simulate user interaction (SMS, assessment)
3. **Verify** - Query database to check expected state
4. **Cleanup** - Delete all test data

Example:
```typescript
// Setup
const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {...});

// Action
await t.mutation(internal.inbound.handleIncomingMessage, {
  message: { body: "I can't do this anymore", ...twilioFields }
});

// Verify
const alerts = await t.run(ctx =>
  ctx.db.query('alerts').withIndex('by_user', q => q.eq('userId', userId)).collect()
);
expect(alerts).toHaveLength(1);
expect(alerts[0].type).toBe('crisis');

// Cleanup
await cleanup(userId);
```

## Debugging Tips

1. **Check logs**: Each step prints success/failure
2. **Inspect database**: Tests query real tables
3. **Verify indexes**: Schema indexes must match query patterns
4. **Check cleanup**: `🧹 Cleanup` message confirms data deletion

## References

- `ARCHITECTURE.md` - Source of truth for expected behavior
- `PRODUCT.md` - Feature specifications
- `convex/schema.ts` - Database schema and indexes
- `convex/inbound.ts` - Message processing entry point
- `convex/agents.ts` - Agent implementations
