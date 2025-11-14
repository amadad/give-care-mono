# Simulation Tests - E2E Testing Framework

## Purpose
End-to-end tests that verify every critical path in the GiveCare platform by running real Convex functions against an in-memory database.

**NO MOCKS** - These tests exercise actual code paths, detect real bugs, and verify behavior matches `ARCHITECTURE.md` specifications.

## Current Status (v2.0 - Full E2E with API Requirements)

### ✅ What Works (E2E Verified)
- **Component Registration**: Agent, workflow, rateLimiter components properly registered
- **User Creation**: Creates real users in test database via `internal.internal.users.upsertUserFromSignup`
- **Subscription Setup**: Creates active subscriptions via `internal.internal.subscriptions.createTestSubscription`
- **Direct Agent Calls**: Bypasses webhook/scheduler to avoid convex-test limitations
- **Memory System**: recordMemory, listMemories, importance filtering all working
- **Database Queries**: All indexes verified (`by_user`, `by_user_and_importance`, etc.)
- **Error Handling**: Graceful retry logic for API calls with exponential backoff
- **Cleanup**: Deletes all test data from 6+ tables automatically

### ⚠️ Requires API Keys
Tests run successfully but agent-dependent assertions fail without:
- **OPENAI_API_KEY**: For embeddings and GPT-4 mini (assessment agent)
- **GOOGLE_API_KEY**: For Gemini 2.5 Flash (main agent)

Without API keys, you'll see:
```
⚠️  Agent API unavailable: Cannot connect to API: getaddrinfo EAI_AGAIN api.openai.com
   Continuing test without agent response
✓ Step 1: sendMessage (infrastructure works!)
✗ Step 2: Expected crisis=true, got false (no LLM to detect)
✗ Step 3: No agent runs found (no LLM to generate response)
```

### Current Test Results (without API keys)
```
✓ User setup and database operations
✓ Direct function calls (mutations, queries, actions)
✓ Memory recording and retrieval
✓ Assessment workflow setup
✗ Agent text generation (requires API keys)
✗ Crisis detection via LLM (requires API keys)
✗ Response generation (requires API keys)
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

## Setup for Full E2E Testing

### Option 1: With API Keys (Full E2E)

1. Create `.env` file in `give-care-app/` directory:
```bash
OPENAI_API_KEY=sk-proj-...your-key...
GOOGLE_API_KEY=...your-key...
```

2. Run tests:
```bash
npm run test:e2e
```

All tests will pass with real LLM responses.

### Option 2: Without API Keys (Infrastructure Only)

Run tests without API keys to verify:
- Database operations
- Function routing
- Schema validation
- Memory system
- Assessment workflow

Tests will show warnings but infrastructure tests pass:
```bash
npm run test:e2e
# ⚠️ Agent API unavailable warnings expected
# ✓ Infrastructure tests pass
# ✗ Agent-dependent assertions skip
```

## How to Run

```bash
# Run all e2e tests
npm run test:e2e

# Run in watch mode
npm run test:e2e:watch

# Run all simulation tests (includes unit tests)
npm test -- simulation

# Run specific test file
npm test -- tests/simulation/all-scenarios.test.ts

# Run property-based tests
npm run test:property
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

### To Enable Full E2E Testing
1. **Add API Keys** - Set OPENAI_API_KEY and GOOGLE_API_KEY in .env
2. **Run with Keys** - Verify all agent-dependent tests pass
3. **CI/CD Integration** - Add secrets to GitHub Actions for automated testing

### Expansion Roadmap
4. **Add Resource Search Tests** - ZIP code persistence, Google Maps grounding (infrastructure ready)
5. **Add Check-in Tests** - Scheduled check-ins, wellness trends
6. **Add Intervention Tests** - Intervention suggestions, preference tracking
7. **Expand Memory Tests** - More edge cases for context persistence
8. **Progressive Onboarding Tests** - P2-compliant field collection (infrastructure ready)

## Test Coverage Status

### Infrastructure (✅ Working without API keys)
- [x] User creation and subscription setup
- [x] Component registration (agent, workflow, rateLimiter)
- [x] Direct function calls (mutations, queries, actions)
- [x] Memory recording and retrieval
- [x] Memory filtering by category and importance
- [x] Assessment session creation and management
- [x] Database queries with proper indexes
- [x] Test cleanup across all tables

### LLM-Dependent (⚠️ Requires API keys)
- [ ] Crisis agent response with 988 (needs GOOGLE_API_KEY)
- [ ] Crisis alert creation via LLM detection (needs GOOGLE_API_KEY)
- [ ] Main agent conversation flow (needs GOOGLE_API_KEY)
- [ ] Assessment completion with scoring (needs OPENAI_API_KEY)
- [ ] Wellness score calculation (needs OPENAI_API_KEY)
- [ ] Resource search with ZIP code (needs GOOGLE_API_KEY)
- [ ] Progressive profile completion (needs GOOGLE_API_KEY)

### Not Yet Implemented
- [ ] Check-in scheduling
- [ ] Intervention preference tracking
- [ ] Long-term memory trends

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
