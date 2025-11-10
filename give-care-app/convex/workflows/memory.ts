/**
 * Memory Enrichment Workflow (Hook Pattern)
 *
 * Runs async AFTER response to build context for NEXT message.
 * Always one step ahead - no blocking on current response.
 */

import { internal, components } from '../_generated/api';
import { v } from 'convex/values';
import { WorkflowManager } from '@convex-dev/workflow';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// MEMORY ENRICHMENT WORKFLOW (HOOK)
// ============================================================================

export const enrichMemory = workflow.define({
  args: {
    userId: v.string(), // External ID
    threadId: v.string(),
    recentMessages: v.array(v.any()), // Last few messages to analyze
  },
  handler: async (step, { userId, threadId, recentMessages }) => {
    // Step 1: Extract important facts from recent conversation
    const facts = await step.runAction(
      internal.workflows.memoryActions.extractFacts,
      { userId, recentMessages },
      { retry: true }
    );

    // Step 2: Save facts to memories table
    if (facts && facts.length > 0) {
      await step.runMutation(
        internal.workflows.memoryMutations.saveFacts,
        { userId, facts }
      );
    }

    // Step 3: Build enriched context for NEXT message
    const enrichedContext = await step.runAction(
      internal.workflows.memoryActions.buildContext,
      { userId, threadId },
      { retry: true }
    );

    // Step 4: Save enriched context to user.metadata
    await step.runMutation(
      internal.workflows.memoryMutations.updateContext,
      { userId, enrichedContext }
    );

    return { enriched: facts.length, contextReady: true };
  },
});
