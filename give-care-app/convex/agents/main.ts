"use node";

/**
 * Main Agent - General caregiving support
 *
 * Handles day-to-day conversations, resource lookup, wellness checks,
 * and profile management.
 * 
 * Uses Agent Component's built-in memory via contextOptions.
 * See: https://stack.convex.dev/ai-agents
 */

import { action } from '../_generated/server';
import { internal, components, api } from '../_generated/api';
import { v } from 'convex/values';
import { Agent, saveMessage } from '@convex-dev/agent';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { WorkflowManager } from '@convex-dev/workflow';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';
import { extractProfileVariables, buildWellnessInfo } from '../lib/profile';
import { agentContextValidator, channelValidator } from '../lib/validators';
import { searchResources } from '../tools/searchResources';
import { recordMemory } from '../tools/recordMemory';
import { checkWellnessStatus } from '../tools/checkWellnessStatus';
import { findInterventions } from '../tools/findInterventions';
import { updateProfile } from '../tools/updateProfile';
import { startAssessment } from '../tools/startAssessment';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: google('gemini-2.5-flash-lite'), // ✅ Fastest model for speed
  textEmbeddingModel: openai.embedding('text-embedding-3-small'), // Keep OpenAI embeddings (proven, separate from language model)
  instructions: MAIN_PROMPT,
  tools: {
    searchResources,
    recordMemory,
    check_wellness_status: checkWellnessStatus,
    find_interventions: findInterventions,
    update_profile: updateProfile,
    start_assessment: startAssessment,
  },
  maxSteps: 5,
  // ✅ No custom contextHandler - use contextOptions in generateText()
});

// ============================================================================
// AGENT ACTION
// ============================================================================

