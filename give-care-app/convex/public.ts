/**
 * Public API Surface
 *
 * This file defines the ONLY functions callable from the browser/frontend.
 * All exports here must have validators and proper access control.
 *
 * Server-side code should use internal.* instead.
 */

import { mutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import * as Core from './core';

// ============================================================================
// VALIDATORS
// ============================================================================

export const channelValidator = v.union(v.literal('sms'), v.literal('web'));

const consentValidator = v.object({ emergency: v.boolean(), marketing: v.boolean() });
const promptHistoryValidator = v.array(v.object({ fieldId: v.string(), text: v.string() }));
const budgetValidator = v.object({ maxInputTokens: v.number(), maxOutputTokens: v.number(), maxTools: v.number() });

// ============================================================================
// CONTEXT - Hydration & Persistence
// ============================================================================

/**
 * Hydrate user context from storage
 *
 * Called by frontend to load user session state
 */
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
    return Core.hydrate(ctx, user);
  },
});

/**
 * Persist user context back to storage
 *
 * Called by frontend to save user session state
 */
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
    await Core.persist(ctx, context);
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
    const user = await Core.getByExternalId(ctx, args.userId);
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

// ============================================================================
// PLACEHOLDER: Other public exports will be added here
// ============================================================================

// TODO: Add assessment exports
// TODO: Add billing exports
// TODO: Add resource search exports (if public-facing)
