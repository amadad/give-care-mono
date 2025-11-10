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
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { WorkflowManager } from '@convex-dev/workflow';
import { CRISIS_PROMPT } from '../lib/prompts';
import { crisisResponse } from '../lib/policy';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const crisisAgent = new Agent(components.agent, {
  name: 'Crisis Support',
  languageModel: openai('gpt-5-nano'),
  textEmbeddingModel: openai.embedding('text-embedding-3-small'),
  instructions: CRISIS_PROMPT,
  maxSteps: 1, // ✅ No tools - prioritize speed
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
      // Get or create thread
      let thread;
      let newThreadId: string;

      if (threadId) {
        // ✅ Continue existing thread
        const threadResult = await crisisAgent.continueThread(ctx, {
          threadId,
          userId: context.userId,
        });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        // ✅ Create new thread
        const threadResult = await crisisAgent.createThread(ctx, {
          userId: context.userId,
        });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      // ✅ Fast response - no context search needed for speed
      const result = await thread.generateText({
        prompt: input.text,
        system: CRISIS_PROMPT,
        providerOptions: {
          openai: {
            reasoningEffort: 'minimal',
            textVerbosity: 'medium',
            serviceTier: 'auto',
          },
        },
      });

      // ✅ Agent Component automatically saves message

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

      // Trigger workflow for follow-up
      await workflow.start(ctx, internal.workflows.crisis.crisisEscalation, {
        userId: userId,
        threadId: newThreadId,
        messageText: input.text,
        crisisTerms: context.crisisFlags?.terms || [],
        severity: 'high', // Can be determined from crisis detection
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

