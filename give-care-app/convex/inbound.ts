"use node";

/**
 * Inbound SMS Processing - Async Pattern
 *
 * Following Convex Agent pattern:
 * 1. Mutation: Schedule response (instant webhook response)
 * 2. Action: Generate agent response + send SMS (background)
 */

import { internalAction, mutation } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { channelValidator } from './public';
import { twilio } from './twilioClient';
import { enforceInboundSmsLimit, enforceOutboundSmsLimit } from './lib/rateLimiting';
import { detectCrisis } from './lib/policy';

// ============================================================================
// STEP 1: MUTATION - Schedule Response (Returns Immediately)
// ============================================================================

export const processInboundMessage = mutation({
  args: {
    messageId: v.id('messages'),
    userId: v.id('users'),
    text: v.string(),
    externalId: v.string(),
    channel: channelValidator,
  },
  handler: async (ctx, args) => {
    // Enforce rate limit
    await enforceInboundSmsLimit(ctx, args.userId);

    // Crisis pre-routing
    const crisisDetection = detectCrisis(args.text);
    if (crisisDetection.hit) {
      ctx.scheduler.runAfter(0, internal.workflows.crisisEscalation, {
        userId: args.userId,
        threadId: String(args.messageId),
        messageText: args.text,
        crisisTerms: crisisDetection.keyword ? [crisisDetection.keyword] : [],
        severity: crisisDetection.severity ?? 'medium',
      });
      return { scheduled: 'crisis' };
    }

    // Schedule main agent response
    ctx.scheduler.runAfter(0, internal.inbound.generateAgentResponse, {
      messageId: args.messageId,
      userId: args.userId,
      text: args.text,
      externalId: args.externalId,
      channel: args.channel,
    });

    return { scheduled: 'main' };
  },
});

// ============================================================================
// STEP 2: ACTION - Generate Response + Send SMS (Background)
// ============================================================================

export const generateAgentResponse = internalAction({
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
      const response = await ctx.runAction(api.agents.main.runMainAgent, {
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
        await ctx.runAction(internal.inbound.sendSmsResponse, {
          to: args.externalId,
          text: reply.content,
          userId: args.externalId,
          convexUserId: args.userId,
          traceId: response?.threadId ?? `thread-${args.messageId}`,
        });
      }
    } catch (error) {
      console.error('[inbound] Failed to generate agent response', {
        messageId: args.messageId,
        error,
      });
    }
  },
});

// ============================================================================
// SMS DELIVERY
// ============================================================================

export const sendSmsResponse = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
    userId: v.string(),
    convexUserId: v.optional(v.id('users')),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.to) {
      throw new Error('[inbound] Missing destination phone number');
    }

    if (args.convexUserId) {
      await enforceOutboundSmsLimit(ctx, args.convexUserId);
    }

    await twilio.messages.create({
      to: args.to,
      body: args.text,
    });

    await ctx.runMutation(api.internal.recordOutbound, {
      message: {
        externalId: args.userId,
        channel: 'sms',
        text: args.text,
        traceId: args.traceId ?? `sms-${Date.now()}`,
        meta: {
          phone: args.to,
        },
      },
    });

    return { sent: true };
  },
});
