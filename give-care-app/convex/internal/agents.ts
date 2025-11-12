/**
 * Internal Agent Functions
 * Process messages through agents
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { mainAgent, assessmentAgent } from "../agents";
import { components } from "../_generated/api";
import { createThread, saveMessage } from "@convex-dev/agent";
import { internal } from "../_generated/api";
import { getRelevantMemories } from "../lib/services/memoryService";

/**
 * Process message through Main Agent
 */
export const processMainAgentMessage = internalAction({
  args: {
    userId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, { userId, body }) => {
    // Get or create thread for user
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId,
        paginationOpts: { cursor: null, numItems: 1 },
      }
    );

    let threadId: string;
    if (threads.results.length > 0) {
      threadId = threads.results[0]._id;
    } else {
      threadId = await createThread(ctx, components.agent, {
        userId,
        title: "Main Conversation",
      });
    }

    // Save user message
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      userId,
      prompt: body,
    });

    // Get relevant memories (optimized: importance ≥7, limit 5)
    // This is async but non-blocking - agent will use memories via contextOptions
    const memories = await ctx.runQuery(internal.memories.getRelevantMemoriesQuery, {
      userId,
      limit: 5,
    });

    // Generate response with memory context
    // Agent Component handles vector search automatically via contextOptions
    const result = await mainAgent.generateText(
      ctx,
      { threadId },
      {
        promptMessageId: messageId,
        // Note: Agent Component's contextOptions would be configured here
        // For now, memories are retrieved but agent handles semantic search internally
      }
    );

    // Response is automatically saved by Agent Component
    // Send SMS response (async via wrapper mutation to avoid scheduler path bug)
    await ctx.scheduler.runAfter(0, internal.twilioMutations.sendAgentResponseMutation, {
      userId,
      text: result.text,
    });
  },
});

/**
 * Process assessment completion
 */
export const processAssessmentCompletion = internalAction({
  args: {
    userId: v.id("users"),
    assessmentId: v.id("assessments"),
    score: v.number(),
    band: v.string(),
  },
  handler: async (ctx, { userId, assessmentId, score, band }) => {
    // Get or create thread
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId,
        paginationOpts: { cursor: null, numItems: 1 },
      }
    );

    let threadId: string;
    if (threads.results.length > 0) {
      threadId = threads.results[0]._id;
    } else {
      threadId = await createThread(ctx, components.agent, {
        userId,
        title: "Assessment Results",
      });
    }

    // Generate interpretation and intervention suggestions
    const prompt = `User completed assessment. Score: ${score} (${band}). Provide encouraging interpretation and suggest 1-2 matched interventions.`;
    
    const result = await assessmentAgent.generateText(
      ctx,
      { threadId },
      { prompt }
    );

    // Send response (via wrapper mutation to avoid scheduler path bug)
    await ctx.scheduler.runAfter(0, internal.twilioMutations.sendAgentResponseMutation, {
      userId,
      text: result.text,
    });
  },
});
