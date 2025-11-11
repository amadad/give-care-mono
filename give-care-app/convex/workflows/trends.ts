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
    // OPTIMIZATION: Batch all user scores in a single query instead of looping
    // This replaces N queries (one per user) with 1 query
    const allUserScores = await ctx.runQuery(internal.workflows.trends.getAllUserScores, {});

    for (const { userId, scores } of allUserScores) {
      if (scores.length < 2) continue; // Need at least 2 scores to detect trend

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
            userId,
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

/**
 * OPTIMIZATION: Get all user scores in a single query (batched)
 * Replaces loop with N queries with 1 query
 */
export const getAllUserScores = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();

    // Batch: Get scores for all users in parallel
    // Note: We still need to query per user (indexed), but we parallelize
    const scorePromises = users.map(async (user) => {
      const scores = await ctx.db
        .query('scores')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .take(2); // Only need latest 2 for trend detection
      return { userId: user._id, scores };
    });

    const allScores = await Promise.all(scorePromises);
    return allScores.filter((item) => item.scores.length >= 2);
  },
});

