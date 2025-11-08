# Simulation Testing Framework

## Overview

Simulation tests run through realistic user journeys, detect failures, and generate reports to guide fixes.

## Architecture

```
tests/simulation/
├── scenarios/          # Journey definitions
│   ├── onboarding.ts
│   ├── crisis.ts
│   ├── assessment.ts
│   └── recurring-user.ts
├── fixtures/           # Test data generators
│   ├── users.ts
│   ├── messages.ts
│   └── triggers.ts
├── runner.ts           # Simulation orchestrator
├── analyzer.ts         # Output analysis & validation
└── reports/            # Test run outputs (gitignored)
```

## Concepts

### 1. Scenario-Based Testing
Define realistic user journeys as sequences of actions:
```typescript
const crisisScenario = {
  name: 'Crisis Detection & Response',
  steps: [
    { action: 'sendMessage', text: 'I want to end it all' },
    { expect: 'crisisDetected', value: true },
    { expect: 'response', contains: '988' },
  ]
}
```

### 2. Property-Based Testing
Generate random inputs to find edge cases:
```typescript
fc.assert(
  fc.property(fc.date(), fc.integer(1, 365), (start, days) => {
    const trigger = createDailyTrigger(start, days);
    return trigger.occurrences.length === days;
  })
)
```

### 3. Chaos Testing
Inject failures to test resilience:
- Network timeouts
- Rate limit hits
- Database unavailable
- OpenAI API errors

### 4. Output Analysis
Tests collect traces and validate:
- Response times (P50, P95, P99)
- Error rates
- Token usage
- Crisis detection accuracy

## Running Simulations

```bash
# Run all scenarios
pnpm test:simulate

# Run specific scenario
pnpm test:simulate --scenario=crisis

# Run with chaos injection
pnpm test:simulate --chaos

# Generate coverage report
pnpm test:simulate --coverage
```

## Auto-Fixing Capabilities

### What Can Auto-Fix:
1. **Snapshot Updates** - Response format changes
2. **Baseline Adjustments** - Performance regression thresholds
3. **Schema Migrations** - Database structure changes

### What Requires Manual Fix:
1. **Logic Bugs** - Wrong crisis detection
2. **Security Issues** - Auth bypasses
3. **Business Logic** - Incorrect scoring

## Example Simulation Output

```
Scenario: Crisis Detection & Response
──────────────────────────────────────
✓ Step 1: Send crisis message (12ms)
✓ Step 2: Crisis detected (true)
✓ Step 3: Response contains 988 hotline
✓ Step 4: Alert created (severity: critical)
✗ Step 5: SMS sent within 5s (actual: 7.2s)

Performance:
  P50: 145ms
  P95: 892ms
  P99: 1.2s

Recommendations:
  - Investigate SMS delay (exceeded 5s SLA)
  - Consider caching crisis responses
```

## Convex Testing Strategy

Convex provides testing utilities:
- `ConvexTestingHelper` - Run mutations/queries in test mode
- Deterministic IDs for reproducible tests
- Isolated test databases

See: https://docs.convex.dev/production/testing
