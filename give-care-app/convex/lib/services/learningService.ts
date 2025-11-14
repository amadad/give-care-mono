/**
 * Learning Service
 * Convex-aware service for learning loop operations
 */

import { QueryCtx } from "../../_generated/server";
import {
  analyzeInterventionEffectiveness,
  rankInterventionsForZones,
  type InterventionEvent,
} from "../domain/learning";

/**
 * Get effective interventions for zones
 * Uses learning loop to rank interventions by success rate
 */
export async function getEffectiveInterventions(
  ctx: QueryCtx,
  zones: string[]
): Promise<Array<{ interventionId: string; zone: string; successRate: number }>> {
  // Query events table for intervention.success events
  const allEvents = await ctx.db
    .query("events")
    .withIndex("by_type", (q) => q.eq("type", "intervention.success"))
    .collect();
  // Filter and limit in code (CONVEX_01.md: filter in code for readability)
  const events = allEvents
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 5000);

  // Also get intervention.try events to calculate success rate
  const allTryEvents = await ctx.db
    .query("events")
    .withIndex("by_type", (q) => q.eq("type", "intervention.try"))
    .collect();
  // Filter and limit in code
  const tryEvents = allTryEvents
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 5000);

  // Map events to InterventionEvent format
  const interventionEvents: InterventionEvent[] = [];
  
  // Process success events
  for (const event of events) {
    const payload = event.payload;
    if (payload?.interventionId && payload?.zone) {
      interventionEvents.push({
        interventionId: payload.interventionId,
        zone: payload.zone,
        success: true,
        timestamp: event._creationTime,
      });
    }
  }

  // Process try events (mark as not successful if no corresponding success)
  const successMap = new Set(
    events.map((e) => {
      const p = e.payload;
      return `${p?.interventionId}:${p?.zone}:${e.userId}`;
    })
  );

  for (const event of tryEvents) {
    const payload = event.payload;
    if (payload?.interventionId && payload?.zone) {
      const key = `${payload.interventionId}:${payload.zone}:${event.userId}`;
      if (!successMap.has(key)) {
        interventionEvents.push({
          interventionId: payload.interventionId,
          zone: payload.zone,
          success: false,
          timestamp: event._creationTime,
        });
      }
    }
  }

  // Analyze effectiveness using domain logic
  const effectiveness = analyzeInterventionEffectiveness(interventionEvents);

  // Rank for given zones
  const ranked = rankInterventionsForZones(effectiveness, zones);

  return ranked.map((e) => ({
    interventionId: e.interventionId,
    zone: e.zone,
    successRate: e.successRate,
  }));
}

