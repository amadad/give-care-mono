/**
 * Chaos Testing - Fault Injection
 *
 * Simulates failures to test system resilience
 */

export type ChaosScenario =
  | { type: 'networkTimeout'; delayMs: number }
  | { type: 'apiError'; statusCode: number }
  | { type: 'rateLimitHit'; service: 'openai' | 'twilio' | 'stripe' }
  | { type: 'databaseSlow'; delayMs: number }
  | { type: 'partialFailure'; failureRate: number };

export class ChaosEngine {
  private enabled = false;
  private scenarios: ChaosScenario[] = [];

  /**
   * Enable chaos testing
   */
  enable(scenarios: ChaosScenario[]): void {
    this.enabled = true;
    this.scenarios = scenarios;
    console.log('🌪️  Chaos testing enabled');
  }

  /**
   * Disable chaos testing
   */
  disable(): void {
    this.enabled = false;
    this.scenarios = [];
    console.log('✨ Chaos testing disabled');
  }

  /**
   * Inject chaos before API call
   */
  async inject(operation: string): Promise<void> {
    if (!this.enabled) return;

    for (const scenario of this.scenarios) {
      switch (scenario.type) {
        case 'networkTimeout':
          console.log(`⏱️  Injecting ${scenario.delayMs}ms delay for ${operation}`);
          await new Promise((resolve) => setTimeout(resolve, scenario.delayMs));
          break;

        case 'apiError':
          if (Math.random() < 0.3) {
            // 30% chance
            console.log(`❌ Injecting ${scenario.statusCode} error for ${operation}`);
            throw new Error(`Chaos: API returned ${scenario.statusCode}`);
          }
          break;

        case 'rateLimitHit':
          if (operation.includes(scenario.service)) {
            console.log(`🚫 Injecting rate limit for ${scenario.service}`);
            throw new Error(`Chaos: Rate limit exceeded for ${scenario.service}`);
          }
          break;

        case 'databaseSlow':
          if (operation.includes('db')) {
            console.log(`🐌 Injecting database slowdown (${scenario.delayMs}ms)`);
            await new Promise((resolve) => setTimeout(resolve, scenario.delayMs));
          }
          break;

        case 'partialFailure':
          if (Math.random() < scenario.failureRate) {
            console.log(`💥 Injecting partial failure (${scenario.failureRate * 100}%)`);
            throw new Error('Chaos: Random failure');
          }
          break;
      }
    }
  }

  /**
   * Wrap function with chaos injection
   */
  wrap<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    return this.inject(operation).then(() => fn());
  }
}

/**
 * Predefined chaos scenarios
 */
export const chaosScenarios = {
  /**
   * High latency network
   */
  slowNetwork: [
    { type: 'networkTimeout' as const, delayMs: 2000 },
    { type: 'databaseSlow' as const, delayMs: 1000 },
  ],

  /**
   * API failures
   */
  apiFailures: [
    { type: 'apiError' as const, statusCode: 500 },
    { type: 'apiError' as const, statusCode: 503 },
  ],

  /**
   * Rate limit exhaustion
   */
  rateLimits: [
    { type: 'rateLimitHit' as const, service: 'openai' as const },
    { type: 'rateLimitHit' as const, service: 'twilio' as const },
  ],

  /**
   * Intermittent failures
   */
  intermittent: [{ type: 'partialFailure' as const, failureRate: 0.2 }],

  /**
   * Complete chaos - all failure modes
   */
  fullChaos: [
    { type: 'networkTimeout' as const, delayMs: 3000 },
    { type: 'apiError' as const, statusCode: 500 },
    { type: 'rateLimitHit' as const, service: 'openai' as const },
    { type: 'partialFailure' as const, failureRate: 0.1 },
  ],
};

/**
 * Usage example:
 *
 * const chaos = new ChaosEngine();
 * chaos.enable(chaosScenarios.slowNetwork);
 *
 * await chaos.wrap(
 *   () => runMainAgent(input, context),
 *   'agent-call'
 * );
 */
