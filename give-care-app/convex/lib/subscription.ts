/**
 * Subscription status helpers
 *
 * Provides utilities for checking subscription status including grace periods.
 * Grace period: 3 days after cancellation before hard block.
 */

import type { Doc, Id } from '../_generated/dataModel';
import type { QueryCtx, MutationCtx } from '../_generated/server';

const GRACE_PERIOD_DAYS = 3;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

/**
 * Check if subscription is currently in grace period
 * Grace period applies when subscription is canceled but within 3 days of cancellation
 */
export function isInGracePeriod(subscription: Doc<'subscriptions'>): boolean {
  if (!subscription.gracePeriodEndsAt) return false;
  return Date.now() < subscription.gracePeriodEndsAt;
}

/**
 * Check if subscription is active (including grace period)
 * Active means:
 * - status is 'active' or 'trialing'
 * - OR status is 'past_due' and currentPeriodEnd hasn't passed
 * - OR subscription is in grace period (canceled but within 3 days)
 */
export function isSubscriptionActive(
  subscription: Doc<'subscriptions'> | null | undefined
): boolean {
  if (!subscription) return false;

  // Active or trialing = active
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return true;
  }

  // Past due but still in billing period = active
  if (subscription.status === 'past_due' && Date.now() < subscription.currentPeriodEnd) {
    return true;
  }

  // Canceled but in grace period = active
  if (subscription.status === 'canceled' && isInGracePeriod(subscription)) {
    return true;
  }

  return false;
}

/**
 * Require an active subscription for a user
 * Throws error if subscription is not active
 * Returns subscription if active
 */
export async function requireActiveSubscription(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<Doc<'subscriptions'>> {
  const subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();

  if (!subscription || !isSubscriptionActive(subscription)) {
    throw new Error('Active subscription required');
  }

  return subscription;
}

/**
 * Calculate grace period end date from cancellation time
 */
export function calculateGracePeriodEnd(canceledAt: number): number {
  return canceledAt + GRACE_PERIOD_MS;
}

/**
 * Get user's subscription status
 * Returns null if no subscription exists
 */
export async function getUserSubscription(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<Doc<'subscriptions'> | null> {
  return await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
}
