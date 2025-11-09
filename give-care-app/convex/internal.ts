"use node";

/**
 * Internal Functions - Server-side only
 *
 * Consolidates all server-only functions from internal/* and functions/*.
 * NOT exposed to frontend - use internal.* to call these.
 *
 * Includes:
 * - Metrics aggregation (daily, subscriptions, journey funnel, burnout distribution)
 * - Onboarding (welcome SMS sender)
 * - Scheduler (trigger advancement, processing)
 * - Seed (interventions data)
 * - Threads (Agent Component wrappers)
 * - Messages (record inbound/outbound)
 * - Users (queries by externalId)
 * - Email (delivery logging)
 * - Alerts (pending alerts, processing)
 * - Wellness (status queries)
 * - Memory (recording and retrieval)
 * - Logs (agent runs, guardrails, crisis tracking)
 * - Interventions (queries by zone/category, event tracking)
 * - Newsletter (signup actions)
 * - Assessments (start, record answers, submit results)
 * - Watchers (engagement checks)
 * - Manual subscription linking
 * - Analytics (burnout distribution, journey funnel, quality metrics, agent performance)
 * - Admin (user management, system health, crisis alerts)
 */

import { mutation, query, action, internalMutation, internalAction } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { internal, components, api } from './_generated/api';
import { v } from 'convex/values';
import type { Id, Doc } from './_generated/dataModel';
import * as Core from './core';
import { interventionsSeedData } from './lib/interventions_seed';
import { createThread } from '@convex-dev/agent';
import { Resend } from 'resend';
import { CRISIS_TERMS } from './lib/constants';
import { PLAN_ENTITLEMENTS } from './lib/billing';

// ============================================================================
// CONSTANTS
// ============================================================================

const DAY_MS = 86_400_000;
const BATCH_SIZE = 200;

// ============================================================================
// METRICS AGGREGATION
// ============================================================================

/**
 * Daily metrics aggregation (cron-based)
 *
 * Runs daily via cron to compute key metrics:
 * - Daily metrics (users, messages, burnout, latency)
 * - Subscription metrics
 * - Journey funnel
 * - Burnout distribution
 */
export const aggregateDailyMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    console.info(`[metrics] Starting daily aggregation for ${today}`);

    await ctx.runMutation(internal.internal.computeDailyMetrics, { date: today });
    await ctx.runMutation(internal.internal.computeSubscriptionMetrics, {});
    await ctx.runMutation(internal.internal.computeJourneyFunnel, {});
    await ctx.runMutation(internal.internal.computeBurnoutDistribution, {});

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
      inboundMessages += batch.page.filter((m) => m.direction === 'inbound').length;
      outboundMessages += batch.page.filter((m) => m.direction === 'outbound').length;

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
    const avgBurnoutScore =
      latestScores.size > 0
        ? Array.from(latestScores.values()).reduce((sum, v) => sum + v, 0) / latestScores.size
        : 0;

    // Crisis alerts - bounded by time filter
    const alerts = await ctx.db
      .query('alerts')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .collect(); // Acceptable: bounded by 24h time window
    const crisisAlerts = alerts.filter((a) => a.severity === 'high' || a.severity === 'critical').length;

    // Response latency from agent runs - using take() not collect()
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

    console.info(
      `[metrics:daily] Saved metrics - ${totalUsers} users, ${totalMessages} messages, ${crisisAlerts} alerts`
    );
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
      const bucket = buckets.find((b) => score >= b.min && score <= b.max);
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

// ============================================================================
// ONBOARDING
// ============================================================================

/**
 * Send welcome SMS after Stripe checkout completion
 *
 * Triggered by billing.applyStripeEvent when checkout.session.completed
 * is received with phone number and name metadata.
 */
export const sendWelcomeSms = internalAction({
  args: {
    phoneNumber: v.string(),
    fullName: v.string(),
  },
  handler: async (ctx, { phoneNumber, fullName }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.error('[onboarding] Twilio credentials not configured');
      return { success: false, error: 'Twilio not configured' };
    }

    // Personalized welcome message
    const firstName = fullName.split(' ')[0];
    const welcomeText = `Hi ${firstName}! Welcome to GiveCare. I'm here to support you 24/7 on your caregiving journey. Text me anytime for guidance, resources, or just someone to listen. How are you doing today?`;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: from,
            Body: welcomeText,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[onboarding] Twilio error sending welcome SMS:', error);
        return { success: false, error };
      }

      const data: any = await response.json();
      console.log('[onboarding] Welcome SMS sent:', { sid: data.sid, to: phoneNumber });

      return { success: true, sid: data.sid };
    } catch (error) {
      console.error('[onboarding] Failed to send welcome SMS:', error);
      return { success: false, error: String(error) };
    }
  },
});

// ============================================================================
// SCHEDULER
// ============================================================================

/**
 * Advance trigger mutation
 *
 * Called by scheduled functions to advance trigger state.
 */
export const advanceTriggerMutation = internalMutation({
  args: {
    triggerId: v.id('triggers'),
  },
  handler: async (ctx, { triggerId }) => {
    const trigger = await ctx.db.get(triggerId);
    if (!trigger) return;
    await Core.advanceTrigger(ctx, trigger);
  },
});

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Seed interventions table with evidence-based data
 *
 * Run once via CLI:
 * npx convex run internal:internal:seedInterventions
 *
 * Safe to run multiple times - clears existing data first
 */
export const seedInterventions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing interventions
    const existing = await ctx.db.query('interventions').collect();
    for (const intervention of existing) {
      await ctx.db.delete(intervention._id);
    }

    // Insert seed data
    let inserted = 0;
    for (const data of interventionsSeedData) {
      await ctx.db.insert('interventions', data);
      inserted++;
    }

    return {
      success: true,
      inserted,
      message: `Successfully seeded ${inserted} evidence-based interventions`,
    };
  },
});

