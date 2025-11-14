/**
 * Internal Resource Functions
 * Cache operations following Convex best practices
 */

import { internalQuery, internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getLocationFromUser } from "../lib/mapsUtils";
import { suggestResourcesForZone } from "../lib/services/resourceService";

/**
 * Get cached resources (query - pure, reactive)
 */
export const getCachedResources = internalQuery({
  args: {
    category: v.string(),
    zip: v.string(),
  },
  handler: async (ctx, { category, zip }) => {
    // Query cache by category + zip
    const cache = await ctx.db
      .query("resource_cache")
      .withIndex("by_zip_cat", (q) =>
        q.eq("zip", zip).eq("category", category)
      )
      .order("desc")
      .first();

    if (!cache) return null;

    // Check expiration
    const now = Date.now();
    if (cache.expiresAt && cache.expiresAt < now) {
      return null; // Expired
    }

    return cache;
  },
});

/**
 * Suggest resources for a zone (action)
 * Called by workflow
 */
export const suggestResourcesForZoneAction = internalAction({
  args: {
    userId: v.id("users"),
    zone: v.string(),
  },
  handler: async (ctx, { userId, zone }) => {
    await suggestResourcesForZone(ctx, userId, zone);
  },
});

/**
 * Save to cache (mutation - transactional)
 */
export const saveToCache = internalMutation({
  args: {
    category: v.string(),
    zip: v.string(),
    placeIds: v.array(v.string()),
    ttlDays: v.number(),
  },
  handler: async (ctx, { category, zip, placeIds, ttlDays }) => {
    const now = Date.now();
    const expiresAt = now + ttlDays * 86400000;

    // Check if exists (idempotent)
    const existing = await ctx.db
      .query("resource_cache")
      .withIndex("by_zip_cat", (q) =>
        q.eq("zip", zip).eq("category", category)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        placeIds,
        expiresAt,
        createdAt: now,
      });
    } else {
      // Create new
      await ctx.db.insert("resource_cache", {
        category,
        zip,
        placeIds,
        createdAt: now,
        expiresAt,
      });
    }
  },
});

/**
 * Get location from user (query helper)
 */
export const getLocationFromUserQuery = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await getLocationFromUser(ctx, userId);
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

/**
 * Cleanup expired cache entries
 */
export const cleanupExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("resource_cache")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
      .collect();

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }
    
    return { deletedCount: expired.length };
  },
});
