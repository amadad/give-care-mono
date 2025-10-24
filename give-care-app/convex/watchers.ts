/**
 * Engagement Watcher System (Task 11)
 *
 * Background watchers to detect disengagement patterns, high-stress bursts,
 * and wellness trends for proactive intervention.
 *
 * Features:
 * - Sudden drop detection (averageMessagesPerDay > 3, recentMessageCount === 0)
 * - High-stress burst detection (3+ crisis keywords in 6 hours)
 * - Wellness trend detection (4 consecutive worsening scores)
 *
 * Cron Schedule:
 * - Engagement watcher: Every 6 hours
 * - Wellness trend watcher: Weekly (Monday 9am PT / 16:00 UTC)
 */

import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { logSafe } from './utils/logger';
import type { Id } from './_generated/dataModel';

/**
 * Engagement Watcher
 * Runs every 6 hours to detect:
 * 1. Sudden drop: High engagement (>3 msgs/day) → 0 messages in 24h
 * 2. Crisis burst: 3+ crisis keywords in 6 hours
 *
 * OPTIMIZED: Batch queries to eliminate N+1 pattern
 */
export const watchCaregiverEngagement = internalAction({
  handler: async (ctx) => {
    logSafe('Watcher', 'Starting engagement monitoring');

    const now = Date.now();
    const sixHoursAgo = now - 6 * 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Query 1: Get all active users
    const users = await ctx.runQuery(internal.watchers._getActiveUsers);
    logSafe('Watcher', 'Monitoring active users', { count: users.length });

    if (users.length === 0) {
      logSafe('Watcher', 'No active users to monitor');
      return {
        suddenDrops: 0,
        crisisBursts: 0,
        usersMonitored: 0,
      };
    }

    // Query 2: Get all unresolved alerts for all active users in one batch query
    const userIds = users.map((u) => u._id);
    const existingAlerts = await ctx.runQuery(internal.watchers._getAllUnresolvedAlerts, {
      userIds,
    });

    // Build lookup map: userId -> Set<type:pattern>
    const alertLookup = new Map<string, Set<string>>();
    for (const alert of existingAlerts) {
      const key = `${alert.userId}`;
      if (!alertLookup.has(key)) {
        alertLookup.set(key, new Set());
      }
      alertLookup.get(key)!.add(`${alert.type}:${alert.pattern}`);
    }

    // Collect alerts to create (batch mutations at the end)
    const alertsToCreate: Array<{
      userId: Id<'users'>;
      type: string;
      pattern: string;
      severity: string;
      createdAt: number;
    }> = [];

    let suddenDropCount = 0;
    let crisisBurstCount = 0;

    // Process each user (NO database queries in loop)
    for (const user of users) {
      try {
        const userId = user._id;
        const userAlerts = alertLookup.get(userId) || new Set();

        // Pattern 1: Sudden Drop Detection
        const averageMessagesPerDay = calculateAverageMessagesPerDay(user);
        const recentMessageCount = countRecentMessages(user.recentMessages || [], oneDayAgo);

        if (averageMessagesPerDay > 3 && recentMessageCount === 0) {
          // Check if alert already exists (in-memory lookup)
          if (!userAlerts.has('disengagement:sudden_drop')) {
            alertsToCreate.push({
              userId,
              type: 'disengagement',
              pattern: 'sudden_drop',
              severity: 'medium',
              createdAt: now,
            });
            suddenDropCount++;
            logSafe('Watcher', 'Sudden drop detected', { userId });
          }
        }

        // Pattern 2: High-Stress Burst Detection
        const crisisKeywordCount = countCrisisKeywords(user.recentMessages || [], sixHoursAgo);

        if (crisisKeywordCount >= 3) {
          // Check if alert already exists (in-memory lookup)
          if (!userAlerts.has('high_stress:crisis_burst')) {
            alertsToCreate.push({
              userId,
              type: 'high_stress',
              pattern: 'crisis_burst',
              severity: 'urgent',
              createdAt: now,
            });
            crisisBurstCount++;
            logSafe('Watcher', 'Crisis burst detected', { userId, count: crisisKeywordCount });
          }
        }
      } catch (error) {
        logSafe('Watcher', 'Error processing user', { userId: user._id, error: String(error) });
      }
    }

    // Batch mutation: Create all alerts at once
    if (alertsToCreate.length > 0) {
      await ctx.runMutation(internal.watchers._createAlertsBatch, { alerts: alertsToCreate });
    }

    logSafe('Watcher', 'Engagement monitoring complete', {
      suddenDrops: suddenDropCount,
      crisisBursts: crisisBurstCount,
    });
    return {
      suddenDrops: suddenDropCount,
      crisisBursts: crisisBurstCount,
      usersMonitored: users.length,
    };
  },
});

/**
 * Wellness Trend Watcher
 * Runs weekly (Monday 9am PT / 16:00 UTC) to detect:
 * - Worsening wellness scores over 4 consecutive weeks
 *
 * OPTIMIZED: Batch queries to eliminate N+1 pattern
 */
