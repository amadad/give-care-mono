"use node";

/**
 * Crisis Agent - Immediate crisis support
 *
 * Provides fast, safe responses for crisis situations.
 * No tools - prioritizes speed.
 */

import { internalAction } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { CRISIS_PROMPT, renderPrompt } from '../lib/prompts';
import { buildWellnessInfo } from '../lib/profile';

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const crisisAgent = new Agent(components.agent, {
  name: 'Crisis Support',
  languageModel: openai('gpt-5-nano'),
  instructions: 'You are a compassionate crisis support assistant for caregivers providing immediate support resources.',
  maxSteps: 1, // No tool calls needed for crisis - prioritize speed
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

    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const userName = (profile.firstName as string) ?? 'friend';
    const careRecipient = (profile.careRecipientName as string) ?? 'loved one';
    const journeyPhase = (metadata.journeyPhase as string) ?? 'crisis';
    const wellnessInfo = buildWellnessInfo(metadata);

    try {
      const systemPrompt = renderPrompt(CRISIS_PROMPT, {
        userName,
        careRecipient,
        journeyPhase,
        wellnessInfo
      });

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
        system: systemPrompt,
        providerOptions: {
          openai: {
            reasoningEffort: 'minimal',
            textVerbosity: 'low',
            serviceTier: 'auto',
          },
        },
      });

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.logCrisisInteraction, {
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

      await ctx.runMutation(internal.logCrisisInteraction, {
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

export const shouldInvokeCrisisAgent = internalAction({
  args: {
    context: agentContextValidator,
  },
  handler: async (_ctx, { context }) => {
    return Boolean(context.crisisFlags?.active);
  },
});
