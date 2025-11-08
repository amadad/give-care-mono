/**
 * Simulation Tests - Entry Point
 *
 * Run with: pnpm vitest tests/simulation/simulation.test.ts
 */

import { describe, it, expect } from 'vitest';
import { SimulationRunner } from './runner';
import { crisisScenarios } from './scenarios/crisis';
import { onboardingScenarios } from './scenarios/onboarding';

describe('Simulation Tests', () => {
  const runner = new SimulationRunner();

  describe('Crisis Scenarios', () => {
    it('should handle immediate crisis response', async () => {
      const result = await runner.runScenario(crisisScenarios[0]);

      expect(result.success).toBe(true);
      expect(result.failures).toHaveLength(0);
      expect(result.metrics.p95).toBeLessThan(3000); // 95th percentile under 3s
    });

    it('should detect crisis escalation', async () => {
      const result = await runner.runScenario(crisisScenarios[1]);

      expect(result.success).toBe(true);
    });

    it('should avoid false positives', async () => {
      const result = await runner.runScenario(crisisScenarios[3]);

      expect(result.success).toBe(true);
    });
  });

  describe('Onboarding Scenarios', () => {
    it('should handle happy path onboarding', async () => {
      const result = await runner.runScenario(onboardingScenarios[0]);

      expect(result.success).toBe(true);
      expect(result.metrics.errorRate).toBe(0);
    });
  });

  describe('Full Suite', () => {
    it('should run all crisis scenarios', async () => {
      const results = await runner.runScenarios(crisisScenarios);

      const passed = results.filter((r) => r.success).length;
      const total = results.length;

      expect(passed).toBe(total); // All scenarios should pass
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet response time SLAs', async () => {
      const results = await runner.runScenarios(crisisScenarios);

      results.forEach((result) => {
        // Crisis responses must be fast
        if (result.scenario.includes('Crisis')) {
          expect(result.metrics.p95).toBeLessThan(3000);
        }

        // All responses should be under 5s
        expect(result.metrics.p99).toBeLessThan(5000);
      });
    });
  });
});
