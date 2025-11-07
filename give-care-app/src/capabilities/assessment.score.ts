import { z } from 'zod';
import { capability } from './factory';

const scoreInputSchema = z.object({
  definitionId: z.string(),
  answers: z.array(z.object({ questionId: z.string(), value: z.number().min(0).max(4) })),
});

export const scoreAssessment = capability({
  name: 'assessment.score',
  description: 'Scores assessment responses deterministically',
  costHint: 'low',
  latencyHint: 'low',
  io: { input: scoreInputSchema },
  async run(args, { services }) {
    const { definitionId, answers } = scoreInputSchema.parse(args);
    return services.assessment.scoreAssessment(definitionId, answers);
  },
});
