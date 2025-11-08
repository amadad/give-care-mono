import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Users from '../model/users';

/**
 * Manually link a Stripe subscription to a user
 */
export const linkSubscription = mutation({
  args: {
    phoneNumber: v.string(),
    stripeCustomerId: v.string(),
    planId: v.string(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await Users.getByExternalId(ctx, args.phoneNumber);

    if (!user) {
      throw new Error(`User not found: ${args.phoneNumber}`);
    }

    // Check if subscription already exists
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        planId: args.planId,
        status: 'active',
        currentPeriodEnd: args.currentPeriodEnd,
      });

      console.log('[manual-link] Updated existing subscription:', existing._id);
      return { action: 'updated', subscriptionId: existing._id, userId: user._id };
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId: user._id,
      stripeCustomerId: args.stripeCustomerId,
      planId: args.planId,
      status: 'active',
      currentPeriodEnd: args.currentPeriodEnd,
    });

    // Apply entitlements (same logic as billing.ts)
    const PLAN_ENTITLEMENTS: Record<string, string[]> = {
      free: ['assessments'],
      plus: ['assessments', 'interventions', 'resources'],
      enterprise: ['assessments', 'interventions', 'resources', 'priority_support'],
    };

    // Map price ID to plan name
    const planName = args.planId.includes('standard') ? 'plus' : 'plus'; // Default to plus for paid plans
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
