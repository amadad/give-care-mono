"use node";

/**
 * Main Agent - General caregiving support
 *
 * Handles day-to-day conversations, resource lookup, wellness checks,
 * and profile management.
 */

import { action, internalAction } from '../_generated/server';
import { internal, components, api } from '../_generated/api';
import { v } from 'convex/values';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';
import { getProfileCompleteness, buildWellnessInfo, extractProfileVariables } from '../lib/profile';
import {
  searchResources,
  recordMemory,
  checkWellnessStatus,
  findInterventions,
  updateProfile,
  startAssessment
} from '../tools';

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: openai('gpt-5-nano'),
  instructions: 'You are a compassionate AI caregiver assistant providing empathetic support and practical advice.',
  tools: {
    searchResources,
    recordMemory,
    check_wellness_status: checkWellnessStatus,
    find_interventions: findInterventions,
    update_profile: updateProfile,
    start_assessment: startAssessment,
  },
  maxSteps: 5,

  // Context handler: Use Agent Component's built-in search (non-blocking)
  contextHandler: async (ctx, args) => {
    // Agent Component provides built-in hybrid vector/text search
    // Return only built-in context for fast responses
    return [
      ...args.search || [],      // Built-in search results
      ...args.recent || [],      // Recent conversation
      ...args.inputMessages,
      ...args.inputPrompt,
      ...args.existingResponses,
    ];
  },
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
      const { profileComplete, missingFieldsSection } = getProfileCompleteness(profile);
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
        profileComplete: String(profileComplete),
        missingFieldsSection,
      });

      const tone = getTone(context);
      const systemPrompt = `${basePrompt}\n\n${tone}`;

      let newThreadId: string;
      let thread;

      const threadMetadata = {
        context: {
          sessionId: context.sessionId,
          userId: context.userId,
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
        system: systemPrompt,
        providerOptions: {
          openai: {
            reasoningEffort: 'low',
            textVerbosity: 'low',
            serviceTier: 'auto',
          },
        },
      });

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      await ctx.runMutation(internal.logAgentRunInternal, {
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

      // Async: Enrich context with memories after response (non-blocking)
      ctx.scheduler.runAfter(0, internal.agents.main.enrichThreadContext, {
        threadId: newThreadId,
        userId: context.userId,
        userQuery: input.text,
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

      await ctx.runMutation(internal.logAgentRunInternal, {
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

// ============================================================================
// ASYNC CONTEXT ENRICHMENT
// ============================================================================

export const enrichThreadContext = internalAction({
  args: {
    threadId: v.string(),
    userId: v.string(),
    userQuery: v.string(),
  },
  handler: async (ctx, { threadId, userId, userQuery }) => {
    try {
      const memories = await ctx.runQuery(internal.public.retrieveMemories, {
        userId,
        query: userQuery,
        limit: 5,
      });

      for (const memory of memories.filter((m: any) => m.importance >= 7)) {
        await ctx.runMutation(internal.appendMessage, {
          userId,
          role: 'system',
          text: `[Memory: ${memory.category}] ${memory.content} (importance: ${memory.importance}/10)`,
          metadata: {
            threadId,
            source: 'memory_enrichment',
            importance: memory.importance,
          },
        });
      }
    } catch (error) {
      console.error('[enrichThreadContext] Error enriching context:', error);
    }
  },
});
