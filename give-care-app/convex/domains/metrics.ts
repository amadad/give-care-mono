/**
 * Metrics aggregation domain.
 *
 * Contains cron-invoked internal actions/mutations that populate the
 * metrics_* tables used by analytics and admin surfaces.
 */

import { internalAction, internalMutation } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import { v } from 'convex/values';

const DAY_MS = 86_400_000;
const BATCH_SIZE = 200;

export const aggregateDailyMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    console.info(`[metrics] Starting daily aggregation for ${today}`);

    await ctx.runMutation(internal.domains.metrics.computeDailyMetrics, { date: today });
    await ctx.runMutation(internal.domains.metrics.computeSubscriptionMetrics, {});
    await ctx.runMutation(internal.domains.metrics.computeJourneyFunnel, {});
    await ctx.runMutation(internal.domains.metrics.computeBurnoutDistribution, {});

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

    let totalUsers = 0;
    let newUsersToday = 0;
    let userCursor: string | null = null;

    while (true) {
      const batch = await ctx.db
        .query('users')
        .order('desc')
        .paginate({ cursor: userCursor, numItems: BATCH_SIZE });

      totalUsers += batch.page.length;
      newUsersToday += batch.page.filter((u) => u._creationTime >= dayAgo).length;

      if (!batch.continueCursor) break;
      userCursor = batch.continueCursor;
    }

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
      inboundMessages += batch.page.filter((m) => m.direction === 'inbound').length;
      outboundMessages += batch.page.filter((m) => m.direction === 'outbound').length;

      if (!batch.continueCursor) break;
      messageCursor = batch.continueCursor;
    }

    const scores = await ctx.db.query('scores').order('desc').take(5000);
    const latestScores = new Map<Id<'users'>, number>();
    for (const score of scores) {
      if (!latestScores.has(score.userId)) {
        latestScores.set(score.userId, score.composite);
      }
    }
    const avgBurnoutScore =
      latestScores.size > 0
        ? Array.from(latestScores.values()).reduce((sum, v) => sum + v, 0) / latestScores.size
        : 0;

    const alerts = await ctx.db
      .query('alerts')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .collect();
    const crisisAlerts = alerts.filter((a) => a.severity === 'high' || a.severity === 'critical').length;

    const runs = await ctx.db
      .query('agent_runs')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .take(1000);
    const latencies = runs.map((r) => r.latencyMs);
    const avgResponseLatencyMs =
      latencies.length > 0 ? latencies.reduce((sum, v) => sum + v, 0) / latencies.length : 0;
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const p95ResponseLatencyMs =
      latencies.length > 0 ? sortedLatencies[Math.floor(latencies.length * 0.95)] : 0;

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

    console.info(
      `[metrics:daily] Saved metrics - ${totalUsers} users, ${totalMessages} messages, ${crisisAlerts} alerts`
    );
  },
});

export const computeSubscriptionMetrics = internalMutation({
  args: {},
  handler: async (ctx) => {
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
    const scores = await ctx.db.query('scores').order('desc').take(5000);
    const latestScores = new Map<Id<'users'>, number>();

    for (const score of scores) {
      if (!latestScores.has(score.userId)) {
        latestScores.set(score.userId, score.composite);
      }
    }

    const buckets = [
      { bucket: '0-20', count: 0 },
      { bucket: '21-40', count: 0 },
      { bucket: '41-60', count: 0 },
      { bucket: '61-80', count: 0 },
      { bucket: '81-100', count: 0 },
    ];

    for (const score of latestScores.values()) {
      if (score <= 20) buckets[0].count += 1;
      else if (score <= 40) buckets[1].count += 1;
      else if (score <= 60) buckets[2].count += 1;
      else if (score <= 80) buckets[3].count += 1;
      else buckets[4].count += 1;
    }

    const updatedAt = Date.now();
    const existing = await ctx.db.query('metrics_burnout_distribution').collect();
    for (const doc of existing) {
      await ctx.db.delete(doc._id);
    }

    for (const bucket of buckets) {
      await ctx.db.insert('metrics_burnout_distribution', {
        updatedAt,
        bucket: bucket.bucket,
        count: bucket.count,
      });
    }
  },
});
