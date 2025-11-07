"use node";

/**
 * Assessment Agent - Convex-native implementation using Agent Component
 *
 * Handles burnout assessments and intervention suggestions.
 *
 * This agent:
 * - Scores completed burnout assessments
 * - Provides explanations and band classifications
 * - Suggests interventions based on results
 * - Logs assessment completions
 * - Uses AI to provide personalized, compassionate interpretations
 */

import { action } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { ASSESSMENT_PROMPT, renderPrompt } from '../lib/prompts';

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

const assessmentAgent = new Agent(components.agent, {
  name: 'Assessment Specialist',
  // @ts-expect-error - LanguageModelV1/V2 type mismatch between AI SDK versions
  languageModel: openai.chat('gpt-4o-mini'),
  instructions:
    'You are a burnout assessment specialist who provides personalized, compassionate interpretations and actionable intervention suggestions.',
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
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }) => {
    const startTime = Date.now();

    try {
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const answers = (metadata.assessmentAnswers as number[]) ?? [];

      if (answers.length === 0) {
        const errorMessage = 'No assessment answers found. Please complete an assessment first.';
        return {
          chunks: [{ type: 'error', content: errorMessage }],
          latencyMs: Date.now() - startTime,
        };
      }

      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';

      const total = answers.reduce((sum, val) => sum + val, 0);
      const avgScore = total / answers.length;
      const pressureZone = (metadata.pressureZone as string) ?? 'work';

      let band: string;
      if (avgScore < 2) {
        band = 'low';
      } else if (avgScore < 3.5) {
        band = 'moderate';
      } else {
        band = 'high';
      }

      const systemPrompt = renderPrompt(ASSESSMENT_PROMPT, {
        userName,
        careRecipient,
        totalScore: total.toFixed(1),
        avgScore: avgScore.toFixed(1),
        band,
        pressureZone,
      });

      let newThreadId: string;
      let thread;

      if (threadId) {
        const threadResult = await assessmentAgent.continueThread(ctx, { threadId, userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        const threadResult = await assessmentAgent.createThread(ctx, { userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      const result = await thread.generateText({
        prompt: input.text || 'Please interpret my burnout assessment results and suggest interventions.',
        system: systemPrompt, // Override default instructions with assessment-specific context
      });

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.functions.logs.logAgentRunInternal, {
        userId: context.userId,
        agent: 'assessment',
        policyBundle: 'assessment_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `assessment-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'text', content: responseText }],
        latencyMs,
        threadId: newThreadId,
      };
    } catch (error) {
      console.error('Assessment agent error:', error);

      const errorMessage = 'I apologize, but I encountered an error processing your assessment. Please try again.';
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.functions.logs.logAgentRunInternal, {
        userId: context.userId,
        agent: 'assessment',
        policyBundle: 'assessment_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: errorMessage.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `assessment-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'error', content: errorMessage, meta: { error: String(error) } }],
        latencyMs,
      };
    }
  },
});
