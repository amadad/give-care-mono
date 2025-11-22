/**
 * Internal Assessment Functions
 */

import { getAssessmentDefinition } from "../lib/assessmentCatalog";
import { internal } from "../_generated/api";
import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Start assessment session
 * Sends the first question immediately via SMS
 */

function formatQuestion(questionText: string, index: number, total: number): string {
  const progress = `(${index + 1} of ${total})`;
  const skipHint = index === 0 ? " Reply 1-5 or skip." : " Reply 1-5 or skip.";
  return `${progress} ${questionText}${skipHint}`;
}

export const startAssessment = internalMutation({
  args: {
    userId: v.id("users"),
    assessmentType: v.union(
      v.literal("ema"),
      v.literal("sdoh")
    ),
  },
  handler: async (ctx, { userId, assessmentType }) => {
    // Check cooldown periods (EMA + SDOH only)
    const cooldowns: Record<string, number> = {
      ema: 86400000, // 1 day
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

    // Send first question immediately
    const definition = getAssessmentDefinition(assessmentType);
    const firstQuestion = definition.questions[0];
    await ctx.scheduler.runAfter(0, internal.internal.sms.sendAssessmentQuestion, {
      userId,
      text: formatQuestion(firstQuestion.text, 0, definition.questions.length),
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

/**
 * Get latest completed assessment for a user
 * Used by workflows to check completion status
 */
export const getLatestCompletedAssessment = internalQuery({
  args: {
    userId: v.id("users"),
    assessmentType: v.union(
      v.literal("ema"),
      v.literal("sdoh")
    ),
  },
  handler: async (ctx, { userId, assessmentType }) => {
    // Get latest assessment
    const assessment = await ctx.db
      .query("assessments")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("definitionId", assessmentType)
      )
      .order("desc")
      .first();

    if (!assessment) {
      return null;
    }

    // Get corresponding score
    const score = await ctx.db
      .query("scores")
      .withIndex("by_user_and_assessment", (q) =>
        q.eq("userId", userId).eq("assessmentId", assessment._id)
      )
      .first();

    if (!score) {
      return null;
    }

    return {
      assessmentId: assessment._id,
      completedAt: assessment.completedAt,
      gcBurnout: score.gcBurnout,
      band: score.band,
      zones: score.zones,
    };
  },
});
