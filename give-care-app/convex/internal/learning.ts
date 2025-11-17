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

