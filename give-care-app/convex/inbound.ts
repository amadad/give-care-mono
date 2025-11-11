"use node";

/**
 * Inbound SMS Processing
 *
 * Processes incoming SMS messages and generates agent responses
 */

import { internalAction } from './_generated/server';
import { v } from 'convex/values';
import { api, internal, components } from './_generated/api';
import { twilio } from './lib/twilio';
import { detectCrisis } from './lib/utils';
import { RateLimitError, UserNotFoundError } from './lib/utils';

// ============================================================================
// PROCESS INBOUND MESSAGE
// ============================================================================

export const processInbound = internalAction({
  args: {
    phone: v.string(),
    text: v.string(),
    messageSid: v.string(),
  },
  handler: async (ctx, args) => {
    // OPTIMIZATION: Batch all context queries into a single query
    // This replaces 5 sequential queries with 1, saving ~200-400ms
    const context = await ctx.runQuery(internal.inboundHelpers.getInboundContext, {
      messageSid: args.messageSid,
      phone: args.phone,
    });

    // Idempotency check
    if (context.seen) {
      return { success: true, deduped: true };
    }

    // Mark as seen (non-blocking, fire-and-forget)
    ctx.runMutation(internal.internal._markMessage, { sid: args.messageSid })
      .catch((err) => console.error('[inbound] Failed to mark message:', err));

    // Rate limiting check - use ConvexError
    if (!context.rateLimitOk) {
      throw new RateLimitError(context.rateLimitRetryAfter ?? 60000);
    }

    // Ensure user exists (mutation must be separate from query)
    let user = context.user;
    if (!user || context.needsUserCreation) {
      user = await ctx.runMutation(internal.internal.ensureUserMutation, {
        externalId: args.phone,
        channel: 'sms' as const,
        phone: args.phone,
      });
      
      if (!user) {
        throw new UserNotFoundError(args.phone);
      }
    }

    // Fast-path: Check for active assessment session and numeric/skip replies
    const maybeNumeric = /^\s*([1-5])\s*$/.test(args.text) || /^skip$/i.test(args.text);

    if (context.activeSession && maybeNumeric) {
      // Fast-path: Process assessment answer directly
      const result = await ctx.runAction(internal.assessments.handleInboundAnswer, {
        userId: user.externalId,
        definition: context.activeSession.definitionId as any,
        text: args.text,
      });

      if (result?.text) {
        await ctx.runAction(internal.inbound.sendSmsResponse, {
          to: args.phone,
          text: result.text,
          userId: user.externalId,
        });
        return { success: true, response: result, fastPath: true };
      }
    }

    // Detect crisis keywords
    const crisisDetection = detectCrisis(args.text);
    
    // Build context
    const metadata = (user.metadata as Record<string, unknown>) ?? {};
    const agentContext = {
      userId: user.externalId,
      locale: user.locale,
      consent: user.consent ?? { emergency: false, marketing: false },
      crisisFlags: crisisDetection.hit
        ? {
            active: true,
            terms: crisisDetection.keyword ? [crisisDetection.keyword] : [],
          }
        : undefined,
      metadata: {
        ...metadata,
        convex: {
          userId: user._id,
        },
      },
    };

    // Route to appropriate agent
    let response;
    if (crisisDetection.hit) {
      // Crisis agent
      response = await ctx.runAction(internal.agents.runCrisisAgent, {
        input: {
          channel: 'sms' as const,
          text: args.text,
          userId: user.externalId,
        },
        context: agentContext,
      });
    } else {
      // Main agent
      // OPTIMIZATION: Don't fetch threadId here - let agent handle it internally
      // This avoids redundant query since ensureAgentThread will do it anyway
      // If we want to optimize further, we'd need to cache threadId in user metadata
      response = await ctx.runAction(api.agents.runMainAgent, {
        input: {
          channel: 'sms' as const,
          text: args.text,
          userId: user.externalId,
        },
        context: agentContext,
        threadId: undefined, // Let agent handle thread lookup (will cache if we optimize)
      });
    }

    // Priority 3: No need to save threadId manually - Agent Component manages it

    // Send SMS response
    if (response?.text) {
      await ctx.runAction(internal.inbound.sendSmsResponse, {
        to: args.phone,
        text: response.text,
        userId: user.externalId,
      });
    }

    return { success: true, response };
  },
});

// ============================================================================
// SEND SMS RESPONSE
// ============================================================================

export const sendSmsResponse = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Use Twilio component to send SMS
    const message = await ctx.runAction(components.twilio.messages.create, {
      to: args.to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: args.text,
      account_sid: process.env.TWILIO_ACCOUNT_SID!,
      auth_token: process.env.TWILIO_AUTH_TOKEN!,
      status_callback: `${process.env.CONVEX_SITE_URL}/twilio/message-status`,
    });

    // Note: Messages are automatically saved by Twilio component
    // No need to manually save to components.messages

    return { sid: message.sid };
  },
});
