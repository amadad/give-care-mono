"use node";

/**
 * Main Agent - Convex-native implementation using Agent Component
 *
 * Handles general caregiving conversations and support.
 *
 * This agent:
 * - Provides empathetic support for caregivers
 * - Offers practical advice and resources
 * - Helps manage caregiver burnout
 * - Routes to specialized agents when needed
 * - Manages persistent threads with automatic message history
 */

import { action } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';

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

// Define the main agent with Convex Agent Component
const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: openai.chat('gpt-4o-mini'),
  instructions: 'You are a compassionate AI caregiver assistant providing empathetic support and practical advice.',
  // TODO: Add tools (schedule, assess, etc.)
});

/**
 * Main Agent Action
 *
 * Runs general caregiving conversation workflow using Convex Agent Component.
 *
 * @param input - User message and channel
 * @param context - User context including profile
 * @returns Stream of response chunks
 */
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
      // Extract user profile data
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const relationship = (profile.relationship as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';
      const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
      const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);

      // Render dynamic system prompt
      const basePrompt = renderPrompt(MAIN_PROMPT, {
        userName,
        relationship,
        careRecipient,
        journeyPhase,
        totalInteractionCount,
      });

      // Add tone guidance
      const tone = getTone(context);
      const systemPrompt = `${basePrompt}\n\n${tone}`;

      // Get or create thread
      const thread = threadId
        ? await mainAgent.continueThread(ctx, { threadId, userId: context.userId })
        : await mainAgent.createThread(ctx, { userId: context.userId });

      // Generate response with automatic context and history
      const result = await thread.generateText({
        prompt: input.text,
        system: systemPrompt, // Override default instructions
      });

      const responseText = result.text;
      const latencyMs = Date.now() - startTime;

      // Log agent run for analytics
      await ctx.runMutation(internal.functions.logs.logAgentRunInternal, {
        userId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: responseText.length,
          toolCalls: 0,
        },
        latencyMs,
        traceId: `main-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'text', content: responseText }],
        latencyMs,
        threadId: thread.threadId,
      };
    } catch (error) {
      console.error('Main agent error:', error);

      // Extract user profile for fallback
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

      await ctx.runMutation(internal.functions.logs.logAgentRunInternal, {
        userId: context.userId,
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
        chunks: [{ type: 'error', content: fallbackResponse, meta: { error: String(error) } }],
        latencyMs,
      };
    }
  },
});
