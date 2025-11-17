/**
 * Internal Learning Functions
 * Simple intervention tracking
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Track resource helpfulness
 * Simple yes/no feedback stored in events table
 */
export const trackHelpfulnessMutation = internalMutation({
  args: {
    userId: v.id("users"),
    resourceId: v.string(),
    helpful: v.boolean(),
  },
  handler: async (ctx, { userId, resourceId, helpful }) => {
    // Store simple helpfulness feedback in events table
    await ctx.db.insert("events", {
      userId,
      type: helpful ? "intervention.success" : "intervention.skip",
      payload: {
        resourceId,
        helpful,
        timestamp: Date.now(),
      },
    });
  },
});

/**
 * Log guardrail event
 * Tracks safety events (crisis follow-ups, stress spikes, reassurance loops, etc.)
 */
export const logGuardrailEvent = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    type: v.union(
      v.literal("crisis"),
      v.literal("false_positive"),
      v.literal("dv_hint"),
      v.literal("crisis_followup_sent"),
      v.literal("stress_spike_followup_sent"),
      v.literal("reassurance_loop"),
      v.literal("self_sacrifice")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    context: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("guardrail_events", {
      userId: args.userId,
      type: args.type,
      severity: args.severity,
      context: args.context,
      createdAt: Date.now(),
    });
  },
});

/**
 * Record conversation feedback
 * Captures user feedback on AI responses (helpful yes/no)
 */
export const recordConversationFeedback = internalMutation({
  args: {
    userId: v.id("users"),
    agentRunId: v.optional(v.id("agent_runs")),
    alertId: v.optional(v.id("alerts")),
    helpful: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("conversation_feedback", {
      userId: args.userId,
      agentRunId: args.agentRunId,
      alertId: args.alertId,
      helpful: args.helpful,
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

/**
 * Record crisis feedback
 * Captures feedback specific to crisis interventions
 */
export const recordCrisisFeedback = internalMutation({
  args: {
    userId: v.id("users"),
    alertId: v.id("alerts"),
    connectedWith988: v.optional(v.boolean()),
    wasHelpful: v.optional(v.boolean()),
    followUpResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("crisis_feedback", {
      userId: args.userId,
      alertId: args.alertId,
      connectedWith988: args.connectedWith988,
      wasHelpful: args.wasHelpful,
      followUpResponse: args.followUpResponse,
      createdAt: Date.now(),
    });
  },
});

/**
 * Create or update session metrics
 * Tracks aggregate conversation quality metrics
 */
export const upsertSessionMetrics = internalMutation({
  args: {
    userId: v.id("users"),
    threadId: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    messageCount: v.number(),
    assessmentCompleted: v.optional(v.boolean()),
    crisisDetected: v.optional(v.boolean()),
    userReturnedNext24h: v.optional(v.boolean()),
    avgResponseTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if session already exists
    const existing = args.threadId
      ? await ctx.db
          .query("session_metrics")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .first()
      : null;

    if (existing) {
      // Update existing session
      await ctx.db.patch(existing._id, {
        endedAt: args.endedAt ?? existing.endedAt,
        messageCount: args.messageCount,
        assessmentCompleted: args.assessmentCompleted ?? existing.assessmentCompleted,
        crisisDetected: args.crisisDetected ?? existing.crisisDetected,
        userReturnedNext24h: args.userReturnedNext24h ?? existing.userReturnedNext24h,
        avgResponseTimeMs: args.avgResponseTimeMs ?? existing.avgResponseTimeMs,
      });
    } else {
      // Create new session
      await ctx.db.insert("session_metrics", args);
    }
  },
});

