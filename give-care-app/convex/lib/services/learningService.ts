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
  const events = await ctx.db
    .query("events")
    .withIndex("by_type_time", (q) => q.eq("type", "intervention.success"))
    .order("desc")
    .take(5000) // CONVEX_01.md: "Only use .collect with a small number"
    .collect();

  // Also get intervention.try events to calculate success rate
  const tryEvents = await ctx.db
    .query("events")
    .withIndex("by_type_time", (q) => q.eq("type", "intervention.try"))
    .order("desc")
    .take(5000)
    .collect();

  // Map events to InterventionEvent format
  const interventionEvents: InterventionEvent[] = [];
  
  // Process success events
  for (const event of events) {
    const payload = event.payload as any;
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
      const p = e.payload as any;
      return `${p?.interventionId}:${p?.zone}:${e.userId}`;
    })
  );

  for (const event of tryEvents) {
    const payload = event.payload as any;
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

