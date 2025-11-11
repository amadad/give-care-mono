/**
 * Agent Helper Functions
 *
 * Shared utilities for agent thread management.
 * These helpers require ActionCtx because they interact with Agent Component.
 */

import { Agent } from '@convex-dev/agent';
import { components } from '../_generated/api';
import type { ActionCtx } from '../_generated/server';

/**
 * Get or create agent thread for a user
 *
 * Pattern: If threadId provided, continue it. Otherwise, find most recent thread
 * or create new one. This centralizes the duplicated logic across all agents.
 *
 * @param ctx - ActionCtx required for component queries
 * @param agent - The agent instance (mainAgent, crisisAgent, assessmentAgent)
 * @param userId - User's external ID
 * @param threadId - Optional existing thread ID to continue
 * @returns Thread object and threadId
 */
export async function ensureAgentThread(
  ctx: ActionCtx,
  agent: Agent,
  userId: string,
  threadId?: string
): Promise<{ thread: any; threadId: string }> {
  if (threadId) {
    // Continue existing thread
    const threadResult = await agent.continueThread(ctx, {
      threadId,
      userId,
    });
    return {
      thread: threadResult.thread,
      threadId,
    };
  }

  // Find existing thread or create new one
  const existingThreadsResult = await ctx.runQuery(
    components.agent.threads.listThreadsByUserId,
    {
      userId,
      paginationOpts: { cursor: null, numItems: 1 },
      order: 'desc', // Most recent first
    }
  );

  if (existingThreadsResult?.page?.length > 0) {
    // Use most recent thread
    const threadResult = await agent.continueThread(ctx, {
      threadId: existingThreadsResult.page[0]._id,
      userId,
    });
    return {
      thread: threadResult.thread,
      threadId: existingThreadsResult.page[0]._id,
    };
  }

  // Create new thread
  const threadResult = await agent.createThread(ctx, { userId });
  return {
    thread: threadResult.thread,
    threadId: threadResult.threadId,
  };
}
