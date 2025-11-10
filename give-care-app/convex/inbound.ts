"use node";

import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { channelValidator } from './public';
import { twilio } from './twilioClient';

type DeliverSmsArgs = {
  to: string;
  text: string;
  userId?: string;
  traceId?: string;
};

const deliverSms = async (ctx: any, args: DeliverSmsArgs) => {
  if (!args.to) {
    throw new Error('[inbound] Missing destination phone number');
  }

  await twilio.messages.create({
    to: args.to,
    body: args.text,
  });

  await ctx.runMutation(api.internal.recordOutbound, {
    message: {
      externalId: args.userId ?? args.to,
      channel: 'sms',
      text: args.text,
      traceId: args.traceId ?? `sms-${Date.now()}`,
      meta: {
        phone: args.to,
      },
    },
  });
};

export const sendSmsResponse = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
    userId: v.optional(v.string()),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await deliverSms(ctx, args);
    return { sent: true };
  },
});

export const processInboundMessage = internalAction({
  args: {
    messageId: v.id('messages'),
    userId: v.id('users'),
    text: v.string(),
    externalId: v.string(),
    channel: channelValidator,
  },
  handler: async (ctx, args) => {
    const agentContext = {
      userId: args.externalId,
      sessionId: args.messageId as string,
      locale: 'en-US',
      consent: { emergency: false, marketing: false },
      metadata: {},
    };

    try {
      const response = await ctx.runAction(api.agents.runMainAgent, {
        input: {
          channel: args.channel,
          text: args.text,
          userId: args.externalId,
        },
        context: agentContext,
      });

      const reply =
        response?.chunks?.find((chunk: any) => chunk.type === 'text') ??
        response?.chunks?.[0];

      if (reply && typeof reply.content === 'string' && reply.content.trim().length > 0) {
        await deliverSms(ctx, {
          to: args.externalId,
          text: reply.content,
          userId: args.externalId,
          traceId: response?.threadId ?? `thread-${args.messageId}`,
        });
      }
    } catch (error) {
      console.error('[inbound] Failed to process inbound message', {
        messageId: args.messageId,
        error,
      });
    }
  },
});
