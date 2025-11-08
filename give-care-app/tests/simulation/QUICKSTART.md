# Simulation Testing Quickstart

## What You Built

A complete simulation testing framework that can:

1. **Run realistic user journeys** - Complete scenarios like onboarding, crisis detection, assessments
2. **Find edge cases automatically** - Property-based testing generates random inputs
3. **Test resilience** - Chaos testing injects failures to verify error handling
4. **Analyze outputs** - Collects metrics, identifies issues, suggests fixes
5. **Run in sandbox** - Uses isolated test environment with cleanup

## Quick Start (Mock Mode)

Run simulations without hitting real APIs:

```bash
cd give-care-app

# Run all simulation tests
pnpm vitest tests/simulation/simulation.test.ts

# Run specific scenario
pnpm vitest tests/simulation/simulation.test.ts -t "crisis"

# Run property-based tests
pnpm vitest tests/simulation/property-based.test.ts
```

## Example Output

```
▶ Running: Crisis - Immediate Response
  User sends crisis message and receives immediate support
  ✓ Step 1: sendMessage (152ms)
  ✓ Step 2: crisisDetected (8ms)
  ✓ Step 3: agentType (12ms)
  ✓ Step 4: response (45ms)
  ✓ Step 5: response (3ms)
  ✗ Step 6: responseTime (actual: 3.2s > expected: 3s)
  ✓ Step 7: alertCreated (89ms)
  🧹 Cleanup: sim-user-1234567890-1

Performance:
  P50: 89ms
  P95: 152ms
  P99: 152ms
  Error Rate: 14.3%

Recommendations:
  - 1 step(s) exceeded expected time - investigate latency
  - Step 6 failed: Response time 3200ms exceeded 3000ms
```

## Using Output to Fix Issues

### Scenario: Slow Crisis Response

**Test Output:**
```
✗ Step 6: responseTime (actual: 3.2s > expected: 3s)
Recommendation: Step 6 failed - investigate latency
```

**Analysis:**
1. Crisis responses must be < 3s (safety critical)
2. Current P95 is 3.2s
3. Bottleneck likely in agent call

**Fix Options:**

**Option 1: Cache Crisis Responses**
```typescript
// convex/agents/crisis.ts

const CACHED_CRISIS_RESPONSE = `I hear you're going through difficulty.
Please reach out: 988 (Crisis Text Line)`;

export const runCrisisAgent = action({
  handler: async (ctx, { input, context }) => {
    // Skip LLM for immediate response
    if (context.crisisFlags?.active) {
      return {
        chunks: [{ type: 'text', content: CACHED_CRISIS_RESPONSE }],
        latencyMs: 50, // Fast!
        cached: true
      };
    }
    // ... existing logic
  }
});
```

**Option 2: Use Faster Model**
```typescript
// Already using gpt-5-nano, but optimize further:
languageModel: openai.chat('gpt-5-nano', {
  reasoningEffort: 'low',
  max_tokens: 100, // Limit response length
}),
```

**Verify Fix:**
```bash
pnpm vitest tests/simulation/simulation.test.ts -t "crisis"

# Expected output:
# ✓ Step 6: responseTime (actual: 0.8s < expected: 3s)
```

### Scenario: False Crisis Detection

**Test Output:**
```
✗ Step 1: crisisDetected (expected: false, got: true)
Message: "My mom's doctor says she might not make it"
```

**Analysis:**
1. Normal discussion of death/illness flagged as crisis
2. Need more context-aware detection
3. Terms like "not make it" triggering false positives

**Fix:**

```typescript
// convex/lib/crisis.ts

const CRISIS_TERMS = [
  { term: 'suicide', weight: 10 },
  { term: 'kill myself', weight: 10 },
  { term: 'end it all', weight: 8 },
  { term: 'want to die', weight: 8 },
  { term: 'give up', weight: 3 }, // Lower weight - can be metaphorical
];

const EXCLUSION_CONTEXT = [
  'doctor says',
  'prognosis',
  'diagnosis',
  'medical',
];

export function detectCrisis(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Check for medical/clinical context
  if (EXCLUSION_CONTEXT.some(ctx => lowerMessage.includes(ctx))) {
    // Only flag if high-weight terms present
    return CRISIS_TERMS
      .filter(t => t.weight >= 8)
      .some(t => lowerMessage.includes(t.term));
  }

  // Normal crisis detection
  return CRISIS_TERMS.some(t => lowerMessage.includes(t.term));
}
```

