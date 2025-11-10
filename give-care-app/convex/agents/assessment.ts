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
import { Agent, saveMessage } from '@convex-dev/agent';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { ASSESSMENT_PROMPT, renderPrompt } from '../lib/prompts';
import { agentContextValidator, channelValidator } from '../lib/validators';
import { getInterventions } from '../tools/getInterventions';

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const assessmentAgent = new Agent(components.agent, {
  name: 'Assessment Specialist',
  languageModel: google('gemini-2.5-flash-lite'), // ✅ Fastest model for speed
  textEmbeddingModel: openai.embedding('text-embedding-3-small'), // Keep OpenAI embeddings
  instructions: ASSESSMENT_PROMPT,
  tools: { getInterventions },
  maxSteps: 2,
});

// ============================================================================
// AGENT ACTION
// ============================================================================

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

      // ✅ Priority 3: Use listThreads() instead of manual threadId storage
      let thread;
      let newThreadId: string;

      if (threadId) {
        // Continue existing thread
        const threadResult = await assessmentAgent.continueThread(ctx, {
          threadId,
          userId: context.userId,
        });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        // Find existing thread or create new one
        const existingThreadsResult = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
          userId: context.userId,
          paginationOpts: { cursor: null, numItems: 1 },
          order: 'desc', // Most recent first
        });

        if (existingThreadsResult && existingThreadsResult.page && existingThreadsResult.page.length > 0) {
          // Use most recent thread
          const threadResult = await assessmentAgent.continueThread(ctx, {
            threadId: existingThreadsResult.page[0]._id,
            userId: context.userId,
          });
          thread = threadResult.thread;
          newThreadId = existingThreadsResult.page[0]._id;
        } else {
          // Create new thread
          const threadResult = await assessmentAgent.createThread(ctx, {
            userId: context.userId,
          });
          thread = threadResult.thread;
          newThreadId = threadResult.threadId;
        }
      }

      const promptText = input.text || 'Please interpret my burnout assessment results and suggest interventions.';

      // ✅ Priority 1: Save user message first (for idempotency)
      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: promptText,
      });

      // ✅ Priority 2: Use contextOptions for built-in RAG
      const result = await thread.generateText({
        promptMessageId: messageId, // ✅ Reference saved message
        system: systemPrompt,
        // @ts-expect-error - contextOptions not in types yet but supported per docs
        contextOptions: {
          // Built-in semantic search for assessment context
          searchOtherThreads: true,
          recentMessages: 10,
          searchOptions: {
            textSearch: true,
            vectorSearch: true, // Uses textEmbeddingModel automatically
            limit: 10,
          },
        },
        providerOptions: {
          google: {
            temperature: 0.5, // Lower for consistent assessment interpretation
            topP: 0.9, // Focused reasoning
            maxOutputTokens: 400, // Assessment results can be longer
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
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

