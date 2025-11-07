import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import * as Users from '../model/users';

export const record = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, { userId, category, content, importance }) => {
    const user = await Users.ensureUser(ctx, { externalId: userId, channel: 'sms' });
    await ctx.db.insert('memories', {
      userId: user._id,
      externalId: userId,
      category,
      content,
      importance,
      embedding: undefined,
      lastAccessedAt: Date.now(),
      accessCount: 0,
    });
  },
});

export const retrieve = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    return memories.map(m => ({
      category: m.category,
      content: m.content,
      importance: m.importance,
      lastAccessedAt: m.lastAccessedAt,
    }));
  },
});

export const retrieveByCategory = query({
  args: {
    userId: v.string(),
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, category, limit = 10 }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('category'), category))
      .order('desc')
      .take(limit);

    return memories.map(m => ({
      category: m.category,
      content: m.content,
      importance: m.importance,
      lastAccessedAt: m.lastAccessedAt,
      accessCount: m.accessCount,
    }));
  },
});

export const retrieveImportant = query({
  args: {
    userId: v.string(),
    minImportance: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, minImportance = 0.7, limit = 5 }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.gte(q.field('importance'), minImportance))
      .order('desc')
      .take(limit);

    return memories.map(m => ({
      category: m.category,
      content: m.content,
      importance: m.importance,
      lastAccessedAt: m.lastAccessedAt,
    }));
  },
});
