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
  const skipHint = index === 0 ? " Reply 1-5 or skip." : " Reply 1-5.";
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
    // Prevent multiple active sessions
    const existingSession = await ctx.db
      .query("assessment_sessions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .first();

    if (existingSession) {
      return {
        success: false,
        message: "You already have an assessment in progress. Let's finish that first.",
        nextStep: "Reply 1-5 or skip to continue.",
      };
    }

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

/**
 * Start assessment for agent (returns first question instead of sending SMS)
 */
export const startAssessmentForAgent = internalMutation({
  args: {
    userId: v.id("users"),
    assessmentType: v.union(v.literal("ema"), v.literal("sdoh")),
  },
  handler: async (ctx, { userId, assessmentType }) => {
    // Check for existing active session
    const existingSession = await ctx.db
      .query("assessment_sessions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .first();

    if (existingSession) {
      return {
        success: false,
        message: "You already have an assessment in progress.",
      };
    }

    // Check cooldown periods
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

    // Get first question
    const definition = getAssessmentDefinition(assessmentType);
    const firstQuestion = definition.questions[0];

    return {
      success: true,
      firstQuestion: firstQuestion.text,
      progress: `1 of ${definition.questions.length}`,
      totalQuestions: definition.questions.length,
    };
  },
});

/**
 * Process assessment answer for agent (returns next question or completion)
 */
export const processAssessmentAnswerForAgent = internalMutation({
  args: {
    userId: v.id("users"),
    answer: v.union(v.number(), v.literal("skip")),
  },
  handler: async (ctx, { userId, answer }) => {
    // Get active session
    const session = await ctx.db
      .query("assessment_sessions")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .first();

    if (!session) {
      return {
        success: false,
        message: "No active assessment found.",
      };
    }

    // Get assessment definition
    const definition = getAssessmentDefinition(session.definitionId as "ema" | "sdoh");

    // Record answer (skip responses are not stored)
    const currentQuestion = definition.questions[session.questionIndex];
    const updatedAnswers = [...session.answers];
    if (answer !== "skip") {
      updatedAnswers.push({
        questionId: currentQuestion.id,
        value: answer,
      });
    }

    // Check if this was the last question
    const isLastQuestion = session.questionIndex >= definition.questions.length - 1;

    if (isLastQuestion) {
      // Complete the assessment
      await ctx.db.patch(session._id, {
        answers: updatedAnswers,
        status: "completed",
        questionIndex: session.questionIndex + 1,
      });

      // Process completion (calculate scores, etc.)
      const completion = await ctx.runMutation(internal.assessments.completeAssessment, {
        userId,
        sessionId: session._id,
      });

      if (!completion) {
        return {
          success: false,
          message: "Failed to complete assessment.",
        };
      }

      const { gcBurnout: score, band, zones } = completion;

      // Calculate worst zone from scoring result
      let worstZone: string | null = null;
      let maxScore = -1;
      for (const [zone, zoneScore] of Object.entries(zones || {})) {
        if (typeof zoneScore === "number" && zoneScore > maxScore) {
          maxScore = zoneScore;
          worstZone = zone;
        }
      }

      const zoneNames: Record<string, string> = {
        P1: "Relationship & Social Support",
        P2: "Physical Health",
        P3: "Housing & Environment",
        P4: "Financial Resources",
        P5: "Legal & Navigation",
        P6: "Emotional Wellbeing",
      };

      // Determine score band text
      let bandText = "low stress";
      if (score >= 76) bandText = "crisis level";
      else if (score >= 51) bandText = "high stress";
      else if (score >= 26) bandText = "moderate stress";

      return {
        success: true,
        complete: true,
        score,
        band: bandText,
        worstZone,
        worstZoneName: worstZone ? zoneNames[worstZone] || worstZone : undefined,
      };
    }

    // Move to next question
    const nextIndex = session.questionIndex + 1;
    await ctx.db.patch(session._id, {
      questionIndex: nextIndex,
      answers: updatedAnswers,
    });

    const nextQuestion = definition.questions[nextIndex];

    return {
      success: true,
      complete: false,
      nextQuestion: nextQuestion.text,
      progress: `${nextIndex + 1} of ${definition.questions.length}`,
    };
  },
});
