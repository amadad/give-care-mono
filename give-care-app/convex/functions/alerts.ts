import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';

export const listPending = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const alerts = await ctx.db
      .query('alerts')
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .take(limit);
    return alerts.map((alert) => ({
      id: alert._id,
      type: alert.type,
      severity: alert.severity,
      channel: alert.channel,
      message: alert.message,
      payload: alert.payload ?? {},
    }));
  },
});

export const markProcessed = mutation({
  args: {
    alertId: v.id('alerts'),
    result: v.object({
      deliveredVia: v.union(v.literal('sms'), v.literal('email')),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { alertId, result }) => {
    await ctx.db.patch(alertId, {
      status: 'processed',
      context: { deliveredVia: result.deliveredVia, metadata: result.metadata },
    });
  },
});
