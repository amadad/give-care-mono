import { internalMutation } from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import * as Users from '../model/users';

const CRISIS_TERMS = ['suicide', 'kill myself', 'end it'];

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
    const now = Date.now();
    const users = await ctx.db.query('users').take(1000);
    for (const user of users) {
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
    return { processedUsers: users.length };
  },
});
