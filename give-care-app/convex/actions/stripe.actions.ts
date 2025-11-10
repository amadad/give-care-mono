'use node';

import { action } from '../_generated/server';
import { v } from 'convex/values';

export const createCheckoutSession = action({
  args: {
    userId: v.string(),
    plan: v.union(v.literal('monthly'), v.literal('annual')),
  },
  handler: async (_, args) => {
    // TODO: integrate Stripe checkout
    return {
      checkoutUrl: `https://stripe.example/checkout?plan=${args.plan}&user=${args.userId}`,
    };
  },
});

export const syncSubscription = action({
  args: {
    userId: v.string(),
  },
  handler: async () => {
    // Placeholder
    return { status: 'active', plan: 'monthly' } as const;
  },
});
