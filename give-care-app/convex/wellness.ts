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

/**
 * List all users (admin query)
 */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * List all scores (admin query)
 */
export const listScores = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scores").collect();
  },
});

/**
 * List all alerts (admin query)
 */
export const listAlerts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alerts").collect();
  },
});

/**
 * List all events (admin query)
 */
export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").collect();
  },
});

