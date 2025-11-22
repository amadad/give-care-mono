/**
 * Public API
 * Functions accessible to clients (with access control)
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { ADMIN_EMAILS } from "./lib/adminConfig";

/**
 * Get user by external ID (phone or email)
 */
export const getByExternalIdQuery = query({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, { externalId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .first();
  },
});

/**
 * List all subscriptions (admin query)
 * Requires authentication - admin only
 */
export const listSubscriptions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    await checkAdminAccess(ctx);

    // Limit results to prevent unbounded queries
    // Note: Cannot use .order() without an index - using .take() only
    return await ctx.db
      .query("subscriptions")
      .take(limit);
  },
});

/**
 * Check rate limiter status for a user (admin query)
 * Returns the current rate limit state without consuming a token
 */
export const checkRateLimitStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const result = await ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
      name: "sms_daily",
      key: userId,
      config: {
        kind: "fixed window",
        period: 86400000,
        rate: 30,
        capacity: 30,
      },
      count: 1,
    });

    return {
      ok: result.ok,
      retryAfter: result.retryAfter,
      currentConfig: { rate: 30, capacity: 30, period: 86400000 },
    };
  },
});

/**
 * Reset rate limiter (admin mutation)
 * Clears all rate limit buckets to allow fresh starts
 * USE WITH CAUTION - only for testing/debugging
 */
export const resetRateLimiter = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all rate limit buckets
    await ctx.runMutation(components.rateLimiter.lib.clearAll, {});

    return { success: true, message: "Rate limiter cleared - users can now send up to 30 messages/day" };
  },
});

/**
 * Check if current user is admin
 */
async function checkAdminAccess(ctx: any): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Authentication required");
  }

  const email = identity.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("Unauthorized: Admin access only. Contact administrator to request access.");
  }
}

/**
 * List all users (admin query)
 * Requires authentication - admin only
 */
export const listUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    await checkAdminAccess(ctx);

    // Limit results to prevent unbounded queries
    // Note: Cannot use .order() without an index - using .take() only
    return await ctx.db
      .query("users")
      .take(limit);
  },
});

/**
 * List all scores (admin query)
 * Requires authentication - admin only
 */
export const listScores = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    await checkAdminAccess(ctx);

    // Limit results to prevent unbounded queries
    // Note: Cannot use .order() without an index - using .take() only
    return await ctx.db
      .query("scores")
      .take(limit);
  },
});

/**
 * List all alerts (admin query)
 * Requires authentication - admin only
 */
export const listAlerts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    await checkAdminAccess(ctx);

    // Limit results to prevent unbounded queries
    // Note: Cannot use .order() without an index - using .take() only
    return await ctx.db
      .query("alerts")
      .take(limit);
  },
});

/**
 * List all events (admin query)
 * Requires authentication - admin only
 */
export const listEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 100 }) => {
    await checkAdminAccess(ctx);

    // Limit results to prevent unbounded queries
    // Note: Cannot use .order() without an index - using .take() only
    return await ctx.db
      .query("events")
      .take(limit);
  },
});
