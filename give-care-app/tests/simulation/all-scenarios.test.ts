/**
 * Comprehensive E2E Test Suite
 * 
 * Runs all simulation scenarios to validate all features and functions.
 * Cloud-ready: handles timeouts, errors, and cleanup automatically.
 * 
 * Run with: npm test -- all-scenarios
 */

import { describe, it, expect } from 'vitest';
import { SimulationRunner } from './runner';
import { crisisScenarios } from './scenarios/crisis';
import { onboardingScenarios } from './scenarios/onboarding';
import { memoryScenarios } from './scenarios/memory';
import { assessmentScenarios } from './scenarios/assessment';
import { progressiveOnboardingScenarios } from './scenarios/progressive-onboarding';

describe('E2E Test Suite - All Scenarios', () => {
  const runner = new SimulationRunner(60000); // 60s timeout for cloud CI

  describe('Crisis Detection & Response', () => {
    crisisScenarios.forEach((scenario, index) => {
      it(`should handle: ${scenario.name}`, async () => {
        const result = await runner.runScenario(scenario);
        
        expect(result.success).toBe(true);
        expect(result.failures).toHaveLength(0);
        
        // Crisis responses must be fast
        if (scenario.tags.includes('critical')) {
          expect(result.metrics.p95).toBeLessThan(3000);
        }
      }, 60000); // 60s timeout per test
    });
  });

  describe('Memory System', () => {
    memoryScenarios.forEach((scenario) => {
      it(`should handle: ${scenario.name}`, async () => {
        const result = await runner.runScenario(scenario);
        
        expect(result.success).toBe(true);
        expect(result.failures).toHaveLength(0);
      }, 30000);
    });
  });

  describe('Assessment System', () => {
    assessmentScenarios.forEach((scenario) => {
      it(`should handle: ${scenario.name}`, async () => {
        const result = await runner.runScenario(scenario);
        
        expect(result.success).toBe(true);
        expect(result.failures).toHaveLength(0);
      }, 60000); // Assessments may take longer
    });
  });

  describe('Progressive Onboarding', () => {
    progressiveOnboardingScenarios.forEach((scenario) => {
      it(`should handle: ${scenario.name}`, async () => {
        const result = await runner.runScenario(scenario);
        
        expect(result.success).toBe(true);
        expect(result.failures).toHaveLength(0);
      }, 60000); // Agent interactions may take time
    });
  });

  describe('Onboarding Flow', () => {
    onboardingScenarios.forEach((scenario) => {
      it(`should handle: ${scenario.name}`, async () => {
        const result = await runner.runScenario(scenario);
        
        expect(result.success).toBe(true);
        expect(result.failures).toHaveLength(0);
      }, 60000);
    });
  });

  describe('Full Suite Summary', () => {
    it('should run all scenarios and generate summary', async () => {
      const allScenarios = [
        ...crisisScenarios,
        ...memoryScenarios,
        ...assessmentScenarios,
        ...progressiveOnboardingScenarios,
        ...onboardingScenarios,
      ];

      const results = await runner.runScenarios(allScenarios);

      const passed = results.filter((r) => r.success).length;
      const total = results.length;
      const passRate = (passed / total) * 100;

      console.log(`\n📊 Test Summary:`);
      console.log(`   Total: ${total}`);
      console.log(`   Passed: ${passed}`);
      console.log(`   Failed: ${total - passed}`);
      console.log(`   Pass Rate: ${passRate.toFixed(1)}%`);

      // At least 80% should pass (allowing for flaky tests in CI)
      expect(passRate).toBeGreaterThanOrEqual(80);

      // All critical scenarios must pass
      const criticalScenarios = results.filter((r) =>
        r.scenario.toLowerCase().includes('crisis') ||
        r.scenario.toLowerCase().includes('critical')
      );
      const criticalPassed = criticalScenarios.filter((r) => r.success).length;
      expect(criticalPassed).toBe(criticalScenarios.length);
    }, 300000); // 5min timeout for full suite
  });
});

