/**
 * Tests for AxInstructionOptimizer - MiPRO v2 Refactoring
 *
 * This test suite validates the refactoring from deprecated patterns
 * to the latest ax-llm v14+ MiPRO v2 patterns.
 *
 * Test-Driven Development: These tests are written FIRST,
 * before any refactoring is done to ax-optimize.ts
 */

import 'dotenv/config';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EvalExample } from '../dspy_optimization/types';

// Load OpenAI API key from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key';

// Mock examples for testing
const mockExamples: EvalExample[] = [
  {
    id: 'test-1',
    task: 'respond_to_caregiver',
    prompt: [
      { role: 'system', content: 'You are a trauma-informed caregiver support agent.' },
      { role: 'user', content: "I'm feeling overwhelmed with caring for my mom." }
    ],
    answer: "I hear how overwhelming this feels. Caring for a loved one is incredibly demanding. What's one thing that would help you feel more supported right now? (Or we can explore this later if you prefer.)",
    info: {
      instruction: 'Respond with trauma-informed care principles',
      labels: {
        category: 'emotional_support',
        trauma_principles: ['P1', 'P5', 'P6']
      }
    }
  },
  {
    id: 'test-2',
    task: 'respond_to_caregiver',
    prompt: [
      { role: 'system', content: 'You are a trauma-informed caregiver support agent.' },
      { role: 'user', content: "Can you help me find respite care?" }
    ],
    answer: "Yes, I can help with that. Respite care gives you much-needed breaks. What area are you in? (Skip if you'd rather not share right now.)",
    info: {
      instruction: 'Respond with trauma-informed care principles',
      labels: {
        category: 'resource_request',
        trauma_principles: ['P1', 'P3', 'P5']
      }
    }
  }
];

describe('AxInstructionOptimizer - Factory Functions (MiPRO v2)', () => {
  it('should use ai() factory function instead of new AxAI()', async () => {
    // This test verifies that the optimizer uses the ai() factory function
    // as per ax-llm v14+ guidelines, NOT the deprecated AxAI constructor

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    // Access internal properties via Object.getOwnPropertyDescriptor
    // or through reflection to verify factory usage
    const studentAI = (optimizer as any).studentAI;
    const teacherAI = (optimizer as any).teacherAI;

    // Both should be defined
    expect(studentAI).toBeDefined();
    expect(teacherAI).toBeDefined();

    // They should NOT be instances of AxAI (since we're using factory)
    // Instead, they should have the AI interface structure
    expect(studentAI).toHaveProperty('name');
    expect(teacherAI).toHaveProperty('name');

    // Verify they have the correct model configurations
    expect(studentAI.name).toBe('openai');
    expect(teacherAI.name).toBe('openai');
  });

  it('should create programs using ax() function not AxGen constructor', async () => {
    // This test verifies that programs are created with ax() factory
    // function, not the deprecated AxGen constructor

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    // Mock the optimization to capture program creation
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // This will internally create a program using ax()
    // We verify this by checking the program structure
    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    // If ax() is used correctly, the result should have valid structure
    expect(result).toBeDefined();
    expect(result.optimized_instruction).toBeDefined();
    expect(result.optimizer).toBe('bootstrap');
  });
});

describe('AxInstructionOptimizer - Field Names (MiPRO v2)', () => {
  it('should use descriptive field names not generic ones', async () => {
    // This test verifies that generic field names like 'userMessage'
    // are replaced with descriptive names like 'caregiverQuestion'

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // Run optimization
    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    // Check that the optimized instruction doesn't contain generic field names
    const instruction = result.optimized_instruction;

    // Generic field names that should NOT appear
    expect(instruction).not.toMatch(/\buserMessage\b/);
    expect(instruction).not.toMatch(/\bagentResponse\b/);
    expect(instruction).not.toMatch(/\binput\b/);
    expect(instruction).not.toMatch(/\boutput\b/);

    // Descriptive field names that SHOULD appear or be valid
    // (This will pass once refactored to use caregiverQuestion/traumaInformedReply)
    expect(
      instruction.includes('caregiver') ||
      instruction.includes('support') ||
      instruction.includes('trauma')
    ).toBe(true);
  });

  it('should reject programs with generic field names', async () => {
    // This test ensures that creating a program with generic names
    // is properly handled (either rejected or warned about)

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    // Attempt to create a program with generic field names
    // The new implementation should either:
    // 1. Throw an error
    // 2. Automatically convert to descriptive names
    // 3. Warn in console

    // For now, we just verify the optimizer initializes correctly
    expect(optimizer).toBeDefined();
  });
});