export const watchWellnessTrends = internalAction({
  handler: async (ctx) => {
    logSafe('Watcher', 'Starting wellness trend monitoring');

    const now = Date.now();

    // Query 1: Get all active users
    const users = await ctx.runQuery(internal.watchers._getActiveUsers);
    logSafe('Watcher', 'Monitoring wellness trends', { count: users.length });

    if (users.length === 0) {
      logSafe('Watcher', 'No active users to monitor');
      return {
        wellnessDeclines: 0,
        usersMonitored: 0,
      };
    }

    // Query 2: Get all unresolved alerts for all active users
    const userIds = users.map((u) => u._id);
    const existingAlerts = await ctx.runQuery(internal.watchers._getAllUnresolvedAlerts, {
      userIds,
    });

    // Build lookup map: userId -> Set<type:pattern>
    const alertLookup = new Map<string, Set<string>>();
    for (const alert of existingAlerts) {
      const key = `${alert.userId}`;
      if (!alertLookup.has(key)) {
        alertLookup.set(key, new Set());
      }
      alertLookup.get(key)!.add(`${alert.type}:${alert.pattern}`);
    }

    // Query 3: Batch-load wellness scores for all users
    const allWellnessScores = await ctx.runQuery(internal.watchers._getBatchWellnessScores, {
      userIds,
      limit: 4,
    });

    // Build lookup map: userId -> scores[]
    const scoresLookup = new Map<string, any[]>();
    for (const score of allWellnessScores) {
      const key = `${score.userId}`;
      if (!scoresLookup.has(key)) {
        scoresLookup.set(key, []);
      }
      scoresLookup.get(key)!.push(score);
    }

    // Sort each user's scores by recordedAt DESC (most recent first)
    for (const [userId, scores] of scoresLookup.entries()) {
      scores.sort((a, b) => b.recordedAt - a.recordedAt);
      // Keep only latest 4
      scoresLookup.set(userId, scores.slice(0, 4));
    }

    let wellnessDeclineCount = 0;

    // Process each user (NO database queries in loop)
    for (const user of users) {
      try {
        const userId = user._id;
        const scores = scoresLookup.get(userId) || [];

        // Require at least 4 scores for trend analysis
        if (scores.length < 4) {
          continue;
        }

        // Check for worsening trend (higher score = worse)
        const isWorsening = isWorseningTrend(scores);

        if (isWorsening) {
          // Check if alert already exists (in-memory lookup)
          const userAlerts = alertLookup.get(userId) || new Set();
          if (!userAlerts.has('wellness_decline:worsening_scores')) {
            // Create alert
            await ctx.runMutation(internal.watchers.createAlert, {
              userId: user._id,
              type: 'wellness_decline',
              pattern: 'worsening_scores',
              severity: 'medium',
              createdAt: now,
            });

            // Increment count (wellness decline detected)
            wellnessDeclineCount++;
            logSafe('Watcher', 'Wellness decline detected', { userId: user._id });

            // Check subscription status before sending SMS
            const isSubscribed =
              user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

            if (!isSubscribed) {
              logSafe('Watcher', 'Skipping SMS - no active subscription', {
                userId: user._id,
                status: user.subscriptionStatus,
              });
              continue;
            }

            // Send proactive SMS (only if user has phone number)
            if (!user.phoneNumber) {
              logSafe('Watcher', 'Cannot send SMS - missing phone', { userId: user._id });
              continue;
            }

            const message = user.firstName
              ? `Hi ${user.firstName}, I've noticed your stress levels trending up over the past few weeks. Let's talk about what's changed and how I can help. 💙`
              : `I've noticed your stress levels trending up over the past few weeks. Let's talk about what's changed and how I can help. 💙`;

            try {
              await ctx.runAction(internal.twilio.sendOutboundSMS, {
                to: user.phoneNumber,
                body: message,
              });
              logSafe('Watcher', 'SMS sent successfully', { userId: user._id });
            } catch (smsError) {
              logSafe('Watcher', 'SMS sending failed (non-fatal)', {
                userId: user._id,
                error: String(smsError),
              });
              // Continue - alert was already created and counted
            }
          }
        }
      } catch (error) {
        logSafe('Watcher', 'Error processing wellness trend', { userId: user._id, error: String(error) });
      }
    }

    logSafe('Watcher', 'Wellness trend monitoring complete', { wellnessDeclines: wellnessDeclineCount });
    return {
      wellnessDeclines: wellnessDeclineCount,
      usersMonitored: users.length,
    };
  },
});

/**
 * Helper: Calculate average messages per day
 */
function calculateAverageMessagesPerDay(user: any): number {
  const totalMessages = user.totalInteractionCount || 0;
  const conversationStart = user.conversationStartDate || Date.now();
  const daysElapsed = (Date.now() - conversationStart) / (24 * 60 * 60 * 1000);

  if (daysElapsed < 1) {
    return 0; // New user, not enough data
  }

  return totalMessages / daysElapsed;
}

/**
 * Helper: Count recent messages (within time window)
 */
function countRecentMessages(messages: any[], sinceTimestamp: number): number {
  return messages.filter((m) => m.timestamp >= sinceTimestamp).length;
}

