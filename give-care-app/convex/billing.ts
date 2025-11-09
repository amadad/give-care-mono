/**
 * Billing - Stripe integration and webhook processing
 *
 * All Stripe SDK usage now lives in actions/billing.actions.ts to maintain the Node boundary.
 */

import { mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import * as Core from './core';
import { PLAN_ENTITLEMENTS } from './lib/billing';
export { createCheckoutSession } from './actions/billing.actions';

// ============================================================================
// WEBHOOK PROCESSING
// ============================================================================

const applyEntitlements = async (ctx: MutationCtx, userId: string, plan: string, expiresAt?: number) => {
  const user = await Core.getByExternalId(ctx, userId);
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
    console.log('[billing] Processing Stripe event:', { id, type });

    const existing = await ctx.db
      .query('billing_events')
      .withIndex('by_event', (q) => q.eq('stripeEventId', id))
      .unique();
    if (existing) {
      console.log('[billing] Event already processed:', id);
      return;
    }

    const customerId = payload?.data?.object?.customer ?? payload?.customer;
    const planId = payload?.data?.object?.plan?.id ?? payload?.plan_id ?? 'free';
    const status = payload?.data?.object?.status ?? 'active';
    // Stripe uses seconds, convert to milliseconds
    const currentPeriodEnd = payload?.data?.object?.current_period_end
      ? payload.data.object.current_period_end * 1000
      : Date.now();
    const externalUserId = payload?.metadata?.userId ?? payload?.data?.object?.metadata?.userId;

    // Extract phone number and name from checkout.session.completed metadata
    const phoneNumber = payload?.data?.object?.metadata?.phoneNumber;
    const fullName = payload?.data?.object?.metadata?.fullName;

    console.log('[billing] Extracted metadata:', {
      type,
      hasMetadata: !!payload?.data?.object?.metadata,
      phoneNumber,
      fullName,
      allMetadata: payload?.data?.object?.metadata
    });

    // Extract billing address from customer_details (checkout.session.completed)
    const billingAddress = payload?.data?.object?.customer_details?.address;
    const address = billingAddress ? {
      line1: billingAddress.line1,
      line2: billingAddress.line2 || undefined,
      city: billingAddress.city,
      state: billingAddress.state,
      postalCode: billingAddress.postal_code,
      country: billingAddress.country,
    } : undefined;

    let user: Awaited<ReturnType<typeof Core.getByExternalId>> = null;
    if (externalUserId) {
      user = await Core.getByExternalId(ctx, externalUserId);
    } else if (phoneNumber) {
      // Fallback: try phone number if userId not in metadata (old checkouts)
      user = await Core.getByExternalId(ctx, phoneNumber);
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
      if (user.externalId) {
        await applyEntitlements(ctx, user.externalId, planId, currentPeriodEnd);
      }
    }

    // Update user with billing address from checkout.session.completed
    if (type === 'checkout.session.completed' && userId && address) {
      console.log('[billing] Updating user with billing address:', { userId, address });
      await ctx.db.patch(userId, { address });
    }

    // Send welcome SMS for checkout.session.completed
    if (type === 'checkout.session.completed' && phoneNumber) {
      console.log('[billing] Scheduling welcome SMS for checkout:', { phoneNumber, fullName });
      await ctx.scheduler.runAfter(
        5000, // 5 second delay to ensure subscription is fully set up
        internal.internal.sendWelcomeSms,
        {
          phoneNumber,
          fullName: fullName ?? 'there',
        }
      );
    }
  },
});

export const refreshEntitlements = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const user = await Core.getByExternalId(ctx, userId);
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
