"use node";

/**
 * Wellness Status Tool
 * Fetch burnout trends, pressure zones, and wellness status over time
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api } from '../_generated/api';

export const checkWellnessStatus = createTool({
  args: z.object({}),
  description: 'Fetch burnout trends, pressure zones, and wellness status over time. Shows recent scores and identifies areas needing support.',
  handler: async (ctx): Promise<any> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    const status = await ctx.runQuery(api.wellness.getStatus, {
      userId,
    });

    return status;
  },
});

