"use node";

/**
 * Inbound Message Processing
 *
 * Merges functions/inbound.ts and functions/inboundActions.ts
 * Handles SMS/email routing and Twilio integration.
 *
 * Flow:
 * 1. Webhook receives message (http.ts) → recordInbound → schedules processInboundMessage
 * 2. processInboundMessage determines routing (crisis vs main agent)
 * 3. generateCrisisResponse or generateMainResponse invokes agent
 * 4. sendSmsResponse sends reply via Twilio
 */

import { internalAction } from './_generated/server';
import type { ActionCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { internal, components, api } from './_generated/api';
import { v } from 'convex/values';
import * as Core from './core';
import { CRISIS_TERMS } from './lib/constants';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

type UserDoc = Doc<'users'>;
type UserMetadata = Record<string, unknown> & { componentThreadId?: string };

const sanitizeUserMetadata = (metadata: UserDoc['metadata']): UserMetadata => {
  if (metadata && typeof metadata === 'object') {
    return { ...(metadata as Record<string, unknown>) } as UserMetadata;
  }
  return {};
};

const fetchThreadIfPresent = async (
  ctx: ActionCtx,
  userId: Id<'users'>,
  threadId?: string
): Promise<string | undefined> => {
  if (!threadId) return undefined;
  try {
    const thread = await ctx.runQuery(components.agent.threads.getThread, { threadId });
    // Verify thread ownership to prevent cross-user contamination
    if (!thread || thread.userId !== (userId as string)) return undefined;
    return threadId;
  } catch (error) {
    console.warn('[inbound] Stored component thread lookup failed', { threadId, error });
    return undefined;
  }
};

const fetchLatestComponentThread = async (ctx: ActionCtx, userId: Id<'users'>): Promise<string | undefined> => {
  const result = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
    userId: userId as string,
    order: 'desc',
    paginationOpts: { cursor: null, numItems: 1 },
  });
  return result.page.at(0)?._id;
};

const persistThreadIdIfNeeded = async (
  ctx: ActionCtx,
  userId: Id<'users'>,
  metadata: UserMetadata,
  nextThreadId: string
) => {
  if (metadata.componentThreadId === nextThreadId) {
    return;
  }
  const nextMetadata: UserMetadata = { ...metadata, componentThreadId: nextThreadId };
  await ctx.runMutation(internal.core.updateUserMetadata, {
    userId,
    metadata: nextMetadata,
  });
};

const ensureComponentThreadId = async (ctx: ActionCtx, user: UserDoc): Promise<string> => {
  const metadata = sanitizeUserMetadata(user.metadata);
  const storedThreadId = await fetchThreadIfPresent(ctx, user._id, metadata.componentThreadId);
  if (storedThreadId) {
    return storedThreadId;
  }

  const latestThreadId = await fetchLatestComponentThread(ctx, user._id);
  if (latestThreadId) {
    await persistThreadIdIfNeeded(ctx, user._id, metadata, latestThreadId);
    return latestThreadId;
  }

  // Use internal mutation wrapper (Convex best practice: avoid ActionCtx→MutationCtx casts)
  const createdThreadId = await ctx.runMutation(internal.core.createComponentThread, {
    userId: user._id,
  });
  await persistThreadIdIfNeeded(ctx, user._id, metadata, createdThreadId);
  return createdThreadId;
};

// ============================================================================
// INBOUND MESSAGE PROCESSING
// ============================================================================

/**
 * Process a new inbound message and route to appropriate agent
 *
 * This action is called from the Twilio webhook after recording the message.
 * It determines routing and kicks off async agent processing.
 */
