/**
 * Internal Assessment Functions
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Start assessment session
 */
export const startAssessment = internalMutation({
  args: {
    userId: v.id("users"),
    assessmentType: v.union(
      v.literal("ema"),
      v.literal("cwbs"),
      v.literal("reach2"),
      v.literal("sdoh")
    ),
  },
  handler: async (ctx, { userId, assessmentType }) => {
    // Check cooldown periods
    const cooldowns: Record<string, number> = {
      ema: 86400000, // 1 day
      cwbs: 604800000, // 7 days
      reach2: 1814400000, // 21 days
      sdoh: 2592000000, // 30 days
    };

    const lastAssessment = await ctx.db
      .query("assessments")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("definitionId", assessmentType)
      )
      .order("desc")
      .first();

    if (lastAssessment) {
      const timeSince = Date.now() - lastAssessment.completedAt;
      const cooldown = cooldowns[assessmentType];
      if (timeSince < cooldown) {
        const daysRemaining = Math.ceil((cooldown - timeSince) / 86400000);
        return {
          success: false,
          message: `This assessment is on cooldown. You can retake it in ${daysRemaining} day(s).`,
          nextStep: "",
        };
      }
    }

    // Create assessment session
    await ctx.db.insert("assessment_sessions", {
      userId,
      definitionId: assessmentType,
      channel: "sms",
      questionIndex: 0,
      answers: [],
      status: "active",
    });

    return {
      success: true,
      message: `Starting ${assessmentType.toUpperCase()} assessment.`,
      nextStep: "I'll ask one question at a time.",
    };
  },
});

/**
 * Get active assessment session
 */
export const getActiveSession = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("assessment_sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .first();
  },
});

