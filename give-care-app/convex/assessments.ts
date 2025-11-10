import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getByExternalId } from './lib/core';

const assessmentDefinitionValidator = v.union(
  v.literal('ema'),
  v.literal('bsfc'),
  v.literal('reach2'),
  v.literal('sdoh')
);

const channelValidator = v.union(v.literal('sms'), v.literal('web'));

export const startAssessment = mutation({
  args: {
    userId: v.string(),
    definition: assessmentDefinitionValidator,
    channel: v.optional(channelValidator),
  },
  handler: async (ctx, { userId, definition, channel }) => {
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Close any existing active sessions for this assessment
    const existingSessions = await ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
      .collect();

    for (const session of existingSessions) {
      if (session.status === 'active') {
        await ctx.db.patch(session._id, { status: 'completed' });
      }
    }

    // Create new assessment session
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

export const getAssessment = query({
  args: {
    userId: v.string(),
    definitionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getByExternalId(ctx, args.userId);
    if (!user) return null;

    return ctx.db
      .query('assessments')
      .withIndex('by_user_definition', (q) =>
        q.eq('userId', user._id).eq('definitionId', args.definitionId)
      )
      .order('desc')
      .first();
  },
});

