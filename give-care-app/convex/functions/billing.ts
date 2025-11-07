import { mutation } from '../_generated/server';
import type { MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import * as Users from '../model/users';

const PLAN_ENTITLEMENTS: Record<string, string[]> = {
  free: ['assessments'],
  plus: ['assessments', 'interventions', 'resources'],
  enterprise: ['assessments', 'interventions', 'resources', 'priority_support'],
};

const applyEntitlements = async (ctx: MutationCtx, userId: string, plan: string, expiresAt?: number) => {
  const user = await Users.getByExternalId(ctx, userId);
  if (!user) return;
  const features = PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.free;
  for (const feature of features) {
    await ctx.db.insert('entitlements', {
      userId: user._id,
      feature,
      active: true,
      expiresAt,
    });
  }
};

export const applyStripeEvent = mutation({
  args: {
    id: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, { id, type, payload }) => {
    const existing = await ctx.db
      .query('billing_events')
      .withIndex('by_event', (q) => q.eq('stripeEventId', id))
      .unique();
    if (existing) return;

    const customerId = payload?.data?.object?.customer ?? payload?.customer;
    const planId = payload?.data?.object?.plan?.id ?? payload?.plan_id ?? 'free';
    const status = payload?.data?.object?.status ?? 'active';
    const currentPeriodEnd = payload?.data?.object?.current_period_end ?? Date.now();
    const externalUserId = payload?.metadata?.userId ?? payload?.data?.object?.metadata?.userId;

    let user = null;
    if (externalUserId) {
      user = await Users.getByExternalId(ctx, externalUserId);
    } else if (customerId) {
      const sub = await ctx.db
        .query('subscriptions')
        .withIndex('by_customer', (q) => q.eq('stripeCustomerId', customerId))
        .unique();
      if (sub) {
        user = await ctx.db.get(sub.userId);
      }
    }

    const userId = user?._id;

    await ctx.db.insert('billing_events', {
      userId: userId ?? undefined,
      stripeEventId: id,
      type,
      data: payload,
    });

    if (userId && user) {
      await ctx.db.insert('subscriptions', {
        userId,
        stripeCustomerId: customerId ?? 'unknown',
        planId,
        status,
        currentPeriodEnd,
      });
      await applyEntitlements(ctx, user.externalId, planId, currentPeriodEnd);
    }
  },
});

export const refreshEntitlements = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await Users.getByExternalId(ctx, userId);
    if (!user) {
      return { plan: 'free', entitlements: PLAN_ENTITLEMENTS.free };
    }
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .first();
    const plan = sub?.planId ?? 'free';
    const entitlements = PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.free;
    return { plan, entitlements, validUntil: sub ? new Date(sub.currentPeriodEnd).toISOString() : undefined };
  },
});
