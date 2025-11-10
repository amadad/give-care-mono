"use node";

/**
 * Start Assessment Tool
 * Begin a wellness assessment
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const startAssessment = createTool({
  args: z.object({
    assessmentType: z.enum(['burnout_v1', 'bsfc_v1', 'ema_v1', 'reach_ii_v1', 'sdoh_v1']).describe('Type of assessment to start'),
  }),
  description: 'Begin a wellness assessment. This will initiate a structured check-in to track burnout, stress, or other wellness metrics.',
  handler: async (ctx, args: { assessmentType: string }): Promise<{ error?: string; success?: boolean; assessmentType?: string; message?: string; nextStep?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    const mapType = (t: string): 'ema' | 'bsfc' | 'reach2' | 'sdoh' => {
      if (t === 'ema_v1') return 'ema';
      if (t === 'bsfc_v1') return 'bsfc';
      if (t === 'reach_ii_v1') return 'reach2';
      if (t === 'sdoh_v1') return 'sdoh';
      return 'ema';
    };

    const definition = mapType(args.assessmentType);

    try {
      await ctx.runMutation(api.public.startAssessment, {
        userId,
        definition,
        channel: 'sms',
      });

      return {
        success: true,
        assessmentType: args.assessmentType,
        message: `Starting ${definition.toUpperCase()} now.`,
        nextStep: 'I\'ll ask one question at a time.',
      };
    } catch (error) {
      return {
        error: String(error),
        success: false,
      };
    }
  },
});
