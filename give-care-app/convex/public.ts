/**
 * Public API Surface
 *
 * This file defines the ONLY functions callable from the browser/frontend.
 * All exports here must have validators and proper access control.
 */

import { query, mutation, internalQuery, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { getByExternalId, ensureUser } from './lib/utils';
import { assessmentDefinitionValidator } from './lib/validators';

// ============================================================================
// USERS
// ============================================================================

export const getByExternalIdQuery = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    // Note: For SMS-only app, externalId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    return getByExternalId(ctx, externalId);
  },
});

// ============================================================================
// MEMORIES
// ============================================================================

/**
 * Record important memory about a user
 * Lightweight table for category queries only
 * Semantic search handled by Agent Component
 */
export const recordMemory = mutation({
  args: {
    userId: v.string(),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    // Note: For SMS-only app, userId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    const user = await getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Store in lightweight memories table for category queries
    // Agent Component handles semantic search via contextOptions
    await ctx.db.insert('memories', {
      userId: user._id,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });
  },
});

/**
 * Internal version of recordMemory - for use within Convex only
 */
export const recordMemoryInternal = internalMutation({
  args: {
    userId: v.id('users'),
    category: v.string(),
    content: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('memories', {
      userId: args.userId,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });
  },
});

/**
 * List stored memories for a user ordered by importance
 */
export const listMemories = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    // Note: For SMS-only app, userId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      return [];
    }

    // Fix: Query with limit and proper ordering
    // Note: Index doesn't support ordering, so we fetch more than needed and sort
    // For better performance, consider adding composite index on (userId, importance, _creationTime)
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user_category', (q) => q.eq('userId', user._id))
      .take(limit * 2); // Fetch 2x limit to account for category filtering

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
      }));
  },
});

/**
 * Internal version of listMemories - for use within Convex only
 */
export const listMemoriesInternal = internalQuery({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user_category', (q) => q.eq('userId', userId))
      .take((limit ?? 10) * 2); // Fetch 2x limit to account for category filtering

    return memories
      .sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return b._creationTime - a._creationTime;
      })
      .slice(0, limit ?? 10)
      .map((m) => ({
        category: m.category,
        content: m.content,
        importance: m.importance,
      }));
  },
});

// ============================================================================
// ASSESSMENTS
// ============================================================================

/**
 * Record assessment response - public-facing mutation for agents/admin flows
 * Records a structured answer to an assessment question
 * 
 * This mutation is designed for programmatic use (agents, admin flows, EMA/BSFC ingestion)
 * For user-facing flows, use answerAssessment mutation directly
 */
export const recordAssessmentResponse = mutation({
  args: {
    userId: v.string(),
    sessionId: v.optional(v.id('assessment_sessions')),
    questionIndex: v.number(),
    answer: v.union(v.number(), v.string()),
    definitionId: assessmentDefinitionValidator,
  },
  handler: async (ctx, { userId, sessionId, questionIndex, answer, definitionId }) => {
    // Note: For SMS-only app, userId = phone number
    // Caller must know phone number (acceptable for SMS-only)
    // For web users, add auth check: const identity = await ctx.auth.getUserIdentity();
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Normalize answer to number (string answers like "skip" become 0)
    const value = typeof answer === 'string' 
      ? (answer.toLowerCase() === 'skip' ? 0 : parseInt(answer, 10) || 0)
      : answer;

    // Validate value is in valid range (1-5 for most assessments)
    if (value < 0 || value > 5) {
      throw new Error('Answer value must be between 0 and 5');
    }

    // Find active session if sessionId not provided
    let session;
    if (sessionId) {
      session = await ctx.db.get(sessionId);
      if (!session || session.userId !== user._id || session.definitionId !== definitionId) {
        throw new Error('Invalid session');
      }
    } else {
      // Find active session for this user and definition
      const sessions = await ctx.db
        .query('assessment_sessions')
        .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definitionId))
        .order('desc')
        .collect();
      
      session = sessions.find(s => s.status === 'active');
      if (!session) {
        throw new Error('No active assessment session found');
      }
    }

    // Validate questionIndex matches session's current question
    if (session.questionIndex !== questionIndex) {
      throw new Error(`Question index mismatch: expected ${session.questionIndex}, got ${questionIndex}`);
    }

    // Append answer to session
    const newAnswer = {
      questionId: questionIndex.toString(),
      value,
    };
    const updatedAnswers = [...session.answers, newAnswer];

    await ctx.db.patch(session._id, {
      answers: updatedAnswers,
      questionIndex: questionIndex + 1,
    });

    return { 
      sessionId: session._id, 
      currentIndex: questionIndex + 1,
    };
  },
});

