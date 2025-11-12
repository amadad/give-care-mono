/**
 * Internal Memory Functions
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getRelevantMemories } from "../lib/services/memoryService";

/**
 * Record memory
 */
export const recordMemory = internalMutation({
  args: {
    userId: v.id("users"),
    category: v.union(
      v.literal("care_routine"),
      v.literal("preference"),
      v.literal("intervention_result"),
      v.literal("crisis_trigger"),
      v.literal("family_health")
    ),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, { userId, category, content, importance }) => {
    await ctx.db.insert("memories", {
      userId,
      category,
      content,
      importance,
    });
  },
});

/**
 * Get relevant memories for agent context
 * Optimized: Filter by importance (≥7), limit to top 5
 */
export const getRelevantMemoriesQuery = internalQuery({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 5 }) => {
    return await getRelevantMemories(ctx, userId, limit);
  },
});
