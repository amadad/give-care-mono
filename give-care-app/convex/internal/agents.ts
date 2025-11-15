/**
 * Internal Agent Functions
 * Process messages through agents
 */

import { internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { mainAgent, assessmentAgent } from "../agents";
import { components } from "../_generated/api";
import { createThread, saveMessage } from "@convex-dev/agent";
import { internal } from "../_generated/api";
import { getRelevantMemories } from "../lib/services/memoryService";
import { detectCrisis, getCrisisResponse, extractProfileData } from "../lib/utils";

/**
 * Process message through Main Agent
 */
export const processMainAgentMessage = internalAction({
  args: {
    userId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, { userId, body }) => {
    // Check for crisis BEFORE processing (same as inbound.ts)
    const crisisResult = detectCrisis(body);
    if (crisisResult.isCrisis) {
      // Handle crisis immediately - bypass agent processing
      await ctx.runMutation(internal.internal.agents.handleCrisisDetection, {
        userId,
        crisisResult,
      });
      return; // Don't process through agent
    }

    // Extract and auto-save profile data (deterministic preprocessing)
    // This ensures data is captured even if agent doesn't use tools
    const extractedData = extractProfileData(body);
    if (Object.keys(extractedData).length > 0) {
      // Save each extracted field
      for (const [field, value] of Object.entries(extractedData)) {
        await ctx.runMutation(internal.internal.users.updateProfile, {
          userId,
          field,
          value,
        });
      }
    }

    // Get or create thread for user
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId,
        paginationOpts: { cursor: null, numItems: 1 },
      }
    );

    let threadId: string;
    if (threads.page.length > 0) {
      threadId = threads.page[0]._id;
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
    const memories = await ctx.runQuery(internal.internal.memories.getRelevantMemoriesQuery, {
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
    await ctx.scheduler.runAfter(0, internal.internal.twilioMutations.sendAgentResponseAction, {
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
    if (threads.page.length > 0) {
      threadId = threads.page[0]._id;
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
    await ctx.scheduler.runAfter(0, internal.internal.twilioMutations.sendAgentResponseAction, {
      userId,
      text: result.text,
    });
  },
});

/**
 * Handle crisis detection
 * Creates alert and sends crisis response (same logic as inbound.ts)
 */
export const handleCrisisDetection = internalMutation({
  args: {
    userId: v.id("users"),
    crisisResult: v.object({
      isCrisis: v.boolean(),
      severity: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
      isFalsePositive: v.boolean(),
      isDVHint: v.boolean(),
    }),
  },
  handler: async (ctx, { userId, crisisResult }) => {
    // Precompute crisis response
    const crisisMessage = getCrisisResponse(crisisResult.isDVHint);

    // Batch database operations (parallel inserts)
    await Promise.all([
      // Log crisis event
      ctx.db.insert("alerts", {
        userId,
        type: "crisis",
        severity: crisisResult.severity ?? "medium",
        context: { detection: crisisResult },
        message: crisisMessage,
        channel: "sms",
        status: "pending",
      }),
      // Log guardrail event
      ctx.db.insert("guardrail_events", {
        userId,
        type: "crisis",
        severity: crisisResult.severity ?? "medium",
        context: { detection: crisisResult },
        createdAt: Date.now(),
      }),
      // Log agent run for tracking (even though no agent was used)
      // This allows tests and monitoring to track crisis interventions
      ctx.db.insert("agent_runs", {
        userId,
        agentName: "crisis",
        createdAt: Date.now(),
        latencyMs: 0, // Deterministic response, no latency
      }),
    ]);

    // Send crisis response immediately
    await ctx.scheduler.runAfter(0, internal.internal.twilioMutations.sendCrisisResponseAction, {
      userId,
      isDVHint: crisisResult.isDVHint,
    });

    // Schedule follow-up check-in (next day)
    await ctx.scheduler.runAfter(
      86400000, // 24 hours
      internal.internal.workflows.scheduleCrisisFollowUp,
      { userId }
    );
  },
});
