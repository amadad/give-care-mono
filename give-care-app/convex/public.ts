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
    // TODO: Add access control (requireUser helper)
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
