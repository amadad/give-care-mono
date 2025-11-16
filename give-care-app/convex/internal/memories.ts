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
  // Use range query on importance (>= 7), order by importance desc
  const memories = await ctx.db
    .query("memories")
    .withIndex("by_user_and_importance", (q) =>
      q.eq("userId", userId).gte("importance", 7)
    )
    .order("desc")
    .take(limit);

  return memories;
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
    // Query memories by user (and category if provided)
    const userMemories = category
      ? await ctx.db
          .query("memories")
          .withIndex("by_user_category", (q) =>
            q.eq("userId", userId).eq("category", category)
          )
          .collect()
      : await ctx.db
          .query("memories")
          .withIndex("by_user_and_importance", (q) => q.eq("userId", userId))
          .collect();

    // Sort by importance (descending)
    userMemories.sort((a, b) => b.importance - a.importance);

    return userMemories;
  },
});
