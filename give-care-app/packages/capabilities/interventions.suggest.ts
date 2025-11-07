import { z } from 'zod';
import { capability } from './factory';

export const suggestInterventions = capability({
  name: 'interventions.suggest',
  description: 'Ranks interventions for a given pressure zone',
  costHint: 'low',
  latencyHint: 'low',
  io: {
    input: z.object({ pressureZone: z.enum(['work', 'home', 'health']) }),
  },
  async run({ pressureZone }, { services }) {
    return services.interventions.rankInterventions({ pressureZone });
  },
});
