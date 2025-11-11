/**
 * Crisis Escalation Workflow
 *
 * Handles multi-step crisis intervention workflows using Workflow Component.
 * Durable, retriable workflow for handling crisis situations.
 */

import { WorkflowManager } from '@convex-dev/workflow';
import { components, internal } from '../_generated/api';
import { v } from 'convex/values';
import { internalMutation, internalAction, internalQuery } from '../_generated/server';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// CRISIS ESCALATION WORKFLOW
// ============================================================================

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
  handler: async (step, args): Promise<{
    success: boolean;
    alertId: any;
    emergencyContactNotified: boolean;
  }> => {
    // Step 1: Log the crisis event immediately
    const alertId: any = await step.runMutation(internal.workflows.crisis.logCrisisEvent, {
      userId: args.userId,
      severity: args.severity,
      terms: args.crisisTerms,
      messageText: args.messageText,
    });

    console.log(`Crisis event logged: ${alertId}`);

    // Step 2: Check if emergency contact notification is needed (high severity)
    let emergencyContactNotified = false;
    if (args.severity === 'high') {
      const notificationResult: any = await step.runAction(
        internal.workflows.crisis.notifyEmergencyContact,
        {
          userId: args.userId,
          alertId,
          messageText: args.messageText,
        }
      );

      emergencyContactNotified = notificationResult.sent;
      if (notificationResult.sent) {
        console.log(`Emergency contact notified: ${notificationResult.recipient}`);
      } else {
        console.warn(`No emergency contact configured for user ${args.userId}`);
      }
    }

    // Step 3: Schedule follow-up check-in (24 hours later)
    await step.runMutation(internal.workflows.crisis.scheduleFollowUp, {
      userId: args.userId,
      alertId,
      hoursFromNow: 24,
    });

    console.log('Follow-up scheduled for 24 hours from now');

    return {
      success: true,
      alertId,
      emergencyContactNotified,
    };
  },
});

/**
 * Follow-up workflow for crisis check-ins
 * Sends automated check-in message after crisis event
 */
export const crisisFollowUp = workflow.define({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
  },
  handler: async (step, args): Promise<{
    success: boolean;
    followUpSent: boolean;
  }> => {
    // Step 1: Check if user has had any recent interactions
    const recentActivity: any = await step.runQuery(
      internal.workflows.crisis.checkRecentActivity,
      {
        userId: args.userId,
        hoursAgo: 24,
      }
    );

    // Step 2: If no recent activity, send check-in message
    let followUpSent = false;
    if (!recentActivity.hasActivity) {
      await step.runAction(internal.workflows.crisis.sendFollowUpMessage, {
        userId: args.userId,
        alertId: args.alertId,
      });

      followUpSent = true;
      console.log(`Follow-up message sent to user ${args.userId}`);
    } else {
      console.log(`User ${args.userId} has recent activity, skipping follow-up`);
    }

    // Step 3: Update crisis event status
    await step.runMutation(internal.workflows.crisis.updateCrisisEvent, {
      alertId: args.alertId,
      status: 'processed',
    });

    return {
      success: true,
      followUpSent,
    };
  },
});

// ============================================================================
// CRISIS WORKFLOW STEPS
// ============================================================================

/**
 * Log crisis event to alerts table
 */
export const logCrisisEvent = internalMutation({
  args: {
    userId: v.id('users'),
    severity: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    terms: v.array(v.string()),
    messageText: v.string(),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.insert('alerts', {
      userId: args.userId,
      type: 'crisis_detected',
      severity: args.severity === 'high' ? 'critical' : args.severity === 'medium' ? 'high' : 'medium',
      message: `Crisis detected: ${args.terms.join(', ')}`,
      context: {
        terms: args.terms,
        originalMessage: args.messageText,
        detectedAt: Date.now(),
      },
      channel: 'sms',
      status: 'pending',
    });

    console.log(`[Crisis Workflow] Crisis event logged: ${alert}`);
    return alert;
  },
});

/**
 * Notify emergency contact (email or SMS)
 */
