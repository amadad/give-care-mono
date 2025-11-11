/**
 * Engagement Monitoring Workflow
 *
 * Detects users who haven't engaged recently and sends re-engagement messages.
 * Runs every 24 hours via cron.
 */

import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';

// ============================================================================
// ENGAGEMENT MONITORING ACTION
// ============================================================================

/**
 * Monitor user engagement and send re-engagement messages to silent users
 * Runs every 24 hours via cron
 */
export const monitorEngagement = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.internal.getAllUsers, {});

    for (const u of users) {
      // Check recent agent runs (last 7 days)
      const recent = await ctx.runQuery(internal.workflows.engagement.getRecentRuns, {
        userId: u._id,
        days: 7,
      });

      // If no runs in last 7 days, send re-engagement message
      if (recent.length === 0 && u.phone) {
        const name = ((u.metadata as any)?.profile?.firstName as string) || 'there';
        const msg = `Hi ${name}, we haven't heard from you in a while. How are you doing? Reply anytime if you need support.`;

        await ctx.runAction(internal.inbound.sendSmsResponse, {
          to: u.phone,
          userId: u.externalId,
          text: msg,
        });
      }
    }
  },
});

// ============================================================================
// HELPER QUERIES
// ============================================================================

/**
 * Get recent agent runs for a user (within last N days)
 * Note: agent_runs table uses userId (externalId string), not _id
 */
export const getRecentRuns = internalQuery({
  args: {
    userId: v.id('users'),
    days: v.number(),
  },
  handler: async (ctx, { userId, days }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    // Note: agent_runs uses userId (externalId string), not _id
    // And uses _creationTime, not timestamp
    return await ctx.db
      .query('agent_runs')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), user.externalId),
          q.gte(q.field('_creationTime'), cutoff)
        )
      )
      .collect();
  },
});

