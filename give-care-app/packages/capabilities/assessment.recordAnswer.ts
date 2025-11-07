import { z } from 'zod';
import { capability } from './factory';

const InputSchema = z.object({
  sessionId: z.string(),
  definitionId: z.string().default('burnout_v1'),
  questionId: z.string(),
  value: z.number().min(0).max(4),
});

export const recordAssessmentAnswerCapability = capability({
  name: 'assessment.recordAnswer',
  description: 'Record an assessment response and return the next question or final score.',
  costHint: 'low',
  latencyHint: 'low',
  io: { input: InputSchema },
  requiresConsent: false,
  async run(input, ctx) {
    const payload = InputSchema.parse(input);
    const result = await ctx.store.recordAssessmentAnswer(payload);

    if (result.completed) {
      return {
        completed: true,
        score: result.score,
        nextQuestion: null,
      };
    }

    return {
      completed: false,
      nextQuestion: result.nextQuestion,
    };
  },
});
