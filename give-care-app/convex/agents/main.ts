"use node";

/**
 * Main Agent - Convex-native implementation
 *
 * Handles general caregiving conversations and support.
 *
 * This agent:
 * - Provides empathetic support for caregivers
 * - Offers practical advice and resources
 * - Helps manage caregiver burnout
 * - Routes to specialized agents when needed
 */

import { action } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { Agent, run, setOpenAIAPI } from '@openai/agents';
import type { AgentContext, AgentInput, StreamChunk } from '../lib/types';
import { MAIN_PROMPT, renderPrompt } from '../lib/prompts';
import { getTone } from '../lib/policy';

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
 * Main Agent Action
 *
 * Runs general caregiving conversation workflow.
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
  },
  handler: async (ctx, { input, context }) => {
    // Extract user profile data
    const metadata = (context.metadata ?? {}) as Record<string, unknown>;
    const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};
    const userName = (profile.firstName as string) ?? 'caregiver';
    const relationship = (profile.relationship as string) ?? 'caregiver';
    const careRecipient = (profile.careRecipientName as string) ?? 'your loved one';
    const journeyPhase = (metadata.journeyPhase as string) ?? 'active';
    const totalInteractionCount = String((metadata.totalInteractionCount as number) ?? 0);
    const wellnessInfo = metadata.wellnessInfo as string | undefined;
    const profileComplete = String(Boolean(metadata.profileComplete));
    const missingFieldsSection = metadata.missingFieldsSection as string | undefined;

    // Render system prompt with user variables
    const basePrompt = renderPrompt(MAIN_PROMPT, {
      userName,
      relationship,
      careRecipient,
      journeyPhase,
      totalInteractionCount,
      wellnessInfo,
      profileComplete,
      missingFieldsSection,
    });

    // Add tone guidance
    const tone = getTone(context);
    const systemPrompt = `${basePrompt}\n\n${tone}`;

    // Build LLM context
    const llmContext = {
      userId: context.userId,
      sessionId: context.sessionId,
      locale: context.locale,
      consent: context.consent,
      crisisFlags: context.crisisFlags,
      channel: input.channel,
      metadata: context.metadata,
    };

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in Convex environment');
      const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

      await ctx.runMutation(internal.functions.logs.logAgentRunInternal, {
        userId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: fallbackResponse.length,
          toolCalls: 0,
        },
        latencyMs: 0,
        traceId: `main-${Date.now()}`,
      });

      return {
        chunks: [{ type: 'text', content: fallbackResponse }],
        latencyMs: 0,
      };
    }

    // Create agent with @openai/agents SDK
    const agent = new Agent({
      name: 'main',
      instructions: systemPrompt,
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      tools: [], // TODO: Add tools (schedule, assess, etc.)
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
        responseText = `I'm here to support you, ${userName}. How can I help you with caring for ${careRecipient}?`;
      }

      chunks.push({
        type: 'text',
        content: responseText,
      });
    } catch (error) {
      console.error('Main agent error:', error);
      chunks.push({
        type: 'error',
        content: 'I apologize, but I encountered an error. Please try again.',
        meta: { error: String(error) },
      });
    }

    const latencyMs = Date.now() - startTime;

    // Log agent run for analytics
    await ctx.runMutation(internal.functions.logs.logAgentRunInternal, {
      userId: context.userId,
      agent: 'main',
      policyBundle: 'default_v1',
      budgetResult: {
        usedInputTokens: input.text.length,
        usedOutputTokens: chunks.map((c) => c.content).join('').length,
        toolCalls: 0,
      },
      latencyMs,
      traceId: `main-${Date.now()}`,
    });

    return { chunks, latencyMs };
  },
});
