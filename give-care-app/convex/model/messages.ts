import type { MutationCtx } from '../_generated/server';
import type { Channel } from '../lib/types';
import * as Users from './users';

type BaseMessage = {
  externalId: string;
  channel: Channel;
  text: string;
  meta?: Record<string, unknown>;
  traceId: string;
  redactionFlags?: string[];
};

const sanitizeText = (text: string) => text.slice(0, 2000);

const record = async (ctx: MutationCtx, payload: BaseMessage, direction: 'inbound' | 'outbound') => {
  const user = await Users.ensureUser(ctx, {
    externalId: payload.externalId,
    channel: payload.channel,
    locale: (payload.meta?.locale as string | undefined) ?? undefined,
    phone: (payload.meta?.phone as string | undefined) ?? undefined,
  });
  const messageId = await ctx.db.insert('messages', {
    userId: user._id,
    channel: payload.channel,
    direction,
    text: sanitizeText(payload.text),
    meta: payload.meta,
    traceId: payload.traceId,
    redactionFlags: payload.redactionFlags ?? [],
  });
  return { messageId, userId: user._id };
};

export const recordInbound = (ctx: MutationCtx, payload: BaseMessage) => record(ctx, payload, 'inbound');
export const recordOutbound = (ctx: MutationCtx, payload: BaseMessage) => record(ctx, payload, 'outbound');
