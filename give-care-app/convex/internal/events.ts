/**
 * Internal Event Functions
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { emitEvent } from "../lib/services/eventService";

/**
 * Emit resource search event
 */
export const emitResourceSearch = internalMutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    category: v.string(),
    zip: v.string(),
  },
  handler: async (ctx, { userId, query, category, zip }) => {
    await emitEvent(ctx, userId, "resource.search", {
      query,
      category,
      zip,
    });
  },
});

