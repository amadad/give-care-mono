/**
 * Internal Wellness Functions
 */

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCompositeScore } from "../lib/services/wellnessService";

/**
 * Get composite score history for trend analysis
 */
export const getCompositeScoreHistory = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const allScores = await ctx.db
      .query("scores_composite")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    // Limit to 10 most recent in code
    const scores = allScores.slice(0, 10);
    return scores.map((s) => ({ gcBurnout: s.gcBurnout }));
  },
});

/**
 * Get wellness status (composite score)
 */
export const getWellnessStatus = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Get composite score (uses denormalized value from metadata)
    const composite = await getCompositeScore(ctx, userId);

    if (!composite) {
      return {
        score: 0,
        band: "unknown",
        zones: {},
        lastAssessment: "never",
      };
    }

    // Get latest individual score for zones
    const latestScore = await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return {
      score: composite.gcBurnout,
      band: composite.band,
      zones: latestScore?.zones || {},
      lastAssessment: latestScore
        ? new Date(latestScore._creationTime).toISOString()
        : "never",
    };
  },
});

