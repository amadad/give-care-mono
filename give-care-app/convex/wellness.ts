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

