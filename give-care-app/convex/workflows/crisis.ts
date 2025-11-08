"use node";

/**
 * Crisis Escalation Workflow
 *
 * Durable, retriable workflow for handling crisis situations:
 * 1. Assess crisis severity
 * 2. Generate crisis response
 * 3. Log crisis event
 * 4. Notify emergency contacts if needed
 * 5. Schedule follow-up
 *
 * Uses Workflow component for:
 * - Automatic retries on failures
 * - Durability across server restarts
 * - Idempotent step execution
 */

import { WorkflowManager } from '@convex-dev/workflow';
import { components, internal } from '../_generated/api';
import { v } from 'convex/values';

const workflow = new WorkflowManager(components.workflow);

/**
 * Crisis escalation workflow
 * Handles multi-step crisis response with retries and guarantees
 */
export const crisisEscalation = workflow.define({
  args: {
    userId: v.id('users'),
    threadId: v.string(),
    messageText: v.string(),
    crisisTerms: v.array(v.string()),
    severity: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
  },
  handler: async (step, args) => {
    // Step 1: Log the crisis event immediately
    const crisisEventId = await step.runMutation(internal.workflows.crisisSteps.logCrisisEvent, {
      userId: args.userId,
      severity: args.severity,
      terms: args.crisisTerms,
      messageText: args.messageText,
    });

    console.log(`Crisis event logged: ${crisisEventId}`);

    // Step 2: Generate crisis response using the crisis agent
    const response = await step.runAction(internal.workflows.crisisSteps.generateCrisisResponse, {
      userId: args.userId,
      threadId: args.threadId,
      messageText: args.messageText,
      severity: args.severity,
    });

    console.log(`Crisis response generated: ${response.text.substring(0, 100)}...`);

    // Step 3: Check if emergency contact notification is needed (high severity)
    if (args.severity === 'high') {
      const notificationResult = await step.runAction(
        internal.workflows.crisisSteps.notifyEmergencyContact,
        {
          userId: args.userId,
          crisisEventId,
          messageText: args.messageText,
        }
      );

      if (notificationResult.sent) {
        console.log(`Emergency contact notified: ${notificationResult.recipient}`);
      } else {
        console.warn(`No emergency contact configured for user ${args.userId}`);
      }
    }

    // Step 4: Schedule follow-up check-in (24 hours later)
    await step.runMutation(internal.workflows.crisisSteps.scheduleFollowUp, {
      userId: args.userId,
      crisisEventId,
      hoursFromNow: 24,
    });

    console.log('Follow-up scheduled for 24 hours from now');

    return {
      success: true,
      crisisEventId,
      responseText: response.text,
      emergencyContactNotified: args.severity === 'high',
    };
  },
  config: {
    // Retry configuration for reliability
    maxAttempts: 3,
    backoff: {
      type: 'exponential',
      initialDelayMs: 1000,
      maxDelayMs: 30000,
    },
  },
});

/**
 * Follow-up workflow for crisis check-ins
 * Sends automated check-in message after crisis event
 */
export const crisisFollowUp = workflow.define({
  args: {
    userId: v.id('users'),
    crisisEventId: v.id('alerts'),
  },
  handler: async (step, args) => {
    // Step 1: Check if user has had any recent interactions
    const recentActivity = await step.runQuery(
      internal.workflows.crisisSteps.checkRecentActivity,
      {
        userId: args.userId,
        hoursAgo: 24,
      }
    );

    // Step 2: If no recent activity, send check-in message
    if (!recentActivity.hasActivity) {
      await step.runAction(internal.workflows.crisisSteps.sendFollowUpMessage, {
        userId: args.userId,
        crisisEventId: args.crisisEventId,
      });

      console.log(`Follow-up message sent to user ${args.userId}`);
    } else {
      console.log(`User ${args.userId} has recent activity, skipping follow-up`);
    }

    // Step 3: Update crisis event status
    await step.runMutation(internal.workflows.crisisSteps.updateCrisisEvent, {
      crisisEventId: args.crisisEventId,
      status: 'followed_up',
    });

    return {
      success: true,
      followUpSent: !recentActivity.hasActivity,
    };
  },
});
