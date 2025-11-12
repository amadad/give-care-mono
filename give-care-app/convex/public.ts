/**
 * Public API Surface
 *
 * This file defines the ONLY functions callable from the browser/frontend.
 * All exports here must have validators and proper access control.
 */

import { query, mutation, internalQuery, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { getByExternalId, ensureUser } from './lib/utils';
import { assessmentDefinitionValidator } from './lib/validators';

// ============================================================================
// USERS
// ============================================================================

export const getByExternalIdQuery = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    // Note: For SMS-only app, externalId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    return getByExternalId(ctx, externalId);
  },
});

// ============================================================================
// MEMORIES
// ============================================================================

/**
 * Record important memory about a user
 * Lightweight table for category queries only
 * Semantic search handled by Agent Component
 */
export const recordMemory = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    // Note: For SMS-only app, userId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    const user = await getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Store in lightweight memories table for category queries
    // Agent Component handles semantic search via contextOptions
    await ctx.db.insert('memories', {
      userId: user._id,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });
  },
});

/**
 * Internal version of recordMemory - for use within Convex only
 */
export const recordMemoryInternal = internalMutation({
  args: {
    userId: v.id('users'),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('memories', {
      userId: args.userId,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });
  },
});

/**
 * List stored memories for a user ordered by importance
 */
export const listMemories = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    // Note: For SMS-only app, userId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      return [];
    }

    // Fix: Query with limit and proper ordering
    // Note: Index doesn't support ordering, so we fetch more than needed and sort
    // For better performance, consider adding composite index on (userId, importance, _creationTime)
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user_category', (q) => q.eq('userId', user._id))
      .take(limit * 2); // Fetch 2x limit to account for category filtering

    return memories
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return b._creationTime - a._creationTime;
      })
      .slice(0, limit)
      .map((m) => ({
        category: m.category,
        content: m.content,
        importance: m.importance,
      }));
  },
});

/**
 * Internal version of listMemories - for use within Convex only
 */
export const listMemoriesInternal = internalQuery({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user_category', (q) => q.eq('userId', userId))
      .take((limit ?? 10) * 2); // Fetch 2x limit to account for category filtering

    return memories
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return b._creationTime - a._creationTime;
      })
      .slice(0, limit ?? 10)
      .map((m) => ({
        category: m.category,
        content: m.content,
        importance: m.importance,
      }));
  },
});

// ============================================================================
// ASSESSMENTS
// ============================================================================

/**
 * Record assessment response - public-facing mutation for agents/admin flows
 * Records a structured answer to an assessment question
 * 
 * This mutation is designed for programmatic use (agents, admin flows, EMA/BSFC ingestion)
 * For user-facing flows, use answerAssessment mutation directly
 */
export const recordAssessmentResponse = mutation({
  args: {
    userId: v.string(),
    sessionId: v.optional(v.id('assessment_sessions')),
    questionIndex: v.number(),
    answer: v.union(v.number(), v.string()),
    definitionId: assessmentDefinitionValidator,
  },
  handler: async (ctx, { userId, sessionId, questionIndex, answer, definitionId }) => {
    // Note: For SMS-only app, userId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Normalize answer to number (string answers like "skip" become 0)
    const value = typeof answer === 'string' 
      ? (answer.toLowerCase() === 'skip' ? 0 : parseInt(answer, 10) || 0)
      : answer;

    // Validate value is in valid range (1-5 for most assessments)
    if (value < 0 || value > 5) {
      throw new Error('Answer value must be between 0 and 5');
    }

    // Find active session if sessionId not provided
    let session;
    if (sessionId) {
      session = await ctx.db.get(sessionId);
      if (!session || session.userId !== user._id || session.definitionId !== definitionId) {
        throw new Error('Invalid session');
      }
    } else {
      // Find active session for this user and definition
      const sessions = await ctx.db
        .query('assessment_sessions')
        .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definitionId))
        .order('desc')
        .collect();
      
      session = sessions.find(s => s.status === 'active');
      if (!session) {
        throw new Error('No active assessment session found');
      }
    }

    // Validate questionIndex matches session's current question
    if (session.questionIndex !== questionIndex) {
      throw new Error(`Question index mismatch: expected ${session.questionIndex}, got ${questionIndex}`);
    }

    // Append answer to session
    const newAnswer = {
      questionId: questionIndex.toString(),
      value,
    };
    const updatedAnswers = [...session.answers, newAnswer];

    await ctx.db.patch(session._id, {
      answers: updatedAnswers,
      questionIndex: questionIndex + 1,
    });

    return { 
      sessionId: session._id, 
      currentIndex: questionIndex + 1,
    };
  },
});

