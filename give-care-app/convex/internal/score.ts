/**
 * Internal Score Update Functions
 * Actions and mutations for updating user scores from assessments and observations
 */

import { internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { calculateCompositeScore, calculateZoneAverage, normalizeScore, ZoneScores } from "../lib/scoreCalculator";
import { getRiskLevel } from "../lib/sdoh";
import type { ZoneId } from "../lib/sdoh";

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

    // Use top-level fields (with metadata fallback for migration)
    const currentZones = (user.zones as ZoneScores) || ((user.metadata as any)?.zones as ZoneScores) || {};
    const currentScore = user.gcSdohScore || ((user.metadata as any)?.gcSdohScore as number) || 0;

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
    const metadata = user.metadata || {};
    await ctx.db.patch(userId, {
      zones: updatedZones,
      gcSdohScore: newScore,
      riskLevel: riskLevel as any,
      metadata: {
        ...metadata,
        // Store in metadata as any for backward compatibility (not in schema validator)
        zones: updatedZones,
        gcSdohScore: newScore,
        riskLevel,
      } as any,
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
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.number(),
      })
    ),
  },
  handler: async (ctx, { userId, answers }) => {
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Map SDOH questions to zones
    // P1: questions 1-8 (Relationship & Social Support)
    // P3: questions 9-12 (Housing & Environment)
    // P4: questions 13-20 (Financial Resources)
    // P5: questions 21-26 (Legal & Navigation)
    // P6: questions 27-28 (Emotional Wellbeing)

    const p1Answers = answers.slice(0, 8).map((a) => a.value);
    const p3Answers = answers.slice(8, 12).map((a) => a.value);
    const p4Answers = answers.slice(12, 20).map((a) => a.value);
    const p5Answers = answers.slice(20, 26).map((a) => a.value);
    const p6Answers = answers.slice(26, 28).map((a) => a.value);

    const metadata = user.metadata || {};
    const currentZones = (user.zones as ZoneScores) || (metadata.zones as ZoneScores) || {};
    const currentScore = user.gcSdohScore || (metadata.gcSdohScore as number) || 0;

    // Calculate zone scores
    const updatedZones: ZoneScores = {
      ...currentZones,
      P1: calculateZoneAverage(p1Answers),
      P3: calculateZoneAverage(p3Answers),
      P4: calculateZoneAverage(p4Answers),
      P5: calculateZoneAverage(p5Answers),
      P6: calculateZoneAverage(p6Answers),
      // P2 (Physical) not covered by SDOH - inferred from conversation
    };

    // Recalculate composite score
    const newScore = calculateCompositeScore(updatedZones);
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
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.number(),
      })
    ),
  },
  handler: async (ctx, { userId, answers }) => {
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user) {
      throw new Error("User not found");
    }

    // EMA has 3 questions:
    // 1. Stress level (P6 - emotional)
    // 2. Mood (P6 - emotional)
    // 3. Support (P1 - social)

    const p6Answers = [answers[0]?.value, answers[1]?.value].filter((v) => v !== undefined) as number[];
    const p1Answers = [answers[2]?.value].filter((v) => v !== undefined) as number[];

    const metadata = user.metadata || {};
    const currentZones = (user.zones as ZoneScores) || (metadata.zones as ZoneScores) || {};
    const currentScore = user.gcSdohScore || (metadata.gcSdohScore as number) || 0;

    // Update zones (blend with existing if present)
    const updatedZones: ZoneScores = {
      ...currentZones,
    };

    if (p6Answers.length > 0) {
      const newP6 = calculateZoneAverage(p6Answers);
      // Blend: 70% new EMA, 30% existing (if present)
      const existingP6 = currentZones.P6 || 0;
      updatedZones.P6 = existingP6 > 0 
        ? Math.round(newP6 * 0.7 + existingP6 * 0.3)
        : newP6;
    }

    if (p1Answers.length > 0) {
      const newP1 = calculateZoneAverage(p1Answers);
      // Blend: 70% new EMA, 30% existing (if present)
      const existingP1 = currentZones.P1 || 0;
      updatedZones.P1 = existingP1 > 0
        ? Math.round(newP1 * 0.7 + existingP1 * 0.3)
        : newP1;
    }

    // Recalculate composite score
    const newScore = calculateCompositeScore(updatedZones);
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

    const oldScore = user.gcSdohScore || 0;
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
        riskLevel: args.riskLevel,
        lastEMA: args.lastEMA,
        lastSDOH: args.lastSDOH,
      } as any,
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
      const proactiveOk = (metadata as any)?.proactiveOk === true;
      const lastSpikeFollowUpAt = (metadata as any)?.lastSpikeFollowUpAt || 0;
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

