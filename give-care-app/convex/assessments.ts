import { mutation, query, internalAction } from './_generated/server';
import { v } from 'convex/values';
import { getByExternalId } from './lib/core';
import { CATALOG, type AssessmentAnswer, scoreWithDetails } from './lib/assessmentCatalog';
import { extractSDOHProfile } from './lib/profile';
import type { Doc } from './_generated/dataModel';
import { internal, api } from './_generated/api';

const assessmentDefinitionValidator = v.union(
  v.literal('ema'),
  v.literal('bsfc'),
  v.literal('reach2'),
  v.literal('sdoh')
);

const channelValidator = v.union(v.literal('sms'), v.literal('web'));

type SessionAnswer = Doc<'assessment_sessions'>['answers'][number];

const toAssessmentAnswers = (answers: SessionAnswer[]): AssessmentAnswer[] =>
  answers.map((answer, idx) => ({
    questionIndex: Number.isNaN(Number.parseInt(answer.questionId, 10))
      ? idx
      : Number.parseInt(answer.questionId, 10),
    value: answer.value,
  }));

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

    // Fix: Only fetch active sessions, limit query
    const existingSessions = await ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .take(10); // Reasonable limit

    for (const session of existingSessions) {
      await ctx.db.patch(session._id, { status: 'completed' });
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

/**
 * Get active assessment session for a user
 * Returns the in-progress session with answers, or null if no active session
 */
export const getActiveSession = query({
  args: {
    userId: v.string(),
    definition: assessmentDefinitionValidator,
  },
  handler: async (ctx, { userId, definition }) => {
    const user = await getByExternalId(ctx, userId);
    if (!user) return null;

    return ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .order('desc')
      .first();
  },
});

/**
 * Get any active assessment session for a user (not specific definition)
 * Used for fast-path routing of numeric replies
 */
export const getAnyActiveSession = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await getByExternalId(ctx, userId);
    if (!user) return null;

    return ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_status', (q) => q.eq('userId', user._id).eq('status', 'active'))
      .order('desc')
      .first();
  },
});

/**
 * Answer a question in the active assessment session
 * Appends answer to session.answers array and increments questionIndex
 */
export const answerAssessment = mutation({
  args: {
    userId: v.string(),
    definition: assessmentDefinitionValidator,
    questionIndex: v.number(),
    value: v.number(),
  },
  handler: async (ctx, { userId, definition, questionIndex, value }) => {
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get active session
    const session = await ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .order('desc')
      .first();

    if (!session) {
      throw new Error('No active assessment session found');
    }

    // Append answer (mirror schema shape)
    const newAnswer: SessionAnswer = {
      questionId: questionIndex.toString(),
      value,
    };
    const updatedAnswers = [...session.answers, newAnswer];

    await ctx.db.patch(session._id, {
      answers: updatedAnswers,
      questionIndex: questionIndex + 1,
    });

    return { sessionId: session._id, currentIndex: questionIndex + 1 };
  },
});

/**
 * Finalize assessment - compute score and create final assessment record
 * Moves answers from session to completed assessment with scoring
 */
