/**
 * Internal Workflow Functions
 * Called by crons
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  checkInWorkflow,
  engagementMonitoringWorkflow,
  suggestResourcesWorkflow,
} from "../workflows";
import { internal } from "../_generated/api";

/**
 * Run check-ins for eligible users
 * CONVEX_02.md pattern: Query users, then start workflows for each
 */
export const runCheckIns = internalAction({
  args: {},
  handler: async (ctx) => {
    // Query users who need check-ins
    const users = await ctx.runQuery(internal.users.getUsersWithCheckIns, {});

    if (users.length === 0) {
      return { processed: 0 };
    }

    // Start workflow for each user
    // CONVEX_02.md: Use workflow.start() pattern for durable workflows
    let processed = 0;
    for (const user of users) {
      try {
        await checkInWorkflow.start(ctx, { userId: user._id });
        processed++;
      } catch (error) {
        // Log error but continue to next user (don't fail entire batch)
        console.error(`Failed to start check-in workflow for user ${user._id}:`, error);
      }
    }

    return { processed };
  },
});

/**
 * Run engagement monitoring
 * CONVEX_02.md pattern: Query users, then start workflows for each
 */
export const runEngagementMonitoring = internalAction({
  args: {},
  handler: async (ctx) => {
    // Query inactive users (>5 days since last engagement)
    const users = await ctx.runQuery(internal.users.getInactiveUsers, { days: 5 });

    if (users.length === 0) {
      return { processed: 0 };
    }

    // Start workflow for each user
    // CONVEX_02.md: Use workflow.start() pattern for durable workflows
    let processed = 0;
    for (const user of users) {
      try {
        await engagementMonitoringWorkflow.start(ctx, { userId: user._id });
        processed++;
      } catch (error) {
        // Log error but continue to next user (don't fail entire batch)
        console.error(`Failed to start engagement workflow for user ${user._id}:`, error);
      }
    }

    return { processed };
  },
});

/**
 * Schedule crisis follow-up
 */
export const scheduleCrisisFollowUp = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Schedule follow-up check-in for next day
    // This is a placeholder - actual implementation would use workflow or scheduler
    await ctx.scheduler.runAfter(86400000, internal.agents.processMainAgentMessage, {
      userId,
      body: "How are you doing today? I wanted to check in after our conversation yesterday.",
    });
  },
});