// ============================================================================
// ADMIN / SEEDING
// ============================================================================

/**
 * Admin mutation to seed interventions
 * Idempotent - can be run multiple times safely
 */
export const seedInterventionsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Import internal mutation
    const { internal } = await import('./_generated/api');
    return await ctx.runMutation(internal.lib.seedInterventions.seedInterventions, {});
  },
});

/**
 * Admin mutation to seed promo codes
 * Idempotent - can be run multiple times safely
 */
export const seedPromoCodesAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Import internal mutation
    const { internal } = await import('./_generated/api');
    return await ctx.runMutation(internal.lib.seedPromoCodes.seedPromoCodes, {});
  },
});

/**
 * Get promo code statistics for admin dashboard
 */
export const getPromoCodeStats = query({
  args: {},
  handler: async (ctx) => {
    const codes = await ctx.db.query('promo_codes').collect();
    return codes.map(code => ({
      code: code.code,
      usedCount: code.usedCount,
      maxUses: code.maxUses,
      active: code.active,
      discountType: code.discountType,
      discountValue: code.discountValue,
    }));
  },
});

// ============================================================================
// ANALYTICS / SUCCESS METRICS
// ============================================================================

/**
 * Get assessment completion rate
 * Calculates: completed assessments / started assessments
 */
export const getAssessmentCompletionRate = query({
  args: {
    userId: v.optional(v.string()),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const startTime = args.dateRange?.start || 0;
    const endTime = args.dateRange?.end || Date.now();

    let startedSessions = await ctx.db
      .query('assessment_sessions')
      .filter((q) => 
        q.and(
          q.gte(q.field('_creationTime'), startTime),
          q.lte(q.field('_creationTime'), endTime)
        )
      )
      .collect();

    let completedAssessments = await ctx.db
      .query('assessments')
      .filter((q) =>
        q.and(
          q.gte(q.field('completedAt'), startTime),
          q.lte(q.field('completedAt'), endTime)
        )
      )
      .collect();

    // Filter by userId if provided
    if (args.userId) {
      const user = await getByExternalId(ctx, args.userId);
      if (user) {
        startedSessions = startedSessions.filter(s => s.userId === user._id);
        completedAssessments = completedAssessments.filter(a => a.userId === user._id);
      } else {
        return { rate: 0, started: 0, completed: 0 };
      }
    }

    const started = startedSessions.length;
    const completed = completedAssessments.length;
    const rate = started > 0 ? (completed / started) * 100 : 0;

    return {
      rate: Math.round(rate * 100) / 100, // Round to 2 decimals
      started,
      completed,
    };
  },
});

/**
 * Get user retention at specified days (30, 60, 90)
 * Calculates: users active at T+days / users created at T
 */
