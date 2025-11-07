import { z } from 'zod';
import { AssessmentQuestion } from '../shared/types';

export const AssessmentAnswerSchema = z.array(
  z.object({ questionId: z.string(), value: z.number().min(0).max(4) })
);

export type AssessmentAnswer = z.infer<typeof AssessmentAnswerSchema>[number];

export type AssessmentScore = {
  total: number;
  band: 'low' | 'medium' | 'high';
  explanation: string;
};

export type AssessmentDefinition = {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
};

const ASSESSMENT_DEFINITIONS: Record<string, AssessmentDefinition> = {
  burnout_v1: {
    id: 'burnout_v1',
    title: 'Daily Burnout Check-in',
    description: 'Quick 4-question EMA check-in for emotional load.',
    questions: [
      {
        id: 'energy',
        prompt: 'How much energy do you have right now?',
        type: 'scale',
        min: 0,
        max: 4,
      },
      {
        id: 'stress',
        prompt: 'How stressed do you feel?',
        type: 'scale',
        min: 0,
        max: 4,
      },
      {
        id: 'support',
        prompt: 'Do you feel supported today?',
        type: 'scale',
        min: 0,
        max: 4,
      },
      {
        id: 'hope',
        prompt: 'How hopeful do you feel about the week ahead?',
        type: 'scale',
        min: 0,
        max: 4,
      },
    ],
  },
};

export const getDefinition = (definitionId: string): AssessmentDefinition => {
  const def = ASSESSMENT_DEFINITIONS[definitionId];
  if (!def) {
    throw new Error(`Unknown assessment definition ${definitionId}`);
  }
  return def;
};

export const firstQuestion = (definitionId: string): AssessmentQuestion => {
  const def = getDefinition(definitionId);
  return def.questions[0];
};

export const nextQuestion = (definitionId: string, index: number): AssessmentQuestion | null => {
  const def = getDefinition(definitionId);
  return def.questions[index] ?? null;
};

const bandForScore = (score: number): AssessmentScore['band'] => {
  if (score >= 15) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
};

export const scoreAssessment = (definitionId: string, answers: AssessmentAnswer[]): AssessmentScore => {
  const parsed = AssessmentAnswerSchema.parse(answers);
  const total = parsed.reduce((sum, answer) => sum + answer.value, 0);
  return {
    total,
    band: bandForScore(total),
    explanation: `Definition ${definitionId} → score ${total}`,
  };
};
