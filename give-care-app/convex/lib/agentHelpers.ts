/**
 * Agent Helper Functions
 *
 * Shared utilities for agent thread management.
 * These helpers require ActionCtx because they interact with Agent Component.
 */

import { Agent } from '@convex-dev/agent';
import { components, internal } from '../_generated/api';
import type { ActionCtx } from '../_generated/server';

/**
 * Get or create threadId for a user (OPTIMIZED - no thread loading)
 *
 * OPTIMIZATION: Based on Convex Agent Component docs, we can use
 * `agent.generateText(ctx, { threadId }, { prompt })` directly without
 * calling `continueThread()` first. This saves ~1.8s by avoiding message loading.
 *
 * Use `getOrCreateThreadId()` when you'll call `agent.generateText()` directly.
 * Use `ensureAgentThread()` only if you need the thread object for `thread.generateText()`.
 *
 * @param ctx - ActionCtx required for component queries
 * @param agent - The agent instance (mainAgent, crisisAgent, assessmentAgent)
 * @param userId - User's external ID
 * @param threadId - Optional existing thread ID
 * @returns threadId (no thread object loaded)
 */
export async function getOrCreateThreadId(
  ctx: ActionCtx,
  agent: Agent,
  userId: string,
  threadId?: string,
  userMetadata?: Record<string, unknown>
): Promise<string> {
  if (threadId) {
    return threadId;
  }

  // OPTIMIZATION: Check cached threadId in user metadata first
  const convexMetadata = userMetadata?.convex as Record<string, unknown> | undefined;
  const cachedThreadId = convexMetadata?.threadId as string | undefined;
  if (cachedThreadId) {
    // Verify thread still exists (might have been deleted)
    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId: cachedThreadId,
    });
    if (thread) {
      return cachedThreadId;
    }
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
    const foundThreadId = existingThreadsResult.page[0]._id;
    // Cache threadId in metadata for next time (async, non-blocking)
    // Note: We'd need userId (Convex ID) to update metadata, skip for now
    // TODO: Pass Convex userId to enable caching
    return foundThreadId;
  }

  // Create new thread
  const threadResult = await agent.createThread(ctx, { userId });
  // Note: Cache threadId in metadata would require Convex userId
  // TODO: Update metadata when thread is created
  return threadResult.threadId;
}

/**
 * Get or create agent thread for a user (loads thread object)
 *
 * Use this only if you need the thread object for `thread.generateText()`.
 * Otherwise, use `getOrCreateThreadId()` + `agent.generateText()` for better performance.
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
  threadId?: string,
  userMetadata?: Record<string, unknown>
): Promise<{ thread: any; threadId: string }> {
  // OPTIMIZATION: Use cached threadId from metadata if available
  let finalThreadId = threadId;
  if (!finalThreadId && userMetadata) {
    const convexMetadata = userMetadata.convex as Record<string, unknown> | undefined;
    const cachedThreadId = convexMetadata?.threadId as string | undefined;
    if (cachedThreadId) {
      // Verify thread still exists (might have been deleted)
      const thread = await ctx.runQuery(components.agent.threads.getThread, {
        threadId: cachedThreadId,
      });
      if (thread) {
        finalThreadId = cachedThreadId;
      }
    }
  }

  if (finalThreadId) {
    // OPTIMIZATION: continueThread() loads messages, but contextOptions will filter them
    // The ~1.8s delay is likely from loading thread metadata, not messages
    // TODO: Investigate if we can skip continueThread() and use agent.generateText() directly
    // For now, we still need thread object for thread.generateText() with system override
    const threadResult = await agent.continueThread(ctx, {
      threadId: finalThreadId,
      userId,
    });
    return {
      thread: threadResult.thread,
      threadId: finalThreadId,
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

  let foundThreadId: string;
  if (existingThreadsResult?.page?.length > 0) {
    foundThreadId = existingThreadsResult.page[0]._id;
  } else {
    // Create new thread
    const threadResult = await agent.createThread(ctx, { userId });
    foundThreadId = threadResult.threadId;
  }

  // Cache threadId in metadata for next time (async, non-blocking)
  // Note: updateUserMetadata requires Convex userId, not externalId
  // We'd need to look up user first, so skip caching for now to avoid extra query
  // TODO: Pass Convex userId from context to enable caching without extra lookup

  // Use most recent thread or newly created thread
  const threadResult = await agent.continueThread(ctx, {
    threadId: foundThreadId,
    userId,
  });
  return {
    thread: threadResult.thread,
    threadId: foundThreadId,
  };
}
