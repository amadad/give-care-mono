/**
 * Wellness Status Queries
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCompositeScore } from "./lib/services/wellnessService";

/**
 * Get wellness status (public query)
 * Returns composite burnout score
 */
export const getWellnessStatus = query({
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

