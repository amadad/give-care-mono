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
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { WorkflowManager } from '@convex-dev/workflow';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';
import { extractProfileVariables, buildWellnessInfo } from '../lib/profile';
import { searchResources } from '../tools/searchResources';
import { recordMemory } from '../tools/recordMemory';
import { checkWellnessStatus } from '../tools/checkWellnessStatus';
import { findInterventions } from '../tools/findInterventions';
import { updateProfile } from '../tools/updateProfile';
import { startAssessment } from '../tools/startAssessment';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// AGENT DEFINITION
// ============================================================================

export const mainAgent = new Agent(components.agent, {
  name: 'Caregiver Support',
  languageModel: openai('gpt-5-mini'), // Cost-optimized reasoning + priority tier support
  textEmbeddingModel: openai.embedding('text-embedding-3-small'),
  instructions: MAIN_PROMPT,
  tools: {
    searchResources,
    recordMemory,
    check_wellness_status: checkWellnessStatus,
    find_interventions: findInterventions,
    update_profile: updateProfile,
    start_assessment: startAssessment,
  },
  maxSteps: 5,
  // ✅ No custom contextHandler - use contextOptions in generateText()
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
      const wellnessInfo = buildWellnessInfo(metadata);
      const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
      const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);

      // ✅ Hook pattern: Use pre-built context from previous enrichment
      const enrichedContext = metadata.enrichedContext as string | undefined;

      const basePrompt = renderPrompt(MAIN_PROMPT, {
        userName,
        relationship,
        careRecipient,
        journeyPhase,
        totalInteractionCount,
        wellnessInfo,
        profileComplete: 'true',
        missingFieldsSection: '',
      });

      const tone = getTone(context);
      const contextSection = enrichedContext
        ? `\n\nContext from previous conversations:\n${enrichedContext}`
        : '';

      const systemPrompt = `${basePrompt}\n\n${tone}${contextSection}`;

      // Get or create thread using Agent Component's continueThread pattern
      // See: https://stack.convex.dev/ai-agents
      let thread;
      let newThreadId: string;

      const threadMetadata = {
        context: {
          sessionId: context.sessionId,
          userId: context.userId,
          metadata,
        },
      };

      if (threadId) {
        // ✅ Continue existing thread - automatically includes message history
        const threadResult = await mainAgent.continueThread(ctx, {
          threadId,
          userId: context.userId,
        });
        thread = threadResult.thread;
        newThreadId = threadId;
      } else {
        // ✅ Create new thread
        const threadResult = await mainAgent.createThread(ctx, {
          userId: context.userId,
        });
        thread = threadResult.thread;
        newThreadId = threadResult.threadId;
      }

      // ✅ Fast mode: No blocking memory retrieval
      // Memory enrichment happens async via recordMemory tool
      const result = await thread.generateText({
        prompt: input.text,
        system: systemPrompt,
        providerOptions: {
          openai: {
            reasoningEffort: 'minimal', // Fastest time-to-first-token
            textVerbosity: 'low', // Concise responses for SMS
            serviceTier: 'priority', // Fastest response times
          },
        },
      });

      // ✅ Agent Component automatically saves message
      // No manual recordOutbound needed!

      const responseText: string = result.text;
      const latencyMs = Date.now() - startTime;

      // Log agent run for analytics
      await ctx.runMutation(internal.internal.logAgentRunInternal, {
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
      });

      // ✅ Async memory enrichment (non-blocking)
      // Extracts facts from conversation and saves to memories table
      // Ready for next interaction without slowing down current response
      const recentMessages = [
        { role: 'user', content: input.text },
        { role: 'assistant', content: responseText },
      ];

      workflow.start(ctx, internal.workflows.memory.enrichMemory, {
        userId: context.userId,
        threadId: newThreadId,
        recentMessages,
      });

      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs,
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

      await ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
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
        text: fallbackResponse,
        latencyMs,
        error: String(error),
      };
    }
  },
});

