/**
 * Public Score API
 * Query functions for retrieving user scores
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { getRiskLevel } from "./lib/sdoh";

/**
 * Get current score for a user
 */
export const getScore = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Get score from top-level fields (with metadata fallback for migration)
    const gcSdohScore = user.gcSdohScore || (user.metadata as any)?.gcSdohScore;
    const zones = user.zones || (user.metadata as any)?.zones || {};
    const riskLevel = user.riskLevel || (user.metadata as any)?.riskLevel;

    if (gcSdohScore === undefined || gcSdohScore === null) {
      return null;
    }

    return {
      score: gcSdohScore,
      zones: zones || {},
      riskLevel: riskLevel || getRiskLevel(gcSdohScore),
      lastEMA: user.lastEMA || (user.metadata as any)?.lastEMA,
      lastSDOH: user.lastSDOH || (user.metadata as any)?.lastSDOH,
    };
  },
});

/**
 * Get score history for a user
 */
export const getScoreHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 30 }) => {
    // Query score_history table (will be created in schema update)
    const history = await ctx.db
      .query("score_history")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return history.map((entry) => ({
      oldScore: entry.oldScore,
      newScore: entry.newScore,
      zones: entry.zones,
      trigger: entry.trigger,
      timestamp: entry.timestamp,
    }));
  },
});

