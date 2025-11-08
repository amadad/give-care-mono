# Integrating Simulation Tests with Convex

## Overview

This guide shows how to connect the simulation framework to your actual Convex backend for end-to-end testing.

## Setup

### 1. Install Dependencies

```bash
cd give-care-app
pnpm add -D fast-check @faker-js/faker
```

### 2. Configure Test Environment

Create `tests/simulation/.env.test`:

```bash
# Use a separate Convex deployment for testing
CONVEX_DEPLOYMENT=dev:your-test-deployment
CONVEX_URL=https://your-test-deployment.convex.cloud

# Test credentials (use sandbox accounts)
TWILIO_ACCOUNT_SID=test_sid
TWILIO_AUTH_TOKEN=test_token
TWILIO_PHONE_NUMBER=+15555555555

# Use test mode API keys
OPENAI_API_KEY=sk-test-...
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Create Test Helpers

`tests/simulation/convex-helpers.ts`:

```typescript
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

export class ConvexTestClient {
  private client: ConvexHttpClient;

  constructor(url: string) {
    this.client = new ConvexHttpClient(url);
  }

  /**
   * Create test user
   */
  async createTestUser(userData: UserFixture) {
    return await this.client.mutation(api.functions.users.createUser, {
      externalId: userData.externalId,
      phone: userData.phone,
      locale: userData.locale,
      consent: userData.consent,
      metadata: userData.metadata,
    });
  }

  /**
   * Send message as user
   */
  async sendMessage(userId: string, text: string, channel: 'sms' | 'web') {
    return await this.client.action(api.twilio.handleInboundSms, {
      From: userId,
      Body: text,
      // ... other Twilio fields
    });
  }

  /**
   * Get user's latest messages
   */
  async getUserMessages(userId: string) {
    return await this.client.query(api.functions.messages.getByUser, {
      externalId: userId,
      limit: 10,
    });
  }

  /**
   * Check for crisis alerts
   */
  async getCrisisAlerts(userId: string) {
    return await this.client.query(api.functions.alerts.getByUser, {
      externalId: userId,
      type: 'crisis',
    });
  }

  /**
   * Delete test user and all related data
   */
  async cleanup(userId: string) {
    await this.client.mutation(api.functions.users.deleteTestUser, {
      externalId: userId,
    });
  }
}
```

## Real Implementation Examples

### Crisis Detection Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ConvexTestClient } from './convex-helpers';
import { generateCrisisUser } from './fixtures/users';

describe('Crisis Detection - Real Implementation', () => {
  let client: ConvexTestClient;
  let testUser: UserFixture;

  beforeAll(async () => {
    client = new ConvexTestClient(process.env.CONVEX_URL!);
    testUser = generateCrisisUser();
    await client.createTestUser(testUser);
  });

  afterAll(async () => {
    await client.cleanup(testUser.externalId);
  });

  it('should detect crisis and create alert', async () => {
    const startTime = Date.now();

    // Send crisis message
    await client.sendMessage(
      testUser.externalId,
      "I can't take this anymore. I want to end it all.",
      'sms'
    );

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check response
    const messages = await client.getUserMessages(testUser.externalId);
    const response = messages.find((m) => m.direction === 'outbound');

    expect(response).toBeDefined();
    expect(response?.text).toContain('988');

    // Check alert created
    const alerts = await client.getCrisisAlerts(testUser.externalId);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBe('critical');

    // Check response time
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(5000); // Should respond within 5s
  });
});
```

### Assessment Flow Test

```typescript
describe('Assessment Flow - Real Implementation', () => {
  it('should complete assessment and provide interventions', async () => {
    const client = new ConvexTestClient(process.env.CONVEX_URL!);
    const user = generateUser();

    await client.createTestUser(user);

    // Start assessment
    await client.sendMessage(user.externalId, 'I want to take the burnout assessment', 'web');

    // Complete assessment questions
    const answers = [3, 4, 3, 4, 4, 3, 2, 3, 4, 3]; // High burnout

    for (let i = 0; i < answers.length; i++) {
      await client.sendMessage(user.externalId, String(answers[i]), 'web');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Wait for results
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check assessment stored
    const messages = await client.getUserMessages(user.externalId);
    const resultMessage = messages.find(
      (m) => m.direction === 'outbound' && m.text.includes('score')
    );

    expect(resultMessage).toBeDefined();
    expect(resultMessage?.text).toContain('high'); // Should indicate high burnout

    await client.cleanup(user.externalId);
  });
});
```

