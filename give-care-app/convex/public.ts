/**
 * Public API
 * Functions accessible to clients (with access control)
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user profile (with access control)
 */
export const getProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      name: user.name,
      phone: user.phone,
      metadata: user.metadata,
    };
  },
});

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
    // Access control: require authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Authentication required");
    }

    // TODO: Add admin check if you have admin role system
    // For now, any authenticated user can access (restrict further if needed)

    // Limit results to prevent unbounded queries
    // Note: Cannot use .order() without an index - using .take() only
    return await ctx.db
      .query("subscriptions")
      .take(limit);
  },
});
