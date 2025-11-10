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
import { google } from '@ai-sdk/google';
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
  languageModel: google('gemini-2.5-flash-lite'), // Fastest model for crisis response
  textEmbeddingModel: openai.embedding('text-embedding-3-small'), // Keep OpenAI embeddings
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
          google: {
            temperature: 0.3, // Lower for consistent crisis responses
            topP: 0.9, // More focused responses
            maxOutputTokens: 200, // Keep crisis responses concise
            // Safety: Allow more content in crisis situations (user may need help)
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }, // Still block dangerous content
            ],
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