## Property-Based Testing with Real Backend

```typescript
import fc from 'fast-check';

describe('Property-Based - Real Backend', () => {
  it('should handle random valid message sequences', async () => {
    const client = new ConvexTestClient(process.env.CONVEX_URL!);

    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { maxLength: 5 }),
        async (messages) => {
          const user = generateUser();
          await client.createTestUser(user);

          try {
            // Send all messages
            for (const msg of messages) {
              await client.sendMessage(user.externalId, msg, 'sms');
              await new Promise((resolve) => setTimeout(resolve, 200));
            }

            // Should get responses
            const userMessages = await client.getUserMessages(user.externalId);
            const responses = userMessages.filter((m) => m.direction === 'outbound');

            // Property: Should get at least one response
            return responses.length > 0;
          } finally {
            await client.cleanup(user.externalId);
          }
        }
      ),
      { numRuns: 10 } // Keep low for real API tests
    );
  });
});
```

## Chaos Testing Integration

```typescript
import { ChaosEngine, chaosScenarios } from './chaos';

describe('Chaos Testing - Real Backend', () => {
  it('should handle OpenAI rate limits gracefully', async () => {
    const client = new ConvexTestClient(process.env.CONVEX_URL!);
    const chaos = new ChaosEngine();
    const user = generateUser();

    await client.createTestUser(user);
    chaos.enable(chaosScenarios.rateLimits);

    try {
      // This should trigger fallback behavior
      await chaos.wrap(
        () => client.sendMessage(user.externalId, 'Help me with caregiving', 'sms'),
        'openai-call'
      );

      // Even with chaos, should get some response
      const messages = await client.getUserMessages(user.externalId);
      expect(messages.length).toBeGreaterThan(0);
    } finally {
      chaos.disable();
      await client.cleanup(user.externalId);
    }
  });
});
```

## Performance Testing

```typescript
describe('Performance - Real Backend', () => {
  it('should handle concurrent users', async () => {
    const client = new ConvexTestClient(process.env.CONVEX_URL!);
    const numUsers = 10;
    const users = Array.from({ length: numUsers }, () => generateUser());

    // Create all users
    await Promise.all(users.map((u) => client.createTestUser(u)));

    const startTime = Date.now();

    // Send messages concurrently
    await Promise.all(
      users.map((u) => client.sendMessage(u.externalId, 'Hello', 'sms'))
    );

    const duration = Date.now() - startTime;

    // Should handle concurrent load
    expect(duration).toBeLessThan(10000); // 10s for 10 users

    // Cleanup
    await Promise.all(users.map((u) => client.cleanup(u.externalId)));
  });
});
```

## Continuous Testing

### GitHub Actions

`.github/workflows/simulation-tests.yml`:

```yaml
name: Simulation Tests

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  simulate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install

      - name: Run simulation tests
        env:
          CONVEX_DEPLOYMENT: ${{ secrets.TEST_CONVEX_DEPLOYMENT }}
          CONVEX_URL: ${{ secrets.TEST_CONVEX_URL }}
          OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_KEY }}
        run: |
          cd give-care-app
          pnpm test:simulate

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: simulation-results
          path: give-care-app/tests/simulation/reports/
```

## Best Practices

### 1. Isolation
- Use separate Convex deployment for tests
- Clean up test data after each test
- Use unique IDs (timestamps) for test users

### 2. Timing
- Add delays between actions (simulate real user behavior)
- Use exponential backoff for retries
- Set realistic timeouts

### 3. Assertions
- Check both success and failure paths
- Validate performance metrics (P95, P99)
- Verify data consistency

### 4. Debugging
- Log all API calls
- Save traces for failed tests
- Include context in error messages

### 5. Cost Management
- Limit property-based test runs (numRuns: 10-20)
- Use test API keys with low rate limits
- Monitor test usage in dashboards

## Troubleshooting

### Tests hang indefinitely
- Check Convex deployment is accessible
- Verify API keys are valid
- Add explicit timeouts to all async operations

### Flaky tests
- Add retry logic for network issues
- Increase delays between steps
- Check for race conditions

### High failure rate
- Review Convex function logs
- Check rate limits aren't being hit
- Verify test data cleanup is working

## Next Steps

1. Add more scenario coverage (scheduling, resources, etc.)
2. Implement snapshot testing for UI responses
3. Add visual regression testing for emails
4. Create performance benchmarks dashboard
5. Automate test data generation with faker
