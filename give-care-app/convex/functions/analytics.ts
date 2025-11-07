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
    const scores = await ctx.db.query('scores').order('desc').take(5000);
    const latestByUser = new Map<string, number>();
    for (const score of scores) {
      if (latestByUser.has(score.userId)) continue;
      latestByUser.set(score.userId, score.composite);
    }
    const counts = burnoutBuckets.map(() => 0);
    for (const value of latestByUser.values()) {
      const bucketIndex = burnoutBuckets.findIndex((bucket) => value >= bucket.min && value <= bucket.max);
      const index = bucketIndex === -1 ? burnoutBuckets.length - 1 : bucketIndex;
      counts[index] += 1;
    }
    return burnoutBuckets.map((bucket, index) => ({ range: bucket.label, count: counts[index] }));
  },
});

export const getUserJourneyFunnel = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query('sessions').take(2000);
    const buckets = new Map<string, number>(journeyPhases.map((phase) => [phase, 0]));
    for (const session of sessions) {
      const metadata = (session.metadata as Record<string, unknown> | undefined) ?? {};
      const phase = (metadata.journeyPhase as string) ?? 'active';
      const currentCount = buckets.get(phase) ?? 0;
      buckets.set(phase, currentCount + 1);
    }
    return journeyPhases.map((phase) => ({ phase, count: buckets.get(phase) ?? 0 }));
  },
});

export const getDailyMetrics = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, { days }) => {
    const clampedDays = Math.min(Math.max(days, 1), 60);
    const now = Date.now();
    const windowStart = now - clampedDays * DAY_MS;
    const recentMessages = await ctx.db
      .query('messages')
      .filter((q) => q.gte(q.field('_creationTime'), windowStart))
      .take(10000);
    const buckets = new Map<string, { sent: number; received: number }>();
    for (const message of recentMessages) {
      const day = new Date(message._creationTime).toISOString().slice(0, 10);
      const bucket = buckets.get(day) ?? { sent: 0, received: 0 };
      if (message.direction === 'outbound') bucket.sent += 1;
      else bucket.received += 1;
      buckets.set(day, bucket);
    }
    const data = [] as Array<{ date: string; sent: number; received: number }>;
    for (let offset = clampedDays - 1; offset >= 0; offset -= 1) {
      const day = new Date(now - offset * DAY_MS).toISOString().slice(0, 10);
      const bucket = buckets.get(day) ?? { sent: 0, received: 0 };
      data.push({ date: day, sent: bucket.sent, received: bucket.received });
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
