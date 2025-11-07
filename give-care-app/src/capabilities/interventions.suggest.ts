import { z } from 'zod';
import { capability } from './factory';

const interventionsInputSchema = z.object({
  pressureZone: z.enum(['work', 'home', 'health'])
});

export const suggestInterventions = capability({
  name: 'interventions.suggest',
  description: 'Ranks interventions for a given pressure zone',
  costHint: 'low',
  latencyHint: 'low',
  io: { input: interventionsInputSchema },
  async run(args, { services }) {
    const { pressureZone } = interventionsInputSchema.parse(args);
    return services.interventions.rankInterventions({ pressureZone });
  },
});
