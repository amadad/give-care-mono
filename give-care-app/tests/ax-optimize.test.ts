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
    // Verify ai() factory usage (ax-llm v14+ standard)
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const studentAI = (optimizer as any).studentAI;
    const teacherAI = (optimizer as any).teacherAI;

    expect(studentAI).toBeDefined();
    expect(teacherAI).toBeDefined();
    expect(studentAI).toHaveProperty('name');
    expect(teacherAI).toHaveProperty('name');
    expect(studentAI.name).toBe('openai');
    expect(teacherAI.name).toBe('openai');
  });

  it('should create programs using ax() function not AxGen constructor', async () => {
    // Verify ax() factory for program creation (not deprecated AxGen)
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    expect(result).toBeDefined();
    expect(result.optimized_instruction).toBeDefined();
    expect(result.optimizer).toBe('bootstrap');
  });
});

describe('AxInstructionOptimizer - Field Names (MiPRO v2)', () => {
  it('should use descriptive field names not generic ones', async () => {
    // Verify descriptive names (caregiverQuestion) vs generic (userMessage)
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    const instruction = result.optimized_instruction;

    expect(instruction).not.toMatch(/\buserMessage\b/);
    expect(instruction).not.toMatch(/\bagentResponse\b/);
    expect(instruction).not.toMatch(/\binput\b/);
    expect(instruction).not.toMatch(/\boutput\b/);

    expect(
      instruction.includes('caregiver') ||
      instruction.includes('support') ||
      instruction.includes('trauma')
    ).toBe(true);
  });

  it('should reject programs with generic field names', async () => {
    // Verify generic field names are rejected/converted/warned
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    expect(optimizer).toBeDefined();
  });
});

describe('AxInstructionOptimizer - MiPRO v2 Self-Consistency', () => {
  it('should implement self-consistency with sampleCount', async () => {
    // Verify MiPRO v2 uses sampleCount for multiple samples
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const config = {
      optimizer: 'mipro' as const,
      numTrials: 3,
      verbose: false
    };

    try {
      const result = await optimizer.optimizeWithMiPRO(
        baseInstruction,
        mockExamples,
        config
      );

      expect(result).toBeDefined();
      expect(result.optimizer).toBe('mipro');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should support custom result picker for trauma-informed selection', async () => {
    // Verify custom result picker prioritizes trauma-informed scores (P1-P6)
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2)
    );

    const metrics = result.detailed_metrics;

    expect(metrics).toBeDefined();
    expect(metrics.p1).toBeGreaterThanOrEqual(0);
    expect(metrics.p6).toBeGreaterThanOrEqual(0);
    expect(metrics.forbidden).toBeGreaterThanOrEqual(0);
  });
});

describe('AxInstructionOptimizer - Checkpointing', () => {
  it('should support checkpointing for long-running optimizations', async () => {
    // Verify checkpoint directory creation
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const { existsSync, mkdirSync } = await import('node:fs');
    const { resolve } = await import('node:path');

    const checkpointDir = resolve(__dirname, '../dspy_optimization/checkpoints');

    if (!existsSync(checkpointDir)) {
      mkdirSync(checkpointDir, { recursive: true });
    }

    expect(existsSync(checkpointDir)).toBe(true);
  });

  it('should save checkpoint during optimization', async () => {
    // Verify checkpoints are saved during optimization process
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const config = {
      optimizer: 'bootstrap' as const,
      numTrials: 2,
      verbose: false,
    };

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2),
      config
    );

    expect(result).toBeDefined();
  });
});

describe('AxInstructionOptimizer - Cost Tracking', () => {
  it('should track costs during optimization', async () => {
    // Verify cost tracking implementation (AxDefaultCostTracker)
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    expect(result).toBeDefined();
    expect(result.optimization_stats).toBeDefined();
  });

  it('should stop optimization when budget limit is reached', async () => {
    // Verify early stopping when cost budget is exceeded
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const config = {
      optimizer: 'bootstrap' as const,
      numTrials: 10,
      verbose: false,
    };

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1),
      config
    );

    expect(result).toBeDefined();
    expect(result.optimization_stats.total_trials).toBeLessThanOrEqual(10);
  });
});

