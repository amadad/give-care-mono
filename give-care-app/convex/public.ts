/**
 * Public API Surface
 *
 * This file defines the ONLY functions callable from the browser/frontend.
 * All exports here must have validators and proper access control.
 *
 * Server-side code should use internal.* instead.
 */

import { mutation, internalQuery, query } from './_generated/server';
import { v } from 'convex/values';
import * as Core from './core';
import type { AssessmentSlug } from './lib/assessmentCatalog';

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
 * Part of working memory system for building context over time.
 * Stores in both RAG (for semantic search) and memories table (for structured queries).
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

    // Store in memories table for structured queries by category/importance
    // TODO: Add RAG integration via separate action for semantic search
    await ctx.db.insert('memories', {
      userId: user._id,
      externalId: args.userId,
      category: args.category,
      content: args.content,
      importance: args.importance,
      embedding: undefined, // Future: Add embeddings via action
      lastAccessedAt: Date.now(),
      accessCount: 0,
    });
  },
});

/**
 * List stored memories for a user ordered by importance and recency.
 */
export const listMemories = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const user = await Core.getByExternalId(ctx, userId);
    if (!user) {
      return [];
    }

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    return memories
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return b._creationTime - a._creationTime;
      })
      .slice(0, limit)
      .map((m) => ({
        category: m.category,
        content: m.content,
        importance: m.importance,
        embedding: m.embedding,
        lastAccessedAt: m.lastAccessedAt,
      }));
  },
});

/**
 * Retrieve relevant memories for a user using semantic search
 *
 * Uses RAG to find memories semantically similar to the query.
 * Returns high-importance memories first.
 */
export const retrieveMemories = internalQuery({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, query, limit = 5 }) => {
    const user = await Core.getByExternalId(ctx, userId);
    if (!user) {
      return [];
    }

    // TODO: Implement semantic search via RAG component in separate action
    // For now, return recent high-importance memories by category match
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    // Simple keyword matching + importance sorting
    const queryLower = query.toLowerCase();
    const matches = memories
      .filter((m) => m.content.toLowerCase().includes(queryLower) || m.category.toLowerCase().includes(queryLower))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);

    return matches.map((m) => ({
      content: m.content,
      category: m.category,
      importance: m.importance,
      score: 1.0, // Placeholder score
    }));
  },
});

// ============================================================================
// ASSESSMENTS & CHECK-INS
// ============================================================================

const assessmentDefinitionValidator = v.union(
  v.literal('ema'),
  v.literal('bsfc'),
  v.literal('reach2'),
  v.literal('sdoh')
);

export const startAssessment = mutation({
  args: {
    userId: v.string(),
    definition: assessmentDefinitionValidator,
    channel: v.optional(channelValidator),
  },
  handler: async (ctx, { userId, definition, channel }) => {
    const user = await Core.getByExternalId(ctx, userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingSessions = await ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
      .collect();

    for (const session of existingSessions) {
      if (session.status === 'active') {
        await ctx.db.patch(session._id, { status: 'completed' });
      }
    }

    const sessionId = await ctx.db.insert('assessment_sessions', {
      userId: user._id,
      definitionId: definition,
      channel: channel ?? 'sms',
      questionIndex: 0,
      answers: [],
      status: 'active',
    });

    return sessionId;
  },
});

const logAssessmentEvent = async (
  ctx: Parameters<typeof startAssessment['handler']>[0],
  args: { userId: string; definition: AssessmentSlug | 'ema'; status: 'offered' | 'declined' }
) => {
  const user = await Core.getByExternalId(ctx, args.userId);
  if (!user) return;
  await ctx.db.insert('memories', {
    userId: user._id,
    externalId: args.userId,
    category: `assessment_${args.status}`,
    content: `${args.definition.toUpperCase()} assessment ${args.status}`,
    importance: 4,
    embedding: undefined,
    lastAccessedAt: Date.now(),
    accessCount: 0,
  });
};

export const recordAssessmentOffer = mutation({
  args: {
    userId: v.string(),
    definition: assessmentDefinitionValidator,
  },
  handler: async (ctx, args) => {
    await logAssessmentEvent(ctx, { ...args, status: 'offered' });
  },
});

export const declineAssessmentOffer = mutation({
  args: {
    userId: v.string(),
    definition: assessmentDefinitionValidator,
  },
  handler: async (ctx, args) => {
    await logAssessmentEvent(ctx, { ...args, status: 'declined' });
  },
});

export const upsertCheckInSchedule = mutation({
  args: {
    userId: v.string(),
    windowStartMinutes: v.number(),
    cadenceMinutes: v.number(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await Core.getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const cadenceDays = Math.max(1, Math.round(args.cadenceMinutes / (24 * 60)));
    const rrule = `FREQ=DAILY;INTERVAL=${cadenceDays}`;
    const nextRunIso = new Date(Date.now() + args.cadenceMinutes * 60 * 1000).toISOString();
    const payload = {
      kind: 'daily_check_in',
      windowStartMinutes: args.windowStartMinutes,
      cadenceMinutes: args.cadenceMinutes,
    };

    const existing = (
      await ctx.db
        .query('triggers')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect()
    ).find((trigger) => (trigger.payload as Record<string, unknown> | undefined)?.kind === 'daily_check_in');

    if (existing) {
      await ctx.db.patch(existing._id, {
        rrule,
        timezone: args.timezone,
        payload,
        nextRun: new Date(nextRunIso).getTime(),
        status: 'active',
      });
      return existing._id;
    }

    return Core.createTrigger(ctx, {
      userExternalId: args.userId,
      rrule,
      timezone: args.timezone,
      nextRun: nextRunIso,
      payload,
      type: 'recurring',
    });
  },
});
// ============================================================================
// PLACEHOLDER: Other public exports will be added here
// ============================================================================

// TODO: Add assessment exports
// TODO: Add billing exports
// TODO: Add resource search exports (if public-facing)
