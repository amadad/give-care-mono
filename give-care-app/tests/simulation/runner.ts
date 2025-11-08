/**
 * Simulation Test Runner
 *
 * Executes scenarios and collects performance/behavioral data
 */

import type {
  Scenario,
  SimulationContext,
  SimulationResult,
  StepResult,
} from './types';
import { generateUser } from './fixtures/users';

export class SimulationRunner {
  private results: SimulationResult[] = [];

  /**
   * Run a single scenario
   */
  async runScenario(scenario: Scenario): Promise<SimulationResult> {
    const startTime = Date.now();
    const context = await this.setupContext(scenario);
    const stepResults: StepResult[] = [];
    const failures: string[] = [];

    console.log(`\n▶ Running: ${scenario.name}`);
    console.log(`  ${scenario.description}`);

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      const stepStart = Date.now();

      try {
        const result = await this.executeStep(step, context, i + 1);
        stepResults.push(result);

        if (!result.success) {
          failures.push(`Step ${i + 1}: ${result.error}`);
          console.log(`  ✗ Step ${i + 1}: ${result.error}`);
        } else {
          console.log(`  ✓ Step ${i + 1}: ${result.action} (${result.duration}ms)`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        failures.push(`Step ${i + 1}: ${errorMsg}`);
        stepResults.push({
          step: i + 1,
          action: 'action' in step ? step.action : step.expect,
          success: false,
          duration: Date.now() - stepStart,
          error: errorMsg,
        });
        console.log(`  ✗ Step ${i + 1}: ${errorMsg}`);
      }
    }

    if (scenario.cleanup) {
      await this.cleanup(context);
    }

    const metrics = this.calculateMetrics(stepResults);
    const recommendations = this.generateRecommendations(stepResults, failures);

    const result: SimulationResult = {
      scenario: scenario.name,
      success: failures.length === 0,
      duration: Date.now() - startTime,
      steps: stepResults,
      metrics,
      failures,
      recommendations,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Run multiple scenarios
   */
  async runScenarios(scenarios: Scenario[]): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
    }

    this.printSummary(results);
    return results;
  }

  /**
   * Setup simulation context
   */
  private async setupContext(scenario: Scenario): Promise<SimulationContext> {
    const user = generateUser(scenario.setup?.user);

    // In a real implementation, this would:
    // 1. Create user in test database
    // 2. Setup subscription if specified
    // 3. Initialize any required state

    return {
      userId: user.externalId,
      variables: new Map(),
      trace: {
        messages: [],
        agentCalls: [],
        alerts: [],
      },
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: any,
    context: SimulationContext,
    stepNumber: number
  ): Promise<StepResult> {
    const startTime = Date.now();

    if ('action' in step) {
      return this.executeAction(step, context, stepNumber, startTime);
    } else if ('expect' in step) {
      return this.executeExpectation(step, context, stepNumber, startTime);
    }

    throw new Error('Invalid step type');
  }

  /**
   * Execute an action step
   */
  private async executeAction(
    step: any,
    context: SimulationContext,
    stepNumber: number,
    startTime: number
  ): Promise<StepResult> {
    const { action } = step;

    switch (action) {
      case 'sendMessage': {
        // In real implementation: call Convex action
        // await ctx.runAction(api.twilio.handleInboundSms, { ... })

        context.trace.messages.push({
          role: 'user',
          content: step.text,
          timestamp: Date.now(),
        });

        // Simulate response
        await this.simulateDelay(50, 200);

        return {
          step: stepNumber,
          action,
          success: true,
          duration: Date.now() - startTime,
          metadata: { text: step.text },
        };
      }

      case 'completeAssessment': {
        // Simulate assessment completion
        await this.simulateDelay(100, 500);

        return {
          step: stepNumber,
          action,
          success: true,
          duration: Date.now() - startTime,
          metadata: { answers: step.answers },
        };
      }

      case 'wait': {
        await new Promise((resolve) => setTimeout(resolve, step.durationMs));

        return {
          step: stepNumber,
          action,
          success: true,
          duration: Date.now() - startTime,
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Execute an expectation step
   */
  private async executeExpectation(
    step: any,
    context: SimulationContext,
    stepNumber: number,
    startTime: number
  ): Promise<StepResult> {
    const { expect: expectation } = step;

    switch (expectation) {
      case 'crisisDetected': {
        // In real implementation: check crisis flags in context
        const lastMessage = context.trace.messages[context.trace.messages.length - 1];
        const crisisTerms = ['end it', 'give up', 'hurt myself', 'suicide'];
        const detected = crisisTerms.some((term) =>
          lastMessage?.content.toLowerCase().includes(term)
        );

        const success = detected === step.value;

        return {
          step: stepNumber,
          action: expectation,
          success,
          duration: Date.now() - startTime,
          error: success ? undefined : `Expected crisis=${step.value}, got ${detected}`,
        };
      }

      case 'response': {
        // Simulate checking response
        const mockResponse = this.generateMockResponse(context);
        const success = mockResponse.toLowerCase().includes(step.contains.toLowerCase());

        return {
          step: stepNumber,
          action: expectation,
          success,
          duration: Date.now() - startTime,
          error: success ? undefined : `Response missing expected text: "${step.contains}"`,
        };
      }

      case 'responseTime': {
        const lastStep = context.trace.messages[context.trace.messages.length - 1];
        const responseTime = Date.now() - (lastStep?.timestamp || Date.now());
        const success = responseTime < step.lessThan;

        return {
          step: stepNumber,
          action: expectation,
          success,
          duration: Date.now() - startTime,
          error: success
            ? undefined
            : `Response time ${responseTime}ms exceeded ${step.lessThan}ms`,
          metadata: { responseTime },
        };
      }

      case 'agentType': {
        // Mock agent detection
        const lastMessage = context.trace.messages[context.trace.messages.length - 1];
        const crisisDetected = lastMessage?.content.toLowerCase().includes('end it');
        const agentType = crisisDetected ? 'crisis' : 'main';
        const success = agentType === step.equals;

        return {
          step: stepNumber,
          action: expectation,
          success,
          duration: Date.now() - startTime,
          error: success ? undefined : `Expected agent=${step.equals}, got ${agentType}`,
        };
      }

      case 'alertCreated': {
        // Mock alert creation
        const lastMessage = context.trace.messages[context.trace.messages.length - 1];
        const crisisDetected = lastMessage?.content.toLowerCase().includes('end it');

        if (crisisDetected) {
          context.trace.alerts.push({
            type: 'crisis',
            severity: 'critical',
            timestamp: Date.now(),
          });
        }

        const success = context.trace.alerts.length > 0;

        return {
          step: stepNumber,
          action: expectation,
          success,
          duration: Date.now() - startTime,
          error: success ? undefined : 'No alert created',
        };
      }

      case 'messageCount': {
        const count = context.trace.messages.length;
        const success = count === step.equals;

        return {
          step: stepNumber,
          action: expectation,
          success,
          duration: Date.now() - startTime,
          error: success ? undefined : `Expected ${step.equals} messages, got ${count}`,
        };
      }

      default:
        throw new Error(`Unknown expectation: ${expectation}`);
    }
  }

  /**
   * Generate mock response based on context
   */
  private generateMockResponse(context: SimulationContext): string {
    const lastMessage = context.trace.messages[context.trace.messages.length - 1];

    if (lastMessage?.content.toLowerCase().includes('end it')) {
      return "I hear that you're going through a very difficult time. Please reach out: 988 (Crisis Text Line)";
    }

    return 'I understand caregiving can be challenging. How can I support you today?';
  }

  /**
   * Simulate network/processing delay
   */
  private async simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(steps: StepResult[]) {
    const durations = steps.map((s) => s.duration).sort((a, b) => a - b);

    return {
      p50: durations[Math.floor(durations.length * 0.5)] || 0,
      p95: durations[Math.floor(durations.length * 0.95)] || 0,
      p99: durations[Math.floor(durations.length * 0.99)] || 0,
      errorRate: steps.filter((s) => !s.success).length / steps.length,
      totalTokens: 0, // In real impl: sum from agent traces
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(
    steps: StepResult[],
    _failures: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow responses
    const slowSteps = steps.filter((s) => s.duration > 1000);
    if (slowSteps.length > 0) {
      recommendations.push(
        `${slowSteps.length} step(s) exceeded 1s - consider caching or optimization`
      );
    }

    // Check for high error rate
    const errorRate = steps.filter((s) => !s.success).length / steps.length;
    if (errorRate > 0.1) {
      recommendations.push(`Error rate ${(errorRate * 100).toFixed(1)}% - investigate failures`);
    }

    return recommendations;
  }

  /**
   * Cleanup test data
   */
  private async cleanup(context: SimulationContext): Promise<void> {
    // In real implementation: delete test user, messages, etc.
    console.log(`  🧹 Cleanup: ${context.userId}`);
  }

  /**
   * Print summary of all results
   */
  private printSummary(results: SimulationResult[]): void {
    const passed = results.filter((r) => r.success).length;
    const failed = results.length - passed;

    console.log('\n' + '='.repeat(60));
    console.log('SIMULATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Scenarios: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed Scenarios:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`\n  ✗ ${r.scenario}`);
          r.failures.forEach((f) => console.log(`    - ${f}`));
          if (r.recommendations.length > 0) {
            console.log('    Recommendations:');
            r.recommendations.forEach((rec) => console.log(`      • ${rec}`));
          }
        });
    }

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Get all results
   */
  getResults(): SimulationResult[] {
    return this.results;
  }
}
