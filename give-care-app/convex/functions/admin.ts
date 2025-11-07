import { query } from '../_generated/server';
import type { QueryCtx } from '../_generated/server';
import { v } from 'convex/values';
import type { Id, Doc } from '../_generated/dataModel';

type AdminUserSummary = {
  _id: Id<'users'>;
  externalId: string;
  firstName: string;
  relationship?: string;
  phoneNumber: string;
  burnoutScore?: number;
  burnoutBand?: string;
  journeyPhase: string;
  subscriptionStatus: string;
  lastContactAt?: number;
  createdAt: number;
  pressureZones: string[];
};

type ConversationEntry = {
  _id: Id<'messages'>;
  role: 'user' | 'assistant';
  text: string;
  agentName?: string;
  latency?: number;
  timestamp: number;
};

const DAY_MS = 86_400_000;
const WEEK_MS = DAY_MS * 7;

const loadSessionForUser = async (ctx: QueryCtx, user: Doc<'users'>) => {
  return ctx.db
    .query('sessions')
    .withIndex('by_user_channel', (q) => q.eq('userId', user._id).eq('channel', user.channel))
    .unique();
};

const extractMetadata = (session: Doc<'sessions'> | null) => ((session?.metadata as Record<string, unknown>) ?? {});

const extractProfile = (metadata: Record<string, unknown>) => ((metadata.profile as Record<string, unknown>) ?? {});

const latestScoreForUser = async (ctx: QueryCtx, userId: Id<'users'>) => {
  return ctx.db
    .query('scores')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .order('desc')
    .first();
};

const lastMessageTimestamp = async (ctx: QueryCtx, userId: Id<'users'>) => {
  const lastMessage = await ctx.db
    .query('messages')
    .withIndex('by_user_created', (q) => q.eq('userId', userId))
    .order('desc')
    .first();
  return lastMessage?._creationTime;
};

const subscriptionForUser = async (ctx: QueryCtx, userId: Id<'users'>) => {
  return ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
};

const summarizeUser = async (ctx: QueryCtx, user: Doc<'users'>): Promise<AdminUserSummary> => {
  const session = await loadSessionForUser(ctx, user);
  const metadata = extractMetadata(session);
  const profile = extractProfile(metadata);
  const latestScore = await latestScoreForUser(ctx, user._id);
  const subscription = await subscriptionForUser(ctx, user._id);
  const lastContact = await lastMessageTimestamp(ctx, user._id);
  const pressureZones = Array.isArray(metadata.pressureZones)
    ? (metadata.pressureZones as string[])
    : Array.isArray(metadata.riskSignals)
    ? (metadata.riskSignals as string[])
    : [];

  return {
    _id: user._id,
    externalId: user.externalId,
    firstName: (profile.firstName as string) ?? user.externalId,
    relationship: profile.relationship as string | undefined,
    phoneNumber: user.phone ?? 'unavailable',
    burnoutScore: latestScore?.composite,
    burnoutBand: latestScore?.band,
    journeyPhase: (metadata.journeyPhase as string) ?? 'active',
    subscriptionStatus: subscription?.status ?? 'none',
    lastContactAt: lastContact,
    createdAt: user._creationTime,
    pressureZones,
  };
};

const percentile = (values: number[], target: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.floor((target / 100) * sorted.length)));
  return sorted[rank];
};

