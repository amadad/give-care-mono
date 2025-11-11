"use node";

/**
 * Track Intervention Preference Tool
 *
 * Allows agents to record user feedback on interventions (tried, liked, disliked, helpful).
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { internal } from '../_generated/api';

export const trackInterventionPreference = createTool({
  args: z.object({
    interventionId: z.string(),
    status: z.enum(['tried', 'liked', 'disliked', 'helpful', 'not_helpful']),
  }),
  description: 'Record whether the user tried/liked/disliked an intervention',
  handler: async (ctx, args) => {
    const user = (ctx as any).userId;
    if (!user) {
      return { success: false, error: 'No user ID available' };
    }

    const convexUser = await ctx.runQuery(internal.internal.getByExternalIdQuery, {
      externalId: user,
    });

    if (!convexUser) {
      return { success: false, error: 'User not found' };
    }

    await ctx.runMutation(internal.interventions.recordInterventionEvent, {
      userId: convexUser._id,
      interventionId: args.interventionId,
      status: args.status,
    });

    return { success: true };
  },
});

