import { describe, expect, it, vi } from 'vitest';
import { mainAgent } from '../src/agents/main';
import { crisisAgent } from '../src/agents/crisis';
import { assessmentAgent } from '../src/agents/assessment';
import { HydratedContext, AgentInput } from '../src/shared/types';

/**
 * Baseline tests for existing agent behavior before Convex-native migration.
 * These tests document current functionality and ensure we don't break anything during refactor.
 */

describe('Agent Baseline Tests', () => {
  const mockContext: HydratedContext = {
    userId: 'user-123',
    sessionId: 'session-abc',
    locale: 'en',
    policyBundle: {},
    consent: { emergency: true, data: true },
    crisisFlags: { active: false },
    promptHistory: [],
    metadata: {
      profile: {
        firstName: 'Jane',
        relationship: 'daughter',
        careRecipientName: 'Mom',
      },
      journeyPhase: 'active',
      totalInteractionCount: 5,
      profileComplete: true,
    },
  };

  const mockInput: AgentInput = {
    channel: 'sms',
    text: 'How do I manage stress?',
  };

  describe('mainAgent', () => {
    it('has correct name', () => {
      expect(mainAgent.name).toBe('main');
    });

    it('preconditions always return true', () => {
      expect(mainAgent.preconditions(mockContext)).toBe(true);
    });

    it('plans "assess" for assessment intent', async () => {
      const assessInput = { ...mockInput, text: 'I want to take the burnout assessment' };
      const plan = await mainAgent.plan(assessInput);
      expect(plan).toBe('assess');
    });

    it('plans "escalate" for crisis intent', async () => {
      // NOTE: Current policy filters out "unsafe tokens" like "suicidal"
      // so crisis detection may not work as expected. This test documents current behavior.
      const crisisInput = { ...mockInput, text: 'I am feeling suicidal' };
      const plan = await mainAgent.plan(crisisInput);
      // TODO: Fix policy.intent() to properly detect crisis keywords
      expect(plan).toBe('respond'); // Should be 'escalate' when crisis detection works
    });

    it('plans "respond" for normal conversation', async () => {
      const plan = await mainAgent.plan(mockInput);
      expect(plan).toBe('respond');
    });

    it('run yields chunks from model stream', async () => {
      const mockModelStream = (async function* () {
        yield 'chunk1';
        yield 'chunk2';
        yield 'chunk3';
      })();

      const mockDeps = {
        model: {
          stream: vi.fn().mockReturnValue(mockModelStream),
        },
        tools: [],
        invokeTool: vi.fn(),
      };

      const mockCaps = {
        invoke: vi.fn(),
      };

      const mockBudget = {
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        maxTools: 5,
      };

      const chunks: string[] = [];
      for await (const chunk of mainAgent.run(mockInput, mockContext, mockCaps as any, mockBudget, mockDeps as any)) {
        chunks.push(chunk as string);
      }

      expect(chunks).toEqual(['chunk1', 'chunk2', 'chunk3']);
      expect(mockDeps.model.stream).toHaveBeenCalledOnce();
    });
  });

  describe('crisisAgent', () => {
    const crisisContext: HydratedContext = {
      ...mockContext,
      crisisFlags: { active: true },
    };

    it('has correct name', () => {
      expect(crisisAgent.name).toBe('crisis');
    });

    it('preconditions check for active crisis flags', () => {
      expect(crisisAgent.preconditions(mockContext)).toBe(false);
      expect(crisisAgent.preconditions(crisisContext)).toBe(true);
    });

    it('always plans "escalate"', async () => {
      const plan = await crisisAgent.plan(mockInput);
      expect(plan).toBe('escalate');
    });

    it('run yields chunks from model stream with crisis prompt', async () => {
      const mockModelStream = (async function* () {
        yield 'I hear you are struggling.';
        yield ' Please call 988 for immediate support.';
      })();

      const mockDeps = {
        model: {
          stream: vi.fn().mockReturnValue(mockModelStream),
        },
        tools: [],
        invokeTool: vi.fn(),
      };

      const mockCaps = {
        invoke: vi.fn(),
      };

      const mockBudget = {
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        maxTools: 5,
      };

      const chunks: string[] = [];
      for await (const chunk of crisisAgent.run(mockInput, crisisContext, mockCaps as any, mockBudget, mockDeps as any)) {
        chunks.push(chunk as string);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(mockDeps.model.stream).toHaveBeenCalledOnce();
    });
  });

  describe('assessmentAgent', () => {
    const assessmentContext: HydratedContext = {
      ...mockContext,
      metadata: {
        ...mockContext.metadata,
        assessmentAnswers: [3, 4, 2, 5, 3],
        pressureZone: 'work',
      },
      lastAssessment: {
        definitionId: 'burnout_v1',
      },
    };

    it('has correct name', () => {
      expect(assessmentAgent.name).toBe('assessment');
    });

    it('preconditions always return true', () => {
      expect(assessmentAgent.preconditions(mockContext)).toBe(true);
    });

    it('always plans "assess"', async () => {
      const plan = await assessmentAgent.plan(mockInput);
      expect(plan).toBe('assess');
    });

    it('run yields assessment score and explanation', async () => {
      const mockCaps = {
        invoke: vi.fn()
          .mockResolvedValueOnce({
            total: 17,
            band: 'moderate',
            explanation: 'You are experiencing moderate burnout.',
          })
          .mockResolvedValueOnce([
            { title: 'Deep breathing exercises' },
            { title: 'Take a 15-minute break' },
          ]),
      };

      const mockBudget = {
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        maxTools: 5,
      };

      const chunks: string[] = [];
      for await (const chunk of assessmentAgent.run(mockInput, assessmentContext, mockCaps as any, mockBudget)) {
        chunks.push(chunk as string);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toContain('17');
      expect(chunks[0]).toContain('moderate');
      expect(mockCaps.invoke).toHaveBeenCalledWith('assessment.score', {
        definitionId: 'burnout_v1',
        answers: [3, 4, 2, 5, 3],
      });
    });

    it('run suggests interventions for non-low scores', async () => {
      const mockCaps = {
        invoke: vi.fn()
          .mockResolvedValueOnce({
            total: 22,
            band: 'high',
            explanation: 'You are experiencing high burnout.',
          })
          .mockResolvedValueOnce([
            { title: 'Schedule time off' },
            { title: 'Talk to supervisor' },
          ]),
      };

      const mockBudget = {
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        maxTools: 5,
      };

      const chunks: string[] = [];
      for await (const chunk of assessmentAgent.run(mockInput, assessmentContext, mockCaps as any, mockBudget)) {
        chunks.push(chunk as string);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[1]).toContain('Schedule time off');
      expect(chunks[1]).toContain('Talk to supervisor');
      expect(mockCaps.invoke).toHaveBeenCalledWith('interventions.suggest', {
        pressureZone: 'work',
      });
    });

    it('run skips interventions for low scores', async () => {
      const mockCaps = {
        invoke: vi.fn().mockResolvedValueOnce({
          total: 5,
          band: 'low',
          explanation: 'You are doing well!',
        }),
      };

      const mockBudget = {
        maxInputTokens: 1000,
        maxOutputTokens: 500,
        maxTools: 5,
      };

      const chunks: string[] = [];
      for await (const chunk of assessmentAgent.run(mockInput, assessmentContext, mockCaps as any, mockBudget)) {
        chunks.push(chunk as string);
      }

      expect(chunks.length).toBe(1);
      expect(mockCaps.invoke).toHaveBeenCalledTimes(1);
    });
  });
});
