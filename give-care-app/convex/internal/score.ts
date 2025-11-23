/**
 * Internal Score Update Functions
 * Actions and mutations for updating user scores from assessments and observations
 */

import { internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { calculateCompositeScore, normalizeScore, ZoneScores } from "../lib/scoreCalculator";
import { getRiskLevel } from "../lib/sdoh";
import { getUserMetadata } from "../lib/utils";
import type { ZoneId } from "../lib/sdoh";

const zonesValidator = v.object({
  P1: v.optional(v.number()),
  P2: v.optional(v.number()),
  P3: v.optional(v.number()),
  P4: v.optional(v.number()),
  P5: v.optional(v.number()),
  P6: v.optional(v.number()),
});

/**
 * Update a specific zone score
 */
export const updateZone = internalMutation({
  args: {
    userId: v.id("users"),
    zone: v.string(),
    value: v.number(),
  },
  handler: async (ctx, { userId, zone, value }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const metadata = getUserMetadata(user);
    // Use top-level fields (with metadata fallback for migration)
    const currentZones = (user.zones as ZoneScores | undefined)
      ?? (metadata.zones as ZoneScores | undefined)
      ?? {};
    const currentScore = user.gcSdohScore ?? (metadata.gcSdohScore) ?? 0;

    // Update zone
    const updatedZones: ZoneScores = {
      ...currentZones,
      [zone]: normalizeScore(value),
    };

    // Recalculate composite score
    const newScore = calculateCompositeScore(updatedZones);
    const riskLevel = getRiskLevel(newScore);

    // Record score history
    await ctx.db.insert("score_history", {
      userId,
      oldScore: currentScore,
      newScore,
      zones: updatedZones,
      trigger: "observation",
      timestamp: Date.now(),
    });

    // Update user (top-level fields + metadata for backward compatibility)
    await ctx.db.patch(userId, {
      zones: updatedZones,
      gcSdohScore: newScore,
      riskLevel: riskLevel as any,
      metadata: {
        ...metadata,
        zones: updatedZones,
        gcSdohScore: newScore,
        riskLevel,
      },
    });

    return { score: newScore, riskLevel, zones: updatedZones };
  },
});

/**
 * Update scores from SDOH-28 assessment (Action wrapper)
 * Maps 28 questions to P1 (8), P3 (4), P4 (8), P5 (6), P6 (2)
 */
export const updateFromSDOH = internalAction({
  args: {
    userId: v.id("users"),
    zones: zonesValidator,
    gcBurnout: v.number(),
  },
  handler: async (ctx, { userId, zones, gcBurnout }) => {
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    const metadata = getUserMetadata(user);
    const currentZones = (user.zones as ZoneScores | undefined)
      ?? (metadata.zones as ZoneScores | undefined)
      ?? {};
    const currentScore = user.gcSdohScore ?? (metadata.gcSdohScore) ?? 0;

    // Merge computed zones (respect existing P2 if assessment doesn't cover it)
    const updatedZones: ZoneScores = { ...currentZones };
    for (const [zone, value] of Object.entries(zones)) {
      if (typeof value === "number") {
        updatedZones[zone as keyof ZoneScores] = normalizeScore(value);
      }
    }

    // Use canonical burnout score from assessment results
    const newScore = normalizeScore(gcBurnout);
    const riskLevel = getRiskLevel(newScore);

    // Update user and record score history in single transaction
    await ctx.runMutation(internal.internal.score.updateUserScore, {
      userId,
      zones: updatedZones,
      gcSdohScore: newScore,
      riskLevel,
      lastSDOH: Date.now(),
      trigger: "sdoh",
    });

    return { score: newScore, riskLevel, zones: updatedZones };
  },
});

/**
 * Update scores from EMA assessment (Action wrapper)
 * EMA updates P6 (emotional) + P1 (social support)
 */
export const updateFromEMA = internalAction({
  args: {
    userId: v.id("users"),
    zones: zonesValidator,
    gcBurnout: v.number(),
  },
  handler: async (ctx, { userId, zones, gcBurnout }) => {
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    const metadata = getUserMetadata(user);
    const currentZones = (user.zones as ZoneScores | undefined)
      ?? (metadata.zones as ZoneScores | undefined)
      ?? {};
    const currentScore = user.gcSdohScore ?? (metadata.gcSdohScore) ?? 0;

    // Merge computed zones from EMA (preserve other zones)
    const updatedZones: ZoneScores = { ...currentZones };
    for (const [zone, value] of Object.entries(zones)) {
      if (typeof value === "number") {
        updatedZones[zone as keyof ZoneScores] = normalizeScore(value);
      }
    }

    const newScore = normalizeScore(gcBurnout);
    const riskLevel = getRiskLevel(newScore);

    // Update user and record score history in single transaction
    await ctx.runMutation(internal.internal.score.updateUserScore, {
      userId,
      zones: updatedZones,
      gcSdohScore: newScore,
      riskLevel,
      lastEMA: Date.now(),
      trigger: "ema",
    });

    return { score: newScore, riskLevel, zones: updatedZones };
  },
});

/**
 * Helper mutation: Insert score history
 */
export const insertScoreHistory = internalMutation({
  args: {
    userId: v.id("users"),
    oldScore: v.number(),
    newScore: v.number(),
    zones: v.any(),
    trigger: v.union(v.literal("ema"), v.literal("sdoh"), v.literal("observation")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("score_history", {
      userId: args.userId,
      oldScore: args.oldScore,
      newScore: args.newScore,
      zones: args.zones,
      trigger: args.trigger,
      timestamp: Date.now(),
    });
  },
});

/**
 * Check if user has crisis in last N days
 */
async function hasRecentCrisis(ctx: any, userId: any, days: number): Promise<boolean> {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  // Limit to recent 100 events to prevent unbounded collection
  // Filter in code since we need to check createdAt >= threshold
  const recentCrisis = await ctx.db
    .query("guardrail_events")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(100); // Safety limit

  return recentCrisis.some(
    (event) => event.type === "crisis" && event.createdAt >= threshold
  );
}

/**
 * Helper mutation: Update user score fields
 * Detects stress spikes and schedules follow-ups if conditions met
 * Also records score history in the same transaction for atomicity
 */
export const updateUserScore = internalMutation({
  args: {
    userId: v.id("users"),
    zones: v.any(),
    gcSdohScore: v.number(),
    riskLevel: v.string(),
    lastEMA: v.optional(v.number()),
    lastSDOH: v.optional(v.number()),
    trigger: v.optional(v.union(v.literal("ema"), v.literal("sdoh"), v.literal("observation"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const oldScore = user.gcSdohScore ?? 0;
    const newScore = args.gcSdohScore;
    const delta = newScore - oldScore;

    const metadata = user.metadata || {};
    
    // Record score history in the same transaction (if trigger provided)
    if (args.trigger) {
      await ctx.db.insert("score_history", {
        userId: args.userId,
        oldScore,
        newScore,
        zones: args.zones,
        trigger: args.trigger,
        timestamp: Date.now(),
      });
    }
    
    await ctx.db.patch(args.userId, {
      // Top-level fields
      gcSdohScore: args.gcSdohScore,
      zones: args.zones,
      riskLevel: args.riskLevel as any,
      lastEMA: args.lastEMA,
      lastSDOH: args.lastSDOH,
      // Also in metadata for backward compatibility (not in schema validator)
      metadata: {
        ...metadata,
        zones: args.zones,
        gcSdohScore: args.gcSdohScore,
        riskLevel: args.riskLevel as any,
        lastEMA: args.lastEMA,
        lastSDOH: args.lastSDOH,
      },
    });

    // Check for stress spike (delta >= 20) and schedule follow-up if conditions met
    // Feature flag: FF_SPIKE_FOLLOWUPS (check env var)
    const spikeFollowupsEnabled = process.env.FF_SPIKE_FOLLOWUPS === "true";
    
    if (
      spikeFollowupsEnabled &&
      delta >= 20 &&
      newScore > oldScore // Only if score increased
    ) {
      // Check conditions: no crisis in 7d, proactiveOk = true, cooldown >= 7d
      const hasCrisis = await hasRecentCrisis(ctx, args.userId, 7);
      const proactiveOk = metadata.proactiveOk === true;
      const lastSpikeFollowUpAt = metadata.lastSpikeFollowUpAt || 0;
      const cooldownMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      const cooldownMet = Date.now() - lastSpikeFollowUpAt >= cooldownMs;

      if (!hasCrisis && proactiveOk && cooldownMet) {
        // Schedule spike follow-up (ask-first pattern)
        await ctx.scheduler.runAfter(
          0, // Immediate
          internal.internal.sms.sendScoreSpikeFollowUp,
          {
            userId: args.userId,
            oldScore,
            newScore,
            zones: args.zones,
          }
        );
      }
    }
  },
});
