/**
 * Inbound Message Processor (Mutations)
 *
 * Processes inbound messages and triggers async agent responses.
 * Called automatically when a new inbound message is received via webhook.
 */

import { internalAction } from '../_generated/server';
import type { ActionCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import * as Subscriptions from '../model/subscriptions';
import { CRISIS_TERMS } from '../lib/constants';

type UserDoc = Doc<'users'>;
type UserMetadata = Record<string, unknown> & { componentThreadId?: string };

const sanitizeUserMetadata = (metadata: UserDoc['metadata']): UserMetadata => {
  if (metadata && typeof metadata === 'object') {
    return { ...(metadata as Record<string, unknown>) } as UserMetadata;
  }
  return {};
};

const fetchThreadIfPresent = async (ctx: ActionCtx, userId: Id<'users'>, threadId?: string): Promise<string | undefined> => {
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
  await ctx.runMutation(internal.model.users.updateUserMetadata, {
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
  const createdThreadId = await ctx.runMutation(internal.internal.threads.createComponentThread, {
    userId: user._id,
  });
  await persistThreadIdIfNeeded(ctx, user._id, metadata, createdThreadId);
  return createdThreadId;
};

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
    const hasSubscription = await ctx.runQuery(internal.model.subscriptions.hasActiveSubscriptionQuery, {
      userId,
    });
    console.log('[inbound] Subscription check', { userId, hasSubscription });

    const user = await ctx.runQuery(internal.model.users.getUser, { userId });
    if (!user) {
      throw new Error(`User ${userId} not found during inbound processing`);
    }

    if (!hasSubscription) {
      const signupUrl = Subscriptions.getSignupUrl(user.phone);

      // Send signup message directly (we're already in an action)
      await ctx.runAction(internal.functions.inboundActions.sendSignupMessage, {
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
      await ctx.runAction(internal.functions.inboundActions.generateCrisisResponse, {
        threadId,
        text,
        userId: externalId,
        channel,
      });
    } else {
      // Normal priority - run main agent
      await ctx.runAction(internal.functions.inboundActions.generateMainResponse, {
        threadId,
        text,
        userId: externalId,
        channel,
      });
    }

    return { threadId, agent: hasCrisisTerms ? 'crisis' : 'main' };
  },
});
