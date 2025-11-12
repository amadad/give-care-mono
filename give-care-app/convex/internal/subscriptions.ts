/**
 * Internal Subscription Functions
 */

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get subscription by user ID
 */
export const getByUserId = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

