"use node";

/**
 * Assessment Agent - Burnout assessments and interventions
 *
 * Processes assessment answers and provides results with interventions.
 */

import { action } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { ASSESSMENT_PROMPT, renderPrompt } from '../lib/prompts';
import { getInterventions } from '../tools';

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const assessmentAgent: any = new Agent(components.agent, {
  name: 'Assessment Specialist',
  languageModel: openai('gpt-5-mini'),
  instructions:
    'You are a burnout assessment specialist who provides personalized, compassionate interpretations and actionable intervention suggestions. Use the getInterventions tool to recommend evidence-based interventions matching the user\'s pressure zones.',
  tools: { getInterventions },
  maxSteps: 2,
});

// ============================================================================
// AGENT ACTION
// ============================================================================

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

const channelValidator = v.union(
  v.literal('sms'),
  v.literal('email'),
  v.literal('web')
);

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
      const _pressureZone = (metadata.pressureZone as string) ?? 'work';

      let _band: string;
      if (avgScore < 2) {
        _band = 'low';
      } else if (avgScore < 3.5) {
        _band = 'moderate';
      } else {
        _band = 'high';
      }

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
        system: systemPrompt,
        providerOptions: {
          openai: {
            reasoningEffort: 'medium',
            textVerbosity: 'medium',
            serviceTier: 'flex',
          },
        },
      });

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.logAgentRunInternal, {
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

      await ctx.runMutation(internal.logAgentRunInternal, {
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
