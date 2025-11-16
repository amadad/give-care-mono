/**
 * Wellness Status Queries
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { getRiskLevel } from "./lib/sdoh";

/**
 * Get wellness status (public query)
 * Returns composite burnout score
 */
export const getWellnessStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Get score from user (new score-first system)
    const user = await ctx.db.get(userId);
    if (!user) {
      return {
        score: 0,
        band: "unknown",
        zones: {},
        lastAssessment: "never",
      };
    }

    const gcSdohScore = user.gcSdohScore || (user.metadata as any)?.gcSdohScore;
    const zones = user.zones || (user.metadata as any)?.zones || {};

    if (gcSdohScore === undefined || gcSdohScore === null) {
      return {
        score: 0,
        band: "unknown",
        zones: {},
        lastAssessment: "never",
      };
    }

    // Get latest assessment for lastAssessment timestamp
    const latestAssessment = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    const riskLevel = user.riskLevel || getRiskLevel(gcSdohScore);
    const band = riskLevel === "crisis" ? "high" : riskLevel === "high" ? "high" : riskLevel === "moderate" ? "moderate" : "low";

    return {
      score: gcSdohScore,
      band,
      zones: zones || {},
      lastAssessment: latestAssessment
        ? new Date(latestAssessment.completedAt).toISOString()
        : "never",
    };
  },
});

/**
 * List all users (admin query)
 * Limited to 100 results - use pagination for more
 */
export const listUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("users").take(Math.min(limit, 100));
  },
});

/**
 * List all scores (admin query)
 * Limited to 100 results - use pagination for more
 */
export const listScores = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("scores").take(Math.min(limit, 100));
  },
});

/**
 * List all alerts (admin query)
 * Limited to 100 results - use pagination for more
 */
export const listAlerts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("alerts").take(Math.min(limit, 100));
  },
});

/**
 * List all events (admin query)
 * Limited to 100 results - use pagination for more
 */
export const listEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("events").take(Math.min(limit, 100));
  },
});

