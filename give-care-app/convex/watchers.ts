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
 */
export const watchCaregiverEngagement = internalAction({
  handler: async (ctx) => {
    logSafe('Watcher', 'Starting engagement monitoring');

    const now = Date.now();
    const sixHoursAgo = now - 6 * 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Get all active users
    const users = await ctx.runQuery(internal.watchers._getActiveUsers);
    logSafe('Watcher', 'Monitoring active users', { count: users.length });

    let suddenDropCount = 0;
    let crisisBurstCount = 0;

    for (const user of users) {
      try {
        // Pattern 1: Sudden Drop Detection
        const averageMessagesPerDay = calculateAverageMessagesPerDay(user);
        const recentMessageCount = countRecentMessages(user.recentMessages || [], oneDayAgo);

        if (averageMessagesPerDay > 3 && recentMessageCount === 0) {
          // Check if alert already exists (no duplicates)
          const existingAlert = await ctx.runQuery(internal.watchers.findExistingAlert, {
            userId: user._id,
            type: 'disengagement',
            pattern: 'sudden_drop',
          });

          if (!existingAlert) {
            await ctx.runMutation(internal.watchers.createAlert, {
              userId: user._id,
              type: 'disengagement',
              pattern: 'sudden_drop',
              severity: 'medium',
              createdAt: now,
            });
            suddenDropCount++;
            logSafe('Watcher', 'Sudden drop detected', { userId: user._id });
          }
        }

        // Pattern 2: High-Stress Burst Detection
        const crisisKeywordCount = countCrisisKeywords(user.recentMessages || [], sixHoursAgo);

        if (crisisKeywordCount >= 3) {
          // Check if alert already exists (no duplicates)
          const existingAlert = await ctx.runQuery(internal.watchers.findExistingAlert, {
            userId: user._id,
            type: 'high_stress',
            pattern: 'crisis_burst',
          });

          if (!existingAlert) {
            await ctx.runMutation(internal.watchers.createAlert, {
              userId: user._id,
              type: 'high_stress',
              pattern: 'crisis_burst',
              severity: 'urgent',
              createdAt: now,
            });
            crisisBurstCount++;
            logSafe('Watcher', 'Crisis burst detected', { userId: user._id, count: crisisKeywordCount });
          }
        }
      } catch (error) {
        logSafe('Watcher', 'Error processing user', { userId: user._id, error: String(error) });
      }
    }

    logSafe('Watcher', 'Engagement monitoring complete', { suddenDrops: suddenDropCount, crisisBursts: crisisBurstCount });
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
 */
export const watchWellnessTrends = internalAction({
  handler: async (ctx) => {
    logSafe('Watcher', 'Starting wellness trend monitoring');

    const now = Date.now();

    // Get all active users
    const users = await ctx.runQuery(internal.watchers._getActiveUsers);
    logSafe('Watcher', 'Monitoring wellness trends', { count: users.length });

    let wellnessDeclineCount = 0;

    for (const user of users) {
      try {
        // Get last 4 wellness scores (by recordedAt DESC)
        const scores = await ctx.runQuery(internal.watchers.getLatestWellnessScores, {
          userId: user._id,
          limit: 4,
        });

        // Require at least 4 scores for trend analysis
        if (scores.length < 4) {
          continue;
        }

        // Check for worsening trend (higher score = worse)
        const isWorsening = isWorseningTrend(scores);

        if (isWorsening) {
          // Check if alert already exists (no duplicates)
          const existingAlert = await ctx.runQuery(internal.watchers.findExistingAlert, {
            userId: user._id,
            type: 'wellness_decline',
            pattern: 'worsening_scores',
          });

          if (!existingAlert) {
            // Create alert
            await ctx.runMutation(internal.watchers.createAlert, {
              userId: user._id,
              type: 'wellness_decline',
              pattern: 'worsening_scores',
              severity: 'medium',
              createdAt: now,
            });

            // Check subscription status before sending SMS
            const isSubscribed =
              user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

            if (!isSubscribed) {
              logSafe('Watcher', 'Skipping SMS - no active subscription', {
                userId: user._id,
                status: user.subscriptionStatus,
              });
              wellnessDeclineCount++;
              continue;
            }

            // Send proactive SMS (only if user has phone number)
            if (!user.phoneNumber) {
              logSafe('Watcher', 'Cannot send SMS - missing phone', { userId: user._id });
              wellnessDeclineCount++;
              continue;
            }

            const message = user.firstName
              ? `Hi ${user.firstName}, I've noticed your stress levels trending up over the past few weeks. Let's talk about what's changed and how I can help. 💙`
              : `I've noticed your stress levels trending up over the past few weeks. Let's talk about what's changed and how I can help. 💙`;

            await ctx.runAction(internal.twilio.sendOutboundSMS, {
              to: user.phoneNumber,
              body: message,
            });

            wellnessDeclineCount++;
            logSafe('Watcher', 'Wellness decline detected, SMS sent', { userId: user._id });
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

export const _getActiveUsers = internalQuery({
  handler: async (ctx) => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_journey', (q) => q.eq('journeyPhase', 'active'))
      .collect();

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