/**
 * Helper: Count crisis keywords in recent messages
 */
function countCrisisKeywords(messages: any[], sinceTimestamp: number): number {
  const crisisRegex = /help|overwhelm|can't do this|give up/i;
  const recentMessages = messages.filter((m) => m.timestamp >= sinceTimestamp);

  return recentMessages.filter((m) => crisisRegex.test(m.content)).length;
}

/**
 * Helper: Check if wellness scores show worsening trend
 * Scores are ordered DESC by recordedAt (most recent first)
 */
function isWorseningTrend(scores: any[]): boolean {
  // Need to reverse to get chronological order
  const chronologicalScores = [...scores].reverse();

  // Check if each score is higher than the previous (worsening)
  for (let i = 1; i < chronologicalScores.length; i++) {
    if (chronologicalScores[i].overallScore <= chronologicalScores[i - 1].overallScore) {
      return false; // Not consistently worsening
    }
  }

  return true; // All scores are increasing (worsening)
}

/**
 * Query: Get all active users
 */
export const getActiveUsers = internalAction({
  handler: async (ctx) => {
    return await ctx.runQuery(internal.watchers._getActiveUsers);
  },
});

import { internalQuery } from './_generated/server';

/**
 * Internal query: Get active users (limited to prevent unbounded queries)
 *
 * Note: Returns first 100 active users. For processing all users, implement
 * cursor-based pagination or batch processing with multiple calls.
 */
export const _getActiveUsers = internalQuery({
  handler: async (ctx) => {
    // Limit query to first 100 active users to prevent unbounded collect()
    // Watchers processing large user bases should implement batching
    const users = await ctx.db
      .query('users')
      .withIndex('by_journey', (q) => q.eq('journeyPhase', 'active'))
      .take(100);

    return users;
  },
});

/**
 * Query: Get latest wellness scores for user
 */
export const getLatestWellnessScores = internalQuery({
  args: {
    userId: v.id('users'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q) => q.eq('userId', args.userId))
      .order('desc') // Most recent first
      .take(args.limit);

    return scores;
  },
});

/**
 * Query: Find existing alert to prevent duplicates
 */
export const findExistingAlert = internalQuery({
  args: {
    userId: v.id('users'),
    type: v.string(),
    pattern: v.string(),
  },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query('alerts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('type'), args.type),
          q.eq(q.field('pattern'), args.pattern),
          q.eq(q.field('resolvedAt'), undefined) // Only unresolved alerts
        )
      )
      .first();

    return alerts;
  },
});

/**
 * Mutation: Create alert
 */
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

export const createAlert = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
    pattern: v.string(),
    severity: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const alertId = await ctx.db.insert('alerts', {
      userId: args.userId,
      type: args.type,
      pattern: args.pattern,
      severity: args.severity,
      createdAt: args.createdAt,
    });

    return alertId;
  },
});

/**
 * BATCH QUERY OPTIMIZATION
 * New functions to eliminate N+1 query pattern
 */

/**
 * Query: Get all unresolved alerts for multiple users (batch query)
 * Eliminates N queries by loading all alerts in one query
 */
export const _getAllUnresolvedAlerts = internalQuery({
  args: {
    userIds: v.array(v.id('users')),
  },
  handler: async (ctx, args) => {
    if (args.userIds.length === 0) {
      return [];
    }

    // FIXED: Use indexed query per user instead of loading entire alerts table
    // This prevents unbounded memory usage while still being more efficient than N+1
    const unresolvedAlerts = [];

    for (const userId of args.userIds) {
      const userAlerts = await ctx.db
        .query('alerts')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .filter((q) => q.eq(q.field('resolvedAt'), undefined))
        .take(10); // Limit alerts per user

      unresolvedAlerts.push(...userAlerts);
    }

    return unresolvedAlerts;
  },
});

/**
 * Query: Get wellness scores for multiple users (batch query)
 * Eliminates N queries by loading all scores in one query
 */
export const _getBatchWellnessScores = internalQuery({
  args: {
    userIds: v.array(v.id('users')),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.userIds.length === 0) {
      return [];
    }

    // FIXED: Use indexed query per user instead of loading entire wellnessScores table
    // This prevents unbounded memory usage
    const userScores = [];

    for (const userId of args.userIds) {
      const scores = await ctx.db
        .query('wellnessScores')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .take(args.limit); // Limit scores per user (typically 4 for trend detection)

      userScores.push(...scores);
    }

    return userScores;
  },
});

/**
 * Mutation: Create multiple alerts in batch
 * Eliminates N mutations by batching inserts
 */
export const _createAlertsBatch = internalMutation({
  args: {
    alerts: v.array(
      v.object({
        userId: v.id('users'),
        type: v.string(),
        pattern: v.string(),
        severity: v.string(),
        createdAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const alertIds: Id<'alerts'>[] = [];

    for (const alert of args.alerts) {
      const alertId = await ctx.db.insert('alerts', {
        userId: alert.userId,
        type: alert.type,
        pattern: alert.pattern,
        severity: alert.severity,
        createdAt: alert.createdAt,
      });
      alertIds.push(alertId);
    }

    return alertIds;
  },
});
