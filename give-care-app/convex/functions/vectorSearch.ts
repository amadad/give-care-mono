/**
 * Vector Search for Semantic Intervention Matching (Task 2)
 *
 * Uses Convex native vector search for fast (<50ms), free semantic matching.
 * Replaces static ZONE_INTERVENTIONS mapping with dynamic similarity search.
 *
 * NOTE: Only actions use "use node" directive - queries run in Convex runtime
 */

import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';

/**
 * Semantic search for interventions using vector similarity
 *
 * @param query - User query or description of need
 * @param limit - Max results to return (default: 5)
 * @param pressure_zone - Optional filter by pressure zone
 * @returns Ranked interventions with similarity scores
 */
export const searchInterventions = internalAction({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    pressureZone: v.optional(v.string()), // Optional filter
  },
  handler: async (ctx, args) => {
    "use node";

    const limit = args.limit || 5;

    // Generate embedding for user query
    const queryEmbedding = await ctx.runAction(
      internal.functions.embeddings.generateEmbedding,
      { text: args.query }
    );

    // Vector search with filters
    const results = await ctx.vectorSearch('knowledgeBase', 'by_embedding', {
      vector: queryEmbedding,
      limit: limit * 2, // Get more candidates for post-filtering
      filter: (q) => {
        // Base filters: active status, English language
        let baseFilter = q.and(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('language'), 'en')
        );

        // Optional: filter by pressure zone if provided
        if (args.pressureZone) {
          // Note: pressureZones is an array, so we need to check if it contains the value
          // Convex doesn't have array.includes in filters, so we'll post-filter
          return baseFilter;
        }

        return baseFilter;
      },
    });

    // Fetch full documents with similarity scores
    const interventions = [];
    for (const result of results) {
      const doc = await ctx.runQuery(internal.functions.vectorSearch.getKnowledgeBaseById, {
        id: result._id,
      });

      if (!doc) continue;

      // Post-filter by pressure zone if specified
      if (args.pressureZone && !doc.pressureZones.includes(args.pressureZone)) {
        continue;
      }

      interventions.push({
        ...doc,
        score: result._score, // Similarity score (0-1)
      });

      if (interventions.length >= limit) break;
    }

    return interventions;
  },
});

/**
 * Search interventions by burnout level (maps to pressure zones)
 *
 * @param burnoutBand - User's burnout level (thriving, healthy, moderate, high, crisis)
 * @param query - Optional query to refine results
 * @param limit - Max results (default: 5)
 */
export const searchByBurnoutLevel = internalAction({
  args: {
    burnoutBand: v.string(),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    "use node";

    const limit = args.limit || 5;

    // Map burnout band to pressure zones priority
    const zonePriority: Record<string, string[]> = {
      crisis: ['emotional', 'self_care', 'physical', 'social', 'financial', 'caregiver_tasks', 'time_management'],
      high: ['self_care', 'emotional', 'physical', 'social', 'time_management', 'caregiver_tasks', 'financial'],
      moderate: ['time_management', 'self_care', 'social', 'physical', 'caregiver_tasks', 'emotional', 'financial'],
      healthy: ['social', 'time_management', 'self_care', 'physical', 'caregiver_tasks', 'emotional', 'financial'],
      thriving: ['social', 'emotional', 'self_care', 'physical', 'time_management', 'caregiver_tasks', 'financial'],
    };

    const zones = zonePriority[args.burnoutBand] || zonePriority.moderate;

    // Build search query based on burnout level
    const burnoutQueries: Record<string, string> = {
      crisis: 'Immediate emotional support, crisis resources, respite care, mental health services',
      high: 'Stress reduction, self-care strategies, emotional support, respite care, practical help',
      moderate: 'Time management, routine optimization, support groups, self-care tips, work-life balance',
      healthy: 'Social connections, preventive care, caregiver community, wellness activities',
      thriving: 'Community engagement, peer support, advanced caregiving strategies, sharing experiences',
    };

    const searchQuery = args.query || burnoutQueries[args.burnoutBand] || 'general caregiver support';

    // Search with priority on top zones
    const interventions = await ctx.runAction(internal.functions.vectorSearch.searchInterventions, {
      query: searchQuery,
      limit: limit * 2, // Get more candidates
    });

    // Re-rank by zone priority + similarity score
    const ranked = interventions.map(int => {
      // Find highest priority zone that matches
      const zonePriorityScore = Math.max(
        ...int.pressureZones.map(zone => {
          const priority = zones.indexOf(zone);
          return priority === -1 ? 999 : priority;
        })
      );

      return {
        ...int,
        zonePriorityScore,
        combinedScore: int.score * 0.7 + (1 - zonePriorityScore / zones.length) * 0.3,
      };
    });

    // Sort by combined score and return top results
    return ranked
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit);
  },
});

/**
 * Get knowledge base entry by ID (internal query)
 */
export const getKnowledgeBaseById = internalQuery({
  args: { id: v.id('knowledgeBase') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Search by multiple pressure zones (OR logic)
 *
 * @param pressureZones - Array of pressure zones to search
 * @param query - Optional query to refine results
 * @param limit - Max results (default: 5)
 */
export const searchByPressureZones = internalAction({
  args: {
    pressureZones: v.array(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    "use node";

    const limit = args.limit || 5;

    // Build query from pressure zones
    const zoneLabels: Record<string, string> = {
      emotional: 'emotional support, mental health, stress, anxiety, depression',
      self_care: 'self-care, personal wellness, rest, relaxation, hobbies',
      physical: 'physical health, exercise, sleep, fatigue, chronic pain',
      social: 'social connections, isolation, support groups, community',
      financial: 'financial assistance, insurance, medical bills, costs',
      caregiver_tasks: 'caregiving tasks, ADLs, medical management, coordination',
      time_management: 'time management, scheduling, routines, work-life balance',
    };

    const queryParts = args.pressureZones.map(zone => zoneLabels[zone] || zone);
    const searchQuery = args.query
      ? `${args.query} ${queryParts.join(' ')}`
      : queryParts.join(', ');

    // Search across all zones
    const interventions = await ctx.runAction(internal.functions.vectorSearch.searchInterventions, {
      query: searchQuery,
      limit: limit * 2,
    });

    // Filter to only include interventions matching at least one pressure zone
    const filtered = interventions.filter(int =>
      int.pressureZones.some(zone => args.pressureZones.includes(zone))
    );

    return filtered.slice(0, limit);
  },
});
