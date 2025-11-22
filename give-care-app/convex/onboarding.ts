/**
 * Onboarding Workflow
 * Durable multi-step flow to ensure critical user data is collected
 */

import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { getUserMetadata } from "./lib/utils";

const workflow = new WorkflowManager(components.workflow);

/**
 * Onboarding Completion Workflow
 * Triggered when user completes a milestone, checks if all done and starts check-in workflow
 */
export const onboardingWorkflow = workflow.define({
  args: {
    userId: v.id("users"),
    threadId: v.string(),
  },
  handler: async (step, { userId, threadId }) => {
    // Check current onboarding status
    const status = await step.runQuery(internal.onboarding.getOnboardingStatus, {
      userId,
    });

    // If all critical data collected, mark complete
    if (status.hasName && status.hasZip && status.hasBaselineAssessment) {
      await step.runMutation(internal.onboarding.markComplete, { userId });

      // If check-in preference is set, start check-in workflow
      if (status.hasCheckInPreference) {
        const user = await step.runQuery(internal.internal.users.getUser, { userId });
        const metadata = getUserMetadata(user);

        if (metadata.checkInFrequency === "daily" || metadata.checkInFrequency === "weekly") {
          await step.runAction(internal.workflows.startCheckInWorkflow, { userId });
        }
      }
    }
  },
});

/**
 * Trigger onboarding check (can be called multiple times idempotently)
 * Checks if onboarding is complete and starts check-in workflow if ready
 */
export const triggerOnboardingCheck = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Get threads for this user
    const threads = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      paginationOpts: { cursor: null, numItems: 1 },
    });

    const threadId = threads.page.length > 0 ? threads.page[0]._id : "none";

    // Start workflow (WorkflowManager handles idempotency)
    await workflow.start(ctx, internal.onboarding.onboardingWorkflow, {
      userId,
      threadId,
    });
  },
});

/**
 * Get onboarding status (query)
 */
export const getOnboardingStatus = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      return {
        hasName: false,
        hasZip: false,
        hasBaselineAssessment: false,
        hasCheckInPreference: false,
        isComplete: false,
      };
    }

    const metadata = getUserMetadata(user);

    const hasName = !!metadata.firstName || !!metadata.profile?.firstName;
    const hasZip = !!metadata.zipCode || !!user.zipCode;
    const hasBaselineAssessment = !!metadata.firstAssessmentCompletedAt;
    const hasCheckInPreference = !!metadata.checkInFrequency;
    const isComplete = !!metadata.onboardingCompletedAt;

    return {
      hasName,
      hasZip,
      hasBaselineAssessment,
      hasCheckInPreference,
      isComplete,
    };
  },
});

/**
 * Record onboarding milestone
 */
export const recordMilestone = internalMutation({
  args: {
    userId: v.id("users"),
    milestone: v.string(),
  },
  handler: async (ctx, { userId, milestone }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const metadata = getUserMetadata(user);
    const existingMilestones = metadata.onboardingMilestones || [];

    // Check if milestone already recorded
    const alreadyRecorded = existingMilestones.some(
      (m: any) => m.milestone === milestone
    );

    if (!alreadyRecorded) {
      const updatedMilestones = [
        ...existingMilestones,
        { milestone, completedAt: Date.now() },
      ];

      await ctx.db.patch(userId, {
        metadata: {
          ...metadata,
          onboardingMilestones: updatedMilestones,
        },
      });
    }
  },
});

/**
 * Mark onboarding complete
 */
export const markComplete = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;

    const metadata = getUserMetadata(user);

    await ctx.db.patch(userId, {
      metadata: {
        ...metadata,
        onboardingCompletedAt: Date.now(),
      },
    });
  },
});
