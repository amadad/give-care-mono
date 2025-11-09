/**
 * Email logging domain.
 */

import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Core from '../core';

export const logDelivery = mutation({
  args: {
    userId: v.optional(v.string()),
    to: v.string(),
    subject: v.string(),
    status: v.string(),
    traceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = args.userId ? await Core.getByExternalId(ctx, args.userId) : null;
    await ctx.db.insert('emails', {
      userId: user?._id ?? undefined,
      to: args.to,
      subject: args.subject,
      status: args.status,
      traceId: args.traceId,
    });
  },
});
