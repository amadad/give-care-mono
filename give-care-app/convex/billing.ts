"use server";

import { mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { getByExternalId } from './core';

const SUBSCRIPTION_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
]);

const normalizeStatus = (status?: string) => {
  switch (status) {
    case 'trialing':
    case 'active':
    case 'past_due':
    case 'canceled':
    case 'unpaid':
    case 'paused':
      return status;
    default:
      return 'active';
  }
};

const extractExternalId = (payload: Record<string, unknown>): string | undefined => {
  const metadata = (payload?.metadata ?? {}) as Record<string, unknown>;
  return (
    (metadata.externalId as string | undefined) ||
    (metadata.userId as string | undefined) ||
    (metadata.convexUserId as string | undefined)
  );
};

const upsertSubscription = async (
  ctx: MutationCtx,
  params: {
    userExternalId: string;
    status: string;
    planId?: string;
    stripeCustomerId?: string;
    currentPeriodEnd?: number;
  }
) => {
  const user = await getByExternalId(ctx, params.userExternalId);
  if (!user) {
    console.warn('[billing] Unable to link subscription, user not found', params.userExternalId);
    return;
  }

  const existing = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', user._id))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      status: params.status,
      planId: params.planId ?? existing.planId,
      stripeCustomerId: params.stripeCustomerId ?? existing.stripeCustomerId,
      currentPeriodEnd: params.currentPeriodEnd ?? existing.currentPeriodEnd,
    });
  } else {
    await ctx.db.insert('subscriptions', {
      userId: user._id,
      status: params.status,
      planId: params.planId ?? 'free',
      stripeCustomerId: params.stripeCustomerId ?? 'unknown',
      currentPeriodEnd: params.currentPeriodEnd ?? Date.now(),
    });
  }
};

export const applyStripeEvent = mutation({
  args: {
    id: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db
      .query('billing_events')
      .withIndex('by_event', (q) => q.eq('stripeEventId', args.id))
      .unique();

    if (existingEvent) {
      return existingEvent._id;
    }

    const eventId = await ctx.db.insert('billing_events', {
      stripeEventId: args.id,
      type: args.type,
      data: args.payload,
      userId: undefined,
    });

    if (SUBSCRIPTION_EVENTS.has(args.type)) {
      const subscription = (args.payload?.data as any)?.object as Record<string, any> | undefined;
      if (subscription) {
        const externalId =
          extractExternalId(subscription) ??
          (subscription.metadata?.userExternalId as string | undefined);
        const planId =
          (subscription.items?.data?.[0]?.price?.id as string | undefined) ??
          (subscription.plan?.id as string | undefined);
        const status = normalizeStatus(subscription.status);
        const currentPeriodEnd =
          typeof subscription.current_period_end === 'number'
            ? subscription.current_period_end * 1000
            : undefined;
        const stripeCustomerId = subscription.customer as string | undefined;

        if (externalId) {
          await upsertSubscription(ctx, {
            userExternalId: externalId,
            status,
            planId,
            stripeCustomerId,
            currentPeriodEnd,
          });
        } else {
          console.warn('[billing] Subscription event missing externalId metadata', {
            eventType: args.type,
            subscriptionId: subscription.id,
          });
        }
      }
    }

    return eventId;
  },
});
