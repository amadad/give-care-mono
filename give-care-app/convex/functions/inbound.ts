/**
 * Inbound Message Processor (Mutations)
 *
 * Processes inbound messages and triggers async agent responses.
 * Called automatically when a new inbound message is received via webhook.
 */

import { internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
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
 * This mutation is called from the Twilio webhook after recording the message.
 * It determines routing and kicks off async agent processing.
 */
export const processInboundMessage = internalMutation({
  args: {
    messageId: v.id('messages'),
    userId: v.id('users'),
    text: v.string(),
    externalId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
  },
  handler: async (ctx, { messageId, userId, text, externalId, channel }) => {
    // Check subscription status
    const hasSubscription = await Subscriptions.hasActiveSubscription(ctx, userId);

    if (!hasSubscription) {
      // Get user to extract phone for signup URL
      const user = await ctx.db.get(userId);
      const signupUrl = Subscriptions.getSignupUrl(user?.phone);

      // Send signup message
      await ctx.scheduler.runAfter(0, internal.functions.inboundActions.sendSignupMessage, {
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

    // Get or create thread for this user
    const existingThread = await ctx.db
      .query('threads')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    let threadId: string;
    if (existingThread) {
      threadId = existingThread._id as string;
    } else {
      // Create new thread
      const newThreadId = await ctx.db.insert('threads', {
        userId,
        metadata: {},
      });
      threadId = newThreadId as string;
    }

    // Save user message to thread
    // @ts-ignore - saveMessage return type
    const { messageId: promptMessageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt: text,
    });

    // Route to appropriate agent based on context
    if (hasCrisisTerms) {
      // High priority - schedule crisis agent immediately
      await ctx.scheduler.runAfter(
        0,
        internal.functions.inboundActions.generateCrisisResponse,
        {
          threadId,
          promptMessageId,
          userId: externalId,
          channel,
        }
      );
    } else {
      // Normal priority - schedule main agent
      await ctx.scheduler.runAfter(0, internal.functions.inboundActions.generateMainResponse, {
        threadId,
        promptMessageId,
        userId: externalId,
        channel,
      });
    }

    return { threadId, agent: hasCrisisTerms ? 'crisis' : 'main' };
  },
});

