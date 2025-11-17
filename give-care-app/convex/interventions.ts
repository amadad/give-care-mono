/**
 * Intervention Queries and Matching
 */

import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Evidence level ranking (lower = higher priority)
 */
function evidenceRank(level: string): number {
  if (level === "high") return 0;
  if (level === "moderate") return 1;
  return 2;
}

/**
 * Parse duration string to minutes for sorting
 */
function durationMinutes(duration: string): number {
  const match = /(\d+)(?:-(\d+))?\s*min/.exec(duration || "");
  if (!match) return 999;
  if (match[2]) {
    return (Number(match[1]) + Number(match[2])) / 2;
  }
  return Number(match[1]);
}

/**
 * Find interventions by zones (internal query)
 * Deduplicates by category, sorts by evidence level and duration
 */
export const findInterventions = internalQuery({
  args: {
    zones: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { zones, limit = 3 }) => {
    const byZone = new Map<string, any[]>();

    // Collect interventions for each zone
    // Limit per zone to prevent unbounded collection (safety limit)
    for (const zone of zones) {
      const matches = await ctx.db
        .query("intervention_zones")
        .withIndex("by_zone", (q) => q.eq("zone", zone))
        .take(50); // Safety limit per zone

      for (const match of matches) {
        const intervention = await ctx.db.get(match.interventionId);
        if (intervention) {
          const category = intervention.category;
          const arr = byZone.get(category) ?? [];
          arr.push(intervention);
          byZone.set(category, arr);
        }
      }
    }

    // Deduplicate by category: pick best from each category
    const deduplicated = Array.from(byZone.values()).map((list) =>
      list.sort((a, b) => {
        const evidenceDiff = evidenceRank(a.evidenceLevel) - evidenceRank(b.evidenceLevel);
        if (evidenceDiff !== 0) return evidenceDiff;
        return durationMinutes(a.duration) - durationMinutes(b.duration);
      })[0]
    );

    // Return top N
    return deduplicated.slice(0, limit);
  },
});

/**
 * Get interventions by zones (public query for testing)
 */
export const getInterventionsByZones = query({
  args: {
    zones: v.array(v.string()),
  },
  handler: async (ctx, { zones }) => {
    const interventionIds = new Set<string>();

    for (const zone of zones) {
      const matches = await ctx.db
        .query("intervention_zones")
        .withIndex("by_zone", (q) => q.eq("zone", zone))
        .take(50); // Safety limit per zone

      for (const match of matches) {
        interventionIds.add(match.interventionId);
      }
    }

    const interventions = [];
    for (const id of interventionIds) {
      const intervention = await ctx.db.get(id as any);
      if (intervention) {
        interventions.push(intervention);
      }
    }

    return { interventions };
  },
});

