/**
 * Durable Workflows
 * Using @convex-dev/workflow for check-ins, engagement, trends
 */

import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";

const workflow = new WorkflowManager(components.workflow);

/**
 * Check-In Workflow
 * Scheduled EMA assessment at user's preferred time
 */
export const checkInWorkflow = workflow.define({
  args: {
    userId: v.id("users"),
  },
  handler: async (step, { userId }) => {
    // Step 1: Load user preferences
    const user = await step.runQuery(internal.users.getUser, { userId });
    
    // Step 2: Check quiet hours (8am-9pm local)
    // TODO: Implement timezone-aware quiet hours check
    
    // Step 3: Send EMA assessment prompt
    await step.runMutation(internal.assessments.startAssessment, {
      userId,
      assessmentType: "ema",
    });
    
    // Step 4: Wait for completion (with timeout)
    // TODO: Implement wait logic
    
    // Step 5: Process results
    // Assessment completion handled by assessment flow
  },
});

/**
 * Engagement Monitoring Workflow
 */
export const engagementMonitoringWorkflow = workflow.define({
  args: {
    userId: v.id("users"),
  },
  handler: async (step, { userId }) => {
    // Check last engagement date
    const user = await step.runQuery(internal.users.getUser, { userId });
    
    if (!user?.lastEngagementDate) {
      return;
    }
    
    const daysSince = (Date.now() - user.lastEngagementDate) / 86400000;
    
    // Day 5: Gentle nudge
    if (daysSince >= 5 && daysSince < 7) {
      await step.runAction(internal.internal.sms.sendEngagementNudge, {
        userId,
        level: "day5",
      });
    }
    
    // Day 7: Escalation
    if (daysSince >= 7 && daysSince < 14) {
      await step.runAction(internal.internal.sms.sendEngagementNudge, {
        userId,
        level: "day7",
      });
    }
    
    // Day 14: Final check-in
    if (daysSince >= 14) {
      await step.runAction(internal.internal.sms.sendEngagementNudge, {
        userId,
        level: "day14",
      });
    }
  },
});

/**
 * Suggest Resources Workflow
 * Triggered after assessment completion to suggest resources for highest pressure zone
 */
export const suggestResourcesWorkflow = workflow.define({
  args: {
    userId: v.id("users"),
    zone: v.string(),
  },
  handler: async (step, { userId, zone }) => {
    // Suggest resources for the zone
    await step.runAction(internal.resources.suggestResourcesForZoneAction, {
      userId,
      zone,
    });
  },
});
