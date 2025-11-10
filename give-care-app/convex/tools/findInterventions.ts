"use node";

/**
 * Find Interventions Tool
 * Get evidence-based interventions matched to pressure zones
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const findInterventions = createTool({
  args: z.object({
    zones: z.array(z.string()).optional().describe('Pressure zones to target (e.g., ["emotional", "physical", "time"]). If not provided, uses user\'s current pressure zones.'),
    minEvidenceLevel: z.enum(['high', 'moderate', 'low']).optional().describe('Minimum evidence level (default: moderate)'),
    limit: z.number().optional().describe('Maximum number of interventions (default: 5)'),
  }),
  description: 'Get evidence-based interventions matched to pressure zones. Returns micro-commitments and support strategies with evidence levels.',
  handler: async (ctx, args: { zones?: string[]; minEvidenceLevel?: 'high' | 'moderate' | 'low'; limit?: number }): Promise<{ error?: string; interventions?: any[]; zones?: string[] }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    let zones: string[] = args.zones || [];
    if (zones.length === 0) {
      const status = await ctx.runQuery(api.wellness.getStatus, {
        userId,
      });
      zones = status.pressureZones || ['emotional', 'physical'];
    }

    const interventions = await ctx.runQuery(api.interventions.getByZones, {
      zones,
      minEvidenceLevel: args.minEvidenceLevel || 'moderate',
      limit: args.limit || 5,
    });

    return {
      interventions,
      zones,
    };
  },
});

