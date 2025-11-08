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
import { api, internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { Agent, createTool } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';
import { z } from 'zod';

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

// Tool: Search for local caregiving resources using Google Maps
const searchResourcesTool = createTool({
  args: z.object({
    query: z.string().describe('Natural language query for caregiving resources (e.g., "respite care near me", "support groups")'),
    category: z.string().optional().describe('Optional category: respite, support, daycare, homecare, medical, community, meals, transport, hospice, memory'),
  }),
  description: 'Search for local caregiving resources using Google Maps. Returns nearby services like respite care, support groups, adult day care, home health agencies, and community resources with addresses, hours, and reviews.',
  handler: async (ctx, args: { query: string; category?: string }) => {
    // Get user metadata to extract location
    // @ts-expect-error - metadata property exists at runtime
    const contextData = ctx.metadata as { context?: { metadata?: Record<string, unknown> } };
    const userMetadata = contextData?.context?.metadata || {};

    const result = await ctx.runAction(api.functions.resources.searchResources, {
      query: args.query,
      metadata: userMetadata,
    });

    if ('error' in result && result.error) {
      return {
        error: result.error,
        suggestion: 'I need your zip code to find nearby resources. What\'s your zip code?',
      };
    }

    return {
      resources: result.text,
      sources: result.sources,
      widgetToken: result.widgetToken,
    };
  },
});

const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  // @ts-expect-error - LanguageModelV1/V2 type mismatch between AI SDK versions
  languageModel: openai.chat('gpt-5-nano', {
    reasoningEffort: 'low', // Lower latency: 100 tokens/sec throughput
  }),
  instructions: 'You are a compassionate AI caregiver assistant providing empathetic support and practical advice.',
  tools: { searchResources: searchResourcesTool },
  maxSteps: 3, // Limit tool call iterations for faster responses
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
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
      const userName = (profile.firstName as string) ?? 'caregiver';
      const relationship = (profile.relationship as string) ?? 'caregiver';
      const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';
      const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
      const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);

      // Fetch conversation summary for context compression
      const conversationSummary = await ctx.runQuery(api.functions.context.getConversationSummary, {
        externalId: input.userId,
        limit: 25,
      });

      const basePrompt = renderPrompt(MAIN_PROMPT, {
        userName,
        relationship,
        careRecipient,
        journeyPhase,
        totalInteractionCount,
      });

      const tone = getTone(context);

      // Inject compressed conversation history if available
      let contextSection = '';
      const formattedContext = (conversationSummary as { formattedContext?: string }).formattedContext;
      if (formattedContext) {
        contextSection = `\n\n## Conversation Context\n${formattedContext}\n\n(Token savings: ${conversationSummary.tokensSaved} tokens, ${conversationSummary.compressionRatio}% compression)`;
      }

      const systemPrompt = `${basePrompt}\n\n${tone}${contextSection}`;

      let newThreadId: string;
      let thread;

      // Prepare metadata for tool access
      const threadMetadata = {
        context: {
          metadata,
        },
      };

      if (threadId) {
        const threadResult = await mainAgent.continueThread(ctx, {
          threadId,
          userId: context.userId,
          metadata: threadMetadata,
        } as any);
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        const threadResult = await mainAgent.createThread(ctx, {
          userId: context.userId,
          metadata: threadMetadata,
        } as any);
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      const result = await thread.generateText({
        prompt: input.text,
        system: systemPrompt, // Override default instructions
      });

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

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
        threadId: newThreadId,
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
