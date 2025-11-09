/**
 * Agent thread helpers.
 */

import { internalMutation } from '../_generated/server';
import { components } from '../_generated/api';
import { v } from 'convex/values';
import { createThread } from '@convex-dev/agent';

export const createComponentThread = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return createThread(ctx, components.agent, {
      userId: userId as string,
    });
  },
});