export const finalizeAssessment = mutation({
  args: {
    userId: v.string(),
    definition: assessmentDefinitionValidator,
  },
  handler: async (ctx, { userId, definition }) => {
    const user = await getByExternalId(ctx, userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get active session
    const session = await ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .order('desc')
      .first();

    if (!session) {
      throw new Error('No active assessment session found');
    }

    // Compute score using catalog (convert stored answers to catalog shape)
    const catalog = CATALOG[definition];
    const normalizedAnswers = toAssessmentAnswers(session.answers);
    const details = scoreWithDetails(definition, normalizedAnswers);

    // Create final assessment record matching schema fields
    const assessmentId = await ctx.db.insert('assessments', {
      userId: user._id,
      definitionId: definition,
      version: 'v1',
      answers: session.answers,
      completedAt: Date.now(),
    });

    // Create scores row (NEW: Phase 1.1)
    const zones = {
      emotional: details.zoneAverages.emotional ?? 0,
      physical: details.zoneAverages.physical ?? 0,
      social: details.zoneAverages.social ?? 0,
      time: details.zoneAverages.time ?? 0,
      financial: details.zoneAverages.financial, // optional
    };

    const scoreId = await ctx.db.insert('scores', {
      userId: user._id,
      assessmentId,
      composite: details.composite,
      band: details.band,
      zones,
      confidence: details.confidence,
    });

    // Mark session as completed
    await ctx.db.patch(session._id, {
      status: 'completed',
    });

    // Schedule update (fire-and-forget) - Phase 1.2
    void ctx.scheduler.runAfter(
      0,
      internal.workflows.scheduling.updateCheckInSchedule,
      { userId: user._id }
    );

    // SDOH → Profile enrichment - Phase 2.5
    if (definition === 'sdoh') {
      const sdoh = extractSDOHProfile(normalizedAnswers);
      const meta = (user.metadata ?? {}) as Record<string, unknown>;
      await ctx.db.patch(user._id, {
        metadata: {
          ...meta,
          profile: {
            ...((meta.profile as any) ?? {}),
            ...sdoh,
          },
        },
      });
    }

    // Automatic intervention suggestions - Phase 2.6
    if (details.pressureZones.length > 0) {
      void ctx.scheduler.runAfter(0, internal.workflows.interventions.suggestInterventions, {
        userId: user._id,
        assessmentId,
        zones: details.pressureZones,
      });
    }

    return {
      assessmentId,
      score: details.composite,
      band: details.band,
      pressureZones: details.pressureZones,
    };
  },
});

/**
 * Handle inbound assessment answer (fast-path for numeric replies)
 * Processes numeric answers or skip, advances session, finalizes if complete
 */
export const handleInboundAnswer = internalAction({
  args: {
    userId: v.string(), // externalId
    definition: assessmentDefinitionValidator,
    text: v.string(),
  },
  handler: async (ctx, { userId, definition, text }) => {
    const user = await ctx.runQuery(internal.internal.getByExternalIdQuery, { externalId: userId });
    if (!user) return { text: null, done: false };

    // Get active session
    const session = await ctx.runQuery(api.assessments.getActiveSession, {
      userId,
      definition,
    });

    if (!session) return { text: null, done: false };

    const catalog = CATALOG[definition];
    const currentIndex = session.questionIndex;

    // Parse input
    if (/^skip$/i.test(text.trim())) {
      // Skip: advance without answer (use 0 as placeholder)
      await ctx.runMutation(api.assessments.answerAssessment, {
        userId,
        definition,
        questionIndex: currentIndex,
        value: 0, // Use 0 for skip (scoring logic handles this)
      });
    } else {
      const match = text.trim().match(/^\s*([1-5])\s*$/);
      if (match) {
        const value = parseInt(match[1], 10);
        await ctx.runMutation(api.assessments.answerAssessment, {
          userId,
          definition,
          questionIndex: currentIndex,
          value,
        });
      } else {
        // Invalid input: reprompt
        const question = catalog.items[currentIndex];
        return {
          text: `Please reply with a number 1-5. ${question.text} (Reply "skip" to move on)`,
          done: false,
        };
      }
    }

    // Check if finished
    const updatedSession = await ctx.runQuery(api.assessments.getActiveSession, {
      userId,
      definition,
    });

    if (!updatedSession || updatedSession.questionIndex >= catalog.length) {
      // Finalize assessment (creates score, schedules check-ins)
      const result = await ctx.runMutation(api.assessments.finalizeAssessment, {
        userId,
        definition,
      });

      return {
        text: `Thanks! Your score is ${result.score} (${result.band}). We'll check in with you soon.`,
        done: true,
      };
    }

    // Send next question
    const nextIndex = updatedSession.questionIndex;
    const nextQuestion = catalog.items[nextIndex];
    const total = catalog.length;

    return {
      text: `(${nextIndex + 1} of ${total}) ${nextQuestion.text} (Reply "skip" to move on)`,
      done: false,
    };
  },
});