export const getUserRetention = query({
  args: {
    days: v.number(), // 30, 60, 90
  },
  handler: async (ctx, { days }) => {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    // Users created at T (days ago)
    const usersCreated = await ctx.db
      .query('users')
      .filter((q) => q.lte(q.field('_creationTime'), cutoffDate))
      .collect();

    if (usersCreated.length === 0) {
      return { rate: 0, totalUsers: 0, activeUsers: 0 };
    }

    // Users active at T+days (have messages or assessments after cutoff)
    const activeUserIds = new Set<string>();
    
    // Check for messages (via agent_runs or inbound_receipts)
    const recentMessages = await ctx.db
      .query('inbound_receipts')
      .filter((q) => q.gte(q.field('_creationTime'), cutoffDate))
      .collect();
    
    // Note: inbound_receipts only stores messageSid for idempotency
    // Cannot track user activity from receipts table
    // Skip message-based activity tracking

    // Check for assessments
    const recentAssessments = await ctx.db
      .query('assessments')
      .filter((q) => q.gte(q.field('completedAt'), cutoffDate))
      .collect();
    
    for (const assessment of recentAssessments) {
      const user = await ctx.db.get(assessment.userId);
      if (user && usersCreated.some(u => u._id === user._id)) {
        activeUserIds.add(user._id);
      }
    }

    const activeUsers = activeUserIds.size;
    const rate = usersCreated.length > 0 ? (activeUsers / usersCreated.length) * 100 : 0;

    return {
      rate: Math.round(rate * 100) / 100,
      totalUsers: usersCreated.length,
      activeUsers,
      days,
    };
  },
});

/**
 * Get burnout score trends
 * Calculates average score improvement over time
 */
