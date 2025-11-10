/**
 * Memory Mutations
 *
 * Database operations for saving extracted memories and enriched context
 */

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

// ============================================================================
// SAVE FACTS MUTATION
// ============================================================================

export const saveFacts = internalMutation({
  args: {
    userId: v.string(),
    facts: v.array(v.any()),
  },
  handler: async (ctx, { userId, facts }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return;

    // Save each fact to memories table
    for (const fact of facts) {
      await ctx.db.insert('memories', {
        userId: user._id,
        category: fact.category || 'preference',
        content: fact.fact,
        importance: fact.importance || 5,
      });
    }
  },
});

// ============================================================================
// UPDATE CONTEXT MUTATION
// ============================================================================

export const updateContext = internalMutation({
  args: {
    userId: v.string(),
    enrichedContext: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { userId, enrichedContext }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return;

    // Update user metadata with enriched context
    const metadata = (user.metadata ?? {}) as Record<string, unknown>;
    metadata.enrichedContext = enrichedContext;
    metadata.contextUpdatedAt = Date.now();

    await ctx.db.patch(user._id, { metadata });
  },
});
