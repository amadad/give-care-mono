import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import * as ContextModel from '../model/context';
import { summarizeConversation, formatForContext } from '../lib/summarization';
import * as Users from '../model/users';

export const channelValidator = v.union(v.literal('sms'), v.literal('web'));

const consentValidator = v.object({ emergency: v.boolean(), marketing: v.boolean() });
const promptHistoryValidator = v.array(v.object({ fieldId: v.string(), text: v.string() }));
const budgetValidator = v.object({ maxInputTokens: v.number(), maxOutputTokens: v.number(), maxTools: v.number() });

export const hydrate = mutation({
  args: {
    user: v.object({
      externalId: v.string(),
      channel: channelValidator,
      locale: v.optional(v.string()),
      phone: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { user }) => {
    return ContextModel.hydrate(ctx, user);
  },
});

export const persist = mutation({
  args: {
    context: v.object({
      userId: v.string(),
      sessionId: v.string(),
      locale: v.string(),
      policyBundle: v.string(),
      promptHistory: promptHistoryValidator,
      consent: consentValidator,
      metadata: v.any(),
      budget: budgetValidator,
      lastAssessment: v.optional(v.object({ definitionId: v.string(), score: v.number() })),
      crisisFlags: v.optional(v.object({ active: v.boolean(), terms: v.array(v.string()) })),
    }),
  },
  handler: async (ctx, { context }) => {
    await ContextModel.persist(ctx, context);
  },
});

/**
 * Get conversation summary for a user
 *
 * Returns compressed conversation history with 60-80% token savings
 */
export const getConversationSummary = query({
  args: {
    externalId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { externalId, limit = 25 }) => {
    const user = await Users.getByExternalId(ctx, externalId);
    if (!user) {
      return {
        recentMessages: [],
        compressedHistory: '',
        totalMessages: 0,
        tokensSaved: 0,
        compressionRatio: 0,
      };
    }

    const summary = await summarizeConversation(ctx, user._id, limit);
    return {
      ...summary,
      formattedContext: formatForContext(summary),
    };
  },
});

/**
 * Record important memory about a user
 *
 * Part of working memory system for building context over time
 */
export const recordMemory = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await Users.getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    await ctx.db.insert('memories', {
      userId: user._id,
      externalId: args.userId,
      category: args.category,
      content: args.content,
      importance: args.importance,
      embedding: undefined,
      lastAccessedAt: Date.now(),
      accessCount: 0,
    });
  },
});
