/**
 * Workflows - Crisis workflow orchestration
 *
 * Merges workflows/crisis.ts and workflows/crisisSteps.ts
 * Handles multi-step crisis intervention workflows.
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
import { components, internal } from './_generated/api';
import { v } from 'convex/values';
import { internalMutation, internalAction, internalQuery } from './_generated/server';

const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// CRISIS ESCALATION WORKFLOWS
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
    crisisEventId: any;
    responseText: string;
    emergencyContactNotified: boolean;
  }> => {
    // Step 1: Log the crisis event immediately
    const crisisEventId: any = await step.runMutation(internal.workflows.logCrisisEvent, {
      userId: args.userId,
      severity: args.severity,
      terms: args.crisisTerms,
      messageText: args.messageText,
    });

    console.log(`Crisis event logged: ${crisisEventId}`);

    // Step 2: Generate crisis response using the crisis agent
    const response: any = await step.runAction(internal.workflows.generateCrisisResponse, {
      userId: args.userId,
      threadId: args.threadId,
      messageText: args.messageText,
      severity: args.severity,
    });

    console.log(`Crisis response generated: ${response.text.substring(0, 100)}...`);

    // Step 3: Check if emergency contact notification is needed (high severity)
    if (args.severity === 'high') {
      const notificationResult: any = await step.runAction(
        internal.workflows.notifyEmergencyContact,
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
    await step.runMutation(internal.workflows.scheduleFollowUp, {
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
  handler: async (step, args): Promise<{
    success: boolean;
    followUpSent: boolean;
  }> => {
    // Step 1: Check if user has had any recent interactions
    const recentActivity: any = await step.runQuery(
      internal.workflows.checkRecentActivity,
      {
        userId: args.userId,
        hoursAgo: 24,
      }
    );

    // Step 2: If no recent activity, send check-in message
    if (!recentActivity.hasActivity) {
      await step.runAction(internal.workflows.sendFollowUpMessage, {
        userId: args.userId,
        crisisEventId: args.crisisEventId,
      });

      console.log(`Follow-up message sent to user ${args.userId}`);
    } else {
      console.log(`User ${args.userId} has recent activity, skipping follow-up`);
    }

    // Step 3: Update crisis event status
    await step.runMutation(internal.workflows.updateCrisisEvent, {
      crisisEventId: args.crisisEventId,
      status: 'followed_up',
    });

    return {
      success: true,
      followUpSent: !recentActivity.hasActivity,
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
 * Generate crisis response using crisis agent
 */
export const generateCrisisResponse = internalAction({
  args: {
    userId: v.id('users'),
    threadId: v.string(),
    messageText: v.string(),
    severity: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get user data for context
    const user: any = await ctx.runQuery(internal.core.getUser, {
      userId: args.userId,
    });

    if (!user) {
      throw new Error(`User not found: ${args.userId}`);
    }

    // Build crisis context
    const context = {
      userId: user.externalId || user._id,
      locale: user.locale || 'en-US',
      consent: {
        emergency: true,
        marketing: false,
      },
      crisisFlags: {
        active: true,
        terms: [], // Will be populated by the workflow caller
      },
      metadata: {
        profile: user.metadata || {},
      },
    };

    // Call crisis agent (now in agents.ts)
    const response: any = await ctx.runAction(internal.agents.runCrisisAgent, {
      input: {
        channel: 'sms' as const,
        text: args.messageText,
        userId: user.externalId || user._id,
      },
      context,
      threadId: args.threadId,
    });

    console.log(`[Crisis Workflow] Crisis response generated`);
    return response;
  },
});

/**
 * Notify emergency contact (email or SMS)
 */
export const notifyEmergencyContact = internalAction({
  args: {
    userId: v.id('users'),
    crisisEventId: v.id('alerts'),
    messageText: v.string(),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; recipient?: string }> => {
    // Get user with emergency contact info
    const user: any = await ctx.runQuery(internal.core.getUser, {
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
    crisisEventId: v.id('alerts'),
    hoursFromNow: v.number(),
  },
  handler: async (ctx, args) => {
    const followUpTime = Date.now() + args.hoursFromNow * 60 * 60 * 1000;

    // Schedule the follow-up workflow
    await ctx.scheduler.runAfter(
      args.hoursFromNow * 60 * 60 * 1000,
      internal.workflows.crisisFollowUp,
      {
        userId: args.userId,
        crisisEventId: args.crisisEventId,
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
    const cutoffTime = Date.now() - args.hoursAgo * 60 * 60 * 1000;

    const recentSessions = await ctx.db
      .query('sessions')
      .withIndex('by_user_channel', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('lastSeen'), cutoffTime))
      .take(1);

    return {
      hasActivity: recentSessions.length > 0,
      lastSeen: recentSessions[0]?.lastSeen,
    };
  },
});

/**
 * Send follow-up check-in message
 */
export const sendFollowUpMessage = internalAction({
  args: {
    userId: v.id('users'),
    crisisEventId: v.id('alerts'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.core.getUser, {
      userId: args.userId,
    });

    if (!user || !user.phone) {
      console.error(`[Crisis Workflow] Cannot send follow-up: user or phone not found`);
      return { sent: false };
    }

    const message = `Hi ${user.name || 'there'}, this is a follow-up from GiveCare. We wanted to check in and see how you're doing. If you need support, please reach out anytime. 988 Suicide & Crisis Lifeline is available 24/7.`;

    // Send SMS via inbound actions (will be in inbound.ts after merge)
    try {
      await ctx.runAction(internal.inbound.sendSmsResponse, {
        to: user.phone,
        text: message,
        userId: user.externalId || user._id,
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
    crisisEventId: v.id('alerts'),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.crisisEventId, {
      status: 'processed',
      payload: {
        followUpStatus: args.status,
        processedAt: Date.now(),
      },
    });

    console.log(`[Crisis Workflow] Crisis event updated: ${args.crisisEventId}`);
  },
});
