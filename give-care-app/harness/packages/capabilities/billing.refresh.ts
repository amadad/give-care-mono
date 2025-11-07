import { capability } from './factory';

export const refreshEntitlementsCapability = capability({
  name: 'billing.refreshEntitlements',
  description: 'Refresh Stripe entitlements for the current caregiver.',
  costHint: 'low',
  latencyHint: 'low',
  io: {},
  async run(_input, ctx) {
    return ctx.store.refreshEntitlements(ctx.context.userId);
  },
});
