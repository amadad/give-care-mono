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
  ema_v1: [
    { id: 'stress', prompt: 'Right now, how stressed are you feeling? (1-10)', type: 'scale', min: 1, max: 10 },
    { id: 'mood', prompt: 'How would you describe your mood right now?', type: 'scale', min: 0, max: 4, labels: ['Very down/hopeless', 'Down/sad', 'Neutral/mixed', 'Okay/content', 'Good/positive'] },
    { id: 'coping', prompt: 'Right now, how well do you feel you can handle what you\'re facing?', type: 'scale', min: 0, max: 4, labels: ['I can\'t handle this', 'It\'s really hard', 'I\'m not sure', 'I think I can handle it', 'I can handle this'] },
  ],
  reach_ii_v1: [
    { id: 'q1', prompt: 'Do you have written information about memory loss, Alzheimer\'s Disease, or dementia?', type: 'binary', yes: 0, no: 1 },
    { id: 'q2', prompt: 'Can care recipient get to dangerous objects?', type: 'binary', yes: 1, no: 0 },
    { id: 'q3', prompt: 'Do you ever leave care recipient alone or unsupervised?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q4', prompt: 'Does care recipient try to wander outside?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q5', prompt: 'Does care recipient drive?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q6', prompt: 'How satisfied with help from family/friends?', type: 'satisfaction', values: { very: 0, moderately: 1, little: 2, not_at_all: 3 } },
    { id: 'q7', prompt: 'How satisfied with support and concern from others?', type: 'satisfaction', values: { very: 0, moderately: 1, little: 2, not_at_all: 3 } },
    { id: 'q8', prompt: 'Trouble sleeping in past month?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q9', prompt: 'How would you describe your health?', type: 'health', values: { excellent: 0, very_good: 1, good: 2, fair: 3, poor: 4 } },
    { id: 'q10', prompt: 'Felt depressed, sad, or crying spells in past month?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q11', prompt: 'Felt like screaming/yelling at care recipient (past 6 months)?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q12', prompt: 'Had to keep from hitting/slapping care recipient (past 6 months)?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q13', prompt: 'Hard or stressful to handle household chores?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q14', prompt: 'Feel strained when around care recipient?', type: 'strain', values: { never: 0, rarely: 1, sometimes: 2, quite_often: 3, frequently: 4, nearly_always: 5 } },
    { id: 'q15', prompt: 'Hard to help with basic daily activities?', type: 'frequency', values: { never: 0, sometimes: 1, often: 2 } },
    { id: 'q16', prompt: 'Providing help has made me feel good about myself', type: 'agreement', values: { agree_lot: 0, agree_little: 1, neither: 1, disagree_little: 2, disagree_lot: 3 } },
  ],
  sdoh_v1: [
    { id: 'food1', prompt: 'How often worried food would run out (past 12 months)?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'food2', prompt: 'Food didn\'t last and no money for more (past 12 months)?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'housing', prompt: 'Current housing situation', type: 'category', value: 0 },
    { id: 'eviction', prompt: 'Been evicted or unable to pay rent (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'transport1', prompt: 'Lack of transportation kept from medical care (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'transport2', prompt: 'How often have transportation problems?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'transport3', prompt: 'Have reliable transportation for emergencies?', type: 'binary', yes: 0, no: 1 },
    { id: 'social1', prompt: 'How often see/talk to people you care about?', type: 'frequency_7', values: { daily: 0, several_weekly: 1, weekly: 2, several_monthly: 3, monthly: 4, less_monthly: 5, never: 6 } },
    { id: 'social2', prompt: 'Have someone for emotional support?', type: 'binary', yes: 0, no: 1 },
    { id: 'social3', prompt: 'How often feel lonely or isolated?', type: 'frequency_5', values: { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 } },
    { id: 'social4', prompt: 'Have someone to help with caregiving?', type: 'binary', yes: 0, no: 1 },
    { id: 'financial1', prompt: 'How hard to pay for basics?', type: 'difficulty', values: { not_hard: 0, somewhat: 1, hard: 2, very_hard: 3, extremely: 4 } },
    { id: 'financial2', prompt: 'Had to choose between medication and basic needs (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'insurance', prompt: 'Have health insurance?', type: 'category', value: 0 },
    { id: 'medical_cost', prompt: 'Unable to get medical care due to cost (past 12 months)?', type: 'binary', yes: 1, no: 0 },
    { id: 'education', prompt: 'Highest education level', type: 'category', value: 0 },
    { id: 'internet', prompt: 'Have reliable internet access?', type: 'binary', yes: 0, no: 1 },
    { id: 'tech_comfort', prompt: 'Comfortable using technology for healthcare?', type: 'comfort', values: { very: 0, somewhat: 1, not_very: 2, not_at_all: 3 } },
    { id: 'health_literacy', prompt: 'Need help reading health information?', type: 'binary', yes: 1, no: 0 },
    { id: 'safety', prompt: 'Feel safe in your neighborhood?', type: 'safety', values: { very: 0, somewhat: 1, not_very: 2, not_at_all: 3 } },
    { id: 'violence', prompt: 'Been afraid of partner/ex-partner (past year)?', type: 'binary', yes: 1, no: 0 },
    { id: 'legal1', prompt: 'Have legal problems causing stress?', type: 'binary', yes: 1, no: 0 },
    { id: 'legal2', prompt: 'Ever needed legal help but couldn\'t afford it?', type: 'binary', yes: 1, no: 0 },
    { id: 'language', prompt: 'Preferred language for healthcare', type: 'category', value: 0 },
    { id: 'discrimination', prompt: 'Felt discriminated against in healthcare?', type: 'binary', yes: 1, no: 0 },
    { id: 'cultural', prompt: 'Cultural background understood by providers?', type: 'frequency_5', values: { always: 0, usually: 1, sometimes: 2, rarely: 3, never: 4 } },
    { id: 'caregiver_cost', prompt: 'How much do caregiving costs strain finances?', type: 'strain_5', values: { not_at_all: 0, little: 1, moderately: 2, quite_a_bit: 3, extremely: 4 } },
    { id: 'caregiver_assistance', prompt: 'Know about financial assistance programs?', type: 'familiarity', values: { very: 0, somewhat: 1, not_very: 2, not_at_all: 3 } },
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

  // EMA: Ecological Momentary Assessment (real-time stress)
  if (definitionId === 'ema_v1') {
    const stressAnswer = answers.find(a => a.questionId === 'stress');
    const stressLevel = stressAnswer?.value || 0;
    const band = stressLevel >= 8 ? 'crisis' : stressLevel >= 6 ? 'high' : stressLevel >= 4 ? 'moderate' : 'low';
    return {
      total: stressLevel,
      band,
      explanation: `Stress level ${stressLevel}/10 - ${band} intervention recommended.`,
    };
  }

  // REACH-II: Risk appraisal for caregiver strain
  if (definitionId === 'reach_ii_v1') {
    const band = total >= 27 ? 'high' : total >= 11 ? 'moderate' : 'low';
    return {
      total,
      band,
      explanation: `REACH-II score ${total}/40 - ${band} risk for caregiver strain.`,
    };
  }

  // SDOH: Social Determinants of Health (5 zones including financial)
  if (definitionId === 'sdoh_v1') {
    const zoneScores: Record<string, number> = {
      food: 0,
      housing: 0,
      transportation: 0,
      social: 0,
      financial: 0,
    };

    answers.forEach((answer) => {
      const qId = answer.questionId;
      if (qId.startsWith('food')) zoneScores.food += answer.value;
      else if (qId.includes('housing') || qId === 'eviction') zoneScores.housing += answer.value;
      else if (qId.startsWith('transport')) zoneScores.transportation += answer.value;
      else if (qId.startsWith('social')) zoneScores.social += answer.value;
      else if (qId.startsWith('financial') || qId.includes('insurance') || qId.includes('medical_cost')) zoneScores.financial += answer.value;
    });

    const pressureZones = Object.entries(zoneScores)
      .map(([zone, score]) => ({ zone, score, maxScore: 10 }))
      .sort((a, b) => b.score - a.score);

    const band = total >= 40 ? 'high' : total >= 20 ? 'moderate' : 'low';

    return {
      total,
      band,
      explanation: `SDOH score ${total} - ${band} social risk.`,
      pressureZones,
    };
  }

  // Burnout v1: Legacy daily check-in
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
