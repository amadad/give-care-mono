/**
 * Interventions domain - evidence-based strategies, seeding, and history.
 */

import { internalMutation, mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { interventionsSeedData } from '../lib/interventions_seed';

export const seedInterventions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('interventions').collect();
    for (const intervention of existing) {
      await ctx.db.delete(intervention._id);
    }

    let inserted = 0;
    for (const data of interventionsSeedData) {
      await ctx.db.insert('interventions', data);
      inserted++;
    }

    return {
      success: true,
      inserted,
      message: `Successfully seeded ${inserted} evidence-based interventions`,
    };
  },
});

export const getByZones = query({
  args: {
    zones: v.array(v.string()),
    minEvidenceLevel: v.optional(v.union(v.literal('high'), v.literal('moderate'), v.literal('low'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { zones, minEvidenceLevel, limit }) => {
    const evidenceOrder = { high: 3, moderate: 2, low: 1 };
    const minLevel = minEvidenceLevel ? evidenceOrder[minEvidenceLevel] : 1;

    const allInterventions = await ctx.db.query('interventions').collect();

    const matching = allInterventions
      .filter((intervention) => {
        const hasMatchingZone = intervention.targetZones.some((zone) => zones.includes(zone));
        const level = evidenceOrder[intervention.evidenceLevel as keyof typeof evidenceOrder] || 0;
        return hasMatchingZone && level >= minLevel;
      })
      .sort((a, b) => {
        const aLevel = evidenceOrder[a.evidenceLevel as keyof typeof evidenceOrder] || 0;
        const bLevel = evidenceOrder[b.evidenceLevel as keyof typeof evidenceOrder] || 0;
        if (aLevel !== bLevel) return bLevel - aLevel;
        const aMatches = a.targetZones.filter((z) => zones.includes(z)).length;
        const bMatches = b.targetZones.filter((z) => zones.includes(z)).length;
        return bMatches - aMatches;
      });

    return matching.slice(0, limit || matching.length);
  },
});

export const getByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, limit }) => {
    return ctx.db
      .query('interventions')
      .withIndex('by_category', (q) => q.eq('category', category))
      .take(limit || 20);
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit }) => {
    const searchTerm = query.toLowerCase();
    const allInterventions = await ctx.db.query('interventions').collect();
    const matching = allInterventions.filter((intervention) => {
      const titleMatch = intervention.title.toLowerCase().includes(searchTerm);
      const tagMatch = intervention.tags.some((tag) => tag.toLowerCase().includes(searchTerm));
      const categoryMatch = intervention.category.toLowerCase().includes(searchTerm);
      return titleMatch || tagMatch || categoryMatch;
    });
    return matching.slice(0, limit || 10);
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const interventions = await ctx.db.query('interventions').collect();
    const categories = new Set(interventions.map((i) => i.category));
    return Array.from(categories).sort();
  },
});

export const recordEvent = mutation({
  args: {
    userId: v.string(),
    interventionId: v.id('interventions'),
    status: v.union(v.literal('viewed'), v.literal('started'), v.literal('completed')),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { userId, interventionId, status, metadata }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    await ctx.db.insert('intervention_events', {
      userId: user._id,
      interventionId: interventionId.toString(),
      status,
      metadata,
    });

    return { success: true };
  },
});

export const getUserHistory = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    return ctx.db
      .query('intervention_events')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);
  },
});
