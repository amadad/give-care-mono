/**
 * Assessment Flow and Scoring
 * Handles question-by-question delivery and scoring
 */

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAssessmentDefinition } from "./lib/assessmentCatalog";
import { internal } from "./_generated/api";
import { recalculateComposite } from "./lib/services/wellnessService";
import { emitEvent } from "./lib/services/eventService";
import { enrichProfileFromSDOH } from "./lib/services/assessmentService";

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

      // Create assessment record
      const assessmentId = await ctx.db.insert("assessments", {
        userId,
        definitionId: session.definitionId as "ema" | "cwbs" | "reach2" | "sdoh",
        version: "1.0",
        answers,
        completedAt: Date.now(),
      });

      // Create score record
      await ctx.db.insert("scores", {
        userId,
        assessmentId,
        instrument: session.definitionId as any,
        rawComposite: avgScore,
        gcBurnout,
        band,
        zones: {
          zone_emotional: zoneAverages["zone_emotional"] ?? 0,
          zone_physical: zoneAverages["zone_physical"] ?? 0,
          zone_social: zoneAverages["zone_social"] ?? 0,
          zone_time: zoneAverages["zone_time"] ?? 0,
          zone_financial: zoneAverages["zone_financial"] ?? 0,
        },
        confidence: answers.length / definition.questions.length,
        answeredRatio: answers.length / definition.questions.length,
      });

      // Recalculate composite burnout score (write-through)
      await recalculateComposite(ctx, userId);

      // Emit assessment.completed event
      await emitEvent(ctx, userId, "assessment.completed", {
        assessmentId,
        instrument: session.definitionId,
        gcBurnout,
        band,
        zones: zoneAverages,
      });

      // Enrich profile from SDOH assessment (if applicable)
      if (session.definitionId === "sdoh") {
        await enrichProfileFromSDOH(ctx, userId, answers, zoneAverages);
      }

      // Find highest pressure zone for proactive resource suggestions
      const zoneEntries = Object.entries(zoneAverages).filter(
        ([_, value]) => value > 0
      );
      if (zoneEntries.length > 0) {
        const highestZone = zoneEntries.reduce((max, [zone, value]) =>
          value > max[1] ? [zone, value] : max
        )[0];

        // Trigger workflow to suggest resources for highest pressure zone
        await ctx.scheduler.runAfter(0, internal.workflows.startSuggestResourcesWorkflow, {
          userId,
          zone: highestZone,
        });
      }

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

    // Create assessment record
    const assessmentId = await ctx.db.insert("assessments", {
      userId,
      definitionId: session.definitionId as "ema" | "cwbs" | "reach2" | "sdoh",
      version: "1.0",
      answers: session.answers,
      completedAt: Date.now(),
    });

    // Create score record
    await ctx.db.insert("scores", {
      userId,
      assessmentId,
      instrument: session.definitionId as any,
      rawComposite: avgScore,
      gcBurnout,
      band,
      zones: {
        zone_emotional: zoneAverages["zone_emotional"] ?? 0,
        zone_physical: zoneAverages["zone_physical"] ?? 0,
        zone_social: zoneAverages["zone_social"] ?? 0,
        zone_time: zoneAverages["zone_time"] ?? 0,
        zone_financial: zoneAverages["zone_financial"] ?? 0,
      },
      confidence: session.answers.length / definition.questions.length,
      answeredRatio: session.answers.length / definition.questions.length,
    });

    // Recalculate composite burnout score (write-through)
    // Single mutation - CONVEX_01.md best practice
    await recalculateComposite(ctx, userId);

    // Emit assessment.completed event
    await emitEvent(ctx, userId, "assessment.completed", {
      assessmentId,
      instrument: session.definitionId,
      gcBurnout,
      band,
      zones: zoneAverages,
    });

    // Enrich profile from SDOH assessment (if applicable)
    if (session.definitionId === "sdoh") {
      await enrichProfileFromSDOH(ctx, userId, session.answers, zoneAverages);
    }

    // Find highest pressure zone for proactive resource suggestions
    const zoneEntries = Object.entries(zoneAverages).filter(
      ([_, value]) => value > 0
    );
    if (zoneEntries.length > 0) {
      const highestZone = zoneEntries.reduce((max, [zone, value]) =>
        value > max[1] ? [zone, value] : max
      )[0];

      // Trigger workflow to suggest resources for highest pressure zone
      // Workflows must be started via action, not scheduled directly
      await ctx.scheduler.runAfter(0, internal.workflows.startSuggestResourcesWorkflow, {
        userId,
        zone: highestZone,
      });
    }

    // Route to Assessment Agent for interpretation
    await ctx.scheduler.runAfter(0, internal.internal.agents.processAssessmentCompletion, {
      userId,
      assessmentId,
      score: gcBurnout,
      band,
    });
  },
});

