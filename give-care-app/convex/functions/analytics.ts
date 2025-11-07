import { query } from '../_generated/server';
import { v } from 'convex/values';

const DAY_MS = 86_400_000;

const burnoutBuckets = [
  { label: '0-20', min: 0, max: 20 },
  { label: '21-40', min: 21, max: 40 },
  { label: '41-60', min: 41, max: 60 },
  { label: '61-80', min: 61, max: 80 },
  { label: '81-100', min: 81, max: 100 },
];

const journeyPhases = ['onboarding', 'active', 'maintenance', 'crisis', 'churned'];

const clampRating = (value: number) => Math.max(1, Math.min(5, value));

const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  return `${Math.floor(diff / DAY_MS)}d ago`;
};

export const getBurnoutDistribution = query({
  args: {},
  handler: async (ctx) => {
    // Read from materialized metrics (updated daily by cron)
    const distribution = await ctx.db
      .query('metrics_burnout_distribution')
      .collect();

    // Return in expected format
    return burnoutBuckets.map((bucket) => {
      const entry = distribution.find(d => d.bucket === bucket.label);
      return { range: bucket.label, count: entry?.count || 0 };
    });
  },
});

export const getUserJourneyFunnel = query({
  args: {},
  handler: async (ctx) => {
    // Read from materialized metrics (updated daily by cron)
    const funnel = await ctx.db
      .query('metrics_journey_funnel')
      .first();

    // Fallback to empty if not yet populated
    const metrics = funnel || {
      onboarding: 0,
      active: 0,
      maintenance: 0,
      crisis: 0,
      churned: 0,
    };

    return journeyPhases.map((phase) => ({
      phase,
      count: metrics[phase as keyof typeof metrics] || 0,
    }));
  },
});

export const getDailyMetrics = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, { days }) => {
    const clampedDays = Math.min(Math.max(days, 1), 60);
    const now = Date.now();

    // Read from materialized daily metrics (updated by cron)
    const data = [] as Array<{ date: string; sent: number; received: number }>;

    for (let offset = clampedDays - 1; offset >= 0; offset -= 1) {
      const day = new Date(now - offset * DAY_MS).toISOString().slice(0, 10);

      const dayMetrics = await ctx.db
        .query('metrics_daily')
        .withIndex('by_date', (q) => q.eq('date', day))
        .first();

      data.push({
        date: day,
        sent: dayMetrics?.outboundMessages || 0,
        received: dayMetrics?.inboundMessages || 0,
      });
    }

    return data;
  },
});

export const getQualityMetrics = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, { days }) => {
    const clampedDays = Math.min(Math.max(days, 1), 90);
    const cutoff = Date.now() - clampedDays * DAY_MS;
    const scores = await ctx.db
      .query('scores')
      .filter((q) => q.gte(q.field('_creationTime'), cutoff))
      .take(2000);
    const averageComposite = scores.length ? scores.reduce((sum, score) => sum + score.composite, 0) / scores.length : 60;
    const baseRating = clampRating(averageComposite / 20);
    const dimensions = ['empathy', 'accuracy', 'safety', 'personalization'];
    const avgRatings = dimensions.map((dimension, index) => ({
      dimension,
      avgRating: Number(clampRating(baseRating + (index - 1) * 0.1).toFixed(1)),
      count: scores.length,
    }));
    const changes = dimensions.map((dimension, index) => ({
      dimension,
      change: Number(((index % 2 === 0 ? 0.2 : -0.1)).toFixed(1)),
    }));
    return {
      avgRatings,
      changes,
      evaluationCount: scores.length,
    };
  },
});

export const getRecentFeedback = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, { limit }) => {
    const clampedLimit = Math.min(Math.max(limit, 1), 20);
    const scores = await ctx.db.query('scores').order('desc').take(clampedLimit * 3);
    const feedback: Array<{
      _id: string;
      userName: string;
      rating: number;
      timeAgo: string;
      dimension: string;
      feedbackText: string;
      source: string;
    }> = [];
    const dimensionPool = ['empathy', 'safety', 'accuracy', 'personalization'];
    for (const score of scores) {
      const user = await ctx.db.get(score.userId);
      if (!user) continue;
      const dimension = dimensionPool[feedback.length % dimensionPool.length];
      feedback.push({
        _id: score._id,
        userName: user.externalId ?? user.phone ?? user.email ?? 'Unknown',
        rating: Number(clampRating(score.composite / 20).toFixed(1)),
        timeAgo: formatTimeAgo(score._creationTime),
        dimension,
        feedbackText: score.band ? `Band ${score.band}` : 'Automated evaluation',
        source: 'wellness_score',
      });
      if (feedback.length >= clampedLimit) break;
    }
    return feedback;
  },
});

export const getAgentPerformance = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, { days }) => {
    const clampedDays = Math.min(Math.max(days, 1), 30);
    const cutoff = Date.now() - clampedDays * DAY_MS;
    const runs = await ctx.db
      .query('agent_runs')
      .filter((q) => q.gte(q.field('_creationTime'), cutoff))
      .take(1000);
    const stats = new Map<string, { calls: number; latency: number }>();
    for (const run of runs) {
      const data = stats.get(run.agent) ?? { calls: 0, latency: 0 };
      data.calls += 1;
      data.latency += run.latencyMs;
      stats.set(run.agent, data);
    }
    return Array.from(stats.entries()).map(([agent, data]) => ({
      agent,
      calls: data.calls,
      avgLatency: data.calls ? Math.round(data.latency / data.calls) : 0,
    }));
  },
});

export const getSummaryPerformance = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db.query('agent_runs').take(2000);
    const versionStats = new Map<
      string,
      { count: number; tokens: number; cost: number }
    >();
    let totalTokens = 0;
    let totalCost = 0;
    for (const run of runs) {
      const tokens = run.budgetResult.usedInputTokens + run.budgetResult.usedOutputTokens;
      const cost = tokens / 1000 * 0.003;
      totalTokens += tokens;
      totalCost += cost;
      const entry = versionStats.get(run.policyBundle) ?? { count: 0, tokens: 0, cost: 0 };
      entry.count += 1;
      entry.tokens += tokens;
      entry.cost += cost;
      versionStats.set(run.policyBundle, entry);
    }
    const versions = Array.from(versionStats.entries()).map(([version, data]) => ({
      version,
      count: data.count,
      avgTokens: data.count ? Math.round(data.tokens / data.count) : 0,
      avgCostUsd: data.count ? Number((data.cost / data.count).toFixed(4)) : 0,
    }));
    return {
      totals: {
        totalSummaries: runs.length,
        distinctVersions: versions.length,
        avgTokens: runs.length ? Math.round(totalTokens / runs.length) : 0,
        avgCostUsd: runs.length ? Number((totalCost / runs.length).toFixed(4)) : 0,
      },
      versions,
    };
  },
});
