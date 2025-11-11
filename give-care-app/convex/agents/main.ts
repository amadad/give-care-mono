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
import { WorkflowManager } from '@convex-dev/workflow';
import { LANGUAGE_MODELS, EMBEDDING_MODELS } from '../lib/models';
import { ensureAgentThread } from '../lib/agentHelpers';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';
import { extractProfileVariables, buildWellnessInfo, getNextMissingField } from '../lib/profile';
import type { UserProfile } from '../lib/types';
import { agentContextValidator, channelValidator } from '../lib/validators';
import { searchResources } from '../tools/searchResources';
import { recordMemory } from '../tools/recordMemory';
import { checkWellnessStatus } from '../tools/checkWellnessStatus';
import { findInterventions } from '../tools/findInterventions';
import { updateProfile } from '../tools/updateProfile';
import { startAssessment } from '../tools/startAssessment';
import { trackInterventionPreference } from '../tools/trackInterventionPreference';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: LANGUAGE_MODELS.main,
  textEmbeddingModel: EMBEDDING_MODELS.default,
  instructions: MAIN_PROMPT,
  tools: {
    searchResources,
    recordMemory,
    check_wellness_status: checkWellnessStatus,
    find_interventions: findInterventions,
    update_profile: updateProfile,
    start_assessment: startAssessment,
    track_intervention_preference: trackInterventionPreference,
  },
  maxSteps: 5,
  // No custom contextHandler - use contextOptions in generateText()
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
      const profile = (metadata.profile as UserProfile | undefined);

      const { userName, relationship, careRecipient } = extractProfileVariables(profile);
      const wellnessInfo = buildWellnessInfo(metadata);
      const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
      const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);

      // Progressive onboarding - simple check
      // Detect if user is asking for local resources (contextual zipCode collection)
      const needsLocalResources = input.text.match(/(respite|support group|local resource|near me|in my area|find.*near|help.*near)/i);
      const nextField = getNextMissingField(profile, { needsLocalResources: !!needsLocalResources });

      const missingFieldsSection = nextField
        ? `\n\nPROFILE GUIDANCE:\n${nextField.prompt}\nCheck recent context - if already asked this session, skip.`
        : '';

      const profileComplete = nextField === null ? 'true' : 'false';

      const basePrompt = renderPrompt(MAIN_PROMPT, {
        userName,
        relationship,
        careRecipient,
        journeyPhase,
        totalInteractionCount,
        wellnessInfo,
        profileComplete,
        missingFieldsSection,
      });

      const tone = getTone(context);
      const systemPrompt = `${basePrompt}\n\n${tone}`;

      // OPTIMIZATION: Pass user metadata to enable threadId caching
      // This avoids listThreadsByUserId query on subsequent requests
      const { thread, threadId: newThreadId } = await ensureAgentThread(
        ctx,
        mainAgent,
        context.userId,
        threadId,
        metadata // Pass metadata for threadId caching
      );

      // SPEED: Short input guard - skip heavy tools for throwaway inputs
      // BUT: Allow onboarding even for short inputs if profile is incomplete
      const trimmedInput = input.text.trim();
      const isShortInput = trimmedInput.length < 10; // Increased from 5 to catch "Doing ok" (8 chars)
      const isVeryShortInput = trimmedInput.length < 5;
      const needsOnboarding = nextField !== null;
      
      // Very short inputs (< 5 chars) - ultra-fast path
      if (isVeryShortInput && !needsOnboarding) {
        // Fast path: Return empathetic response + 1 concrete next step
        // No LLM call, no tool calls, no context search
        // Only use fast path if profile is complete (no onboarding needed)
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
        // Properly handle promise to avoid dangling promise warning
        workflow.start(ctx, internal.workflows.memory.enrichMemory, {
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

      // Priority 1: Save user message first (for idempotency and retries)
      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: input.text,
      });

      // SPEED: Reduce contextOptions for short/simple inputs (fewer messages = faster)
      const isFirstTurn = !threadId;
      const isSimpleResponse = isShortInput && !needsOnboarding; // Short inputs don't need full context
      
      // Detect simple acknowledgments (ok, yes, no, thanks, etc.)
      const isAcknowledgment = /^(ok|okay|yes|no|thanks|thank you|sure|yep|nope|alright|alrighty|got it|gotcha|doing ok|doing okay|i'm ok|i'm okay)$/i.test(trimmedInput);
      
      const contextOptions = isFirstTurn || isSimpleResponse || isAcknowledgment
        ? {
            // Minimal context for first turn, simple responses, or acknowledgments - fastest response
            searchOtherThreads: false,
            recentMessages: 1, // Just the last message for acknowledgments
            searchOptions: {
              textSearch: false, // Disable text search for simple responses
              vectorSearch: false,
              limit: 0, // No semantic search needed
            },
          }
        : {
            // Full context for complex queries
            searchOtherThreads: false,
            recentMessages: 5,
            searchOptions: {
              textSearch: true,
              vectorSearch: false,
              limit: 5,
            },
          };

      // SPEED: LLM timeout wrapper (8s SLA) - allows for context retrieval + LLM + tools
      // Increased from 4s to 8s to accommodate context retrieval and tool calls
      const LLM_TIMEOUT_MS = 8000; // 8 second SLA
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('LLM response timeout after 8s'));
        }, LLM_TIMEOUT_MS);
      });

      let result;
      let timedOut = false;

      try {
        // Race LLM call against timeout
        // NOTE: We still need thread object for thread.generateText(), but contextOptions
        // controls how many messages are actually loaded, so the Agent Component optimizes this
        result = await Promise.race([
          thread.generateText({
            promptMessageId: messageId,
            system: systemPrompt,
            contextOptions,
            // Let model decide when to use tools (natural conversation flow)
            // Using Gemini 2.0 Flash to avoid code execution interference
            toolChoice: 'auto',
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
          // Properly handle promise to avoid dangling promise warning
          workflow.start(ctx, internal.workflows.memory.enrichMemory, {
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

      // Agent Component automatically saves message
      // No manual recordOutbound needed!

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      // Log agent run for analytics (async, non-blocking)
      // Don't await - fire and forget to return response faster
      // Properly handle promise to avoid dangling promise warning
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

      // Async memory enrichment (non-blocking)
      // Extracts facts from conversation and saves to memories table
      // Ready for next interaction without slowing down current response
      const recentMessages = [
        { role: 'user', content: input.text },
        { role: 'assistant', content: responseText },
      ];

      // SPEED: Memory enrichment runs async AFTER response (non-blocking)
      // Use workflow.start() for retryable background work
      // Skip for first message to reduce overhead
      if (threadId && !timedOut) {
        // Thread exists - we have conversation history, safe to enrich
        // Properly handle promise to avoid dangling promise warning
        workflow.start(ctx, internal.workflows.memory.enrichMemory, {
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
      const profile = (metadata.profile as UserProfile | undefined);
      const userName = profile?.firstName ?? 'caregiver';
      const careRecipient = profile?.careRecipientName ?? 'your loved one';

      const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

      const latencyMs = Date.now() - startTime;

      // Log error run (non-blocking, fire-and-forget)
      // Properly handle promise to avoid dangling promise warning
      ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: fallbackResponse.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `main-error-${Date.now()}`,
      }).catch((error) => {
        console.error('[main-agent] Error logging failed:', error);
      });

      return {
        text: fallbackResponse,
        latencyMs,
        error: String(error),
      };
    }
  },
});
