"use node";

/**
 * Get Interventions Tool (for Assessment Agent)
 * Lookup evidence-based caregiver interventions matching pressure zones
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const getInterventions = createTool({
  args: z.object({
    zones: z.array(z.string()).describe('Pressure zones from assessment'),
    minEvidenceLevel: z.enum(['high', 'moderate', 'low']).optional().describe('Minimum evidence level (default: moderate)'),
    limit: z.number().optional().describe('Max number of interventions (default: 5)'),
  }),
  description: 'Lookup evidence-based caregiver interventions matching pressure zones. Use this to provide specific, research-backed recommendations.',
  handler: async (ctx, args: { zones: string[]; minEvidenceLevel?: 'high' | 'moderate' | 'low'; limit?: number }) => {
    const interventions = await ctx.runQuery(api.interventions.getByZones, {
      zones: args.zones,
      minEvidenceLevel: args.minEvidenceLevel || 'moderate',
      limit: args.limit || 5,
    });

    return { interventions };
  },
});

