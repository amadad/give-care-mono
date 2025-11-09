import { internalMutation } from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import * as Users from '../model/users';
import { CRISIS_TERMS } from '../lib/constants';

const insertAlert = async (
  ctx: MutationCtx,
  userId: string,
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  payload: Record<string, unknown>
) => {
  const user = await Users.getByExternalId(ctx, userId);
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