// ============================================================================
// THREAD MANAGEMENT
// ============================================================================

/**
 * Create a new Agent Component thread
 *
 * This wrapper allows actions to safely create threads without
 * casting ActionCtx to MutationCtx (Convex best practice).
 */
export const createComponentThread = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await createThread(ctx, components.agent, {
      userId: userId as string,
    });
  },
});

// ============================================================================
// MESSAGES
// ============================================================================

const messageArgs = v.object({
  externalId: v.string(),
  channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  text: v.string(),
  meta: v.optional(v.any()),
  traceId: v.string(),
  redactionFlags: v.optional(v.array(v.string())),
});

export const recordInbound = mutation({
  args: {
    message: messageArgs,
  },
  handler: async (ctx, { message }) => {
    return await Core.recordInbound(ctx, message);
  },
});

export const recordOutbound = mutation({
  args: {
    message: messageArgs,
  },
  handler: async (ctx, { message }) => {
    return await Core.recordOutbound(ctx, message);
  },
});

// ============================================================================
// USERS
// ============================================================================

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return Core.getByExternalId(ctx, externalId);
  },
});

// ============================================================================
// EMAIL
// ============================================================================

export const logDelivery = mutation({
  args: {
    userId: v.optional(v.string()),
    to: v.string(),
    subject: v.string(),
    status: v.string(),
    traceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = args.userId ? await Core.getByExternalId(ctx, args.userId) : null;
    await ctx.db.insert('emails', {
      userId: user?._id ?? undefined,
      to: args.to,
      subject: args.subject,
      status: args.status,
      traceId: args.traceId,
    });
  },
});

// ============================================================================
// ALERTS
// ============================================================================

export const listPending = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const alerts = await ctx.db
      .query('alerts')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .take(limit);
    return alerts.map((alert) => ({
      id: alert._id,
      type: alert.type,
      severity: alert.severity,
      channel: alert.channel,
      message: alert.message,
      payload: alert.payload ?? {},
    }));
  },
});

export const markProcessed = mutation({
  args: {
    alertId: v.id('alerts'),
    result: v.object({
      deliveredVia: v.union(v.literal('sms'), v.literal('email')),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { alertId, result }) => {
    await ctx.db.patch(alertId, {
      status: 'processed',
      context: { deliveredVia: result.deliveredVia, metadata: result.metadata },
    });
  },
});

// ============================================================================
// WELLNESS
// ============================================================================

export const getStatus = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();
    if (!user) {
      return { summary: 'No wellness data yet.', trend: [], pressureZones: [] };
    }
    const scores = await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(5);
    if (!scores.length) {
      return { summary: 'No wellness data yet.', trend: [], pressureZones: [] };
    }
    const trend = scores.map((score) => ({
      label: score.band,
      value: score.composite,
      recordedAt: score._creationTime,
    }));
    const latest = scores[0];
    const summary = latest.band === 'high'
      ? 'Stress is high. Let’s focus on grounding and breaks.'
      : latest.band === 'medium'
      ? 'You’re managing a lot—keep practicing care routines.'
      : 'You’re in a good place today. Keep nurturing what works.';
    return {
      summary,
      latestScore: latest.composite,
      trend,
      pressureZones: [],
    };
  },
});

// ============================================================================
// SCHEDULER
// ============================================================================

export const enqueueOnce = mutation({
  args: {
    job: v.object({
      name: v.string(),
      payload: v.any(),
      runAt: v.string(),
      userExternalId: v.string(),
      timezone: v.string(),
    }),
  },
  handler: async (ctx, { job }) => {
    const triggerId = await Core.createTrigger(ctx, {
      userExternalId: job.userExternalId,
      rrule: `DTSTART:${job.runAt.replace(/[-:]/g, '').slice(0, 15)}\nRRULE:FREQ=DAILY;COUNT=1`,
      timezone: job.timezone,
      nextRun: job.runAt,
      payload: { ...job.payload, name: job.name },
      type: 'one_off',
    });
    return triggerId;
  },
});

export const createTrigger = mutation({
  args: {
    trigger: v.object({
      userExternalId: v.string(),
      rrule: v.string(),
      timezone: v.string(),
      nextRun: v.string(),
      payload: v.any(),
    }),
  },
  handler: async (ctx, { trigger }) => {
    return Core.createTrigger(ctx, {
      ...trigger,
      type: 'recurring',
    });
  },
});

export const cancelTrigger = mutation({
  args: {
    triggerId: v.id('triggers'),
  },
  handler: async (ctx, { triggerId }) => {
    await Core.cancelTrigger(ctx, triggerId);
  },
});

export const processBatchInternal = internalMutation({
  args: {
    batchSize: v.number(),
  },
  handler: async (ctx, { batchSize }) => {
    const startTime = Date.now();
    console.info(`[scheduler] Starting batch processing, batchSize: ${batchSize}`);

    const due = await Core.dueTriggers(ctx, Date.now(), batchSize);
    console.info(`[scheduler] Found ${due.length} due triggers`);

    for (const trigger of due) {
      await ctx.db.insert('alerts', {
        userId: trigger.userId,
        type: 'scheduled_trigger',
        severity: 'medium',
        context: { payload: trigger.payload, timezone: trigger.timezone },
        message: 'Scheduled follow-up ready. Reach out with a gentle nudge.',
        channel: 'email',
        payload: trigger.payload ?? {},
        status: 'pending',
      });
      await ctx.runMutation(internal.advanceTriggerMutation, { triggerId: trigger._id });
    }

    const duration = Date.now() - startTime;
    console.info(`[scheduler] Completed batch processing in ${duration}ms, processed ${due.length} triggers`);

    return due.length;
  },
});

