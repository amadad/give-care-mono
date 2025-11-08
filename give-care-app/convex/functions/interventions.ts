import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';

// Get interventions by BSFC pressure zones for assessment agent
export const getByZones = query({
  args: {
    zones: v.array(v.string()),
    minEvidenceLevel: v.optional(v.union(v.literal('high'), v.literal('moderate'), v.literal('low'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { zones, minEvidenceLevel, limit }) => {
    const evidenceOrder = { high: 3, moderate: 2, low: 1 };
    const minLevel = minEvidenceLevel ? evidenceOrder[minEvidenceLevel] : 1;

    // Safe to use .collect() here: interventions table is small (~20 entries, bounded by seed data)
    const allInterventions = await ctx.db
      .query('interventions')
      .collect();

    const matching = allInterventions
      .filter(intervention => {
        const hasMatchingZone = intervention.targetZones.some(zone => zones.includes(zone));
        const interventionLevel = evidenceOrder[intervention.evidenceLevel as keyof typeof evidenceOrder] || 0;
        const meetsEvidence = interventionLevel >= minLevel;
        return hasMatchingZone && meetsEvidence;
      })
      .sort((a, b) => {
        const aLevel = evidenceOrder[a.evidenceLevel as keyof typeof evidenceOrder] || 0;
        const bLevel = evidenceOrder[b.evidenceLevel as keyof typeof evidenceOrder] || 0;
        if (aLevel !== bLevel) return bLevel - aLevel;
        const aMatches = a.targetZones.filter(z => zones.includes(z)).length;
        const bMatches = b.targetZones.filter(z => zones.includes(z)).length;
        return bMatches - aMatches;
      });

    return matching.slice(0, limit || matching.length);
  },
});

/**
 * Get interventions by category
 */
export const getByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, limit }) => {
    const interventions = await ctx.db
      .query('interventions')
      .withIndex('by_category', (q) => q.eq('category', category))
      .take(limit || 20);

    return interventions;
  },
});

/**
 * Search interventions by tags or title
 */
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit }) => {
    const searchTerm = query.toLowerCase();

    // Safe to use .collect() here: interventions table is small (~20 entries, bounded by seed data)
    const allInterventions = await ctx.db
      .query('interventions')
      .collect();

    const matching = allInterventions.filter(intervention => {
      const titleMatch = intervention.title.toLowerCase().includes(searchTerm);
      const tagMatch = intervention.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const categoryMatch = intervention.category.toLowerCase().includes(searchTerm);

      return titleMatch || tagMatch || categoryMatch;
    });

    return matching.slice(0, limit || 10);
  },
});

/**
 * Get all available categories
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    // Safe to use .collect() here: interventions table is small (~20 entries, bounded by seed data)
    const interventions = await ctx.db.query('interventions').collect();
    const categories = new Set(interventions.map(i => i.category));
    return Array.from(categories).sort();
  },
});

/**
 * Record when user views/starts an intervention
 */
export const recordEvent = mutation({
  args: {
    userId: v.string(),
    interventionId: v.id('interventions'),
    status: v.union(v.literal('viewed'), v.literal('started'), v.literal('completed')),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { userId, interventionId, status, metadata }) => {
    // Get user ID from externalId
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

/**
 * Get user's intervention history
 */
export const getUserHistory = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Get user ID from externalId
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    // User event history: using .take(100) to bound results per user
    // Most users will have <100 events; for power users, show most recent
    const events = await ctx.db
      .query('intervention_events')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);

    return events;
  },
});
