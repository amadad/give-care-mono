/**
 * Trends Workflow
 *
 * Detects score trends and triggers proactive intervention suggestions.
 * Runs every 6 hours via cron.
 */

import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { CATALOG, type AssessmentAnswer } from '../lib/assessmentCatalog';
import type { Doc } from '../_generated/dataModel';

type SessionAnswer = Doc<'assessment_sessions'>['answers'][number];

const toAssessmentAnswers = (answers: SessionAnswer[]): AssessmentAnswer[] =>
  answers.map((answer, idx) => ({
    questionIndex: Number.isNaN(Number.parseInt(answer.questionId, 10))
      ? idx
      : Number.parseInt(answer.questionId, 10),
    value: answer.value,
  }));

// ============================================================================
// TREND DETECTION ACTION
// ============================================================================

/**
 * Detect score trends and trigger intervention suggestions for declining users
 * Runs every 6 hours via cron
 */
export const detectScoreTrends = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.internal.getAllUsers, {});

    for (const u of users) {
      const scores = await ctx.runQuery(internal.workflows.trends.getUserScores, {
        userId: u._id,
      });

      if (scores.length < 3) continue; // Need at least 3 scores to detect trend

      // Simple trend: compare latest vs previous
      const upDown = scores[0].composite - scores[1].composite;
      const declining = upDown >= 5; // Higher score = worse (5+ point increase)

      if (declining) {
        // Get latest assessment to get pressure zones
        const assessment = await ctx.runQuery(internal.internal.getAssessmentById, {
          assessmentId: scores[0].assessmentId,
        });

        if (assessment) {
          // Recompute pressure zones from assessment answers
          const catalog = CATALOG[assessment.definitionId as 'ema' | 'bsfc' | 'reach2' | 'sdoh'];
          const normalized = toAssessmentAnswers(assessment.answers);
          const { pressureZones } = catalog.score(normalized);

          // Trigger intervention suggestions
          await ctx.scheduler.runAfter(0, internal.workflows.interventions.suggestInterventions, {
            userId: u._id,
            assessmentId: scores[0].assessmentId,
            zones: pressureZones,
          });
        }
      }
    }
  },
});

// ============================================================================
// HELPER QUERIES
// ============================================================================

/**
 * Get user's recent scores (last 5)
 */
export const getUserScores = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(5);
  },
});

