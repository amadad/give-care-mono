"use node";

/**
 * Crisis Agent - Immediate crisis support
 *
 * Provides fast, safe responses for crisis situations.
 * No tools - prioritizes speed.
 * 
 * Uses Agent Component's continueThread pattern.
 * See: https://stack.convex.dev/ai-agents
 */

import { internalAction } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent, saveMessage } from '@convex-dev/agent';
import { WorkflowManager } from '@convex-dev/workflow';
import { LANGUAGE_MODELS, EMBEDDING_MODELS } from '../lib/models';
import { ensureAgentThread } from '../lib/agentHelpers';
import { CRISIS_PROMPT } from '../lib/prompts';
import { crisisResponse } from '../lib/policy';
import { agentContextValidator, channelValidator } from '../lib/validators';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const crisisAgent = new Agent(components.agent, {
  name: 'Crisis Support',
  languageModel: LANGUAGE_MODELS.crisis,
  textEmbeddingModel: EMBEDDING_MODELS.default,
  instructions: CRISIS_PROMPT,
  maxSteps: 1, // No tools - prioritize speed
});

// ============================================================================
// AGENT ACTION
// ============================================================================

export const runCrisisAgent = internalAction({
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

    if (!context.crisisFlags?.active) {
      throw new Error('Crisis agent requires active crisis flags');
    }

    // Extract user ID from context (already fetched in processInbound)
    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const convexMetadata = (metadata.convex as Record<string, unknown> | undefined) ?? {};
    const userId = convexMetadata.userId as string | undefined;
    
    if (!userId) {
      throw new Error(`User ID not found in context: ${context.userId}`);
    }

    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const userName = (profile.firstName as string) ?? 'friend';

    try {
      // Get or create thread using shared helper
      const { thread, threadId: newThreadId } = await ensureAgentThread(
        ctx,
        crisisAgent,
        context.userId,
        threadId
      );

      // Priority 1: Save user message first (for idempotency)
      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId: newThreadId,
        prompt: input.text,
      });

      // Fast response - no context search needed for speed (crisis requires immediate response)
      const result = await thread.generateText({
        promptMessageId: messageId, // Reference saved message
        system: CRISIS_PROMPT,
        providerOptions: {
          google: {
            temperature: 0.3, // Lower for consistent crisis responses
            topP: 0.9, // More focused responses
            maxOutputTokens: 200, // Keep crisis responses concise
            // Safety: Allow more content in crisis situations (user may need help)
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, // Still block dangerous content
            ],
          },
        },
      });

      // Agent Component automatically saves message

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      // Log crisis interaction
      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        externalId: context.userId,
        input: input.text,
        response: responseText,
        timestamp: Date.now(),
        traceId: `crisis-${Date.now()}`,
      });

      // Trigger workflow for follow-up (non-blocking, fire-and-forget)
      // Properly handle promise to avoid dangling promise warning
      workflow.start(ctx, internal.workflows.crisis.crisisEscalation, {
        userId: userId,
        threadId: newThreadId,
        messageText: input.text,
        crisisTerms: context.crisisFlags?.terms || [],
        severity: 'high', // Can be determined from crisis detection
      }).catch((error) => {
        console.error('[crisis-agent] Workflow start failed:', error);
      });

      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs,
      };
    } catch (error) {
      console.error('Crisis agent error:', error);

      const fallbackResponse = crisisResponse(userName);

      await ctx.runMutation(internal.internal.logCrisisInteraction, {
        externalId: context.userId,
        input: input.text,
        response: fallbackResponse,
        timestamp: Date.now(),
        traceId: `crisis-${Date.now()}`,
      });

      return {
        text: fallbackResponse,
        latencyMs: Date.now() - startTime,
        error: String(error),
      };
    }
  },
});

