import { query } from '../_generated/server';
import { v } from 'convex/values';

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
