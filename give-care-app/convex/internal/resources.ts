/**
 * Internal Resource Functions
 * User location and scoring queries
 */

import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Get location from user (query helper)
 * Simplified: just returns ZIP code from user metadata
 */
export const getLocationFromUserQuery = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    const zipCode = user.zipCode || (user.metadata as any)?.zipCode;
    if (!zipCode) return null;
    
    return { zipCode };
  },
});

/**
 * Get latest user score with pressure zones
 */
export const getLatestUserScore = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Get most recent score for this user
    const latestScore = await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    if (!latestScore) return null;

    return {
      zones: latestScore.zones,
      gcBurnout: (latestScore as any).gcBurnout,
      instrument: latestScore.instrument,
    };
  },
});

