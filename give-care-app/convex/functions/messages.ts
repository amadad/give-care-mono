import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Messages from '../model/messages';
import { channelValidator } from './context';

const messageArgs = v.object({
  externalId: v.string(),
  channel: channelValidator,
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
    await Messages.recordInbound(ctx, message);
  },
});

export const recordOutbound = mutation({
  args: {
    message: messageArgs,
  },
  handler: async (ctx, { message }) => {
    await Messages.recordOutbound(ctx, message);
  },
});