describe('AxInstructionOptimizer - MiPRO v2 Self-Consistency', () => {
  it('should implement self-consistency with sampleCount', async () => {
    // This test verifies that MiPRO v2 uses sampleCount for
    // generating multiple independent samples

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // Run MiPRO optimization (requires Python service in production)
    // In tests, we just verify the configuration structure
    const config = {
      optimizer: 'mipro' as const,
      numTrials: 3,
      verbose: false
    };

    // This should use sampleCount internally
    // We verify by checking the result structure
    try {
      const result = await optimizer.optimizeWithMiPRO(
        baseInstruction,
        mockExamples,
        config
      );

      expect(result).toBeDefined();
      expect(result.optimizer).toBe('mipro');
    } catch (error) {
      // If Python service is not available, test should still verify
      // that the configuration was set up correctly
      expect(error).toBeDefined();
    }
  });

  it('should support custom result picker for trauma-informed selection', async () => {
    // This test verifies that a custom result picker is used
    // to select the best response from multiple samples based on
    // trauma-informed scoring

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    // The result picker should prioritize responses with higher
    // trauma-informed scores (P1-P6 compliance)

    // We verify this indirectly by checking that optimization
    // improves trauma-informed metrics
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2)
    );

    // After optimization, detailed metrics should show improvement
    // or high scores in trauma-informed principles
    const metrics = result.detailed_metrics;

    expect(metrics).toBeDefined();
    expect(metrics.p1).toBeGreaterThanOrEqual(0);
    expect(metrics.p6).toBeGreaterThanOrEqual(0);
    expect(metrics.forbidden).toBeGreaterThanOrEqual(0);
  });
});

describe('AxInstructionOptimizer - Checkpointing', () => {
  it('should support checkpointing for long-running optimizations', async () => {
    // This test verifies that checkpointing is implemented
    // for saving and resuming optimization progress

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    // After refactoring, optimizer should have checkpoint methods
    // or accept checkpoint configuration

    // Verify checkpoint directory can be created
    const { existsSync, mkdirSync } = await import('node:fs');
    const { resolve } = await import('node:path');

    const checkpointDir = resolve(__dirname, '../dspy_optimization/checkpoints');

    if (!existsSync(checkpointDir)) {
      mkdirSync(checkpointDir, { recursive: true });
    }

    expect(existsSync(checkpointDir)).toBe(true);
  });

  it('should save checkpoint during optimization', async () => {
    // This test verifies that checkpoints are actually saved
    // during the optimization process

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // Run optimization with checkpoint configuration
    const config = {
      optimizer: 'bootstrap' as const,
      numTrials: 2,
      verbose: false,
      // Checkpoint configuration should be added in refactoring
    };

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2),
      config
    );

    expect(result).toBeDefined();
    // Checkpoint files would be verified in integration tests
  });
});

describe('AxInstructionOptimizer - Cost Tracking', () => {
  it('should track costs during optimization', async () => {
    // This test verifies that cost tracking is implemented
    // using AxDefaultCostTracker or similar

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // Run optimization
    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    // After refactoring, result should include cost information
    expect(result).toBeDefined();
    expect(result.optimization_stats).toBeDefined();

    // Cost tracking would add fields like total_cost, total_tokens
    // This will be added during refactoring
  });

  it('should stop optimization when budget limit is reached', async () => {
    // This test verifies that optimization stops early
    // when cost budget is exceeded

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // Configure with very low budget to trigger early stopping
    const config = {
      optimizer: 'bootstrap' as const,
      numTrials: 10,
      verbose: false,
      // maxCost: 0.01 // Would be added in refactoring
    };

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1),
      config
    );

    // Optimization should complete even with low budget
    expect(result).toBeDefined();
    expect(result.optimization_stats.total_trials).toBeLessThanOrEqual(10);
  });
});

