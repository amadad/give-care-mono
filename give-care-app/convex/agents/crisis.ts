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
import { Agent, run, setOpenAIAPI } from '@openai/agents';
import type { AgentContext, AgentInput, StreamChunk } from '../lib/types';
import { CRISIS_PROMPT, renderPrompt } from '../lib/prompts';

// Configure OpenAI SDK to use responses API
setOpenAIAPI('responses');

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

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in Convex environment');
      const fallbackResponse = `I hear that you're going through a very difficult time.

If you're experiencing a crisis, please reach out for immediate help:
- Call 988 (Suicide & Crisis Lifeline)
- Text HOME to 741741 (Crisis Text Line)
- Call 911 if you are in immediate danger

For ${careRecipient}, resources are available 24/7. You're not alone in this.`;

      await ctx.runMutation(internal.functions.logs.logCrisisInteraction, {
        userId: context.userId,
        input: input.text,
        chunks: [fallbackResponse],
        timestamp: Date.now(),
      });

      return {
        chunks: [{ type: 'text', content: fallbackResponse }],
        latencyMs: 0,
      };
    }

    // Create agent with @openai/agents SDK
    const agent = new Agent({
      name: 'crisis',
      instructions: systemPrompt,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini', // Fast model for crisis response
      tools: [], // No tools needed for crisis response
    });

    // Run agent and collect response
    const chunks: StreamChunk[] = [];
    const startTime = Date.now();

    try {
      // Call OpenAI via @openai/agents SDK
      const result = await run(agent, input.text, {
        context: llmContext,
        conversationId: context.sessionId ?? context.userId,
      });

      // Extract response from result
      let responseText = '';
      if (result && typeof result.finalOutput === 'string') {
        responseText = result.finalOutput;
      } else if (result && result.finalOutput) {
        responseText = JSON.stringify(result.finalOutput);
      } else {
        responseText = 'I hear you. Please reach out to 988 (Suicide & Crisis Lifeline) for immediate support.';
      }

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
