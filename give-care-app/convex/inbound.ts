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
import { detectCrisis } from './lib/policy';

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
    // Ensure user exists
    const user = await ctx.runMutation(internal.internal.ensureUserMutation, {
      externalId: args.phone,
      channel: 'sms' as const,
      phone: args.phone,
    });

    // Detect crisis keywords
    const crisisDetection = detectCrisis(args.text);
    
    // Build context
    const metadata = (user.metadata as Record<string, unknown>) ?? {};
    const context = {
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
      response = await ctx.runAction(internal.agents.crisis.runCrisisAgent, {
        input: {
          channel: 'sms' as const,
          text: args.text,
          userId: user.externalId,
        },
        context,
      });
    } else {
      // Main agent
      // ✅ Priority 3: Use listThreadsByUserId() instead of manual threadId storage
      const existingThreadsResult = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
        userId: user.externalId,
        paginationOpts: { cursor: null, numItems: 1 },
        order: 'desc', // Most recent first
      });
      const threadId = existingThreadsResult && existingThreadsResult.page && existingThreadsResult.page.length > 0 
        ? existingThreadsResult.page[0]._id 
        : undefined;
      
      response = await ctx.runAction(api.agents.main.runMainAgent, {
        input: {
          channel: 'sms' as const,
          text: args.text,
          userId: user.externalId,
        },
        context,
        threadId,
      });
    }

    // ✅ Priority 3: No need to save threadId manually - Agent Component manages it

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
    if (!args.to) {
      throw new Error('[inbound] Missing destination phone number');
    }

    // ✅ Use Twilio component to send message
    const status = await twilio.sendMessage(ctx, {
      to: args.to,
      body: args.text,
    });

    // Component automatically tracks message status
    return { sent: true, sid: status.sid };
  },
});


