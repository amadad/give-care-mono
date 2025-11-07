import { internalQuery } from '../_generated/server';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { v } from 'convex/values';

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<boolean> => {
  const subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('status'), 'active'))
    .first();

  if (!subscription) return false;

  // Check if subscription is not expired
  return subscription.currentPeriodEnd > Date.now();
};

/**
 * Check if user has active subscription (internal query wrapper)
 */
export const hasActiveSubscriptionQuery = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return hasActiveSubscription(ctx, userId);
  },
});

/**
 * Get signup URL for non-subscribers
 */
export const getSignupUrl = (phone?: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://givecare.com';
  const signupPath = '/signup';

  if (phone) {
    const encoded = encodeURIComponent(phone);
    return `${baseUrl}${signupPath}?phone=${encoded}`;
  }

  return `${baseUrl}${signupPath}`;
};
