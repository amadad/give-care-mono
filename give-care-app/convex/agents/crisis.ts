"use node";

/**
 * Crisis Agent - Convex-native implementation
 *
 * Handles crisis detection and provides immediate support resources.
 *
 * This agent:
 * - Detects crisis situations (active crisis flags in context)
 * - Provides 988 hotline and crisis resources
 * - Uses empathetic, safety-focused tone
 * - Streams responses using @openai/agents SDK
 */

import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@openai/agents';
import type { AgentContext, AgentInput, StreamChunk } from '../lib/types';
import { CRISIS_PROMPT, renderPrompt } from '../lib/prompts';

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

/**
 * Crisis Agent Action
 *
 * Runs crisis detection and response workflow.
 *
 * @param input - User message and channel
 * @param context - User context including crisis flags
 * @returns Stream of response chunks
 */
export const runCrisisAgent = action({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
  },
  handler: async (ctx, { input, context }) => {
    // Check preconditions: crisis flags must be active
    if (!context.crisisFlags?.active) {
      throw new Error('Crisis agent requires active crisis flags');
    }

    // Extract user profile data
    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const userName = (profile.firstName as string) ?? 'friend';
    const careRecipient = (profile.careRecipientName as string) ?? 'loved one';

    // Render system prompt
    const systemPrompt = renderPrompt(CRISIS_PROMPT, {
      userName,
      careRecipient,
    });

    // Build LLM context
    const llmContext = {
      userId: context.userId,
      sessionId: context.sessionId,
      locale: context.locale,
      crisisFlags: context.crisisFlags,
      channel: input.channel,
      consent: context.consent,
      metadata: context.metadata,
    };

    // Create agent with @openai/agents SDK
    const agent = new Agent({
      name: 'crisis',
      instructions: systemPrompt,
      model: 'gpt-4o-mini', // Fast model for crisis response
      tools: [], // No tools needed for crisis response (just provide resources)
    });

    // Run agent and collect response
    const chunks: StreamChunk[] = [];
    const startTime = Date.now();

    try {
      // @openai/agents Agent has a chat() method for conversations
      // For now, provide a simple crisis response
      // TODO: Integrate proper OpenAI streaming in Phase 3
      const responseText = `I hear that you're going through a very difficult time.

If you're experiencing a crisis, please reach out for immediate help:
- Call 988 (Suicide & Crisis Lifeline)
- Text HOME to 741741 (Crisis Text Line)
- Call 911 if you are in immediate danger

For ${careRecipient}, resources are available 24/7. You're not alone in this.`;

      chunks.push({
        type: 'text',
        content: responseText,
      });
    } catch (error) {
      console.error('Crisis agent error:', error);
      chunks.push({
        type: 'error',
        content: 'I apologize, but I encountered an error. Please call 988 immediately if you are in crisis.',
        meta: { error: String(error) },
      });
    }

    const latencyMs = Date.now() - startTime;

    // Log crisis interaction for safety monitoring
    await ctx.runMutation(internal.functions.logs.logCrisisInteraction, {
      userId: context.userId,
      input: input.text,
      chunks: chunks.map((c) => c.content),
      timestamp: Date.now(),
    });

    return { chunks, latencyMs };
  },
});

/**
 * Check if crisis agent should be invoked
 *
 * This is a helper query that can be called before routing to agents.
 */
export const shouldInvokeCrisisAgent = action({
  args: {
    context: agentContextValidator,
  },
  handler: async (_ctx, { context }) => {
    return Boolean(context.crisisFlags?.active);
  },
});
