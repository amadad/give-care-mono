import { z } from 'zod';
import { capability } from './factory';
import { firstQuestion } from '../services/assessment';

const InputSchema = z.object({
  definitionId: z.string().default('burnout_v1'),
});

export const startAssessmentCapability = capability({
  name: 'assessment.start',
  description: 'Begin a guided wellness assessment and receive the first question.',
  costHint: 'low',
  latencyHint: 'low',
  io: { input: InputSchema },
  async run(input, ctx) {
    const { definitionId } = InputSchema.parse(input);
    const question = firstQuestion(definitionId);
    const session = await ctx.store.startAssessmentSession({
      userId: ctx.context.userId,
      definitionId,
    });

    return {
      sessionId: session.sessionId,
      question: session.question ?? question,
    };
  },
});