const computeSubscriptionBreakdown = (subscriptions: Doc<'subscriptions'>[], totalUsers: number) => {
  const breakdown = {
    active: 0,
    incomplete: 0,
    pastDue: 0,
    canceled: 0,
    none: 0,
  };
  const usersWithSubs = new Set<string>();
  for (const subscription of subscriptions) {
    usersWithSubs.add(subscription.userId);
    const status = subscription.status;
    if (status === 'active' || status === 'trialing') {
      breakdown.active += 1;
    } else if (status === 'incomplete' || status === 'incomplete_expired') {
      breakdown.incomplete += 1;
    } else if (status === 'past_due' || status === 'unpaid') {
      breakdown.pastDue += 1;
    } else if (status === 'canceled') {
      breakdown.canceled += 1;
    }
  }
  breakdown.none = Math.max(0, totalUsers - usersWithSubs.size);
  return breakdown;
};

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const totalUsers = users.length;
    const sessions = await ctx.db.query('sessions').collect();
    const subscriptions = await ctx.db.query('subscriptions').collect();
    const alerts = await ctx.db.query('alerts').collect();
    const now = Date.now();
    const weekAgo = now - WEEK_MS;
    const dayAgo = now - DAY_MS;

    const recentRuns = await ctx.db
      .query('agent_runs')
      .filter((q) => q.gte(q.field('_creationTime'), weekAgo))
      .take(500);

    const latencies = recentRuns.map((run) => run.latencyMs);
    const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : 0;
    const p95ResponseTime = percentile(latencies, 95);

    const alertsLast24h = alerts.filter((alert) => alert._creationTime >= dayAgo).length;
    const crisisAlerts = alerts.filter((alert) => alert.severity === 'high' || alert.severity === 'critical').length;

    const activeUsers = new Set(
      sessions
        .filter((session) => (session.lastSeen ?? session._creationTime) >= dayAgo)
        .map((session) => session.userId)
    ).size;

    const latestScores = await ctx.db
      .query('scores')
      .order('desc')
      .take(3000);
    const seen = new Set<string>();
    let cumulativeScore = 0;
    let scoreCount = 0;
    for (const score of latestScores) {
      const key = score.userId;
      if (seen.has(key)) continue;
      seen.add(key);
      cumulativeScore += score.composite;
      scoreCount += 1;
    }
    const avgBurnoutScore = scoreCount ? Number((cumulativeScore / scoreCount).toFixed(1)) : 0;

    const subscriptionBreakdown = computeSubscriptionBreakdown(subscriptions, totalUsers);
    const activeSubscriptions = subscriptionBreakdown.active;

    return {
      totalUsers,
      activeUsers,
      crisisAlerts,
      avgBurnoutScore,
      p95ResponseTime,
      subscriptionBreakdown,
      activeSubscriptions,
      alertsLast24h,
      avgLatencyMs,
    };
  },
});

const matchesSearch = (user: AdminUserSummary, search?: string) => {
  if (!search) return true;
  const haystack = `${user.firstName} ${user.phoneNumber} ${user.externalId}`.toLowerCase();
  return haystack.includes(search.toLowerCase());
};

const matchesFilters = (
  user: AdminUserSummary,
  filters: { journeyPhase?: string; burnoutBand?: string; subscriptionStatus?: string }
) => {
  if (filters.journeyPhase && user.journeyPhase !== filters.journeyPhase) return false;
  if (filters.burnoutBand && user.burnoutBand !== filters.burnoutBand) return false;
  if (filters.subscriptionStatus && user.subscriptionStatus !== filters.subscriptionStatus) return false;
  return true;
};

export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),
    burnoutBand: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const users = await ctx.db.query('users').collect();
    users.sort((a, b) => b._creationTime - a._creationTime);

    const summaries: AdminUserSummary[] = [];
    for (const user of users) {
      const summary = await summarizeUser(ctx, user);
      if (!matchesSearch(summary, args.search)) continue;
      if (!matchesFilters(summary, args)) continue;
      summaries.push(summary);
      if (summaries.length >= limit) break;
    }

    return { users: summaries, total: users.length };
  },
});

export const getUserDetails = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const summary = await summarizeUser(ctx, user);

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_user_created', (q) => q.eq('userId', userId))
      .order('desc')
      .take(50);

    const conversations: ConversationEntry[] = messages
      .map((message) => ({
        _id: message._id,
        role: (message.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
        text: message.text,
        agentName: (message.meta as Record<string, unknown> | undefined)?.agent as string | undefined,
        latency: (message.meta as Record<string, unknown> | undefined)?.latencyMs as number | undefined,
        timestamp: message._creationTime,
      }))
      .reverse();

    const scores = await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(30);
    const wellnessHistory = scores.map((score) => ({ recordedAt: score._creationTime, score: score.composite })).reverse();

    const scoreByAssessment = new Map(scores.map((score) => [score.assessmentId, score]));

    const assessments = await ctx.db
      .query('assessments')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(25);

    const assessmentDetails = assessments.map((assessment) => ({
      _id: assessment._id,
      type: assessment.definitionId,
      completedAt: assessment._creationTime,
      overallScore: scoreByAssessment.get(assessment._id)?.composite ?? null,
    }));

    return {
      user: summary,
      conversations,
      wellnessHistory,
      assessments: assessmentDetails,
    };
  },
});

const healthStatus = (utilization: number) => {
  if (utilization >= 0.9) return 'critical';
  if (utilization >= 0.75) return 'warning';
  return 'ok';
};