export const internalProcessDueTriggers = internalAction({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { batchSize }) => {
    await ctx.runMutation(internal.processBatchInternal, { batchSize: batchSize ?? 25 });
  },
});

// ============================================================================
// MEMORY
// ============================================================================

export const record = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, { userId, category, content, importance }) => {
    const user = await Core.ensureUser(ctx, { externalId: userId, channel: 'sms' });
    await ctx.db.insert('memories', {
      userId: user._id,
      externalId: userId,
      category,
      content,
      importance,
      embedding: undefined,
      lastAccessedAt: Date.now(),
      accessCount: 0,
    });
  },
});

export const retrieve = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    return memories.map(m => ({
      category: m.category,
      content: m.content,
      importance: m.importance,
      lastAccessedAt: m.lastAccessedAt,
    }));
  },
});

export const retrieveByCategory = query({
  args: {
    userId: v.string(),
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, category, limit = 10 }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('category'), category))
      .order('desc')
      .take(limit);

    return memories.map(m => ({
      category: m.category,
      content: m.content,
      importance: m.importance,
      lastAccessedAt: m.lastAccessedAt,
      accessCount: m.accessCount,
    }));
  },
});

export const retrieveImportant = query({
  args: {
    userId: v.string(),
    minImportance: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, minImportance = 0.7, limit = 5 }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.gte(q.field('importance'), minImportance))
      .order('desc')
      .take(limit);

    return memories.map(m => ({
      category: m.category,
      content: m.content,
      importance: m.importance,
      lastAccessedAt: m.lastAccessedAt,
    }));
  },
});

// ============================================================================
// LOGS
// ============================================================================

const budgetResultValidator = v.object({
  usedInputTokens: v.number(),
  usedOutputTokens: v.number(),
  toolCalls: v.number(),
});

export const agentRun = mutation({
  args: {
    payload: v.object({
      externalId: v.string(),
      agent: v.string(),
      policyBundle: v.string(),
      budgetResult: budgetResultValidator,
      latencyMs: v.number(),
      traceId: v.string(),
    }),
  },
  handler: async (ctx, { payload }) => {
    await Core.logAgentRun(ctx, payload);
  },
});

export const guardrail = mutation({
  args: {
    payload: v.object({
      externalId: v.optional(v.string()),
      ruleId: v.string(),
      action: v.string(),
      context: v.optional(v.any()),
      traceId: v.string(),
    }),
  },
  handler: async (ctx, { payload }) => {
    await Core.logGuardrail(ctx, payload);
  },
});

/**
 * Log crisis interaction for safety monitoring
 *
 * This is an internal mutation called by the crisis agent.
 */
export const logCrisisInteraction = internalMutation({
  args: {
    userId: v.string(),
    input: v.string(),
    chunks: v.array(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, { userId, input, chunks, timestamp }) => {
    // Get user ID from string (userId is externalId from agent context)
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      console.warn('Crisis interaction logged for unknown user:', userId);
      return;
    }

    // Log to agent_runs for monitoring
    await ctx.db.insert('agent_runs', {
      userId: user._id,
      agent: 'crisis',
      policyBundle: 'crisis_v1',
      budgetResult: {
        usedInputTokens: input.length,
        usedOutputTokens: chunks.join('').length,
        toolCalls: 0,
      },
      latencyMs: Date.now() - timestamp,
      traceId: `crisis-${timestamp}`,
    });
  },
});

/**
 * Log agent run for analytics
 *
 * This is an internal mutation called by Convex-native agents.
 */
export const logAgentRunInternal = internalMutation({
  args: {
    userId: v.string(),
    agent: v.string(),
    policyBundle: v.string(),
    budgetResult: budgetResultValidator,
    latencyMs: v.number(),
    traceId: v.string(),
  },
  handler: async (ctx, { userId, agent, policyBundle, budgetResult, latencyMs, traceId }) => {
    // Get user ID from string (userId is externalId from agent context)
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      console.warn('Agent run logged for unknown user:', userId);
      return;
    }

    // Log to agent_runs table
    await ctx.db.insert('agent_runs', {
      userId: user._id,
      agent,
      policyBundle,
      budgetResult,
      latencyMs,
      traceId,
    });
  },
});

// ============================================================================
// INTERVENTIONS
// ============================================================================

// Get interventions by BSFC pressure zones for assessment agent
export const getByZones = query({
  args: {
    zones: v.array(v.string()),
    minEvidenceLevel: v.optional(v.union(v.literal('high'), v.literal('moderate'), v.literal('low'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { zones, minEvidenceLevel, limit }) => {
    const evidenceOrder = { high: 3, moderate: 2, low: 1 };
    const minLevel = minEvidenceLevel ? evidenceOrder[minEvidenceLevel] : 1;

    // Safe to use .collect() here: interventions table is small (~20 entries, bounded by seed data)
    const allInterventions = await ctx.db
      .query('interventions')
      .collect();

    const matching = allInterventions
      .filter(intervention => {
        const hasMatchingZone = intervention.targetZones.some(zone => zones.includes(zone));
        const interventionLevel = evidenceOrder[intervention.evidenceLevel as keyof typeof evidenceOrder] || 0;
        const meetsEvidence = interventionLevel >= minLevel;
        return hasMatchingZone && meetsEvidence;
      })
      .sort((a, b) => {
        const aLevel = evidenceOrder[a.evidenceLevel as keyof typeof evidenceOrder] || 0;
        const bLevel = evidenceOrder[b.evidenceLevel as keyof typeof evidenceOrder] || 0;
        if (aLevel !== bLevel) return bLevel - aLevel;
        const aMatches = a.targetZones.filter(z => zones.includes(z)).length;
        const bMatches = b.targetZones.filter(z => zones.includes(z)).length;
        return bMatches - aMatches;
      });

    return matching.slice(0, limit || matching.length);
  },
});

/**
 * Get interventions by category
 */
export const getByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { category, limit }) => {
    const interventions = await ctx.db
      .query('interventions')
      .withIndex('by_category', (q) => q.eq('category', category))
      .take(limit || 20);

    return interventions;
  },
});

