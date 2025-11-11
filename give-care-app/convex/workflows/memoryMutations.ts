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
    convexUserId: v.id('users'), // Fix: Accept Convex ID directly
    facts: v.array(v.any()),
  },
  handler: async (ctx, { convexUserId, facts }) => {
    // Fix: No user lookup needed - use ID directly
    // Save each fact to memories table
    for (const fact of facts) {
      await ctx.db.insert('memories', {
        userId: convexUserId,
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
    convexUserId: v.id('users'), // Fix: Accept Convex ID directly
    enrichedContext: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { convexUserId, enrichedContext }) => {
    // Fix: No user lookup needed - use ID directly
    const user = await ctx.db.get(convexUserId);
    if (!user) return;

    // Update user metadata with enriched context
    const metadata = (user.metadata ?? {}) as Record<string, unknown>;
    metadata.enrichedContext = enrichedContext;
    metadata.contextUpdatedAt = Date.now();

    await ctx.db.patch(convexUserId, { metadata });
  },
});
