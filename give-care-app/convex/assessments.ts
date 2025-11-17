/**
 * Assessment Flow and Scoring
 * Handles question-by-question delivery and scoring
 */

import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAssessmentDefinition } from "./lib/assessmentCatalog";
import { internal } from "./_generated/api";
import { calculateZoneAverage } from "./lib/scoreCalculator";
import { getRiskLevel, getBandFromRiskLevel } from "./lib/sdoh";

/**
 * Admin email whitelist (matches public.ts)
 */
const ADMIN_EMAILS = [
  "ali@scty.org",
  "ali@givecareapp.com",
];

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
        value: answer as number,
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

      // Filter out skipped answers (only use numeric values for scoring)
      const answeredValues = answers.filter((a) => typeof a.value === "number");
      const answeredRatio = answeredValues.length / definition.questions.length;

      // Guard: Don't calculate score if no answers
      if (answeredValues.length === 0) {
        return { error: "No answers provided" };
      }

      // Calculate scores and create records inline (synchronous for tests)
      // Calculate raw scores (only from answered questions)
      const zoneScores: Record<string, number[]> = {};
      for (const answer of answeredValues) {
        const question = definition.questions.find((q) => q.id === answer.questionId);
        if (question?.zone) {
          if (!zoneScores[question.zone]) {
            zoneScores[question.zone] = [];
          }
          zoneScores[question.zone].push(answer.value);
        }
      }

      // Calculate zone averages (only for zones with answers)
      const zoneAverages: Record<string, number> = {};
      for (const [zone, values] of Object.entries(zoneScores)) {
        if (values.length > 0) {
          zoneAverages[zone] =
            values.reduce((sum, v) => sum + v, 0) / values.length;
        }
      }

      // Calculate composite score (average of answered questions, normalized to 0-100)
      const allValues = answeredValues.map((a) => a.value);
      const avgScore = allValues.reduce((sum, v) => sum + v, 0) / allValues.length; // Raw average (1-5 scale)
      const composite = avgScore * 20; // Normalize to 0-100
      const gcBurnout = Math.round(composite);

      // Determine band using getRiskLevel (single source of truth)
      const riskLevel = getRiskLevel(gcBurnout);
      const band = getBandFromRiskLevel(riskLevel);

      // Create assessment record (only EMA or SDOH)
      if (session.definitionId !== "ema" && session.definitionId !== "sdoh") {
        return { error: "Invalid assessment type" };
      }

      const assessmentId = await ctx.db.insert("assessments", {
        userId,
        definitionId: session.definitionId as "ema" | "sdoh",
        version: "1.0",
        answers,
        completedAt: Date.now(),
      });

      // Update scores using new score system (via action)
      if (session.definitionId === "ema") {
        await ctx.scheduler.runAfter(0, internal.internal.score.updateFromEMA, {
          userId,
          answers,
        });
      } else if (session.definitionId === "sdoh") {
        await ctx.scheduler.runAfter(0, internal.internal.score.updateFromSDOH, {
          userId,
          answers,
        });
      }

      // Create score record for backward compatibility
      const p1Scores = zoneScores["P1"] || [];
      const p2Scores = zoneScores["P2"] || [];
      const p3Scores = zoneScores["P3"] || [];
      const p4Scores = zoneScores["P4"] || [];
      const p5Scores = zoneScores["P5"] || [];
      const p6Scores = zoneScores["P6"] || [];

      await ctx.db.insert("scores", {
        userId,
        assessmentId,
        instrument: session.definitionId as "ema" | "sdoh",
        rawComposite: avgScore,
        gcBurnout,
        band,
        zones: {
          P1: p1Scores.length > 0 ? calculateZoneAverage(p1Scores) : undefined,
          P2: p2Scores.length > 0 ? calculateZoneAverage(p2Scores) : undefined,
          P3: p3Scores.length > 0 ? calculateZoneAverage(p3Scores) : undefined,
          P4: p4Scores.length > 0 ? calculateZoneAverage(p4Scores) : undefined,
          P5: p5Scores.length > 0 ? calculateZoneAverage(p5Scores) : undefined,
          P6: p6Scores.length > 0 ? calculateZoneAverage(p6Scores) : undefined,
        },
        confidence: answeredRatio, // Use answeredRatio for confidence
        answeredRatio: answeredRatio,
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

    // Filter out skipped answers (only use numeric values for scoring)
    const answeredValues = session.answers.filter((a) => typeof a.value === "number");
    const answeredRatio = answeredValues.length / definition.questions.length;

    // Guard: Don't calculate score if no answers
    if (answeredValues.length === 0) {
      return; // Cannot complete assessment with no answers
    }

    // Calculate raw scores (only from answered questions)
    const zoneScores: Record<string, number[]> = {};
    for (const answer of answeredValues) {
      const question = definition.questions.find((q) => q.id === answer.questionId);
      if (question?.zone) {
        if (!zoneScores[question.zone]) {
          zoneScores[question.zone] = [];
        }
        zoneScores[question.zone].push(answer.value);
      }
    }

    // Calculate zone averages (only for zones with answers)
    const zoneAverages: Record<string, number> = {};
    for (const [zone, values] of Object.entries(zoneScores)) {
      if (values.length > 0) {
        zoneAverages[zone] =
          values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    }

    // Calculate composite score (average of answered questions, normalized to 0-100)
    const allValues = answeredValues.map((a) => a.value);
    const avgScore = allValues.reduce((sum, v) => sum + v, 0) / allValues.length; // Raw average (1-5 scale)
    const composite = avgScore * 20; // Normalize to 0-100
    const gcBurnout = Math.round(composite);

    // Determine band using getRiskLevel (single source of truth)
    const riskLevel = getRiskLevel(gcBurnout);
    const band = getBandFromRiskLevel(riskLevel);

    // Create assessment record (only EMA or SDOH)
    if (session.definitionId !== "ema" && session.definitionId !== "sdoh") {
      return;
    }

    const assessmentId = await ctx.db.insert("assessments", {
      userId,
      definitionId: session.definitionId as "ema" | "sdoh",
      version: "1.0",
      answers: session.answers,
      completedAt: Date.now(),
    });

    // Update scores using new score system (via action)
    if (session.definitionId === "ema") {
      await ctx.scheduler.runAfter(0, internal.internal.score.updateFromEMA, {
        userId,
        answers: session.answers,
      });
    } else if (session.definitionId === "sdoh") {
      await ctx.scheduler.runAfter(0, internal.internal.score.updateFromSDOH, {
        userId,
        answers: session.answers,
      });
    }

    // Create score record for backward compatibility
    const p1Scores = zoneScores["P1"] || [];
    const p2Scores = zoneScores["P2"] || [];
    const p3Scores = zoneScores["P3"] || [];
    const p4Scores = zoneScores["P4"] || [];
    const p5Scores = zoneScores["P5"] || [];
    const p6Scores = zoneScores["P6"] || [];

    await ctx.db.insert("scores", {
      userId,
      assessmentId,
      instrument: session.definitionId as "ema" | "sdoh",
      rawComposite: avgScore,
      gcBurnout,
      band,
        zones: {
          P1: p1Scores.length > 0 ? calculateZoneAverage(p1Scores) : undefined,
          P2: p2Scores.length > 0 ? calculateZoneAverage(p2Scores) : undefined,
          P3: p3Scores.length > 0 ? calculateZoneAverage(p3Scores) : undefined,
          P4: p4Scores.length > 0 ? calculateZoneAverage(p4Scores) : undefined,
          P5: p5Scores.length > 0 ? calculateZoneAverage(p5Scores) : undefined,
          P6: p6Scores.length > 0 ? calculateZoneAverage(p6Scores) : undefined,
        },
        confidence: answeredRatio, // Use answeredRatio for confidence
        answeredRatio: answeredRatio,
    });

    // Route to Assessment Agent for interpretation
    await ctx.scheduler.runAfter(0, internal.internal.agents.processAssessmentCompletion, {
      userId,
      assessmentId,
      score: gcBurnout,
      band,
    });
  },
});

