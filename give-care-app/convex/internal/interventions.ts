/**
 * Internal Intervention Functions
 */

import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { emitEvent } from "../lib/services/eventService";
import { getEffectiveInterventions } from "../lib/services/learningService";

/**
 * Find interventions by zones
 * Uses learning service to rank by effectiveness
 */
export const findByZones = internalQuery({
  args: {
    zones: v.array(v.string()),
  },
  handler: async (ctx, { zones }) => {
    // Get effective interventions using learning service
    const effective = await getEffectiveInterventions(ctx, zones);

    // Get intervention details for effective ones
    const interventionIds = new Set(
      effective.map((e) => e.interventionId).slice(0, 10) // Top 10
    );

    // Also get all interventions for these zones (fallback if no learning data)
    // Parallel queries for each zone - CONVEX_01.md optimization
    const zoneQueries = zones.map(async (zone) => {
      const allMatches = await ctx.db
        .query("intervention_zones")
        .withIndex("by_zone", (q) => q.eq("zone", zone))
        .collect();
      return allMatches.slice(0, 10); // Limit to 10 per zone
    });

    const zoneResults = await Promise.all(zoneQueries);
    for (const matches of zoneResults) {
      for (const match of matches) {
        interventionIds.add(match.interventionId);
      }
    }

    // Get intervention details (parallel queries - CONVEX_01.md optimization)
    const interventionQueries = Array.from(interventionIds).map((id) =>
      ctx.db.get(id as Id<"interventions">)
    );
    const interventionResults = await Promise.all(interventionQueries);

    const interventions = [];
    for (const intervention of interventionResults) {
      if (intervention) {
        const effectiveness = effective.find(
          (e) => e.interventionId === intervention._id
        );
        interventions.push({
          title: intervention.title,
          description: intervention.description,
          category: intervention.category,
          evidenceLevel: intervention.evidenceLevel,
          duration: intervention.duration,
          successRate: effectiveness?.successRate,
        });
      }
    }

    // Sort by success rate if available, then by evidence level
    interventions.sort((a, b) => {
      if (a.successRate !== undefined && b.successRate !== undefined) {
        return b.successRate - a.successRate;
      }
      // Fallback to evidence level
      const evidenceOrder = { high: 3, moderate: 2, low: 1 };
      return (
        evidenceOrder[b.evidenceLevel as keyof typeof evidenceOrder] -
        evidenceOrder[a.evidenceLevel as keyof typeof evidenceOrder]
      );
    });

    return { interventions: interventions.slice(0, 10) }; // Limit to top 10
  },
});

/**
 * Get interventions by IDs
 */
export const getByIds = internalQuery({
  args: {
    interventionIds: v.array(v.string()),
  },
  handler: async (ctx, { interventionIds }) => {
    const interventions = [];
    for (const id of interventionIds) {
      const intervention = await ctx.db.get(id as Id<"interventions">);
      if (intervention) {
        interventions.push({
          title: intervention.title,
          description: intervention.description,
          category: intervention.category,
          evidenceLevel: intervention.evidenceLevel,
          duration: intervention.duration,
          content: intervention.content,
        });
      }
    }
    return { interventions };
  },
});

/**
 * Track intervention event
 * Uses new events table (migrated from intervention_events)
 */
export const trackEvent = internalMutation({
  args: {
    userId: v.id("users"),
    interventionId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, { userId, interventionId, status }) => {
    // Map status to event type
    let eventType: "intervention.try" | "intervention.success" | "intervention.skip";
    if (status === "tried" || status === "viewed") {
      eventType = "intervention.try";
    } else if (status === "helpful" || status === "success") {
      eventType = "intervention.success";
    } else {
      eventType = "intervention.skip";
    }

    // Emit event using event service
    await emitEvent(ctx, userId, eventType, {
      interventionId,
      status,
    });
  },
});

