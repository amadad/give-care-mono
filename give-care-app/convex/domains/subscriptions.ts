/**
 * Subscription helpers for admin tooling.
 */

import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Core from '../core';
import { PLAN_ENTITLEMENTS } from '../lib/billing';

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

    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        planId: args.planId,
        status: 'active',
        currentPeriodEnd: args.currentPeriodEnd,
      });
      console.log('[manual-link] Updated existing subscription:', existing._id);
      return { action: 'updated', subscriptionId: existing._id, userId: user._id };
    }

    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId: user._id,
      stripeCustomerId: args.stripeCustomerId,
      planId: args.planId,
      status: 'active',
      currentPeriodEnd: args.currentPeriodEnd,
    });

    const planName = args.planId.includes('standard') ? 'plus' : 'plus';
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
