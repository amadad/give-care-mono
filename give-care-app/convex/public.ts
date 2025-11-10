/**
 * Public API Surface
 *
 * This file defines the ONLY functions callable from the browser/frontend.
 * All exports here must have validators and proper access control.
 */

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getByExternalId, ensureUser } from './lib/core';

// ============================================================================
// USERS
// ============================================================================

export const getByExternalIdQuery = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return getByExternalId(ctx, externalId);
  },
});

// ============================================================================
// MEMORIES
// ============================================================================

/**
 * Record important memory about a user
 * Lightweight table for category queries only
 * Semantic search handled by Agent Component
 */
export const recordMemory = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Store in lightweight memories table for category queries
    // Agent Component handles semantic search via contextOptions
    await ctx.db.insert('memories', {
      userId: user._id,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });
  },
});

/**
 * List stored memories for a user ordered by importance
 */
export const listMemories = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      return [];
    }

    // ✅ Fix: Query with limit and proper ordering
    // Note: Index doesn't support ordering, so we fetch more than needed and sort
    // For better performance, consider adding composite index on (userId, importance, _creationTime)
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user_category', (q) => q.eq('userId', user._id))
      .take(limit * 2); // Fetch 2x limit to account for category filtering

    return memories
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return b._creationTime - a._creationTime;
      })
      .slice(0, limit)
      .map((m) => ({
        category: m.category,
        content: m.content,
        importance: m.importance,
      }));
  },
});

