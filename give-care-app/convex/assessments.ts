/**
 * Assessment Flow and Scoring
 * Handles question-by-question delivery and scoring
 */

import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAssessmentDefinition } from "./lib/assessmentCatalog";
import { internal } from "./_generated/api";
import { calculateAssessmentScores } from "./lib/assessmentScoring";
import { ADMIN_EMAILS } from "./lib/adminConfig";

/**
 * Check if current user is admin
 */
async function checkAdminAccess(ctx: any): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Authentication required");
  }

  const email = identity.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("Unauthorized: Admin access only. Contact administrator to request access.");
  }
}

/**
 * List all assessments (admin query)
 * Requires authentication - admin only
 */
export const listAssessments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    await checkAdminAccess(ctx);

    // Limit results to prevent unbounded queries
    // Note: Cannot use .order() without an index - using .take() only
    return await ctx.db
      .query("assessments")
      .take(limit);
  },
});

/**
 * Process assessment answer
 * Accepts number or "skip" - skipped questions are not included in score calculation
 */
export const processAssessmentAnswer = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("assessment_sessions"),
    answer: v.union(v.number(), v.literal("skip")),
  },
  handler: async (ctx, { userId, sessionId, answer }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== "active") {
      return { error: "No active session" };
    }

    const definition = getAssessmentDefinition(
      session.definitionId as any
    );
    const currentQuestion = definition.questions[session.questionIndex];

    // Save answer (only if not skipped)
    const answers = [...session.answers];
    if (answer !== "skip") {
      answers.push({
        questionId: currentQuestion.id,
        value: answer,
      });
    }

    const nextIndex = session.questionIndex + 1;

    // Check if complete
    if (nextIndex >= definition.questions.length) {
      // Complete assessment
      await ctx.db.patch(sessionId, {
        status: "completed",
        answers,
        questionIndex: nextIndex,
      });

      // Calculate scores using shared scoring logic
      let scoringResult;
      try {
        scoringResult = calculateAssessmentScores(answers, definition);
      } catch (error) {
        return { error: "No answers provided" };
      }

      const { gcBurnout, band, rawComposite, zones, answeredRatio } = scoringResult;

      // Create assessment record (only EMA or SDOH)
      if (session.definitionId !== "ema" && session.definitionId !== "sdoh") {
        return { error: "Invalid assessment type" };
      }

      const assessmentId = await ctx.db.insert("assessments", {
        userId,
        definitionId: session.definitionId,
        version: "1.0",
        answers,
        completedAt: Date.now(),
      });

      // Update scores using new score system (via action)
      if (session.definitionId === "ema") {
        await ctx.scheduler.runAfter(0, internal.internal.score.updateFromEMA, {
          userId,
          zones,
          gcBurnout,
        });
      } else if (session.definitionId === "sdoh") {
        await ctx.scheduler.runAfter(0, internal.internal.score.updateFromSDOH, {
          userId,
          zones,
          gcBurnout,
        });
      }

      // Create score record for backward compatibility
      await ctx.db.insert("scores", {
        userId,
        assessmentId,
        instrument: session.definitionId,
        rawComposite,
        gcBurnout,
        band,
        zones,
        confidence: answeredRatio,
        answeredRatio,
      });

      // Route to Assessment Agent for interpretation
      await ctx.scheduler.runAfter(0, internal.internal.agents.processAssessmentCompletion, {
        userId,
        assessmentId,
        score: gcBurnout,
        band,
      });

      return { complete: true };
    } else {
      // Continue to next question
      await ctx.db.patch(sessionId, {
        questionIndex: nextIndex,
        answers,
      });

      return {
        complete: false,
        nextQuestion: definition.questions[nextIndex].text,
        progress: `${nextIndex + 1} of ${definition.questions.length}`,
      };
    }
  },
});

/**
 * Complete assessment and calculate scores
 */
export const completeAssessment = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("assessment_sessions"),
  },
  handler: async (ctx, { userId, sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) {
      return;
    }

    const definition = getAssessmentDefinition(
      session.definitionId as any
    );

    // Calculate scores using shared scoring logic
    let scoringResult;
    try {
      scoringResult = calculateAssessmentScores(session.answers, definition);
    } catch (error) {
      return; // Cannot complete assessment with no answers
    }

    const { gcBurnout, band, rawComposite, zones, answeredRatio } = scoringResult;

    // Create assessment record (only EMA or SDOH)
    if (session.definitionId !== "ema" && session.definitionId !== "sdoh") {
      return;
    }

    const assessmentId = await ctx.db.insert("assessments", {
      userId,
      definitionId: session.definitionId,
      version: "1.0",
      answers: session.answers,
      completedAt: Date.now(),
    });

    // Update scores using new score system (via action)
    if (session.definitionId === "ema") {
      await ctx.scheduler.runAfter(0, internal.internal.score.updateFromEMA, {
        userId,
        zones,
        gcBurnout,
      });
    } else if (session.definitionId === "sdoh") {
      await ctx.scheduler.runAfter(0, internal.internal.score.updateFromSDOH, {
        userId,
        zones,
        gcBurnout,
      });
    }

    // Create score record for backward compatibility
    await ctx.db.insert("scores", {
      userId,
      assessmentId,
      instrument: session.definitionId,
      rawComposite,
      gcBurnout,
      band,
      zones,
      confidence: answeredRatio,
      answeredRatio,
    });

    // Route to Assessment Agent for interpretation
    await ctx.scheduler.runAfter(0, internal.internal.agents.processAssessmentCompletion, {
      userId,
      assessmentId,
      score: gcBurnout,
      band,
    });

    return {
      assessmentId,
      gcBurnout,
      band,
      zones,
      answeredRatio,
    };
  },
});
