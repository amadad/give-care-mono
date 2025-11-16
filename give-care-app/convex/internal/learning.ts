/**
 * Internal Learning Functions
 * Simple intervention tracking
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Track resource helpfulness
 * Simple yes/no feedback stored in events table
 */
export const trackHelpfulnessMutation = internalMutation({
  args: {
    userId: v.id("users"),
    resourceId: v.string(),
    helpful: v.boolean(),
  },
  handler: async (ctx, { userId, resourceId, helpful }) => {
    // Store simple helpfulness feedback in events table
    await ctx.db.insert("events", {
      userId,
      type: helpful ? "intervention.success" : "intervention.skip",
      payload: {
        resourceId,
        helpful,
        timestamp: Date.now(),
      },
    });
  },
});