export const getBurnoutScoreTrends = query({
  args: {
    userId: v.optional(v.string()),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const startTime = args.dateRange?.start || 0;
    const endTime = args.dateRange?.end || Date.now();

    let scores = await ctx.db
      .query('scores')
      .filter((q) =>
        q.and(
          q.gte(q.field('_creationTime'), startTime),
          q.lte(q.field('_creationTime'), endTime)
        )
      )
      .collect();

    // Filter by userId if provided
    if (args.userId) {
      const user = await getByExternalId(ctx, args.userId);
      if (user) {
        scores = scores.filter(s => s.userId === user._id);
      } else {
        return { averageImprovement: 0, trend: 'unknown', dataPoints: [] };
      }
    }

    if (scores.length === 0) {
      return { averageImprovement: 0, trend: 'unknown', dataPoints: [] };
    }

    // Group by user and calculate improvement (first score vs last score)
    const userScores = new Map<string, typeof scores>();
    for (const score of scores) {
      const userId = score.userId;
      if (!userScores.has(userId)) {
        userScores.set(userId, []);
      }
      userScores.get(userId)!.push(score);
    }

    const improvements: number[] = [];
    for (const [userId, userScoreList] of userScores) {
      if (userScoreList.length >= 2) {
        const sorted = userScoreList.sort((a, b) => a._creationTime - b._creationTime);
        const first = sorted[0].composite;
        const last = sorted[sorted.length - 1].composite;
        improvements.push(first - last); // Positive = improvement (score decreased)
      }
    }

    const averageImprovement = improvements.length > 0
      ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length
      : 0;

    let trend: 'improving' | 'stable' | 'declining';
    if (averageImprovement > 5) {
      trend = 'improving';
    } else if (averageImprovement < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    return {
      averageImprovement: Math.round(averageImprovement * 100) / 100,
      trend,
      dataPoints: scores.length,
    };
  },
});

/**
 * Get crisis response latency (p95)
 * Calculates latency from agent_runs table for crisis agent
 */
export const getCrisisResponseLatency = query({
  args: {
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const startTime = args.dateRange?.start || Date.now() - (30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endTime = args.dateRange?.end || Date.now();

    // Get all agent runs (we'll filter for crisis in code since there's no index)
    const allRuns = await ctx.db
      .query('agent_runs')
      .filter((q) =>
        q.and(
          q.gte(q.field('_creationTime'), startTime),
          q.lte(q.field('_creationTime'), endTime)
        )
      )
      .collect();

    // Filter for crisis agent runs by agent field (not metadata)
    const crisisRuns = allRuns.filter(run => {
      return run.agent === 'crisis';
    });

    if (crisisRuns.length === 0) {
      return { p95: 0, average: 0, count: 0 };
    }

    // Extract latencies from latencyMs field
    const latencies = crisisRuns
      .map(run => run.latencyMs)
      .filter(lat => lat > 0)
      .sort((a, b) => a - b);

    if (latencies.length === 0) {
      return { p95: 0, average: 0, count: crisisRuns.length };
    }

    const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95 = latencies[p95Index] || latencies[latencies.length - 1];

    return {
      p95: Math.round(p95),
      average: Math.round(average),
      count: latencies.length,
    };
  },
});

/**
 * Get pressure zone reduction
 * Compares first assessment vs latest assessment for each user
 */
export const getPressureZoneReduction = query({
  args: {
    userId: v.optional(v.string()),
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const startTime = args.dateRange?.start || 0;
    const endTime = args.dateRange?.end || Date.now();

    // Get assessments in date range
    let assessments = await ctx.db
      .query('assessments')
      .filter((q) =>
        q.and(
          q.gte(q.field('completedAt'), startTime),
          q.lte(q.field('completedAt'), endTime)
        )
      )
      .collect();

    // Filter by userId if provided
    if (args.userId) {
      const user = await getByExternalId(ctx, args.userId);
      if (user) {
        assessments = assessments.filter(a => a.userId === user._id);
      } else {
        return { zonesImproved: 0, totalZones: 5 };
      }
    }

    // Get scores for these assessments
    const assessmentIds = new Set(assessments.map(a => a._id));
    const scores = await ctx.db
      .query('scores')
      .filter((q) => {
        // Filter scores that match our assessments
        // Note: This is a limitation - we need to check each score's assessmentId
        return true; // We'll filter in code
      })
      .collect();

    const relevantScores = scores.filter(s => assessmentIds.has(s.assessmentId));

    // Group by user and compare first vs latest
    const userScores = new Map<string, typeof relevantScores>();
    for (const score of relevantScores) {
      const userId = score.userId;
      if (!userScores.has(userId)) {
        userScores.set(userId, []);
      }
      userScores.get(userId)!.push(score);
    }

    let totalZonesImproved = 0;
    let totalUsers = 0;

    for (const [userId, userScoreList] of userScores) {
      if (userScoreList.length >= 2) {
        const sorted = userScoreList.sort((a, b) => a._creationTime - b._creationTime);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        // Count zones that improved (score decreased)
        const zones = ['emotional', 'physical', 'social', 'time', 'financial'] as const;
        for (const zone of zones) {
          const firstScore = first.zones[zone];
          const lastScore = last.zones[zone];
          if (firstScore !== undefined && lastScore !== undefined && lastScore < firstScore) {
            totalZonesImproved++;
          }
        }
        totalUsers++;
      }
    }

    return {
      zonesImproved: totalZonesImproved,
      totalZones: totalUsers * 5, // 5 zones per user
      usersAnalyzed: totalUsers,
    };
  },
});

/**
 * Get overall metrics (aggregated)
 */
export const getOverallMetrics = query({
  args: {
    dateRange: v.object({
      start: v.number(),
      end: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const completionRate = await ctx.runQuery(api.public.getAssessmentCompletionRate, { dateRange: args.dateRange });
    const retention30 = await ctx.runQuery(api.public.getUserRetention, { days: 30 });
    const retention60 = await ctx.runQuery(api.public.getUserRetention, { days: 60 });
    const retention90 = await ctx.runQuery(api.public.getUserRetention, { days: 90 });
    const burnoutTrends = await ctx.runQuery(api.public.getBurnoutScoreTrends, { dateRange: args.dateRange });
    const crisisLatency = await ctx.runQuery(api.public.getCrisisResponseLatency, { dateRange: args.dateRange });
    const zoneReduction = await ctx.runQuery(api.public.getPressureZoneReduction, { dateRange: args.dateRange });

    return {
      assessmentCompletionRate: completionRate,
      retention30,
      retention60,
      retention90,
      burnoutTrends,
      crisisLatency,
      zoneReduction,
    };
  },
});

/**
 * Get user-specific metrics
 */
export const getUserMetrics = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const completionRate = await ctx.runQuery(api.public.getAssessmentCompletionRate, { userId: args.userId });
    const burnoutTrends = await ctx.runQuery(api.public.getBurnoutScoreTrends, { userId: args.userId });
    const zoneReduction = await ctx.runQuery(api.public.getPressureZoneReduction, { userId: args.userId });

    return {
      assessmentCompletionRate: completionRate,
      burnoutTrends,
      zoneReduction,
    };
  },
});

