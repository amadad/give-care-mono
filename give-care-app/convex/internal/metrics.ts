import { internalMutation, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

const DAY_MS = 86_400_000;
const BATCH_SIZE = 200;

// Daily metrics aggregation (cron-based, replaces on-demand .collect())
export const aggregateDailyMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    console.info(`[metrics] Starting daily aggregation for ${today}`);

    await ctx.runMutation(internal.internal.metrics.computeDailyMetrics, { date: today });
    await ctx.runMutation(internal.internal.metrics.computeSubscriptionMetrics, {});
    await ctx.runMutation(internal.internal.metrics.computeJourneyFunnel, {});
    await ctx.runMutation(internal.internal.metrics.computeBurnoutDistribution, {});

    const duration = Date.now() - startTime;
    console.info(`[metrics] Completed daily aggregation in ${duration}ms`);
  },
});

export const computeDailyMetrics = internalMutation({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    console.info(`[metrics:daily] Computing daily metrics for ${date}`);
    const now = Date.now();
    const dayAgo = now - DAY_MS;

    // Count users using pagination (no .collect())
    let totalUsers = 0;
    let newUsersToday = 0;
    let userCursor: Id<'users'> | undefined = undefined;

    while (true) {
      const batch = await ctx.db
        .query('users')
        .order('desc')
        .paginate({ cursor: userCursor ? userCursor.toString() : null, numItems: BATCH_SIZE });

      totalUsers += batch.page.length;
      newUsersToday += batch.page.filter(u => u._creationTime >= dayAgo).length;

      if (!batch.continueCursor) break;
      userCursor = batch.page[batch.page.length - 1]._id;
    }

    // Active users via indexed sessions query
    const activeUserIds = new Set<Id<'users'>>();
    let sessionCursor: string | null = null;

    while (true) {
      const batch = await ctx.db
        .query('sessions')
        .withIndex('by_lastSeen', (q) => q.gte('lastSeen', dayAgo))
        .paginate({ cursor: sessionCursor, numItems: BATCH_SIZE });

      for (const session of batch.page) {
        activeUserIds.add(session.userId);
      }

      if (!batch.continueCursor) break;
      sessionCursor = batch.continueCursor;
    }
    const activeUsers = activeUserIds.size;

    // Message counts using indexed query by creation time
    let totalMessages = 0;
    let inboundMessages = 0;
    let outboundMessages = 0;
    let messageCursor: string | null = null;

    while (true) {
      const batch = await ctx.db
        .query('messages')
        .order('desc')
        .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
        .paginate({ cursor: messageCursor, numItems: BATCH_SIZE });

      totalMessages += batch.page.length;
      inboundMessages += batch.page.filter(m => m.direction === 'inbound').length;
      outboundMessages += batch.page.filter(m => m.direction === 'outbound').length;

      if (!batch.continueCursor) break;
      messageCursor = batch.continueCursor;
    }

    // Average burnout score (latest per user) - using take() not collect()
    const scores = await ctx.db.query('scores').order('desc').take(5000);
    const latestScores = new Map<Id<'users'>, number>();
    for (const score of scores) {
      if (!latestScores.has(score.userId)) {
        latestScores.set(score.userId, score.composite);
      }
    }
    const avgBurnoutScore = latestScores.size > 0
      ? Array.from(latestScores.values()).reduce((sum, v) => sum + v, 0) / latestScores.size
      : 0;

    // Crisis alerts - bounded by time filter
    const alerts = await ctx.db
      .query('alerts')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .collect(); // Acceptable: bounded by 24h time window
    const crisisAlerts = alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;

    // Response latency from agent runs - using take() not collect()
    const runs = await ctx.db
      .query('agent_runs')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .take(1000);
    const latencies = runs.map(r => r.latencyMs);
    const avgResponseLatencyMs = latencies.length > 0
      ? latencies.reduce((sum, v) => sum + v, 0) / latencies.length
      : 0;
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const p95ResponseLatencyMs = latencies.length > 0
      ? sortedLatencies[Math.floor(latencies.length * 0.95)]
      : 0;

    // Upsert daily metrics
    const existing = await ctx.db
      .query('metrics_daily')
      .withIndex('by_date', (q) => q.eq('date', date))
      .unique();

    const metrics = {
      date,
      totalUsers,
      activeUsers,
      newUsers: newUsersToday,
      totalMessages,
      inboundMessages,
      outboundMessages,
      avgBurnoutScore: Number(avgBurnoutScore.toFixed(1)),
      crisisAlerts,
      avgResponseLatencyMs: Math.round(avgResponseLatencyMs),
      p95ResponseLatencyMs: Math.round(p95ResponseLatencyMs),
    };

    if (existing) {
      await ctx.db.patch(existing._id, metrics);
    } else {
      await ctx.db.insert('metrics_daily', metrics);
    }

    console.info(`[metrics:daily] Saved metrics - ${totalUsers} users, ${totalMessages} messages, ${crisisAlerts} alerts`);
  },
});

