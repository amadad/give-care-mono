/**
 * Resource Cache Refresh Workflow
 *
 * Durable workflow for refreshing resource cache in the background.
 * Non-blocking, retriable, and load-balanced.
 */

import { WorkflowManager } from '@convex-dev/workflow';
import { components, internal } from '../_generated/api';
import { v } from 'convex/values';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// RESOURCE CACHE REFRESH WORKFLOW
// ============================================================================

/**
 * Refresh resource cache with Maps Grounding results
 * Durable, retriable workflow that runs in the background
 */
export const refresh = workflow.define({
  args: {
    query: v.string(),
    category: v.string(),
    zip: v.string(),
    ttlMs: v.number(),
  },
  handler: async (step, args) => {
    // Step 1: Fetch fresh results from Maps Grounding
    const mapsResult = await step.runAction(
      internal.resources._fetchWithMaps,
      {
        query: args.query,
        category: args.category,
        zip: args.zip,
      },
      { retry: true }
    );

    // Step 2: Update cache with fresh results
    await step.runMutation(internal.internal.recordResourceLookup, {
      userId: undefined,
      category: args.category,
      zip: args.zip,
      results: mapsResult.resources,
      expiresAt: Date.now() + args.ttlMs,
    });

    return { success: true };
  },
});

