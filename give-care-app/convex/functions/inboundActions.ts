"use node";

import { internalAction } from '../_generated/server';
import { internal, api } from '../_generated/api';
import { v } from 'convex/values';
import { CRISIS_TERMS } from '../lib/constants';

export const generateCrisisResponse = internalAction({
  args: {
    threadId: v.string(),
    text: v.string(),
    userId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  },
  handler: async (ctx, { threadId, text, userId, channel }): Promise<any> => {
    // Get user context
    const user: any = await ctx.runQuery(api.functions.users.getByExternalId, {
      externalId: userId,
    });
    if (!user) {
      console.error('[inbound] User not found:', userId);
      return;
    }

    // Run crisis agent
    const result: any = await ctx.runAction(internal.agents.crisis.runCrisisAgent, {
      input: {
        channel,
        text,
        userId,
      },
      context: {
        userId,
        locale: user.locale || 'en',
        consent: {
          emergency: true,
          marketing: user.consent?.marketing ?? false,
        },
        crisisFlags: {
          active: true,
          terms: CRISIS_TERMS,
        },
        metadata: user.metadata,
      },
      threadId,
    });

    // Send SMS response
    if (channel === 'sms' && user.phone) {
      await ctx.runAction(internal.functions.inboundActions.sendSmsResponse, {
        to: user.phone,
        text: result.text,
        userId,
      });
    }

    return result;
  },
});

/**
 * Generate response using Main Agent
 */
export const generateMainResponse = internalAction({
  args: {
    threadId: v.string(),
    text: v.string(),
    userId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  },
  handler: async (ctx, { threadId, text, userId, channel }): Promise<any> => {
    // Get user context
    const user: any = await ctx.runQuery(api.functions.users.getByExternalId, {
      externalId: userId,
    });
    if (!user) {
      console.error('[inbound] User not found:', userId);
      return;
    }

    // Run main agent
    const result: any = await ctx.runAction(api.agents.main.runMainAgent, {
      input: {
        channel,
        text,
        userId,
      },
      context: {
        userId,
        sessionId: threadId,
        locale: user.locale || 'en',
        consent: {
          emergency: user.consent?.emergency ?? false,
          marketing: user.consent?.marketing ?? false,
        },
        metadata: user.metadata,
      },
      threadId,
    });

    // Send SMS response
    if (channel === 'sms' && user.phone) {
      await ctx.runAction(internal.functions.inboundActions.sendSmsResponse, {
        to: user.phone,
        text: result.text,
        userId,
      });
    }

    return result;
  },
});

/**
 * Send signup message to non-subscribers
 */
export const sendSignupMessage = internalAction({
  args: {
    userId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
    phone: v.optional(v.string()),
    signupUrl: v.string(),
  },
  handler: async (ctx, { userId, channel, phone, signupUrl }) => {
    if (channel !== 'sms' || !phone) {
      console.log('[inbound] Signup message only sent via SMS');
      return;
    }

    const message = `Thanks for reaching out! To access GiveCare support, please subscribe at: ${signupUrl}`;

    await ctx.runAction(internal.functions.inboundActions.sendSmsResponse, {
      to: phone,
      text: message,
      userId,
    });
  },
});

/**
 * Send SMS response via Twilio
 */
export const sendSmsResponse = internalAction({
  args: {
    to: v.string(),
    text: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { to, text, userId }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.error('[inbound] Twilio credentials not configured');
      return;
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            To: to,
            From: from,
            Body: text.slice(0, 1600), // SMS limit
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[inbound] Twilio error:', error);
        return;
      }

      const data: any = await response.json();

      // Record outbound message
      await ctx.runMutation(api.functions.messages.recordOutbound, {
        message: {
          externalId: userId,
          channel: 'sms',
          text,
          meta: {
            twilioSid: data.sid,
            to,
          },
          traceId: `twilio-outbound-${data.sid}`,
        },
      });

      console.log('[inbound] SMS sent:', data.sid);
      return { sid: data.sid };
    } catch (error) {
      console.error('[inbound] Failed to send SMS:', error);
      throw error;
    }
  },
});
