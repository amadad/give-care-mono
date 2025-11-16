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
 */
export const listSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subscriptions").collect();
  },
});
