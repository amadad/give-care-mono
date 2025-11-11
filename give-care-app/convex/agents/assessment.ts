"use node";

/**
 * Assessment Agent - Burnout assessments and interventions
 *
 * Processes assessment answers and provides results with interventions.
 * Uses Agent Component's continueThread pattern.
 */

import { action } from '../_generated/server';
import { internal, components, api } from '../_generated/api';
import { v } from 'convex/values';
import { Agent, saveMessage } from '@convex-dev/agent';
import { LANGUAGE_MODELS, EMBEDDING_MODELS } from '../lib/models';
import { ensureAgentThread } from '../lib/agentHelpers';
import { ASSESSMENT_PROMPT, renderPrompt } from '../lib/prompts';
import { agentContextValidator, channelValidator } from '../lib/validators';
import { getInterventions } from '../tools/getInterventions';

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const assessmentAgent = new Agent(components.agent, {
  name: 'Assessment Specialist',
  languageModel: LANGUAGE_MODELS.assessment,
  textEmbeddingModel: EMBEDDING_MODELS.default,
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
      // Get metadata for profile info (keep profile in metadata for now)
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';

      // Get active assessment session from DB (single source of truth)
      const assessmentDefinition = (metadata.assessmentDefinitionId as string) ?? 'bsfc';
      const session = await ctx.runQuery(api.assessments.getActiveSession, {
        userId: context.userId,
        definition: assessmentDefinition as any,
      });

      // Phase 3.10: Q&A Flow - If active session, guide through questions
      if (session && session.status === 'active') {
        const catalog = await import('../lib/assessmentCatalog').then((m) => m.CATALOG);
        const assessmentCatalog = catalog[session.definitionId as 'ema' | 'bsfc' | 'reach2' | 'sdoh'];
        const currentIndex = session.questionIndex ?? 0;

        // If not finished, ask next question
        if (currentIndex < assessmentCatalog.length) {
          const question = assessmentCatalog.items[currentIndex];
          const total = assessmentCatalog.length;
          const questionText = `(${currentIndex + 1} of ${total}) ${question.text} (Reply "skip" to move on)`;

          return {
            text: questionText,
            latencyMs: Date.now() - startTime,
          };
        }
      }

      // If no active session or session completed, interpret results
      if (!session || session.answers.length === 0) {
        const errorMessage = 'No assessment answers found. Please complete an assessment first.';
        return {
          text: errorMessage,
          latencyMs: Date.now() - startTime,
        };
      }

      const questionNumber = String(session.answers.length);
      const responsesCount = String(session.answers.length);

      const systemPrompt = renderPrompt(ASSESSMENT_PROMPT, {
        userName,
        careRecipient,
        assessmentName: session.definitionId,
        assessmentType: session.definitionId,
        questionNumber,
        responsesCount,
      });

      // Get or create thread using shared helper
      const { thread, threadId: newThreadId } = await ensureAgentThread(
        ctx,
        assessmentAgent,
        context.userId,
        threadId
      );

      const promptText = input.text || 'Please interpret my burnout assessment results and suggest interventions.';

      // Priority 1: Save user message first (for idempotency)
      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: promptText,
      });

      // Priority 2: Use contextOptions for built-in RAG
      const result = await thread.generateText({
        promptMessageId: messageId, // Reference saved message
        system: systemPrompt,
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

      // Agent Component automatically saves message

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