export const runMainAgent = action({
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
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};

      const { userName, relationship, careRecipient } = extractProfileVariables(profile);
      const wellnessInfo = buildWellnessInfo(metadata);
      const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
      const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);

      const basePrompt = renderPrompt(MAIN_PROMPT, {
        userName,
        relationship,
        careRecipient,
        journeyPhase,
        totalInteractionCount,
        wellnessInfo,
        profileComplete: 'true',
        missingFieldsSection: '',
      });

      const tone = getTone(context);
      const systemPrompt = `${basePrompt}\n\n${tone}`;

      // ✅ Priority 3: Use listThreads() instead of manual threadId storage
      let thread;
      let newThreadId: string;

      if (threadId) {
        // Continue existing thread
        const threadResult = await mainAgent.continueThread(ctx, {
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
          const threadResult = await mainAgent.continueThread(ctx, {
            threadId: existingThreadsResult.page[0]._id,
            userId: context.userId,
          });
          thread = threadResult.thread;
          newThreadId = existingThreadsResult.page[0]._id;
        } else {
          // Create new thread
          const threadResult = await mainAgent.createThread(ctx, {
            userId: context.userId,
          });
          thread = threadResult.thread;
          newThreadId = threadResult.threadId;
        }
      }

      // ✅ SPEED: Short input guard - skip heavy tools for throwaway inputs
      const trimmedInput = input.text.trim();
      const isShortInput = trimmedInput.length < 5;
      
      if (isShortInput) {
        // Fast path: Return empathetic response + 1 concrete next step
        // No LLM call, no tool calls, no context search
        const fastResponse = `Hi ${userName}! I'm here to help. 

What's on your mind today? You can ask me about:
- Caregiving tips
- Local resources
- Managing stress
- Or anything else you need support with

What would be most helpful right now?`;
        
        // Save message for thread continuity
        await saveMessage(ctx, components.agent, {
          threadId: newThreadId,
          prompt: input.text,
        });
        
        const latencyMs = Date.now() - startTime;
        
        // Schedule enrichment in background (non-blocking)
        // Use workflow.start() for retryable background work
        void workflow.start(ctx, internal.workflows.memory.enrichMemory, {
          userId: context.userId,
          threadId: newThreadId,
          recentMessages: [
            { role: 'user', content: input.text },
            { role: 'assistant', content: fastResponse },
          ],
        }).catch((error) => {
          console.error('[main-agent] Background enrichment failed:', error);
        });
        
        return {
          text: fastResponse,
          threadId: newThreadId,
          latencyMs,
          fastPath: true,
        };
      }

      // ✅ Priority 1: Save user message first (for idempotency and retries)
      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: input.text,
      });

      // ✅ SPEED: Reduce contextOptions on first turns (fewer messages = faster)
      const isFirstTurn = !threadId;
      const contextOptions = isFirstTurn
        ? {
            // Minimal context for first turn - fastest response
            searchOtherThreads: false,
            recentMessages: 3, // Reduced from 5 for first turn
            searchOptions: {
              textSearch: true,
              vectorSearch: false,
              limit: 3, // Reduced from 5
            },
          }
        : {
            // Full context for subsequent turns
            searchOtherThreads: false,
            recentMessages: 5,
            searchOptions: {
              textSearch: true,
              vectorSearch: false,
              limit: 5,
            },
          };

      // ✅ SPEED: LLM timeout wrapper (4s SLA) - prevents hanging responses
      const LLM_TIMEOUT_MS = 4000; // 4 second SLA
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('LLM response timeout after 4s'));
        }, LLM_TIMEOUT_MS);
      });

      let result;
      let timedOut = false;
      
      try {
        // Race LLM call against timeout
        result = await Promise.race([
          thread.generateText({
            promptMessageId: messageId,
            system: systemPrompt,
            // @ts-expect-error - contextOptions not in types yet but supported per docs
            contextOptions,
            providerOptions: {
              google: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 300, // Keep SMS responses concise
                safetySettings: [
                  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
              },
            },
          }),
          timeoutPromise,
        ]);
      } catch (error) {
        // Timeout or LLM error - return fast fallback
        if (error instanceof Error && error.message.includes('timeout')) {
          timedOut = true;
          // Schedule enrichment in background to improve next response
          void workflow.start(ctx, internal.workflows.memory.enrichMemory, {
            userId: context.userId,
            threadId: newThreadId,
            recentMessages: [
              { role: 'user', content: input.text },
              { role: 'assistant', content: '' }, // Will be enriched later
            ],
          }).catch(() => {
            // Ignore errors - best effort
          });
          
          // Return actionable fallback immediately
          const timeoutResponse = `Hi ${userName}! I'm processing your message but it's taking longer than expected.

Here's what I can help with right now:
- Find local caregiving resources
- Answer caregiving questions
- Help manage stress

What's most urgent for you today?`;
          
          const latencyMs = Date.now() - startTime;
          
          return {
            text: timeoutResponse,
            threadId: newThreadId,
            latencyMs,
            timeout: true,
          };
        }
        throw error; // Re-throw non-timeout errors
      }

      // ✅ Agent Component automatically saves message
      // No manual recordOutbound needed!

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      // ✅ Log agent run for analytics (async, non-blocking)
      // Don't await - fire and forget to return response faster
      ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: result.steps?.length ?? 0,
        },
        latencyMs,
        traceId: `main-${Date.now()}`,
      }).catch((error) => {
        // Log but don't block - analytics is best-effort
        console.error('[main-agent] Analytics logging failed:', error);
      });

      // ✅ Async memory enrichment (non-blocking)
      // Extracts facts from conversation and saves to memories table
      // Ready for next interaction without slowing down current response
      const recentMessages = [
        { role: 'user', content: input.text },
        { role: 'assistant', content: responseText },
      ];

      // ✅ SPEED: Memory enrichment runs async AFTER response (non-blocking)
      // Use workflow.start() for retryable background work (properly voided to avoid dangling promise)
      // Skip for first message to reduce overhead
      if (threadId && !timedOut) {
        // Thread exists - we have conversation history, safe to enrich
        void workflow.start(ctx, internal.workflows.memory.enrichMemory, {
          userId: context.userId,
          threadId: newThreadId,
          recentMessages: recentMessages.slice(-3), // Only analyze last 3 messages
        }).catch((error) => {
          // Log but don't block - memory enrichment is best-effort
          console.error('[main-agent] Memory enrichment failed:', error);
        });
      }

      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs,
      };
    } catch (error) {
      console.error('Main agent error:', error);

      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';

      const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: fallbackResponse.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `main-${Date.now()}`,
      });

      return {
        text: fallbackResponse,
        latencyMs,
        error: String(error),
      };
    }
  },
});

