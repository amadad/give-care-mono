"use server";

import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { recordInbound as recordInboundCore } from '../core';

export const recordInbound = mutation({
  args: {
    message: v.object({
      externalId: v.string(),
      channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
      text: v.string(),
      traceId: v.string(),
      meta: v.optional(v.any()),
      redactionFlags: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { message }) => {
    return recordInboundCore(ctx, message as Parameters<typeof recordInboundCore>[1]);
  },
});
