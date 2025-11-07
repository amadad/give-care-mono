"use node";

/**
 * Crisis Agent - Convex-native implementation using Agent Component
 *
 * Handles crisis detection and provides immediate support resources.
 *
 * This agent:
 * - Detects crisis situations (active crisis flags in context)
 * - Provides 988 hotline and crisis resources
 * - Uses empathetic, safety-focused tone
 * - Manages persistent threads with automatic message history
 */

import { action } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
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

const crisisAgent = new Agent(components.agent, {
  name: 'Crisis Support',
  // @ts-expect-error - LanguageModelV1/V2 type mismatch between AI SDK versions
  languageModel: openai.chat('gpt-4o-nano', {
    reasoningEffort: 'minimal', // Lower latency for crisis situations
  }),
  instructions: 'You are a compassionate crisis support assistant for caregivers providing immediate support resources.',
  maxSteps: 1, // No tool calls needed for crisis - prioritize speed
});

/**
 * Crisis Agent Action
 *
 * Runs crisis detection and response workflow using Convex Agent Component.
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
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }) => {
    const startTime = Date.now();

    if (!context.crisisFlags?.active) {
      throw new Error('Crisis agent requires active crisis flags');
    }

    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const userName = (profile.firstName as string) ?? 'friend';
    const careRecipient = (profile.careRecipientName as string) ?? 'loved one';

    try {
      const systemPrompt = renderPrompt(CRISIS_PROMPT, { userName, careRecipient });

      let newThreadId: string;
      let thread;

      if (threadId) {
        const threadResult = await crisisAgent.continueThread(ctx, { threadId, userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        const threadResult = await crisisAgent.createThread(ctx, { userId: context.userId });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      const result = await thread.generateText({
        prompt: input.text,
        system: systemPrompt, // Override default instructions
      });

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.functions.logs.logCrisisInteraction, {
        userId: context.userId,
        input: input.text,
        chunks: [responseText],
        timestamp: Date.now(),
      });

      return {
        chunks: [{ type: 'text', content: responseText }],
        latencyMs,
        threadId: newThreadId,
      };
    } catch (error) {
      console.error('Crisis agent error:', error);

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
        chunks: [{ type: 'error', content: fallbackResponse, meta: { error: String(error) } }],
        latencyMs: Date.now() - startTime,
      };
    }
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
