/**
 * Message persistence domain.
 */

import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Core from '../core';

const messageArgs = v.object({
  externalId: v.string(),
  channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  text: v.string(),
  meta: v.optional(v.any()),
  traceId: v.string(),
  redactionFlags: v.optional(v.array(v.string())),
});

export const recordInbound = mutation({
  args: {
    message: messageArgs,
  },
  handler: async (ctx, { message }) => {
    return Core.recordInbound(ctx, message);
  },
});

export const recordOutbound = mutation({
  args: {
    message: messageArgs,
  },
  handler: async (ctx, { message }) => {
    return Core.recordOutbound(ctx, message);
  },
});
