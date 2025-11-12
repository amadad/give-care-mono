/**
 * Memory Service
 * Optimized memory retrieval for agent context
 */

import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

export interface Memory {
  _id: Id<"memories">;
  userId: Id<"users">;
  category: string;
  content: string;
  importance: number;
  _creationTime: number;
}

/**
 * Get relevant memories for agent context
 * Optimized: Filter by importance (≥7), limit to top 5
 * CONVEX_01.md: Use single query with filtering
 */
export async function getRelevantMemories(
  ctx: QueryCtx,
  userId: Id<"users">,
  limit: number = 5
): Promise<Memory[]> {
  // Single query: Get all memories for user
  // Filter by importance (≥7) and limit to top N
  // CONVEX_01.md: "Only use .collect with a small number"
  const allMemories = await ctx.db
    .query("memories")
    .withIndex("by_user_category", (q) => q.eq("userId", userId))
    .take(100) // Reasonable limit for filtering

  // Filter by importance (≥7) and sort by importance + recency
  const importantMemories = allMemories
    .filter((m) => m.importance >= 7)
    .sort((a, b) => {
      // Sort by importance (desc), then by recency (desc)
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return b._creationTime - a._creationTime;
    })
    .slice(0, limit);

  return importantMemories as Memory[];
}

/**
 * Get recent memories (for caching)
 * Returns last 10 memories regardless of importance
 */
export async function getRecentMemories(
  ctx: QueryCtx,
  userId: Id<"users">,
  limit: number = 10
): Promise<Memory[]> {
  const memories = await ctx.db
    .query("memories")
    .withIndex("by_user_category", (q) => q.eq("userId", userId))
    .order("desc")
    .take(limit);

  return memories as Memory[];
}

