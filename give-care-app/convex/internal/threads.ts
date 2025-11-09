/**
 * Thread Management - Internal Mutations
 *
 * Provides mutation wrappers for Agent Component thread operations
 * to avoid unsafe ActionCtx → MutationCtx casts.
 */

import { internalMutation } from '../_generated/server';
import { components } from '../_generated/api';
import { v } from 'convex/values';
import { createThread } from '@convex-dev/agent';

/**
 * Create a new Agent Component thread
 *
 * This wrapper allows actions to safely create threads without
 * casting ActionCtx to MutationCtx (Convex best practice).
 */
export const createComponentThread = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await createThread(ctx, components.agent, {
      userId: userId as string,
    });
  },
});