export const computeSubscriptionMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Count users using pagination
    let totalUserCount = 0;
    let userCursor: string | null = null;

    while (true) {
      const batch = await ctx.db
        .query('users')
        .order('desc')
        .paginate({ cursor: userCursor, numItems: BATCH_SIZE });

      totalUserCount += batch.page.length;

      if (!batch.continueCursor) break;
      userCursor = batch.continueCursor;
    }

    // Count subscriptions by status using pagination
    const statusCounts = { active: 0, trialing: 0, past_due: 0, canceled: 0 };
    const planCounts: Record<string, number> = { free: 0, plus: 0, enterprise: 0 };
    let subCursor: string | null = null;
    let totalSubCount = 0;

    while (true) {
      const batch = await ctx.db
        .query('subscriptions')
        .order('desc')
        .paginate({ cursor: subCursor, numItems: BATCH_SIZE });

      for (const sub of batch.page) {
        totalSubCount++;
        const status = sub.status as keyof typeof statusCounts;
        if (status in statusCounts) {
          statusCounts[status]++;
        }
        const plan = sub.planId || 'free';
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      }

      if (!batch.continueCursor) break;
      subCursor = batch.continueCursor;
    }

    const metrics = {
      updatedAt: Date.now(),
      total: totalUserCount,
      active: statusCounts.active,
      trialing: statusCounts.trialing,
      pastDue: statusCounts.past_due,
      canceled: statusCounts.canceled,
      free: totalUserCount - totalSubCount,
      plus: planCounts.plus || 0,
      enterprise: planCounts.enterprise || 0,
    };

    // Clear old entries and insert new (metrics tables are small)
    const existing = await ctx.db.query('metrics_subscriptions').collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    await ctx.db.insert('metrics_subscriptions', metrics);
  },
});

export const computeJourneyFunnel = internalMutation({
  args: {},
  handler: async (ctx) => {
    const phases = { onboarding: 0, active: 0, maintenance: 0, crisis: 0, churned: 0 };
    let cursor: string | null = null;

    while (true) {
      const batch = await ctx.db
        .query('sessions')
        .order('desc')
        .paginate({ cursor, numItems: BATCH_SIZE });

      for (const session of batch.page) {
        const metadata = (session.metadata as Record<string, unknown>) || {};
        const phase = (metadata.journeyPhase as string) || 'active';
        if (phase in phases) {
          phases[phase as keyof typeof phases] += 1;
        } else {
          phases.active += 1;
        }
      }

      if (!batch.continueCursor) break;
      cursor = batch.continueCursor;
    }

    const metrics = {
      updatedAt: Date.now(),
      ...phases,
    };

    // Clear old entries and insert new (metrics tables are small)
    const existing = await ctx.db.query('metrics_journey_funnel').collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }
    await ctx.db.insert('metrics_journey_funnel', metrics);
  },
});

export const computeBurnoutDistribution = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Use take() to get recent scores, not collect()
    const scores = await ctx.db.query('scores').order('desc').take(5000);
    const latestScores = new Map<Id<'users'>, number>();

    for (const score of scores) {
      if (!latestScores.has(score.userId)) {
        latestScores.set(score.userId, score.composite);
      }
    }

    const buckets = [
      { bucket: '0-20', min: 0, max: 20, count: 0 },
      { bucket: '21-40', min: 21, max: 40, count: 0 },
      { bucket: '41-60', min: 41, max: 60, count: 0 },
      { bucket: '61-80', min: 61, max: 80, count: 0 },
      { bucket: '81-100', min: 81, max: 100, count: 0 },
    ];

    for (const score of latestScores.values()) {
      const bucket = buckets.find(b => score >= b.min && score <= b.max);
      if (bucket) bucket.count += 1;
    }

    const updatedAt = Date.now();

    // Clear old entries (metrics tables are small, .collect() acceptable)
    const existing = await ctx.db.query('metrics_burnout_distribution').collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }

    // Insert new distribution
    for (const bucket of buckets) {
      await ctx.db.insert('metrics_burnout_distribution', {
        updatedAt,
        bucket: bucket.bucket,
        count: bucket.count,
      });
    }
  },
});