export const notifyEmergencyContact = internalAction({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
    messageText: v.string(),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; recipient?: string }> => {
    // Fix: Use getUserById since args.userId is Id<"users">, not externalId
    const user = await ctx.runQuery(internal.internal.getUserById, {
      userId: args.userId,
    });

    if (!user) {
      console.error(`[Crisis Workflow] User not found: ${args.userId}`);
      return { sent: false };
    }

    // Check if user has given emergency contact consent
    const hasConsent = user.consent?.emergency ?? false;
    if (!hasConsent) {
      console.log(`[Crisis Workflow] User has not consented to emergency notifications`);
      return { sent: false };
    }

    // Get emergency contact from user metadata
    const emergencyContact: any = (user.metadata as any)?.emergencyContact;
    if (!emergencyContact || !emergencyContact.email) {
      console.log(`[Crisis Workflow] No emergency contact configured`);
      return { sent: false };
    }

    console.log(`[Crisis Workflow] Would notify emergency contact: ${emergencyContact.email}`);
    console.log(`[Crisis Workflow] Crisis details: ${args.messageText}`);

    // Temporarily return as if sent - email functionality to be implemented
    return { sent: false, recipient: emergencyContact.email };
  },
});

/**
 * Schedule follow-up check-in
 */
export const scheduleFollowUp = internalMutation({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
    hoursFromNow: v.number(),
  },
  handler: async (ctx, args) => {
    const followUpTime = Date.now() + args.hoursFromNow * 60 * 60 * 1000;

    // Schedule the follow-up workflow
    await ctx.scheduler.runAfter(
      args.hoursFromNow * 60 * 60 * 1000,
      internal.workflows.crisis.crisisFollowUp,
      {
        userId: args.userId,
        alertId: args.alertId,
      }
    );

    console.log(
      `[Crisis Workflow] Follow-up scheduled for ${new Date(followUpTime).toISOString()}`
    );
  },
});

/**
 * Check if user has had recent activity
 */
export const checkRecentActivity = internalQuery({
  args: {
    userId: v.id('users'),
    hoursAgo: v.number(),
  },
  handler: async (ctx, args) => {
    // Check for recent agent runs (proxy for activity)
    const cutoffTime = Date.now() - args.hoursAgo * 60 * 60 * 1000;

    const recentRuns = await ctx.db
      .query('agent_runs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('_creationTime'), cutoffTime))
      .take(1);

    return {
      hasActivity: recentRuns.length > 0,
      lastSeen: recentRuns[0]?._creationTime,
    };
  },
});

/**
 * Send follow-up check-in message
 */
export const sendFollowUpMessage = internalAction({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
  },
  handler: async (ctx, args) => {
    // Get user by ID
    const userDoc = await ctx.runQuery(internal.internal.getUserById, {
      userId: args.userId,
    });
    
    if (!userDoc) {
      console.error(`[Crisis Workflow] User not found: ${args.userId}`);
      return { sent: false };
    }
    
    const user = {
      ...userDoc,
      phone: userDoc.phone,
      externalId: userDoc.externalId,
    };

    if (!user || !user.phone) {
      console.error(`[Crisis Workflow] Cannot send follow-up: user or phone not found`);
      return { sent: false };
    }

    const userName = (user.metadata as any)?.profile?.firstName || 'there';
    const message = `Hi ${userName}, this is a follow-up from GiveCare. We wanted to check in and see how you're doing. If you need support, please reach out anytime. 988 Suicide & Crisis Lifeline is available 24/7.`;

    // Send SMS via inbound actions
    try {
      await ctx.runAction(internal.inbound.sendSmsResponse, {
        to: user.phone,
        text: message,
        userId: user.externalId,
      });

      console.log(`[Crisis Workflow] Follow-up message sent to ${user.phone}`);
      return { sent: true };
    } catch (error) {
      console.error(`[Crisis Workflow] Failed to send follow-up message:`, error);
      throw error;
    }
  },
});

/**
 * Update crisis event status
 */
export const updateCrisisEvent = internalMutation({
  args: {
    alertId: v.id('alerts'),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: 'processed',
      payload: {
        followUpStatus: args.status,
        processedAt: Date.now(),
      },
    });

    console.log(`[Crisis Workflow] Crisis event updated: ${args.alertId}`);
  },
});

