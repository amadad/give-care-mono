"use node";

/**
 * Memory Recording Tool
 * Save important information about the user to build context over time
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const recordMemory = createTool({
  args: z.object({
    content: z.string().describe('The information to remember about the user'),
    category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger']).describe('Category of memory'),
    importance: z.number().min(1).max(10).describe('Importance score (1-10): 9-10=critical, 6-8=important, 3-5=useful, 1-2=minor'),
  }),
  description: 'Save important information about the user to build context over time. Use for care routines, preferences, intervention results, and crisis triggers.',
  handler: async (ctx, args: { content: string; category: string; importance: number }): Promise<{ success: boolean; error?: string; message?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { success: false, error: 'User ID not available' };
    }

    await ctx.runMutation(api.public.recordMemory, {
      userId,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });

    return {
      success: true,
      message: 'Memory saved successfully',
    };
  },
});
