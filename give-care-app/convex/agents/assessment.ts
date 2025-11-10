"use node";

/**
 * Assessment Agent - Burnout assessments and interventions
 *
 * Processes assessment answers and provides results with interventions.
 * Uses Agent Component's continueThread pattern.
 */

import { action } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { ASSESSMENT_PROMPT, renderPrompt } from '../lib/prompts';
import { getInterventions } from '../tools/getInterventions';

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const assessmentAgent = new Agent(components.agent, {
  name: 'Assessment Specialist',
  languageModel: openai('gpt-5-mini'),
  textEmbeddingModel: openai.embedding('text-embedding-3-small'),
  instructions: ASSESSMENT_PROMPT,
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
          text: errorMessage,
          latencyMs: Date.now() - startTime,
        };
      }

      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';
      const assessmentName = (metadata.assessmentDefinitionId as string) ?? 'burnout assessment';
      const questionNumber = String(answers.length);
      const responsesCount = String(answers.length);

      const systemPrompt = renderPrompt(ASSESSMENT_PROMPT, {
        userName,
        careRecipient,
        assessmentName,
        assessmentType: assessmentName,
        questionNumber,
        responsesCount,
      });

      // Get or create thread
      let thread;
      let newThreadId: string;

      if (threadId) {
        // ✅ Continue existing thread
        const threadResult = await assessmentAgent.continueThread(ctx, {
          threadId,
          userId: context.userId,
        });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        // ✅ Create new thread
        const threadResult = await assessmentAgent.createThread(ctx, {
          userId: context.userId,
        });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      // ✅ Use Agent Component's built-in memory
      const result = await thread.generateText({
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

      // ✅ Agent Component automatically saves message

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'assessment',
        policyBundle: 'assessment_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: result.steps?.length ?? 0,
        },
        latencyMs,
        traceId: `assessment-${Date.now()}`,
      });

      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs,
      };
    } catch (error) {
      console.error('Assessment agent error:', error);

      const errorMessage = 'I apologize, but I encountered an error processing your assessment. Please try again.';
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
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
        text: errorMessage,
        latencyMs,
        error: String(error),
      };
    }
  },
});

