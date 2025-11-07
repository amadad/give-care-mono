/**
 * Inbound Message Processor (Mutations)
 *
 * Processes inbound messages and triggers async agent responses.
 * Called automatically when a new inbound message is received via webhook.
 */

import { internalAction, internalMutation } from '../_generated/server';
import { internal, api } from '../_generated/api';
import { v } from 'convex/values';
import { saveMessage } from '@convex-dev/agent';
import { components } from '../_generated/api';
import * as Subscriptions from '../model/subscriptions';

const CRISIS_TERMS = [
  'suicide',
  'kill myself',
  'end it',
  'want to die',
  'no point',
  'give up',
  'hurt myself',
];

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
  handler: async (ctx, { messageId, userId, text, externalId, channel }): Promise<{ threadId: string | null; agent: string }> => {
    console.log('[inbound] Processing message', { messageId, userId, externalId, channel });

    // Check subscription status via query
    // @ts-ignore - Query return type
    const hasSubscription = await ctx.runQuery(internal.model.subscriptions.hasActiveSubscriptionQuery, {
      userId,
    });
    console.log('[inbound] Subscription check', { userId, hasSubscription });

    if (!hasSubscription) {
      // Get user to extract phone for signup URL
      // @ts-ignore - Query return type
      const user = await ctx.runQuery(internal.model.users.getUser, { userId });
      // @ts-ignore - User type
      const signupUrl = Subscriptions.getSignupUrl(user?.phone);

      // Send signup message directly (we're already in an action)
      await ctx.runAction(internal.functions.inboundActions.sendSignupMessage, {
        userId: externalId,
        channel,
        phone: user?.phone,
        signupUrl,
      });

      return { threadId: null, agent: 'signup_required' };
    }

    // Check for crisis terms
    const lowerText = text.toLowerCase();
    const hasCrisisTerms = CRISIS_TERMS.some((term) => lowerText.includes(term));

    // Get or create thread for this user via mutation
    // @ts-ignore - Mutation return type
    const threadResult = await ctx.runMutation(internal.functions.inbound.getOrCreateThread, {
      userId,
    });
    const threadId: string = threadResult.threadId;

    // Save user message to thread
    // @ts-ignore - saveMessage return type
    const { messageId: promptMessageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt: text,
    });

    // Route to appropriate agent based on context
    if (hasCrisisTerms) {
      // High priority - run crisis agent immediately
      await ctx.runAction(internal.functions.inboundActions.generateCrisisResponse, {
        threadId,
        promptMessageId,
        userId: externalId,
        channel,
      });
    } else {
      // Normal priority - run main agent
      await ctx.runAction(internal.functions.inboundActions.generateMainResponse, {
        threadId,
        promptMessageId,
        userId: externalId,
        channel,
      });
    }

    return { threadId, agent: hasCrisisTerms ? 'crisis' : 'main' };
  },
});

/**
 * Get or create thread for user (mutation helper)
 */
export const getOrCreateThread = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const existingThread = await ctx.db
      .query('threads')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    if (existingThread) {
      return { threadId: existingThread._id as string };
    }

    const newThreadId = await ctx.db.insert('threads', {
      userId,
      metadata: {},
    });

    return { threadId: newThreadId as string };
  },
});