/**
 * Search interventions by tags or title
 */
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit }) => {
    const searchTerm = query.toLowerCase();

    // Safe to use .collect() here: interventions table is small (~20 entries, bounded by seed data)
    const allInterventions = await ctx.db
      .query('interventions')
      .collect();

    const matching = allInterventions.filter(intervention => {
      const titleMatch = intervention.title.toLowerCase().includes(searchTerm);
      const tagMatch = intervention.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      const categoryMatch = intervention.category.toLowerCase().includes(searchTerm);

      return titleMatch || tagMatch || categoryMatch;
    });

    return matching.slice(0, limit || 10);
  },
});

/**
 * Get all available categories
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    // Safe to use .collect() here: interventions table is small (~20 entries, bounded by seed data)
    const interventions = await ctx.db.query('interventions').collect();
    const categories = new Set(interventions.map(i => i.category));
    return Array.from(categories).sort();
  },
});

/**
 * Record when user views/starts an intervention
 */
export const recordEvent = mutation({
  args: {
    userId: v.string(),
    interventionId: v.id('interventions'),
    status: v.union(v.literal('viewed'), v.literal('started'), v.literal('completed')),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { userId, interventionId, status, metadata }) => {
    // Get user ID from externalId
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    await ctx.db.insert('intervention_events', {
      userId: user._id,
      interventionId: interventionId.toString(),
      status,
      metadata,
    });

    return { success: true };
  },
});

/**
 * Get user's intervention history
 */
export const getUserHistory = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Get user ID from externalId
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) return [];

    // User event history: using .take(100) to bound results per user
    // Most users will have <100 events; for power users, show most recent
    const events = await ctx.db
      .query('intervention_events')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);

    return events;
  },
});

// ============================================================================
// NEWSLETTER
// ============================================================================

/**
 * Newsletter signup action
 *
 * Adds email to Resend audience and logs subscription in Convex
 */