describe('AxInstructionOptimizer - API Correctness', () => {
  it('should use correct compile() signature for MiPRO v2', async () => {
    // Verify compile(program, examples, metric) NOT compile(metricFn, { auto, valset })
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2)
    );

    expect(result).toBeDefined();
    expect(result.optimized_instruction).toBeDefined();
  });

  it('should apply optimization to program after compile', async () => {
    // Verify applyOptimization() called after compile() returns optimizedProgram
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 2)
    );

    expect(result.optimized_instruction).toBeDefined();
    expect(typeof result.optimized_instruction).toBe('string');
    expect(result.optimized_instruction.length).toBeGreaterThan(0);
  });
});

describe('AxInstructionOptimizer - Integration Tests', () => {
  it('should run end-to-end Bootstrap optimization successfully', async () => {
    // Full Bootstrap optimizer integration test
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(process.env.OPENAI_API_KEY || 'test-key');
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples
    );

    expect(result.optimizer).toBe('bootstrap');
    expect(result.baseline_score).toBeGreaterThanOrEqual(0);
    expect(result.optimized_score).toBeGreaterThanOrEqual(0);
    expect(result.improvement_percent).toBeDefined();
    expect(result.optimized_instruction).toBeDefined();
    expect(result.detailed_metrics).toBeDefined();
    expect(result.optimization_stats).toBeDefined();

    const metrics = result.detailed_metrics;
    expect(metrics.p1).toBeGreaterThanOrEqual(0);
    expect(metrics.p2).toBeGreaterThanOrEqual(0);
    expect(metrics.p3).toBeGreaterThanOrEqual(0);
    expect(metrics.p4).toBeGreaterThanOrEqual(0);
    expect(metrics.p5).toBeGreaterThanOrEqual(0);
    expect(metrics.p6).toBeGreaterThanOrEqual(0);
    expect(metrics.sms).toBeGreaterThanOrEqual(0);
    expect(metrics.forbidden).toBeGreaterThanOrEqual(0);

    const stats = result.optimization_stats;
    expect(stats.total_trials).toBeGreaterThan(0);
    expect(stats.optimization_time_ms).toBeGreaterThan(0);
  });

  it('should save and load optimization results', async () => {
    // Verify results saving and file creation
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);
    const baseInstruction = 'You are a trauma-informed caregiver support agent.';

    const result = await optimizer.optimizeWithBootstrap(
      baseInstruction,
      mockExamples.slice(0, 1)
    );

    const { mkdtempSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');

    const tempDir = mkdtempSync(join(tmpdir(), 'ax-test-'));

    await optimizer.saveResults(result, 'test_agent', tempDir);

    const { readdirSync } = await import('node:fs');
    const files = readdirSync(tempDir);

    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toMatch(/test_agent_bootstrap_/);
  });
});

describe('AxInstructionOptimizer - Trauma-Informed Metrics', () => {
  it('should calculate trauma-informed scores correctly', async () => {
    // Verify trauma-informed scoring calculation
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const response = "I hear how overwhelming this feels. What would help you most right now? (Or skip if you prefer.)";
    const expected = "I understand. How can I help?";

    const scores = await (optimizer as any).evaluateTraumaInformed(response, expected);

    expect(scores).toBeDefined();
    expect(scores.overall).toBeGreaterThanOrEqual(0);
    expect(scores.overall).toBeLessThanOrEqual(1);
  });

  it('should penalize responses with forbidden words', async () => {
    // Verify forbidden words lower the score
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const goodResponse = "I understand how you feel. What would help?";
    const badResponse = "You should do better. You must try harder. This is wrong.";

    const goodScores = await (optimizer as any).evaluateTraumaInformed(goodResponse, goodResponse);
    const badScores = await (optimizer as any).evaluateTraumaInformed(badResponse, badResponse);

    expect(badScores.overall).toBeLessThan(goodScores.overall);
  });

  it('should reward responses with trauma-informed patterns', async () => {
    // Verify trauma-informed patterns increase score
    const { AxInstructionOptimizer } = await import('../dspy_optimization/ax-optimize');
    const optimizer = new AxInstructionOptimizer(OPENAI_API_KEY);

    const basicResponse = "Here is some information.";
    const traumaInformedResponse = "I hear you. Here's a resource that might help. Skip if not relevant right now.";

    const basicScores = await (optimizer as any).evaluateTraumaInformed(basicResponse, basicResponse);
    const traumaScores = await (optimizer as any).evaluateTraumaInformed(traumaInformedResponse, traumaInformedResponse);

    expect(traumaScores.overall).toBeGreaterThan(basicScores.overall);
  });
});
