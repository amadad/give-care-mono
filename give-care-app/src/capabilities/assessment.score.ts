import { z } from 'zod';
import { capability } from './factory';

export const scoreAssessment = capability({
  name: 'assessment.score',
  description: 'Scores assessment responses deterministically',
  costHint: 'low',
  latencyHint: 'low',
  io: {
    input: z.object({
      definitionId: z.string(),
      answers: z.array(z.object({ questionId: z.string(), value: z.number().min(0).max(4) })),
    }),
  },
  async run({ definitionId, answers }, { services }) {
    return services.assessment.scoreAssessment(definitionId, answers);
  },
});