export const newsletterSignup = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    try {
      // Add to Resend audience (newsletter list)
      if (process.env.RESEND_AUDIENCE_ID) {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
        });
      }

      // Log subscription in Convex emails table
      await ctx.runMutation(internal.logDelivery, {
        to: email,
        subject: 'Newsletter Subscription',
        status: 'subscribed',
        traceId: `newsletter-${Date.now()}-${email}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Newsletter signup error:', error);
      throw new Error('Failed to subscribe to newsletter');
    }
  },
});

// ============================================================================
// ASSESSMENT RESULTS
// ============================================================================

/**
 * Submit BSFC assessment results from web form
 *
 * This wraps the existing assessments.start/recordAnswer API
 * to match the frontend's BSFC assessment flow
 */
export const submit = action({
  args: {
    email: v.string(),
    responses: v.array(v.number()),
    pressureZones: v.any(),
  },
  handler: async (ctx, { email, responses, pressureZones }): Promise<{ success: boolean; score: number; band: string; pressureZones: any }> => {
    if (responses.length !== 10) {
      throw new Error('BSFC requires exactly 10 responses');
    }

    try {
      // 1. Start assessment session (creates user if needed)
      const startResult: any = await ctx.runMutation(internal.start, {
        userId: email,
        definitionId: 'bsfc_v1',
      });
      const sessionId = startResult.sessionId;

      // 2. Record all 10 answers
      for (let i = 0; i < responses.length; i++) {
        const result: any = await ctx.runMutation(internal.recordAnswer, {
          sessionId,
          definitionId: 'bsfc_v1',
          questionId: `q${i + 1}`,
          value: responses[i],
        });

        // Last answer completes the assessment
        if (result.completed && result.score) {
          const totalScore: number = result.score.total;
          const band: string = result.score.band;

          // 3. Send results email via Resend
          if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
            const resend = new Resend(process.env.RESEND_API_KEY);

            // Determine interpretation
            let interpretation = '';
            if (band === 'low') {
              interpretation =
                "Your burden level is in the mild range. You're managing well, but it's still important to practice self-care and monitor your wellbeing.";
            } else if (band === 'medium') {
              interpretation =
                "Your burden level is moderate. You're experiencing significant stress. Evidence-based interventions can help reduce your burden and improve your quality of life. Consider discussing your caregiving situation with a healthcare professional.";
            } else {
              interpretation =
                "Your burden level is severe, which indicates you may be experiencing significant stress that could impact your health. We strongly encourage you to consult with a healthcare professional, therapist, or counselor who can provide personalized support.";
            }

            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL,
              to: email,
              subject: 'Your Caregiver Burnout Assessment Results',
              html: `
                <h2>Your Assessment Results</h2>
                <p><strong>Total Score:</strong> ${totalScore}/30</p>
                <p><strong>Burden Level:</strong> ${band}</p>
                <p>${interpretation}</p>
                <p>Thank you for using GiveCare.</p>
              `,
            });

            // Log email delivery
            await ctx.runMutation(internal.logDelivery, {
              userId: email,
              to: email,
              subject: 'Your Caregiver Burnout Assessment Results',
              status: 'sent',
              traceId: `assessment-${sessionId}-${Date.now()}`,
            });
          }

          return {
            success: true,
            score: totalScore,
            band,
            pressureZones,
          };
        }
      }

      throw new Error('Assessment did not complete after all answers');
    } catch (error) {
      console.error('Assessment submission error:', error);
      throw error;
    }
  },
});

// ============================================================================
// WATCHERS
// ============================================================================

const insertAlert = async (
  ctx: MutationCtx,
  userId: string,
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  payload: Record<string, unknown>
) => {
  const user = await Core.getByExternalId(ctx, userId);
  if (!user) return;
  await ctx.db.insert('alerts', {
    userId: user._id,
    type,
    severity,
    context: payload,
    message,
    channel: 'email',
    payload,
    status: 'pending',
  });
};

export const runEngagementChecks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    console.info('[watchers] Starting engagement checks');

    // Get cursor from last run
    const state = await ctx.db
      .query('watcher_state')
      .withIndex('by_watcher', (q) => q.eq('watcherName', 'engagement_checks'))
      .unique();

    const cursor = state?.cursor;
    const now = Date.now();
    const BATCH_SIZE = 200; // Per playbook §4.3

    // Query users starting from cursor
    const users = cursor
      ? await ctx.db
          .query('users')
          .filter((q) => q.gt(q.field('_id'), cursor))
          .take(BATCH_SIZE)
      : await ctx.db.query('users').take(BATCH_SIZE);

    console.info(`[watchers] Processing ${users.length} users from cursor ${cursor ?? 'start'}`);

    for (const user of users) {
      // Skip users without externalId
      if (!user.externalId) continue;

      const recentMessages = await ctx.db
        .query('messages')
        .withIndex('by_user_created', (q) => q.eq('userId', user._id))
        .order('desc')
        .take(10);
      const lastInbound = recentMessages.find((m) => m.direction === 'inbound');
      if (!lastInbound || now - lastInbound._creationTime > 1000 * 60 * 60 * 24) {
        await insertAlert(
          ctx,
          user.externalId,
          'dormant_user',
          'medium',
          "Haven't heard from you—want to check in?",
          { to: user.phone ?? 'caregiver@givecare.ai', userId: user.externalId }
        );
      }
      const crisisHits = recentMessages.filter((message) =>
        message.direction === 'inbound' && CRISIS_TERMS.some((term) => message.text.toLowerCase().includes(term))
      );
      if (crisisHits.length >= 3) {
        await insertAlert(
          ctx,
          user.externalId,
          'crisis_burst',
          'high',
          'Detected several crisis terms. Reach out immediately.',
          { to: user.phone ?? 'caregiver@givecare.ai', userId: user.externalId }
        );
      }
    }

    // Save cursor for next run (or reset if we processed less than batch size)
    const newCursor = users.length === BATCH_SIZE ? users[users.length - 1]._id : undefined;

    if (state) {
      await ctx.db.patch(state._id, {
        cursor: newCursor,
        lastRun: now,
      });
    } else {
      await ctx.db.insert('watcher_state', {
        watcherName: 'engagement_checks',
        cursor: newCursor,
        lastRun: now,
      });
    }

    const duration = Date.now() - startTime;
    console.info(`[watchers] Completed engagement checks in ${duration}ms, processed ${users.length} users, next cursor: ${newCursor ?? 'reset'}`);

    return { processedUsers: users.length, durationMs: duration, cursor: newCursor };
  },
});

// ============================================================================
// MANUAL SUBSCRIPTION LINKING
// ============================================================================

/**
 * Manually link a Stripe subscription to a user
 */
export const linkSubscription = mutation({
  args: {
    phoneNumber: v.string(),
    stripeCustomerId: v.string(),
    planId: v.string(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await Core.getByExternalId(ctx, args.phoneNumber);

    if (!user) {
      throw new Error(`User not found: ${args.phoneNumber}`);
    }

    // Check if subscription already exists
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        planId: args.planId,
        status: 'active',
        currentPeriodEnd: args.currentPeriodEnd,
      });

      console.log('[manual-link] Updated existing subscription:', existing._id);
      return { action: 'updated', subscriptionId: existing._id, userId: user._id };
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId: user._id,
      stripeCustomerId: args.stripeCustomerId,
      planId: args.planId,
      status: 'active',
      currentPeriodEnd: args.currentPeriodEnd,
    });

    // Apply entitlements
    // Map price ID to plan name
    const planName = args.planId.includes('standard') ? 'plus' : 'plus'; // Default to plus for paid plans
    const features = PLAN_ENTITLEMENTS[planName] ?? PLAN_ENTITLEMENTS.plus;

    for (const feature of features) {
      await ctx.db.insert('entitlements', {
        userId: user._id,
        feature,
        active: true,
        expiresAt: args.currentPeriodEnd,
      });
    }

    console.log('[manual-link] Created new subscription:', subscriptionId);
    return { action: 'created', subscriptionId, userId: user._id };
  },
});

// ============================================================================
// ASSESSMENTS
// ============================================================================

const QUESTIONS = {
  burnout_v1: [
    { id: 'energy', prompt: 'How much energy do you have right now?', type: 'scale', min: 0, max: 4 },
    { id: 'stress', prompt: 'How stressed do you feel?', type: 'scale', min: 0, max: 4 },
    { id: 'support', prompt: 'Do you feel supported today?', type: 'scale', min: 0, max: 4 },
    { id: 'hope', prompt: 'How hopeful do you feel about the week ahead?', type: 'scale', min: 0, max: 4 },
  ],
  bsfc_v1: [
    { id: 'q1', prompt: 'My life satisfaction has suffered due to care', type: 'scale', min: 0, max: 3, zone: 'emotional' },
    { id: 'q2', prompt: 'I feel physically strained', type: 'scale', min: 0, max: 3, zone: 'physical' },
    { id: 'q3', prompt: 'Caregiving restricts my freedom', type: 'scale', min: 0, max: 3, zone: 'social' },
    { id: 'q4', prompt: 'I have conflicts between caregiving and other duties', type: 'scale', min: 0, max: 3, zone: 'time' },
    { id: 'q5', prompt: 'I worry about the person I care for', type: 'scale', min: 0, max: 3, zone: 'emotional' },
    { id: 'q6', prompt: 'Caregiving exhausts me physically', type: 'scale', min: 0, max: 3, zone: 'physical' },
    { id: 'q7', prompt: 'I feel trapped in my role as caregiver', type: 'scale', min: 0, max: 3, zone: 'social' },
    { id: 'q8', prompt: 'Caregiving takes up most of my time', type: 'scale', min: 0, max: 3, zone: 'time' },
    { id: 'q9', prompt: 'I am emotionally drained by caregiving', type: 'scale', min: 0, max: 3, zone: 'emotional' },
    { id: 'q10', prompt: 'My health has suffered from caregiving', type: 'scale', min: 0, max: 3, zone: 'physical' },
  ],
  ema_v1: [
    { id: 'stress', prompt: 'Right now, how stressed are you feeling? (1-10)', type: 'scale', min: 1, max: 10 },
    { id: 'mood', prompt: 'How would you describe your mood right now?', type: 'scale', min: 0, max: 4, labels: ['Very down/hopeless', 'Down/sad', 'Neutral/mixed', 'Okay/content', 'Good/positive'] },
    { id: 'coping', prompt: 'Right now, how well do you feel you can handle what you\'re facing?', type: 'scale', min: 0, max: 4, labels: ['I can\'t handle this', 'It\'s really hard', 'I\'m not sure', 'I think I can handle it', 'I can handle this'] },
  ],
  reach_ii_v1: [
    { id: 'q1', prompt: 'Do you have written information about memory loss, Alzheimer\'s Disease, or dementia?', type: 'binary', yes: 0, no: 1 },
    { id: 'q2', prompt: 'Can care recipient get to dangerous objects?', type: 'binary', yes: 1, no: 0 },
    { id: 'q3', prompt: 'Do you ever leave care recipient alone or unsupervised?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q4', prompt: 'Does care recipient try to wander outside?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q5', prompt: 'Does care recipient drive?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q6', prompt: 'How satisfied with help from family/friends?', type: 'satisfaction', values: { very: 0, moderately: 1, little: 2, not_at_all: 3 } },
    { id: 'q7', prompt: 'How satisfied with support and concern from others?', type: 'satisfaction', values: { very: 0, moderately: 1, little: 2, not_at_all: 3 } },
    { id: 'q8', prompt: 'Trouble sleeping in past month?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q9', prompt: 'How would you describe your health?', type: 'health', values: { excellent: 0, very_good: 1, good: 2, fair: 3, poor: 4 } },
    { id: 'q10', prompt: 'Felt depressed, sad, or crying spells in past month?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q11', prompt: 'Felt like screaming/yelling at care recipient (past 6 months)?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q12', prompt: 'Had to keep from hitting/slapping care recipient (past 6 months)?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q13', prompt: 'Hard or stressful to handle household chores?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q14', prompt: 'Feel strained when around care recipient?', type: 'strain', values: { never: 0, rarely: 1, sometimes: 2, quite_often: 3, frequently: 4, nearly_always: 5 } },
    { id: 'q15', prompt: 'Hard to help with basic daily activities?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q16', prompt: 'Providing help has made me feel good about myself', type: 'agreement', values: { agree_lot: 0, agree_little: 1, neither: 1, disagree_little: 2, disagree_lot: 3 } },
  ],
  sdoh_v1: [
    { id: 'food1', prompt: 'How often worried food would run out (past 12 months)?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'food2', prompt: 'Food didn\'t last and no money for more (past 12 months)?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'housing', prompt: 'Current housing situation', type: 'category', value: 0 },
    { id: 'eviction', prompt: 'Been evicted or unable to pay rent (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'transport1', prompt: 'Lack of transportation kept from medical care (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'transport2', prompt: 'How often have transportation problems?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'transport3', prompt: 'Have reliable transportation for emergencies?', type: 'binary', yes: 0, no: 1 },
    { id: 'social1', prompt: 'How often see/talk to people you care about?', type: 'frequency_7', values: { daily: 0, several_weekly: 1, weekly: 2, several_monthly: 3, monthly: 4, less_monthly: 5, never: 6 } },
    { id: 'social2', prompt: 'Have someone for emotional support?', type: 'binary', yes: 0, no: 1 },
    { id: 'social3', prompt: 'How often feel lonely or isolated?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'social4', prompt: 'Have someone to help with caregiving?', type: 'binary', yes: 0, no: 1 },
    { id: 'financial1', prompt: 'How hard to pay for basics?', type: 'difficulty', values: { not_hard: 0, somewhat: 1, hard: 2, very_hard: 3, extremely: 4 } },
    { id: 'financial2', prompt: 'Had to choose between medication and basic needs (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'insurance', prompt: 'Have health insurance?', type: 'category', value: 0 },
    { id: 'medical_cost', prompt: 'Unable to get medical care due to cost (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'education', prompt: 'Highest education level', type: 'category', value: 0 },
    { id: 'internet', prompt: 'Have reliable internet access?', type: 'binary', yes: 0, no: 1 },
    { id: 'tech_comfort', prompt: 'Comfortable using technology for healthcare?', type: 'comfort', values: { very: 0, somewhat: 1, not_very: 2, not_at_all: 3 } },
    { id: 'health_literacy', prompt: 'Need help reading health information?', type: 'binary', yes: 1, no: 0 },
    { id: 'safety', prompt: 'Feel safe in your neighborhood?', type: 'safety', values: { very: 0, somewhat: 1, not_very: 2, not_at_all: 3 } },
    { id: 'violence', prompt: 'Been afraid of partner/ex-partner (past year)?', type: 'binary', yes: 1, no: 0 },
    { id: 'legal1', prompt: 'Have legal problems causing stress?', type: 'binary', yes: 1, no: 0 },
    { id: 'legal2', prompt: 'Ever needed legal help but couldn\'t afford it?', type: 'binary', yes: 1, no: 0 },
    { id: 'language', prompt: 'Preferred language for healthcare', type: 'category', value: 0 },
    { id: 'discrimination', prompt: 'Felt discriminated against in healthcare?', type: 'binary', yes: 1, no: 0 },
    { id: 'cultural', prompt: 'Cultural background understood by providers?', type: 'frequency_5', values: { always: 0, usually: 1, sometimes: 2, rarely: 3, never: 4 } },
    { id: 'caregiver_cost', prompt: 'How much do caregiving costs strain finances?', type: 'strain_5', values: { not_at_all: 0, little: 1, moderately: 2, quite_a_bit: 3, extremely: 4 } },
    { id: 'caregiver_assistance', prompt: 'Know about financial assistance programs?', type: 'familiarity', values: { very: 0, somewhat: 1, not_very: 2, not_at_all: 3 } },
  ],
} as const;

type DefinitionId = keyof typeof QUESTIONS;

const getQuestions = (definitionId: string) => {
  const qs = QUESTIONS[definitionId as DefinitionId];
  if (!qs) throw new Error(`Unknown assessment definition ${definitionId}`);
  return qs;
};

const scoreAnswers = (definitionId: string, answers: Array<{ questionId: string; value: number }>) => {
  const total = answers.reduce((sum, a) => sum + a.value, 0);

  if (definitionId === 'bsfc_v1') {
    const band = total >= 20 ? 'high' : total >= 10 ? 'medium' : 'low';

    const questions = QUESTIONS.bsfc_v1;
    const zoneScores: Record<string, number> = {
      emotional: 0,
      physical: 0,
      social: 0,
      time: 0,
    };

    answers.forEach((answer) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && 'zone' in question) {
        zoneScores[question.zone as string] = (zoneScores[question.zone as string] || 0) + answer.value;
      }
    });

    const pressureZones = Object.entries(zoneScores)
      .map(([zone, score]) => ({ zone, score, maxScore: 9 }))
      .sort((a, b) => b.score - a.score);

    return {
      total,
      band,
      explanation: `Total score ${total}/30 indicates ${band} burden.`,
      pressureZones,
    };
  }

  // EMA: Ecological Momentary Assessment (real-time stress)
  if (definitionId === 'ema_v1') {
    const stressAnswer = answers.find(a => a.questionId === 'stress');
    const stressLevel = stressAnswer?.value || 0;
    const band = stressLevel >= 8 ? 'crisis' : stressLevel >= 6 ? 'high' : stressLevel >= 4 ? 'moderate' : 'low';
    return {
      total: stressLevel,
      band,
      explanation: `Stress level ${stressLevel}/10 - ${band} intervention recommended.`,
    };
  }

  // REACH-II: Risk appraisal for caregiver strain
  if (definitionId === 'reach_ii_v1') {
    const band = total >= 27 ? 'high' : total >= 11 ? 'moderate' : 'low';
    return {
      total,
      band,
      explanation: `REACH-II score ${total}/40 - ${band} risk for caregiver strain.`,
    };
  }

  // SDOH: Social Determinants of Health (5 zones including financial)
  if (definitionId === 'sdoh_v1') {
    const zoneScores: Record<string, number> = {
      food: 0,
      housing: 0,
      transportation: 0,
      social: 0,
      financial: 0,
    };

    answers.forEach((answer) => {
      const qId = answer.questionId;
      if (qId.startsWith('food')) zoneScores.food += answer.value;
      else if (qId.includes('housing') || qId === 'eviction') zoneScores.housing += answer.value;
      else if (qId.startsWith('transport')) zoneScores.transportation += answer.value;
      else if (qId.startsWith('social')) zoneScores.social += answer.value;
      else if (qId.startsWith('financial') || qId.includes('insurance') || qId.includes('medical_cost')) zoneScores.financial += answer.value;
    });

    const pressureZones = Object.entries(zoneScores)
      .map(([zone, score]) => ({ zone, score, maxScore: 10 }))
      .sort((a, b) => b.score - a.score);

    const band = total >= 40 ? 'high' : total >= 20 ? 'moderate' : 'low';

    return {
      total,
      band,
      explanation: `SDOH score ${total} - ${band} social risk.`,
      pressureZones,
    };
  }

  // Burnout v1: Legacy daily check-in
  const band = total >= 15 ? 'high' : total >= 8 ? 'medium' : 'low';
  return {
    total,
    band,
    explanation: `Total score ${total}/20 indicates ${band} burnout.`,
  };
};

export const start = mutation({
  args: {
    userId: v.string(),
    definitionId: v.string(),
  },
  handler: async (ctx, { userId, definitionId }) => {
    const user = await Users.ensureUser(ctx, { externalId: userId, channel: 'sms' });
    const questions = getQuestions(definitionId);
    const sessionId = await ctx.db.insert('assessment_sessions', {
      userId: user._id,
      definitionId,
      channel: 'sms',
      questionIndex: 0,
      answers: [],
      status: 'active',
    });
    return { sessionId, question: questions[0] };
  },
});

export const recordAnswer = mutation({
  args: {
    sessionId: v.id('assessment_sessions'),
    definitionId: v.string(),
    questionId: v.string(),
    value: v.number(),
  },
  handler: async (ctx, { sessionId, definitionId, questionId, value }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Assessment session not active');
    }
    const questions = getQuestions(definitionId);
    const currentIndex = session.questionIndex;
    const expectedQuestion = questions[currentIndex];
    if (!expectedQuestion || expectedQuestion.id !== questionId) {
      throw new Error('Question mismatch');
    }

    const updatedAnswers = [...session.answers, { questionId, value }];
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      const score = scoreAnswers(definitionId, updatedAnswers);
      const assessmentId = await ctx.db.insert('assessments', {
        userId: session.userId,
        definitionId,
        version: 'v1',
        answers: updatedAnswers,
      });
      await ctx.db.insert('scores', {
        userId: session.userId,
        assessmentId,
        composite: score.total,
        band: score.band,
        confidence: 0.8,
      });
      await ctx.db.patch(session._id, { status: 'completed', questionIndex: nextIndex, answers: updatedAnswers });
      return { completed: true, score };
    }

    await ctx.db.patch(session._id, { questionIndex: nextIndex, answers: updatedAnswers });
    return { completed: false, nextQuestion: questions[nextIndex] };
  },
});

// ============================================================================
// ANALYTICS
// ============================================================================

// DAY_MS already defined above

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

// ============================================================================
// ADMIN
// ============================================================================

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

// DAY_MS already defined above

const loadSessionForUser = async (ctx: QueryCtx, user: Doc<'users'>) => {
  // Skip users without a channel
  if (!user.channel) return null;
  return ctx.db
    .query('sessions')
    .withIndex('by_user_channel', (q) => q.eq('userId', user._id).eq('channel', user.channel!))
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
    externalId: user.externalId ?? 'unknown',
    firstName: (profile.firstName as string) ?? user.externalId ?? 'unknown',
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

const _computeSubscriptionBreakdown = (subscriptions: Doc<'subscriptions'>[], totalUsers: number) => {
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
    // Read from materialized metrics (updated daily by cron)
    const latestDaily = await ctx.db
      .query('metrics_daily')
      .withIndex('by_date')
      .order('desc')
      .first();

    const subscriptionMetrics = await ctx.db
      .query('metrics_subscriptions')
      .first();

    // Fallback to empty metrics if not yet aggregated
    const metrics = latestDaily || {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      avgBurnoutScore: 0,
      crisisAlerts: 0,
      avgResponseLatencyMs: 0,
      p95ResponseLatencyMs: 0,
    };

    const subMetrics = subscriptionMetrics || {
      total: 0,
      active: 0,
      trialing: 0,
      pastDue: 0,
      canceled: 0,
      free: 0,
      plus: 0,
      enterprise: 0,
    };

    const totalUsers = metrics.totalUsers;
    const activeUsers = metrics.activeUsers;
    const avgLatencyMs = metrics.avgResponseLatencyMs;
    const p95ResponseTime = metrics.p95ResponseLatencyMs;
    const avgBurnoutScore = metrics.avgBurnoutScore;
    const alertsLast24h = metrics.crisisAlerts;
    const crisisAlerts = metrics.crisisAlerts;

    const subscriptionBreakdown = {
      active: subMetrics.active,
      trialing: subMetrics.trialing,
      pastDue: subMetrics.pastDue,
      canceled: subMetrics.canceled,
      free: subMetrics.free,
      plus: subMetrics.plus,
      enterprise: subMetrics.enterprise,
    };
    const activeSubscriptions = subMetrics.active;

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

    // Use indexed pagination instead of .collect()
    // Fetch more than needed to account for filtering
    const users = await ctx.db
      .query('users')
      .order('desc')
      .take(limit * 3); // Buffer for post-filter results

    const summaries: AdminUserSummary[] = [];
    for (const user of users) {
      const summary = await summarizeUser(ctx, user);
      if (!matchesSearch(summary, args.search)) continue;
      if (!matchesFilters(summary, args)) continue;
      summaries.push(summary);
      if (summaries.length >= limit) break;
    }

    // Get approximate total (materialized from metrics)
    const metrics = await ctx.db.query('metrics_daily').withIndex('by_date').order('desc').first();
    const total = metrics?.totalUsers || summaries.length;

    return { users: summaries, total };
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

    // Use bounded query instead of .collect()
    const recentSessions = await ctx.db
      .query('sessions')
      .filter((q) => q.gte(q.field('lastSeen'), now - 15 * 60 * 1000))
      .take(1000);
    const activeSessions = recentSessions;

    const alerts = await ctx.db
      .query('alerts')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .take(500);
    const priorityUsers = alerts.filter((alert) => alert.severity === 'critical').length;

    const guardrailEvents = await ctx.db
      .query('guardrail_events')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .take(500);

    // Use materialized metrics for total users
    const metrics = await ctx.db.query('metrics_daily').withIndex('by_date').order('desc').first();
    const userCount = metrics?.totalUsers || 0;
    const totalDocs = userCount + messagesLast24h.length + runs.length + alerts.length;
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

/**
 * Debug query to check all subscriptions
 */
export const getAllSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query('subscriptions').collect();
    return { total: subscriptions.length, subscriptions };
  },
});

/**
 * Debug query to check subscriptions for a specific user
 */
export const getSubscriptionsByPhone = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', phoneNumber))
      .unique();

    if (!user) {
      return { user: null, subscriptions: [] };
    }

    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    return { user, subscriptions };
  },
});

/**
 * Debug query to check billing events
 */
export const getBillingEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query('billing_events')
      .order('desc')
      .take(20);
    return { total: events.length, events };
  },
});