**Verify Fix:**
```bash
pnpm vitest tests/simulation/scenarios/crisis.ts -t "false positive"

# Expected:
# ✓ crisisFalsePositive - No crisis detected
```

### Scenario: Rate Limit Failures

**Property-Based Test Output:**
```
Property failed after 23 runs:
  Input: [date1, date2, date3, ..., date15]
  Expected: ≤ 10 requests allowed
  Actual: 12 requests allowed

Bug found in rate limiting logic!
```

**Analysis:**
Rate limiter allowing too many requests in sliding window

**Fix:**

```typescript
// convex/lib/rateLimit.ts

export async function checkRateLimit(
  ctx: QueryCtx,
  userId: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;

  const recentRequests = await ctx.db
    .query('agent_runs')
    .withIndex('by_user', q => q.eq('userId', userId))
    .filter(q => q.gte(q.field('_creationTime'), windowStart))
    .collect();

  // Fixed: Use length, not >=
  return recentRequests.length < limit;
}
```

**Property test confirms fix:**
```
✓ All 100 property tests passed
  Rate limiter correctly enforces limit
```

## Auto-Fixing with Snapshots

Some issues can auto-fix:

### Response Format Changes

```typescript
// tests/simulation/snapshots.test.ts

it('should match expected response format', () => {
  const response = generateCrisisResponse();

  // Will fail first time, then auto-update
  expect(response).toMatchSnapshot();
});
```

**First run:**
```
Snapshot mismatch - run with --updateSnapshot to fix
```

**Auto-fix:**
```bash
pnpm vitest tests/simulation/snapshots.test.ts --updateSnapshot
```

## Integration with Real Backend

See `INTEGRATION.md` for connecting to actual Convex:

```typescript
import { ConvexTestClient } from './convex-helpers';

it('real crisis detection', async () => {
  const client = new ConvexTestClient(process.env.CONVEX_URL!);
  const user = generateCrisisUser();

  await client.createTestUser(user);

  // Send real message
  await client.sendMessage(
    user.externalId,
    "I can't do this anymore",
    'sms'
  );

  // Check real alerts
  const alerts = await client.getCrisisAlerts(user.externalId);
  expect(alerts[0].severity).toBe('critical');

  await client.cleanup(user.externalId);
});
```

## What CAN Be Auto-Fixed

✅ **Snapshot updates** - Response format changes
✅ **Performance baselines** - Adjust thresholds based on actual metrics
✅ **Test data** - Regenerate fixtures
✅ **Schema migrations** - Update test helpers

## What CANNOT Be Auto-Fixed

❌ **Logic bugs** - Crisis detection accuracy
❌ **Security issues** - Authentication bypasses
❌ **Business rules** - Scoring algorithms
❌ **Edge cases** - Timezone handling

These require manual code changes, but simulations **identify** them.

## Running in CI/CD

```yaml
# .github/workflows/simulation.yml
- name: Run simulations
  run: pnpm test:simulate

- name: Check performance
  run: |
    if grep "P95.*[4-9][0-9][0-9][0-9]" simulation-results.json; then
      echo "Performance regression detected!"
      exit 1
    fi
```

## Advanced: Chaos Testing

Test resilience to failures:

```typescript
import { ChaosEngine, chaosScenarios } from './chaos';

const chaos = new ChaosEngine();
chaos.enable(chaosScenarios.apiFailures);

// Your code should handle failures gracefully
await chaos.wrap(
  () => runMainAgent(input, context),
  'agent-call'
);
```

## Next Steps

1. **Add scenarios** - Create more realistic user journeys in `scenarios/`
2. **Connect to Convex** - Use `ConvexTestClient` for real integration tests
3. **Add chaos** - Test failure modes with `ChaosEngine`
4. **Monitor metrics** - Track P95/P99 response times over time
5. **Automate** - Run in GitHub Actions on every PR

## Resources

- `/tests/simulation/README.md` - Framework overview
- `/tests/simulation/INTEGRATION.md` - Convex integration
- `/tests/simulation/scenarios/` - Example scenarios
- `https://docs.convex.dev/production/testing` - Convex testing docs
- `https://fast-check.dev/` - Property-based testing
