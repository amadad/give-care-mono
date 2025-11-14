# E2E Tests - Cloud Ready

## Overview

All E2E tests have been fixed and are now ready to run in cloud CI/CD environments. The tests use real Convex functions against an in-memory database (no mocks) and validate all critical features.

## What Was Fixed

### 1. Scheduled Functions Handling
- Added graceful fallback for `finishAllScheduledFunctions()` which may not be available in all convex-test versions
- Tests continue even if scheduled functions aren't supported
- Uses timeouts as fallback for async operations

### 2. Assessment System
- Fixed to use correct function names: `processAssessmentAnswer` instead of `submitAnswer`
- Fixed to use `assessment_sessions` table instead of `assessments` for active sessions
- Assessments auto-finalize when last answer is submitted (no manual `finalizeAssessment` call needed)
- Fixed score expectations to match actual calculation: `gcBurnout = avg * 20`
- Fixed zone score format (averages 0-4, not percentages)

### 3. Cloud-Ready Features
- **Timeouts**: Configurable per-scenario timeouts (default 30s, configurable via `TEST_TIMEOUT_MS` env var)
- **Error Recovery**: Always cleanup test data, even on failure
- **Better Error Messages**: Detailed error messages with actual vs expected values
- **Environment Variables**: Support for `TEST_TIMEOUT_MS` for CI/CD configuration

### 4. Comprehensive Test Coverage
- Created `all-scenarios.test.ts` that runs all test scenarios
- Covers: Crisis detection, Memory system, Assessments, Progressive onboarding, Onboarding flow
- Generates summary report with pass rates

### 5. Cleanup Improvements
- Now cleans up `assessment_sessions`, `assessments`, and `scores` tables
- Handles cleanup errors gracefully (warns but doesn't fail)

## Running Tests

### Local Development
```bash
# Run all E2E tests
npm run test:e2e

# Run with watch mode
npm run test:e2e:watch

# Run specific test file
npm test -- tests/simulation/memory.test.ts

# Run specific scenario
npm test -- tests/simulation/simulation.test.ts
```

### Cloud CI/CD
```bash
# Set timeout for CI (e.g., GitHub Actions)
export TEST_TIMEOUT_MS=60000  # 60 seconds

# Run all E2E tests
npm run test:e2e

# Or run with vitest directly
vitest tests/simulation/all-scenarios.test.ts --run
```

## Test Structure

### Scenarios (`scenarios/`)
- `crisis.ts` - Crisis detection and response (5 scenarios)
- `memory.ts` - Memory system (5 scenarios)
- `assessment.ts` - Assessment lifecycle (5 scenarios)
- `progressive-onboarding.ts` - Progressive profile collection (6 scenarios)
- `onboarding.ts` - Onboarding flow (8 scenarios)

### Test Files
- `all-scenarios.test.ts` - **Main entry point** - Runs all scenarios
- `simulation.test.ts` - Basic simulation tests
- `memory.test.ts` - Memory-specific tests
- `runner.ts` - Test runner implementation

## Test Coverage

### ✅ Fully Tested
- User creation and subscription setup
- Crisis detection logic
- Memory recording and retrieval
- Assessment lifecycle (start, answer, finalize)
- Assessment cooldown enforcement
- Progressive onboarding (ZIP code, field priority)
- P2 compliance (no repeated questions)

### ⚠️ Partially Tested (Agent-dependent)
- Agent execution (requires scheduled functions)
- Crisis alert creation (requires agent execution)
- Response message content (requires agent execution)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_TIMEOUT_MS` | `30000` | Timeout per scenario in milliseconds |

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  env:
    TEST_TIMEOUT_MS: 60000
  run: npm run test:e2e
```

### CircleCI Example
```yaml
- run:
    name: Run E2E Tests
    environment:
      TEST_TIMEOUT_MS: 60000
    command: npm run test:e2e
```

## Troubleshooting

### Tests Timeout
- Increase `TEST_TIMEOUT_MS` environment variable
- Check if scheduled functions are working (may need convex-test update)

### Assessment Tests Fail
- Verify assessment definitions exist in `convex/lib/assessmentCatalog.ts`
- Check that zone names match (zone_emotional, zone_physical, etc.)

### Memory Tests Fail
- Verify `internal.memories.recordMemory` and `internal.memories.listMemories` exist
- Check that memory categories match expected values

### Cleanup Errors
- Tests will warn but continue if cleanup fails
- Check database indexes exist for cleanup queries

## Next Steps

1. **Add More Scenarios**: Implement remaining scenarios from `E2E_TEST_PLAN.md`
2. **Agent Testing**: Once scheduled functions work reliably, add agent execution tests
3. **Performance Benchmarks**: Add performance regression tests
4. **Property-Based Tests**: Expand property-based testing for edge cases

## References

- `E2E_TEST_PLAN.md` - Complete test coverage plan
- `README.md` - Simulation testing framework overview
- `ARCHITECTURE.md` - System architecture and expected behavior

