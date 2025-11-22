/**
 * Durable Workflows
 * Simplified: EMA check-ins only
 */

import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { DateTime } from "luxon";
import { getUserMetadata } from "./lib/utils";

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
    const user = await step.runQuery(internal.internal.users.getUser, { userId });
    if (!user) {
      return; // User not found
    }

    const metadata = getUserMetadata(user);
    const checkInFrequency = metadata.checkInFrequency;
    const snoozeUntil = metadata.snoozeUntil;

    // Check if check-ins are enabled
    if (!checkInFrequency) {
      return; // No check-in frequency set
    }

    // Check if snoozed
    if (snoozeUntil && Date.now() < snoozeUntil) {
      return; // Still snoozed
    }

    // Step 2: Check quiet hours (9am-7pm local time, never after 8pm)
    const timezone = metadata.timezone || "UTC";
    const localTime = DateTime.now().setZone(timezone);
    const hour = localTime.isValid ? localTime.hour : DateTime.utc().hour;
    const isQuietHours = hour >= 9 && hour < 20;

    if (!isQuietHours) {
      // Outside quiet hours - skip (cron will retry next day)
      return;
    }

    // Step 3: Send EMA assessment prompt
    const assessmentResult = await step.runMutation(internal.internal.assessments.startAssessment, {
      userId,
      assessmentType: "ema",
    });
    
    if (!assessmentResult.success) {
      // Assessment on cooldown or error - skip
      return;
    }

    // Step 4: Check for completion
    // Note: Assessment completion is handled by the assessment flow itself
    // This workflow just checks if completion happened and processes results
    // The assessment flow already triggers resource suggestions and agent processing
    
    // Check if assessment was completed recently (within last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const latestAssessment = await step.runQuery(
      internal.internal.assessments.getLatestCompletedAssessment,
      { userId, assessmentType: "ema" }
    );

    // Step 5: Process results if completed
    if (latestAssessment && latestAssessment.completedAt > oneHourAgo) {
      // Assessment was completed recently - process results
      const assessmentScore = latestAssessment.gcBurnout;
      const assessmentBand = latestAssessment.band;
      
      // Check if high stress (band === "high" or score >= 61)
      const isHighStress = assessmentBand === "high" || assessmentScore >= 61;
      
      // Get highest pressure zone
      let highestZone: string | null = null;
      if (latestAssessment.zones) {
        const zoneEntries = Object.entries(latestAssessment.zones).filter(
          ([_, value]) => typeof value === 'number' && value > 0
        );
        if (zoneEntries.length > 0) {
          highestZone = zoneEntries.reduce((max, [zone, value]) => {
            const maxValue = typeof max[1] === 'number' ? max[1] : 0;
            const currentValue = typeof value === 'number' ? value : 0;
            return currentValue > maxValue ? [zone, value] : max;
          })[0];
        }
      }
      
      // Send follow-up message acknowledging completion
      await step.runAction(internal.internal.sms.sendAssessmentCompletionMessage, {
        userId,
        score: assessmentScore,
        band: assessmentBand,
      });
    }
    // If not completed, the assessment flow will handle completion when user responds
  },
});

/**
 * Start check-in workflow for a user
 * Helper action to start workflows from other actions
 */
export const startCheckInWorkflow = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await workflow.start(ctx, internal.workflows.checkInWorkflow, { userId });
  },
});
