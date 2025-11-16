/**
 * Assessment Flow and Scoring
 * Handles question-by-question delivery and scoring
 */

import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAssessmentDefinition } from "./lib/assessmentCatalog";
import { internal } from "./_generated/api";
import { calculateZoneAverage } from "./lib/scoreCalculator";

/**
 * List all assessments (admin query)
 */
export const listAssessments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assessments").collect();
  },
});

/**
 * Process assessment answer
 */
export const processAssessmentAnswer = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("assessment_sessions"),
    answer: v.number(),
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

    // Save answer
    const answers = [
      ...session.answers,
      {
        questionId: currentQuestion.id,
        value: answer,
      },
    ];

    const nextIndex = session.questionIndex + 1;

    // Check if complete
    if (nextIndex >= definition.questions.length) {
      // Complete assessment
      await ctx.db.patch(sessionId, {
        status: "completed",
        answers,
        questionIndex: nextIndex,
      });

      // Calculate scores and create records inline (synchronous for tests)
      // Calculate raw scores
      const zoneScores: Record<string, number[]> = {};
      for (const answer of answers) {
        const question = definition.questions.find((q) => q.id === answer.questionId);
        if (question?.zone) {
          if (!zoneScores[question.zone]) {
            zoneScores[question.zone] = [];
          }
          zoneScores[question.zone].push(answer.value);
        }
      }

      // Calculate zone averages
      const zoneAverages: Record<string, number> = {};
      for (const [zone, values] of Object.entries(zoneScores)) {
        zoneAverages[zone] =
          values.reduce((sum, v) => sum + v, 0) / values.length;
      }

      // Calculate composite score (average of all answers, normalized to 0-100)
      const allValues = answers.map((a) => a.value);
      const composite = (allValues.reduce((sum, v) => sum + v, 0) / allValues.length) * 20;
      const gcBurnout = Math.round(composite);

      // Determine band
      const avgScore = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
      let band: "very_low" | "low" | "moderate" | "high";
      if (avgScore < 2) {
        band = "very_low";
      } else if (avgScore < 3) {
        band = "low";
      } else if (avgScore < 4) {
        band = "moderate";
      } else {
        band = "high";
      }

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
        confidence: answers.length / definition.questions.length,
        answeredRatio: answers.length / definition.questions.length,
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

    // Calculate raw scores
    const zoneScores: Record<string, number[]> = {};
    for (const answer of session.answers) {
      const question = definition.questions.find((q) => q.id === answer.questionId);
      if (question?.zone) {
        if (!zoneScores[question.zone]) {
          zoneScores[question.zone] = [];
        }
        zoneScores[question.zone].push(answer.value);
      }
    }

    // Calculate zone averages
    const zoneAverages: Record<string, number> = {};
    for (const [zone, values] of Object.entries(zoneScores)) {
      zoneAverages[zone] =
        values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    // Calculate composite score (average of all answers, normalized to 0-100)
    const allValues = session.answers.map((a) => a.value);
    const composite = (allValues.reduce((sum, v) => sum + v, 0) / allValues.length) * 20;
    const gcBurnout = Math.round(composite);

    // Determine band
    const avgScore = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
    let band: "very_low" | "low" | "moderate" | "high";
    if (avgScore < 2) {
      band = "very_low";
    } else if (avgScore < 3) {
      band = "low";
    } else if (avgScore < 4) {
      band = "moderate";
    } else {
      band = "high";
    }

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
      confidence: session.answers.length / definition.questions.length,
      answeredRatio: session.answers.length / definition.questions.length,
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

