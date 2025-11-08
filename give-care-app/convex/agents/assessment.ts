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
import { internal, components, api } from '../_generated/api';
import { v } from 'convex/values';
import { Agent, createTool } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { ASSESSMENT_PROMPT, renderPrompt } from '../lib/prompts';
import { z } from 'zod';
import { sharedAgentConfig } from '../lib/usage';

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

// Tool: Get evidence-based interventions by pressure zones
const getInterventionsTool = createTool({
  args: z.object({
    zones: z.array(z.string()).describe('Pressure zones from BSFC assessment'),
    minEvidenceLevel: z.enum(['high', 'moderate', 'low']).optional().describe('Minimum evidence level (default: moderate)'),
    limit: z.number().optional().describe('Max number of interventions (default: 5)'),
  }),
  description: 'Lookup evidence-based caregiver interventions matching pressure zones. Use this to provide specific, research-backed recommendations.',
  handler: async (ctx, args: { zones: string[]; minEvidenceLevel?: 'high' | 'moderate' | 'low'; limit?: number }) => {
    const interventions: Array<{
      title: string;
      category: string;
      targetZones: string[];
      evidenceLevel: string;
      duration: string;
      description: string;
      content: string;
    }> = await ctx.runQuery(api.functions.interventions.getByZones, {
      zones: args.zones,
      minEvidenceLevel: args.minEvidenceLevel || 'moderate',
      limit: args.limit || 5,
    });

    return {
      interventions: interventions.map((i: any) => ({
        title: i.title,
        category: i.category,
        targetZones: i.targetZones,
        evidenceLevel: i.evidenceLevel,
        duration: i.duration,
        description: i.description,
        content: i.content,
      })),
    };
  },
});

const assessmentAgent: any = new Agent(components.agent, {
  name: 'Assessment Specialist',
  // @ts-expect-error - LanguageModelV1/V2 type mismatch between AI SDK versions
  languageModel: openai.chat('gpt-5-mini', {
    reasoningEffort: 'low', // Lower latency configuration
  }),
  instructions:
    'You are a burnout assessment specialist who provides personalized, compassionate interpretations and actionable intervention suggestions. Use the getInterventions tool to recommend evidence-based interventions matching the user\'s pressure zones.',
  tools: { getInterventions: getInterventionsTool },
  maxSteps: 2, // Limit tool calls for faster responses

  // Usage tracking for billing and monitoring
  ...sharedAgentConfig,
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
export const runAssessmentAgent: any = action({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }): Promise<any> => {
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

      // Extract assessment context for the prompt
      // Note: This agent processes completed assessments, not in-progress ones
      // These variables support both use cases
      const assessmentName = (metadata.assessmentDefinitionId as string) ?? 'burnout assessment';
      const assessmentType = assessmentName;
      const questionNumber = String(answers.length);
      const responsesCount = String(answers.length);

      const systemPrompt = renderPrompt(ASSESSMENT_PROMPT, {
        userName,
        careRecipient,
        assessmentName,
        assessmentType,
        questionNumber,
        responsesCount,
      });

      let newThreadId: string;
      let thread: any;

      if (threadId) {
        const threadResult: any = await assessmentAgent.continueThread(ctx, { threadId, userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        const threadResult: any = await assessmentAgent.createThread(ctx, { userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      const result: any = await thread.generateText({
        prompt: input.text || 'Please interpret my burnout assessment results and suggest interventions.',
        system: systemPrompt, // Override default instructions with assessment-specific context
      });

      const responseText: string = result.text;
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
