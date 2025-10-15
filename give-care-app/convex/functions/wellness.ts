/**
 * Wellness tracking functions
 * Query and mutate wellness_scores table
 * Implements burnout score trends and pressure zone tracking
 */

import { mutation, query, internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';

// QUERIES

export const getLatestScore = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .order('desc')
      .first();
  },
});

export const getScoreHistory = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;

    return await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
  },
});

export const trend = query({
  args: {
    userId: v.id('users'),
    windowDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.windowDays * 24 * 60 * 60 * 1000;
    const points = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('recordedAt'), cutoff))
      .collect();

    if (!points.length) {
      return { count: 0, average: null, trend: [] };
    }

    const average = points.reduce((sum, p) => sum + p.overallScore, 0) / points.length;

    const trend = points.map((p) => ({
      score: p.overallScore,
      band: p.band,
      timestamp: p.recordedAt,
    }));

    return { count: points.length, average: Math.round(average * 10) / 10, trend };
  },
});

export const getPressureZoneTrends = query({
  args: {
    userId: v.id('users'),
    windowDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.windowDays * 24 * 60 * 60 * 1000;
    const scores = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('recordedAt'), cutoff))
      .collect();

    if (!scores.length) {
      return {};
    }

    // Aggregate pressure zone scores over time
    const zoneAggregates: Record<string, { sum: number; count: number }> = {};

    for (const score of scores) {
      for (const zone of score.pressureZones) {
        if (!zoneAggregates[zone]) {
          zoneAggregates[zone] = { sum: 0, count: 0 };
        }
        const zoneScore = (score.pressureZoneScores as Record<string, number>)?.[zone] || 0;
        zoneAggregates[zone].sum += zoneScore;
        zoneAggregates[zone].count += 1;
      }
    }

    // Calculate averages
    const zoneTrends: Record<string, number> = {};
    for (const [zone, data] of Object.entries(zoneAggregates)) {
      zoneTrends[zone] = Math.round((data.sum / data.count) * 10) / 10;
    }

    return zoneTrends;
  },
});

// MUTATIONS

export const saveScore = internalMutation({
  args: {
    userId: v.id('users'),
    overallScore: v.number(),
    confidence: v.optional(v.number()),
    band: v.optional(v.string()),
    pressureZones: v.array(v.string()),
    pressureZoneScores: v.any(), // Accept any object structure
    assessmentSource: v.optional(v.string()),
    assessmentType: v.optional(v.string()),
    assessmentSessionId: v.optional(v.id('assessmentSessions')),
  },
  handler: async (ctx, args) => {
    const scoreId = await ctx.db.insert('wellnessScores', {
      ...args,
      recordedAt: Date.now(),
    });

    // Update user's burnout score
    await ctx.db.patch(args.userId, {
      burnoutScore: args.overallScore,
      burnoutBand: args.band,
      burnoutConfidence: args.confidence,
      pressureZones: args.pressureZones,
      pressureZoneScores: args.pressureZoneScores,
      updatedAt: Date.now(),
    });

    // Schedule 7-day assessment reminder (Task 1: Revised cadence)
    // Changed from 14 days to 7 days (habit formation research)
    const user = await ctx.db.get(args.userId);
    if (user && user.journeyPhase === 'active') {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const firstName = user.firstName || 'friend';

      await ctx.scheduler.runAfter(
        sevenDays,
        internal.functions.scheduling.sendScheduledMessage,
        {
          userId: args.userId,
          message: `Hi ${firstName}, ready for a quick check-in? It's been a week since your last assessment. (Reply YES when ready)`,
          type: 'assessment_reminder',
        }
      );
    }

    return scoreId;
  },
});