const formatErrors = (events: Doc<'guardrail_events'>[]) => {
  const buckets = new Map<string, { count: number; severity: 'warning' | 'critical' }>();
  for (const event of events) {
    const severity = event.action === 'block' ? 'critical' : 'warning';
    const key = event.ruleId;
    const existing = buckets.get(key) ?? { count: 0, severity };
    buckets.set(key, { count: existing.count + 1, severity: existing.severity === 'critical' ? 'critical' : severity });
  }
  return Array.from(buckets.entries()).map(([type, data]) => ({ type, severity: data.severity, count: data.count }));
};

export const getSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - DAY_MS;

    const messagesLast24h = await ctx.db
      .query('messages')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .take(5000);

    const perUserUsage = new Map<string, number>();
    for (const message of messagesLast24h) {
      const key = message.userId;
      perUserUsage.set(key, (perUserUsage.get(key) ?? 0) + 1);
    }
    const busiestUserUsage = Math.max(0, ...perUserUsage.values());
    const globalUsage = messagesLast24h.length;

    const runs = await ctx.db
      .query('agent_runs')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .take(1000);

    const tokensToday = runs.reduce((sum, run) => sum + run.budgetResult.usedInputTokens + run.budgetResult.usedOutputTokens, 0);
    const tokensLimit = 2_000_000;
    const costToday = Number((tokensToday / 1_000 * 0.003).toFixed(2));
    const budget = 500;

    const latencies = runs.map((run) => run.latencyMs);
    const queryLatency = latencies.length ? percentile(latencies, 95) : 0;

    const sessions = await ctx.db.query('sessions').collect();
    const activeSessions = sessions.filter((session) => (session.lastSeen ?? session._creationTime) >= now - 15 * 60 * 1000);

    const alerts = await ctx.db
      .query('alerts')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .take(500);
    const priorityUsers = alerts.filter((alert) => alert.severity === 'critical').length;

    const guardrailEvents = await ctx.db
      .query('guardrail_events')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .take(500);

    const totalDocs = (await ctx.db.query('users').collect()).length + messagesLast24h.length + runs.length + alerts.length;
    const storageUsed = Number((totalDocs * 0.0002).toFixed(2));
    const storageLimit = 5; // GB

    return {
      rateLimits: {
        perUser: {
          used: busiestUserUsage,
          limit: 500,
          status: healthStatus(busiestUserUsage / 500),
        },
        global: {
          used: globalUsage,
          limit: 10000,
          status: healthStatus(globalUsage / 10000),
        },
        priorityUsers,
      },
      openai: {
        tokensToday,
        tokensLimit,
        costToday,
        budget,
      },
      database: {
        queryLatency,
        connectionPoolActive: activeSessions.length,
        connectionPoolMax: 200,
        storageUsed,
        storageLimit,
      },
      errors: formatErrors(guardrailEvents),
    };
  },
});

const hoursUntilNextFollowup = (createdAt: number) => {
  const windowMs = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - createdAt;
  return Math.max(0, (windowMs - elapsed) / (60 * 60 * 1000));
};

export const getCrisisAlerts = query({
  args: {},
  handler: async (ctx) => {
    const scores = await ctx.db
      .query('scores')
      .filter((q) => q.gte(q.field('composite'), 80))
      .order('desc')
      .take(200);
    const crisisUsers: Array<AdminUserSummary & { pressureZones: string[] }> = [];
    const seen = new Set<string>();
    for (const score of scores) {
      const key = score.userId;
      if (seen.has(key)) continue;
      const user = await ctx.db.get(score.userId);
      if (!user) continue;
      const summary = await summarizeUser(ctx, user);
      crisisUsers.push({ ...summary, burnoutScore: score.composite, burnoutBand: score.band, pressureZones: summary.pressureZones });
      seen.add(key);
      if (crisisUsers.length >= 25) break;
    }

    const pendingAlerts = await ctx.db
      .query('alerts')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .take(200);
    const pendingFollowups = [] as Array<{
      _id: Id<'users'>;
      firstName: string;
      phoneNumber: string;
      crisisFollowupCount: number;
      hoursUntilNextFollowup: number;
    }>;
    for (const alert of pendingAlerts) {
      if (alert.severity === 'low') continue;
      const user = await ctx.db.get(alert.userId);
      if (!user) continue;
      const summary = await summarizeUser(ctx, user);
      const context = (alert.context as Record<string, unknown> | undefined) ?? {};
      pendingFollowups.push({
        _id: summary._id,
        firstName: summary.firstName,
        phoneNumber: summary.phoneNumber,
        crisisFollowupCount: Number(context.stage ?? 1),
        hoursUntilNextFollowup: hoursUntilNextFollowup(alert._creationTime),
      });
    }

    return { crisisUsers, pendingFollowups };
  },
});
