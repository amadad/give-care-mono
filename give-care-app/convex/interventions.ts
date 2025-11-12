/**
 * Intervention Queries and Matching
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

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
        .collect();

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

