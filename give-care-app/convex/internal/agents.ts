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
import {
  detectCrisis,
  getCrisisResponse,
  extractProfileData,
  detectSelfSacrifice,
  detectReassuranceLoop,
} from "../lib/utils";

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

    // Guardrail detection: self-sacrifice and reassurance loops
    const hasSelfSacrifice = detectSelfSacrifice(body);
    if (hasSelfSacrifice) {
      await ctx.runMutation(internal.internal.learning.logGuardrailEvent, {
        userId,
        type: "self_sacrifice",
        severity: "medium",
        context: { message: body, timestamp: Date.now() },
      });
    }

    // Check for reassurance loop (3+ similar questions in 24h)
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentMessages = await ctx.runQuery(
      internal.internal.users.getRecentInboundReceipt,
      {
        userId,
        since: twentyFourHoursAgo,
      }
    );

    const hasReassurancePattern = detectReassuranceLoop(body);
    if (hasReassurancePattern) {
      // Count similar reassurance patterns in last 24h
      // Simplified: if this is a reassurance pattern, check if user has asked similar questions
      // In production, would check message content similarity
      await ctx.runMutation(internal.internal.learning.logGuardrailEvent, {
        userId,
        type: "reassurance_loop",
        severity: "low",
        context: { message: body, timestamp: Date.now() },
      });

      // Set reassurance loop flag after 3+ instances
      const recentReassuranceEvents = await ctx.runQuery(
        internal.internal.users.getRecentGuardrailEvents,
        {
          userId,
          since: twentyFourHoursAgo,
          type: "reassurance_loop",
        }
      );

      if (recentReassuranceEvents && recentReassuranceEvents.length >= 2) {
        // 3rd instance (this one + 2 previous) - set flag
        const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
        const metadata = user?.metadata || {};
        await ctx.runMutation(internal.internal.users.updateProfile, {
          userId,
          field: "reassuranceLoopFlag",
          value: true,
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
    // Save system message as a user message to maintain conversation history consistency
    const prompt = `User completed assessment. Score: ${score} (${band}). Provide encouraging interpretation and suggest 1-2 matched interventions.`;

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      userId,
      prompt,
    });

    const result = await assessmentAgent.generateText(
      ctx,
      { threadId },
      { promptMessageId: messageId }
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

    // Insert alert first to get alertId for follow-up tracking
    const alertId = await ctx.db.insert("alerts", {
      userId,
      type: "crisis",
      severity: crisisResult.severity ?? "medium",
      context: { detection: crisisResult },
      message: crisisMessage,
      channel: "sms",
      status: "pending",
    });

    // Log guardrail event and agent run (can be parallel)
    await Promise.all([
      ctx.db.insert("guardrail_events", {
        userId,
        type: "crisis",
        severity: crisisResult.severity ?? "medium",
        context: { detection: crisisResult, alertId },
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

    // Schedule crisis follow-up at T+24 hours with alertId for feedback tracking
    await ctx.scheduler.runAfter(
      24 * 60 * 60 * 1000, // 24 hours in milliseconds
      internal.internal.sms.sendCrisisFollowUpMessage,
      { userId, alertId }
    );
  },
});
