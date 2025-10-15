import { internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Save a new memory entry
 */
export const saveMemory = internalMutation({
  args: {
    userId: v.id('users'),
    content: v.string(),
    category: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate category
    const validCategories = ['care_routine', 'preference', 'intervention_result', 'crisis_trigger'];
    if (!validCategories.includes(args.category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate importance
    if (args.importance < 1 || args.importance > 10) {
      throw new Error('Importance must be between 1 and 10');
    }

    // Validate content
    if (!args.content || args.content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    const memoryId = await ctx.db.insert('memories', {
      userId: args.userId,
      content: args.content,
      category: args.category,
      importance: args.importance,
      createdAt: Date.now(),
    });

    return memoryId;
  },
});

/**
 * Get all memories for a user (newest first)
 */
export const getUserMemories = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .collect();

    // Sort by createdAt descending (newest first)
    return memories.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get memories by category
 */
export const getMemoriesByCategory = internalQuery({
  args: {
    userId: v.id('users'),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .filter(q => q.eq(q.field('category'), args.category))
      .collect();

    return memories.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get top memories by importance
 */
export const getTopMemories = internalQuery({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .collect();

    // Sort by importance descending, then by createdAt descending
    const sorted = memories.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return b.createdAt - a.createdAt;
    });

    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});

/**
 * Increment access count for a memory
 */
export const incrementAccessCount = internalMutation({
  args: { memoryId: v.id('memories') },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory) {
      throw new Error('Memory not found');
    }

    await ctx.db.patch(args.memoryId, {
      accessCount: (memory.accessCount || 0) + 1,
      lastAccessedAt: Date.now(),
    });
  },
});