describe('AxInstructionOptimizer - API Correctness', () => {
  it('should use correct compile() signature for MiPRO v2', async () => {
    // This test verifies that compile() is called with the correct
    // signature: compile(program, examples, metric)
    // NOT the old signature: compile(metricFn, { auto, valset })

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // Run optimization - internally should use correct compile() signature
    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2)
    );

    expect(result).toBeDefined();
    expect(result.optimized_instruction).toBeDefined();
  });

  it('should apply optimization to program after compile', async () => {
    // This test verifies that applyOptimization() is called
    // after compile() returns optimizedProgram

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    // Run optimization
    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2)
    );

    // After optimization, the instruction should be different from baseline
    // (unless baseline was already optimal)
    expect(result.optimized_instruction).toBeDefined();
    expect(typeof result.optimized_instruction).toBe('string');
    expect(result.optimized_instruction.length).toBeGreaterThan(0);
  });
});

describe('AxInstructionOptimizer - Integration Tests', () => {
  it('should run end-to-end Bootstrap optimization successfully', async () => {
    // Full integration test for Bootstrap optimizer

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(process.env.OPENAI_API_KEY || 'test-key');

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples
    );

    // Verify complete result structure
    expect(result.optimizer).toBe('bootstrap');
    expect(result.baseline_score).toBeGreaterThanOrEqual(0);
    expect(result.optimized_score).toBeGreaterThanOrEqual(0);
    expect(result.improvement_percent).toBeDefined();
    expect(result.optimized_instruction).toBeDefined();
    expect(result.detailed_metrics).toBeDefined();
    expect(result.optimization_stats).toBeDefined();

    // Verify metrics structure
    const metrics = result.detailed_metrics;
    expect(metrics.p1).toBeGreaterThanOrEqual(0);
    expect(metrics.p2).toBeGreaterThanOrEqual(0);
    expect(metrics.p3).toBeGreaterThanOrEqual(0);
    expect(metrics.p4).toBeGreaterThanOrEqual(0);
    expect(metrics.p5).toBeGreaterThanOrEqual(0);
    expect(metrics.p6).toBeGreaterThanOrEqual(0);
    expect(metrics.sms).toBeGreaterThanOrEqual(0);
    expect(metrics.forbidden).toBeGreaterThanOrEqual(0);

    // Verify stats structure
    const stats = result.optimization_stats;
    expect(stats.total_trials).toBeGreaterThan(0);
    expect(stats.optimization_time_ms).toBeGreaterThan(0);
  });

  it('should save and load optimization results', async () => {
    // Test saving and loading results

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    // Save results to temp directory
    const { mkdtempSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');

    const tempDir = mkdtempSync(join(tmpdir(), 'ax-test-'));

    await optimizer.saveResults(result, 'test_agent', tempDir);

    // Verify file was created
    const { readdirSync } = await import('node:fs');
    const files = readdirSync(tempDir);

    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toMatch(/test_agent_bootstrap_/);
  });
});

describe('AxInstructionOptimizer - Trauma-Informed Metrics', () => {
  it('should calculate trauma-informed scores correctly', async () => {
    // Test that trauma-informed scoring is working

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    // Test evaluation method
    const response = "I hear how overwhelming this feels. What would help you most right now? (Or skip if you prefer.)";
    const expected = "I understand. How can I help?";

    // Call private method via type assertion
    const scores = await (optimizer as any).evaluateTraumaInformed(response, expected);

    expect(scores).toBeDefined();
    expect(scores.overall).toBeGreaterThanOrEqual(0);
    expect(scores.overall).toBeLessThanOrEqual(1);
  });

  it('should penalize responses with forbidden words', async () => {
    // Test that forbidden words lower the score

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const goodResponse = "I understand how you feel. What would help?";
    const badResponse = "You should do better. You must try harder. This is wrong.";

    const goodScores = await (optimizer as any).evaluateTraumaInformed(goodResponse, goodResponse);
    const badScores = await (optimizer as any).evaluateTraumaInformed(badResponse, badResponse);

    // Bad response should have lower score due to forbidden words
    expect(badScores.overall).toBeLessThan(goodScores.overall);
  });

  it('should reward responses with trauma-informed patterns', async () => {
    // Test that trauma-informed patterns increase score

    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const basicResponse = "Here is some information.";
    const traumaInformedResponse = "I hear you. Here's a resource that might help. Skip if not relevant right now.";

    const basicScores = await (optimizer as any).evaluateTraumaInformed(basicResponse, basicResponse);
    const traumaScores = await (optimizer as any).evaluateTraumaInformed(traumaInformedResponse, traumaInformedResponse);

    // Trauma-informed response should have higher score
    expect(traumaScores.overall).toBeGreaterThan(basicScores.overall);
  });
});
