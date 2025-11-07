import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Users from '../model/users';

const QUESTIONS = {
  burnout_v1: [
    { id: 'energy', prompt: 'How much energy do you have right now?', type: 'scale', min: 0, max: 4 },
    { id: 'stress', prompt: 'How stressed do you feel?', type: 'scale', min: 0, max: 4 },
    { id: 'support', prompt: 'Do you feel supported today?', type: 'scale', min: 0, max: 4 },
    { id: 'hope', prompt: 'How hopeful do you feel about the week ahead?', type: 'scale', min: 0, max: 4 },
  ],
  bsfc_v1: [
    { id: 'q1', prompt: 'My life satisfaction has suffered due to care', type: 'scale', min: 0, max: 3, zone: 'emotional' },
    { id: 'q2', prompt: 'I feel physically strained', type: 'scale', min: 0, max: 3, zone: 'physical' },
    { id: 'q3', prompt: 'Caregiving restricts my freedom', type: 'scale', min: 0, max: 3, zone: 'social' },
    { id: 'q4', prompt: 'I have conflicts between caregiving and other duties', type: 'scale', min: 0, max: 3, zone: 'time' },
    { id: 'q5', prompt: 'I worry about the person I care for', type: 'scale', min: 0, max: 3, zone: 'emotional' },
    { id: 'q6', prompt: 'Caregiving exhausts me physically', type: 'scale', min: 0, max: 3, zone: 'physical' },
    { id: 'q7', prompt: 'I feel trapped in my role as caregiver', type: 'scale', min: 0, max: 3, zone: 'social' },
    { id: 'q8', prompt: 'Caregiving takes up most of my time', type: 'scale', min: 0, max: 3, zone: 'time' },
    { id: 'q9', prompt: 'I am emotionally drained by caregiving', type: 'scale', min: 0, max: 3, zone: 'emotional' },
    { id: 'q10', prompt: 'My health has suffered from caregiving', type: 'scale', min: 0, max: 3, zone: 'physical' },
  ],
} as const;

type DefinitionId = keyof typeof QUESTIONS;

const getQuestions = (definitionId: string) => {
  const qs = QUESTIONS[definitionId as DefinitionId];
  if (!qs) throw new Error(`Unknown assessment definition ${definitionId}`);
  return qs;
};

const scoreAnswers = (definitionId: string, answers: Array<{ questionId: string; value: number }>) => {
  const total = answers.reduce((sum, a) => sum + a.value, 0);

  if (definitionId === 'bsfc_v1') {
    const band = total >= 20 ? 'high' : total >= 10 ? 'medium' : 'low';

    const questions = QUESTIONS.bsfc_v1;
    const zoneScores: Record<string, number> = {
      emotional: 0,
      physical: 0,
      social: 0,
      time: 0,
    };

    answers.forEach((answer) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && 'zone' in question) {
        zoneScores[question.zone as string] = (zoneScores[question.zone as string] || 0) + answer.value;
      }
    });

    const pressureZones = Object.entries(zoneScores)
      .map(([zone, score]) => ({ zone, score, maxScore: 9 }))
      .sort((a, b) => b.score - a.score);

    return {
      total,
      band,
      explanation: `Total score ${total}/30 indicates ${band} burden.`,
      pressureZones,
    };
  }

  const band = total >= 15 ? 'high' : total >= 8 ? 'medium' : 'low';
  return {
    total,
    band,
    explanation: `Total score ${total}/20 indicates ${band} burnout.`,
  };
};

export const start = mutation({
  args: {
    userId: v.string(),
    definitionId: v.string(),
  },
  handler: async (ctx, { userId, definitionId }) => {
    const user = await Users.ensureUser(ctx, { externalId: userId, channel: 'sms' });
    const questions = getQuestions(definitionId);
    const sessionId = await ctx.db.insert('assessment_sessions', {
      userId: user._id,
      definitionId,
      channel: 'sms',
      questionIndex: 0,
      answers: [],
      status: 'active',
    });
    return { sessionId, question: questions[0] };
  },
});

export const recordAnswer = mutation({
  args: {
    sessionId: v.id('assessment_sessions'),
    definitionId: v.string(),
    questionId: v.string(),
    value: v.number(),
  },
  handler: async (ctx, { sessionId, definitionId, questionId, value }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Assessment session not active');
    }
    const questions = getQuestions(definitionId);
    const currentIndex = session.questionIndex;
    const expectedQuestion = questions[currentIndex];
    if (!expectedQuestion || expectedQuestion.id !== questionId) {
      throw new Error('Question mismatch');
    }

    const updatedAnswers = [...session.answers, { questionId, value }];
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      const score = scoreAnswers(definitionId, updatedAnswers);
      const assessmentId = await ctx.db.insert('assessments', {
        userId: session.userId,
        definitionId,
        version: 'v1',
        answers: updatedAnswers,
      });
      await ctx.db.insert('scores', {
        userId: session.userId,
        assessmentId,
        composite: score.total,
        band: score.band,
        confidence: 0.8,
      });
      await ctx.db.patch(session._id, { status: 'completed', questionIndex: nextIndex, answers: updatedAnswers });
      return { completed: true, score };
    }

    await ctx.db.patch(session._id, { questionIndex: nextIndex, answers: updatedAnswers });
    return { completed: false, nextQuestion: questions[nextIndex] };
  },
});
