"use node";

/**
 * Crisis Workflow Step Functions
 *
 * Individual steps for the crisis escalation workflow.
 * Each step is idempotent and retriable.
 */

import { internalMutation, internalAction, internalQuery } from '../_generated/server';
import { internal, components } from '../_generated/api';
import { v } from 'convex/values';

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
  handler: async (ctx, args) => {
    // Get user data for context
    const user = await ctx.runQuery(internal.model.users.getUserById, {
      id: args.userId,
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

    // Call crisis agent
    const response = await ctx.runAction(internal.agents.crisis.runCrisisAgent, {
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
  handler: async (ctx, args) => {
    // Get user with emergency contact info
    const user = await ctx.runQuery(internal.model.users.getUserById, {
      id: args.userId,
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
    const emergencyContact = (user.metadata as any)?.emergencyContact;
    if (!emergencyContact || !emergencyContact.email) {
      console.log(`[Crisis Workflow] No emergency contact configured`);
      return { sent: false };
    }

    // Send email notification
    try {
      await ctx.runMutation(internal.functions.email.sendCrisisAlert, {
        to: emergencyContact.email,
        userName: user.name || 'Caregiver',
        emergencyContactName: emergencyContact.name || 'Emergency Contact',
        crisisDetails: args.messageText,
      });

      console.log(`[Crisis Workflow] Emergency contact notified: ${emergencyContact.email}`);
      return { sent: true, recipient: emergencyContact.email };
    } catch (error) {
      console.error(`[Crisis Workflow] Failed to send emergency notification:`, error);
      throw error; // Will trigger workflow retry
    }
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
      internal.workflows.crisis.crisisFollowUp,
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
    const user = await ctx.runQuery(internal.model.users.getUserById, {
      id: args.userId,
    });

    if (!user || !user.phone) {
      console.error(`[Crisis Workflow] Cannot send follow-up: user or phone not found`);
      return { sent: false };
    }

    const message = `Hi ${user.name || 'there'}, this is a follow-up from GiveCare. We wanted to check in and see how you're doing. If you need support, please reach out anytime. 988 Suicide & Crisis Lifeline is available 24/7.`;

    // Send SMS via Twilio
    try {
      await ctx.runAction(internal.twilio.sendSms, {
        to: user.phone,
        body: message,
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
