import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Triggers from '../model/triggers';

export const advanceTriggerMutation = internalMutation({
  args: {
    triggerId: v.id('triggers'),
  },
  handler: async (ctx, { triggerId }) => {
    const trigger = await ctx.db.get(triggerId);
    if (!trigger) return;
    await Triggers.advanceTrigger(ctx, trigger);
  },
});
