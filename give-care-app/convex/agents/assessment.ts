"use node";

/**
 * Assessment Agent - Convex-native implementation
 *
 * Handles burnout assessments and intervention suggestions.
 *
 * This agent:
 * - Scores completed burnout assessments
 * - Provides explanations and band classifications
 * - Suggests interventions based on results
 * - Logs assessment completions
 */

import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import type { AgentContext, AgentInput, StreamChunk } from '../lib/types';

const channelValidator = v.union(
  v.literal('sms'),
  v.literal('email'),
  v.literal('web')
);

const agentContextValidator = v.object({
  userId: v.string(),
  sessionId: v.optional(v.string()),
  locale: v.string(),
  consent: v.object({
    emergency: v.boolean(),
    marketing: v.boolean(),
  }),
  crisisFlags: v.optional(
    v.object({
      active: v.boolean(),
      terms: v.array(v.string()),
    })
  ),
  metadata: v.optional(v.any()),
});

/**
 * Assessment Agent Action
 *
 * Processes assessment answers and provides results with interventions.
 *
 * @param input - User message and channel
 * @param context - User context including assessment answers
 * @returns Stream of response chunks
 */
export const runAssessmentAgent = action({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
  },
  handler: async (ctx, { input, context }) => {
    const chunks: StreamChunk[] = [];
    const startTime = Date.now();

    try {
      // Extract assessment data from context
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const answers = (metadata.assessmentAnswers as number[]) ?? [];
      const definitionId = 'burnout_v1'; // Default to burnout assessment
      const pressureZone = (metadata.pressureZone as string) ?? 'work';

      if (answers.length === 0) {
        chunks.push({
          type: 'error',
          content: 'No assessment answers found. Please complete an assessment first.',
        });
        return { chunks, latencyMs: Date.now() - startTime };
      }

      // TODO: Call actual scoring function from convex/functions/assessments.ts
      // For now, provide mock scoring logic
      const total = answers.reduce((sum, val) => sum + val, 0);
      const avgScore = total / answers.length;

      let band: string;
      let explanation: string;

      if (avgScore < 2) {
        band = 'low';
        explanation = 'You are experiencing low levels of burnout. Keep up your self-care practices!';
      } else if (avgScore < 3.5) {
        band = 'moderate';
        explanation = 'You are experiencing moderate burnout. Consider implementing some stress management strategies.';
      } else {
        band = 'high';
        explanation = 'You are experiencing high levels of burnout. It\'s important to prioritize self-care and seek support.';
      }

      // First chunk: score and explanation
      const scoreMessage = `Your burnout assessment score is ${total.toFixed(1)} out of ${answers.length * 5} (${band} burnout).

${explanation}`;

      chunks.push({
        type: 'text',
        content: scoreMessage,
      });

      // If not low burnout, suggest interventions
      if (band !== 'low') {
        // TODO: Call actual intervention suggestion from convex/functions/assessments.ts
        // For now, provide mock interventions based on pressure zone
        const interventions = [
          { title: 'Take regular breaks throughout the day' },
          { title: 'Practice deep breathing or meditation' },
          { title: 'Connect with other caregivers for support' },
          { title: 'Set boundaries around caregiving time' },
        ];

        const interventionMessage = `\nRecommended next steps for managing ${pressureZone} stress:\n${interventions.map((i, idx) => `${idx + 1}. ${i.title}`).join('\n')}`;

        chunks.push({
          type: 'text',
          content: interventionMessage,
        });
      }
    } catch (error) {
      console.error('Assessment agent error:', error);
      chunks.push({
        type: 'error',
        content: 'I apologize, but I encountered an error processing your assessment.',
        meta: { error: String(error) },
      });
    }

    const latencyMs = Date.now() - startTime;

    // Log agent run
    await ctx.runMutation(internal.functions.logs.logAgentRunInternal, {
      userId: context.userId,
      agent: 'assessment',
      policyBundle: 'assessment_v1',
      budgetResult: {
        usedInputTokens: input.text.length,
        usedOutputTokens: chunks.map((c) => c.content).join('').length,
        toolCalls: 0,
      },
      latencyMs,
      traceId: `assessment-${Date.now()}`,
    });

    return { chunks, latencyMs };
  },
});
