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
    assessmentType: z.enum(['ema', 'bsfc', 'reach2', 'sdoh']).describe('Type of assessment to start'),
  }),
  description: 'Begin a wellness assessment. This will initiate a structured check-in to track burnout, stress, or other wellness metrics.',
  handler: async (ctx, args: { assessmentType: string }): Promise<{ error?: string; success?: boolean; assessmentType?: string; message?: string; nextStep?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    try {
      await ctx.runMutation(api.assessments.startAssessment, {
        userId,
        definition: args.assessmentType as 'ema' | 'bsfc' | 'reach2' | 'sdoh',
        channel: 'sms',
      });

      return {
        success: true,
        assessmentType: args.assessmentType,
        message: `Starting ${args.assessmentType.toUpperCase()} now.`,
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

