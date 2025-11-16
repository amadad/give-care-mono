/**
 * Internal Memory Functions
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Get relevant memories (inline - was in memoryService)
 * Agent Component handles semantic search, this just filters by importance
 */
async function getRelevantMemories(
  ctx: QueryCtx,
  userId: Id<"users">,
  limit: number = 5
) {
  const memories = await ctx.db
    .query("memories")
    .withIndex("by_user_and_importance", (q) => q.eq("userId", userId))
    .collect();

  // Filter by importance >= 7, sort by importance desc, limit
  return memories
    .filter((m) => m.importance >= 7)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limit);
}

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

/**
 * List all memories for a user, optionally filtered by category
 * Used by tests and admin dashboard
 */
export const listMemories = internalQuery({
  args: {
    userId: v.id("users"),
    category: v.optional(
      v.union(
        v.literal("care_routine"),
        v.literal("preference"),
        v.literal("intervention_result"),
        v.literal("crisis_trigger"),
        v.literal("family_health")
      )
    ),
  },
  handler: async (ctx, { userId, category }) => {
    // Get all memories for user
    const allMemories = await ctx.db.query("memories").collect();
    let userMemories = allMemories.filter((m) => m.userId === userId);

    // Filter by category if provided
    if (category) {
      userMemories = userMemories.filter((m) => m.category === category);
    }

    // Sort by importance (descending)
    userMemories.sort((a, b) => b.importance - a.importance);

    return userMemories;
  },
});
