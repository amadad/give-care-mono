/**
 * Assessment session and response management functions
 */

import { internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';

// QUERIES

export const getSession = internalQuery({
  args: { sessionId: v.id('assessmentSessions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getLatestSession = internalQuery({
  args: {
    userId: v.id('users'),
    type: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('assessmentSessions')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .order('desc');

    const sessions = await query.collect();

    if (args.type) {
      return sessions.find(s => s.type === args.type);
    }

    return sessions[0];
  },
});

export const getSessionResponses = internalQuery({
  args: { sessionId: v.id('assessmentSessions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('assessmentResponses')
      .withIndex('by_session', (q: any) => q.eq('sessionId', args.sessionId))
      .collect();
  },
});

// MUTATIONS

export const insertAssessmentSession = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.string(), // ema | cwbs | reach_ii | sdoh
    totalQuestions: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sessionId = await ctx.db.insert('assessmentSessions', {
      userId: args.userId,
      type: args.type,
      completed: false,
      currentQuestion: 0,
      totalQuestions: args.totalQuestions,
      responses: {},
      startedAt: now,
    });

    return sessionId;
  },
});

export const insertAssessmentResponse = internalMutation({
  args: {
    sessionId: v.id('assessmentSessions'),
    userId: v.id('users'),
    questionId: v.string(),
    questionText: v.string(),
    responseValue: v.string(),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Insert response record
    const responseId = await ctx.db.insert('assessmentResponses', {
      sessionId: args.sessionId,
      userId: args.userId,
      questionId: args.questionId,
      questionText: args.questionText,
      responseValue: args.responseValue,
      score: args.score,
      respondedAt: now,
      createdAt: now,
    });

    // Update session with response in responses object
    const session = await ctx.db.get(args.sessionId);
    if (session) {
      const updatedResponses = {
        ...session.responses,
        [args.questionId]: args.responseValue,
      };

      await ctx.db.patch(args.sessionId, {
        responses: updatedResponses,
        currentQuestion: session.currentQuestion + 1,
      });
    }

    return responseId;
  },
});

/**
 * PERFORMANCE OPTIMIZATION: Batch insert multiple assessment responses
 * Reduces RPC calls from N (one per response) to 1 (single batch)
 *
 * Example: 10 responses = 10 RPC calls → 1 RPC call = ~90% latency reduction
 */
export const batchInsertAssessmentResponses = internalMutation({
  args: {
    sessionId: v.id('assessmentSessions'),
    userId: v.id('users'),
    responses: v.array(
      v.object({
        questionId: v.string(),
        questionText: v.string(),
        responseValue: v.string(),
        score: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error(`Session ${args.sessionId} not found`);
    }

    // Batch insert all response records
    const responseIds = await Promise.all(
      args.responses.map((response) =>
        ctx.db.insert('assessmentResponses', {
          sessionId: args.sessionId,
          userId: args.userId,
          questionId: response.questionId,
          questionText: response.questionText,
          responseValue: response.responseValue,
          score: response.score,
          respondedAt: now,
          createdAt: now,
        })
      )
    );

    // Build updated responses object
    const updatedResponses = { ...session.responses };
    for (const response of args.responses) {
      updatedResponses[response.questionId] = response.responseValue;
    }

    // Single session update with all responses
    await ctx.db.patch(args.sessionId, {
      responses: updatedResponses,
      currentQuestion: session.currentQuestion + args.responses.length,
    });

    return {
      responseIds,
      count: args.responses.length,
    };
  },
});

export const completeAssessmentSession = internalMutation({
  args: {
    sessionId: v.id('assessmentSessions'),
    overallScore: v.union(v.number(), v.null()), // Can be null if all questions skipped
    domainScores: v.any(), // object of domain -> score
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.sessionId, {
      completed: true,
      overallScore: args.overallScore,
      domainScores: args.domainScores,
      completedAt: now,
    });

    return { success: true };
  },
});

export const updateSessionProgress = internalMutation({
  args: {
    sessionId: v.id('assessmentSessions'),
    currentQuestion: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      currentQuestion: args.currentQuestion,
    });

    return { success: true };
  },
});
