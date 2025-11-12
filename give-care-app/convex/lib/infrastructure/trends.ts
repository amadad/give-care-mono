/**
 * Trend Detection Infrastructure
 * Generic pattern for detecting trends across all users
 */

import { ActionCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { calculateScoreTrend } from "../domain/trendAnalysis";

/**
 * Detect score trends for all users
 * Batch query all users with 2+ composite scores
 */
export async function detectScoreTrends(ctx: ActionCtx): Promise<void> {
  // Get all users with 2+ composite scores (single query)
  // Note: This would need a helper query to get users with multiple scores
  // For now, we'll query all users and filter in code (not ideal, but works)
  
  // TODO: Add index or query helper for users with 2+ scores
  const users = await ctx.runQuery(internal.users.getAllUsers, {});

  for (const user of users) {
    // Get composite scores for user
    const scores = await ctx.runQuery(
      internal.wellness.getCompositeScoreHistory,
      { userId: user._id }
    );

    if (!scores || scores.length < 2) {
      continue; // Need at least 2 scores for trend
    }

    // Calculate trend using domain logic
    const scoreValues = scores.map((s) => s.gcBurnout);
    const trend = calculateScoreTrend(scoreValues);

    // If decline ≥ 5, schedule workflow to suggest interventions
    if (trend.trend === "declining" && trend.change >= 5) {
      await ctx.scheduler.runAfter(
        0,
        internal.workflows.suggestInterventionsForDecline,
        {
          userId: user._id,
          change: trend.change,
        }
      );
    }
  }
}