export const processInboundMessage = internalAction({
  args: {
    messageId: v.id('messages'),
    userId: v.id('users'),
    text: v.string(),
    externalId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  },
  handler: async (
    ctx,
    { messageId, userId, text, externalId, channel }
  ): Promise<{ threadId: string | null; agent: string }> => {
    console.log('[inbound] Processing message', { messageId, userId, externalId, channel });

    // Check subscription status via query
    const hasSubscription = await ctx.runQuery(internal.core.hasActiveSubscriptionQuery, {
      userId,
    });
    console.log('[inbound] Subscription check', { userId, hasSubscription });

    const user = await ctx.runQuery(internal.core.getUser, { userId });
    if (!user) {
      throw new Error(`User ${userId} not found during inbound processing`);
    }

    if (!hasSubscription) {
      const signupUrl = Core.getSignupUrl(user.phone);

      // Send signup message directly (we're already in an action)
      await ctx.runAction(internal.inbound.sendSignupMessage, {
        userId: externalId,
        channel,
        phone: user.phone,
        signupUrl,
      });

      return { threadId: null, agent: 'signup_required' };
    }

    // Check for crisis terms
    const lowerText = text.toLowerCase();
    const hasCrisisTerms = CRISIS_TERMS.some((term) => lowerText.includes(term));

    const threadId = await ensureComponentThreadId(ctx, user);

    // Route to appropriate agent based on context
    // Note: Agents automatically save the user message via generateText()
    if (hasCrisisTerms) {
      // High priority - run crisis agent immediately
      await ctx.runAction(internal.inbound.generateCrisisResponse, {
        threadId,
        text,
        userId,
        channel,
      });
    } else {
      // Normal priority - run main agent
      await ctx.runAction(internal.inbound.generateMainResponse, {
        threadId,
        text,
        userId,
        channel,
      });
    }

    return { threadId, agent: hasCrisisTerms ? 'crisis' : 'main' };
  },
});

// ============================================================================
// AGENT RESPONSE GENERATION
// ============================================================================

/**
 * Generate response using Crisis Agent
 */
export const generateCrisisResponse = internalAction({
  args: {
    threadId: v.string(),
    text: v.string(),
    userId: v.id('users'),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  },
  handler: async (ctx, { threadId, text, userId, channel }): Promise<any> => {
    // Get user context
    const user: any = await ctx.runQuery(internal.core.getUser, {
      userId,
    });
    if (!user) {
      console.error('[inbound] User not found:', userId);
      return;
    }

    const externalId = user.externalId || user.phone;

    // Run crisis agent
    const result: any = await ctx.runAction(internal.agents.runCrisisAgent, {
      input: {
        channel,
        text,
        userId: externalId,
      },
      context: {
        userId: externalId,
        locale: user.locale || 'en',
        consent: {
          emergency: true,
          marketing: user.consent?.marketing ?? false,
        },
        crisisFlags: {
          active: true,
          terms: [...CRISIS_TERMS],
        },
        metadata: {
          ...user.metadata,
          convexUserId: userId, // Pass actual Convex ID for usage tracking
        },
      },
      threadId,
    });

    // Send SMS response
    if (channel === 'sms' && user.phone) {
      const responseText = result.chunks?.[0]?.content || 'Unable to generate response';
      await ctx.runAction(internal.inbound.sendSmsResponse, {
        to: user.phone,
        text: responseText,
        userId: externalId,
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
    userId: v.id('users'),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  },
  handler: async (ctx, { threadId, text, userId, channel }): Promise<any> => {
    // Get user context
    const user: any = await ctx.runQuery(internal.core.getUser, {
      userId,
    });
    if (!user) {
      console.error('[inbound] User not found:', userId);
      return;
    }

    const externalId = user.externalId || user.phone;

    // Run main agent
    const result: any = await ctx.runAction(api.agents.runMainAgent, {
      input: {
        channel,
        text,
        userId: externalId,
      },
      context: {
        userId: externalId,
        sessionId: threadId,
        locale: user.locale || 'en',
        consent: {
          emergency: user.consent?.emergency ?? false,
          marketing: user.consent?.marketing ?? false,
        },
        metadata: {
          ...user.metadata,
          convexUserId: userId, // Pass actual Convex ID for usage tracking
        },
      },
      threadId,
    });

    // Send SMS response
    if (channel === 'sms' && user.phone) {
      const responseText = result.chunks?.[0]?.content || 'Unable to generate response';
      await ctx.runAction(internal.inbound.sendSmsResponse, {
        to: user.phone,
        text: responseText,
        userId: externalId,
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

    await ctx.runAction(internal.inbound.sendSmsResponse, {
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
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
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
      await ctx.runMutation(api.domains.messages.recordOutbound, {
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
