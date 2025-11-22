/**
 * Internal SMS helper actions
 * Called via scheduler for async Twilio sending
 */

import { internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { sendSMS, getHelpMessage, getStopConfirmation } from "../lib/twilio";
import { getCrisisResponse, getUserMetadata } from "../lib/utils";
import { internal } from "../_generated/api";

/**
 * Helper to fetch user and ensure phone exists before sending SMS
 */
async function withUserPhone(
  ctx: any,
  userId: any,
  fn: (user: any, phone: string) => Promise<void> | void
): Promise<void> {
  const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
  if (!user?.phone) {
    await ctx.runMutation(internal.internal.sms.logSmsIssue, {
      userId,
      reason: "missing_phone",
      context: "Attempted SMS send without phone",
    });
    return;
  }
  await fn(user, user.phone);
}

/**
 * Send STOP confirmation
 */
export const sendStopConfirmation = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      await sendSMS(ctx, phone, getStopConfirmation());
    });
  },
});

/**
 * Send HELP message
 */
export const sendHelpMessage = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      await sendSMS(ctx, phone, getHelpMessage());
    });
  },
});

/**
 * Send an assessment question (progress-aware)
 */
export const sendAssessmentQuestion = internalAction({
  args: {
    userId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, { userId, text }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      await sendSMS(ctx, phone, text);
    });
  },
});

/**
 * Send crisis response
 */
export const sendCrisisResponse = internalAction({
  args: {
    userId: v.id("users"),
    isDVHint: v.boolean(),
  },
  handler: async (ctx, { userId, isDVHint }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      const response = getCrisisResponse(isDVHint);
      await sendSMS(ctx, phone, response);
    });
  },
});

/**
 * Send agent response
 */
export const sendAgentResponse = internalAction({
  args: {
    userId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, { userId, text }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      await sendSMS(ctx, phone, text);
    });
  },
});

/**
 * Send resubscribe message
 */
export const sendResubscribeMessage = internalAction({
  args: {
    userId: v.id("users"),
    gracePeriodEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, { userId, gracePeriodEndsAt }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      let message: string;
      if (gracePeriodEndsAt && Date.now() < gracePeriodEndsAt) {
        const daysRemaining = Math.ceil(
          (gracePeriodEndsAt - Date.now()) / 86400000
        );
        message = `Your subscription has ended, but you have ${daysRemaining} day(s) to resubscribe without losing your progress. Reply RESUBSCRIBE to continue.`;
      } else {
        message =
          "Your subscription has ended. Reply RESUBSCRIBE to continue using GiveCare.";
      }

      await sendSMS(ctx, phone, message);
    });
  },
});

/**
 * Send welcome SMS after successful subscription
 * Starts onboarding conversation
 */
export const sendWelcomeSMS = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await withUserPhone(ctx, userId, async (user, phone) => {
      const welcomeMessage = `Welcome to GiveCare${
        user.name ? `, ${user.name.split(" ")[0]}` : ""
      }! I'm here to support your caregiving journey 24/7. Who are you caring for?`;

      await sendSMS(ctx, phone, welcomeMessage);
    });
  },
});

/**
 * Send engagement nudge
 */
export const sendEngagementNudge = internalAction({
  args: {
    userId: v.id("users"),
    level: v.union(v.literal("day5"), v.literal("day7"), v.literal("day14")),
  },
  handler: async (ctx, { userId, level }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      let message: string;
      switch (level) {
        case "day5":
          message =
            "We haven't heard from you in a few days. How are you doing?";
          break;
        case "day7":
          message =
            "Just checking in - we're here if you need support.";
          break;
        case "day14":
          message =
            "We miss you! Text back anytime to continue your caregiving support.";
          break;
      }

      await sendSMS(ctx, phone, message);
    });
  },
});

/**
 * Send rate limit message
 */
export const sendRateLimitMessage = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      const message =
        "You've reached your daily message limit. I'll be back tomorrow to continue supporting you.";
      await sendSMS(ctx, phone, message);
    });
  },
});

/**
 * Send assessment completion message
 */
export const sendAssessmentCompletionMessage = internalAction({
  args: {
    userId: v.id("users"),
    score: v.number(),
    band: v.string(),
  },
  handler: async (ctx, { userId, score, band }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      const bandText: Record<string, string> = {
        very_low: "very low stress",
        low: "low stress",
        moderate: "moderate stress",
        high: "high stress",
      };

      const message = `Thanks for completing your check-in! Your score is ${score} - that shows ${
        bandText[band] || band
      }. How are you feeling today?`;
      await sendSMS(ctx, phone, message);
    });
  },
});

/**
 * Send assessment reminder message
 */
export const sendAssessmentReminder = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      const message =
        "You started a check-in earlier. Want to finish it? Just reply with your answers.";
      await sendSMS(ctx, phone, message);
    });
  },
});

/**
 * Check if user has sent any inbound messages in the last N hours
 */
async function hasRecentInbound(
  ctx: any,
  userId: any,
  hours: number
): Promise<boolean> {
  const threshold = Date.now() - hours * 60 * 60 * 1000;
  const recentReceipt = await ctx.runQuery(
    internal.internal.users.getRecentInboundReceipt,
    {
      userId,
      since: threshold,
    }
  );
  return recentReceipt !== null;
}

/**
 * Check if current time is within quiet hours (9:00-19:00 local, never after 20:00)
 * Simplified: uses UTC if timezone not available
 */
function isQuietHours(userTimezone?: string): boolean {
  const now = new Date();
  // Simplified: use UTC hours if timezone not available
  // In production, use proper timezone library
  const hour = now.getUTCHours();
  
  // Quiet hours: 9:00-19:00 (9 AM - 7 PM)
  // Never send after 20:00 (8 PM)
  return hour >= 9 && hour < 20; // 9 AM to 7:59 PM
}

/**
 * Send crisis follow-up message
 * T+24h check-in with safety guards
 */
export const sendCrisisFollowUpMessage = internalAction({
  args: {
    userId: v.id("users"),
    alertId: v.id("alerts"),
  },
  handler: async (ctx, { userId, alertId }) => {
    await withUserPhone(ctx, userId, async (user, phone) => {
      // Guard 1: Skip if user has sent any inbound message in last 24h
      const hasResponded = await hasRecentInbound(ctx, userId, 24);
      if (hasResponded) {
        return;
      }

      // Guard 2: Respect quiet hours (9:00-19:00 local, never after 20:00)
      const timezone = getUserMetadata(user).timezone;
      if (!isQuietHours(timezone)) {
        return;
      }

      const message =
        "Checking in after yesterday. I can't provide crisis support, but human counselors at 988 (call) or 741741 (text) are available 24/7. Were you able to connect? Reply YES or NO.";

      await sendSMS(ctx, phone, message);

      await ctx.runMutation(internal.internal.users.updateProfile, {
        userId,
        field: "awaitingCrisisFollowUp",
        value: { alertId, timestamp: Date.now() },
      });

      await ctx.runMutation(internal.internal.learning.logGuardrailEvent, {
        userId,
        type: "crisis_followup_sent",
        severity: "medium",
        context: { timestamp: Date.now(), alertId },
      });
    });
  },
});

/**
 * Handle crisis follow-up response (YES/NO)
 * Called when user replies to crisis follow-up
 */
export const handleCrisisFollowUpResponse = internalAction({
  args: {
    userId: v.id("users"),
    response: v.string(), // "YES" or "NO" or "UNSURE"
    alertId: v.optional(v.id("alerts")), // Optional alertId from context
  },
  handler: async (ctx, { userId, response, alertId }) => {
    await withUserPhone(ctx, userId, async (user, phone) => {
      const upperResponse = response.toUpperCase().trim();

      // Get the crisis alert (use provided alertId or query for recent one)
      let recentAlert;
      if (alertId) {
        recentAlert = await ctx.runQuery(internal.internal.users.getAlert, {
          alertId,
        });
      } else {
        recentAlert = await ctx.runQuery(
          internal.internal.users.getRecentCrisisAlert,
          {
            userId,
          }
        );
      }

      if (upperResponse === "YES") {
        await sendSMS(
          ctx,
          phone,
          "Glad you were able to connect. I'm here if you need support."
        );

        if (recentAlert) {
          await ctx.runMutation(internal.internal.learning.recordCrisisFeedback, {
            userId,
            alertId: recentAlert._id,
            connectedWith988: true,
            wasHelpful: true,
            followUpResponse: response,
          });
        }
      } else if (upperResponse === "NO" || upperResponse === "UNSURE") {
        await sendSMS(
          ctx,
          phone,
          "Thanks for telling me. Would a counselor right now help? If so, call 988 or text 741741. I can also share local options."
        );

        if (recentAlert) {
          await ctx.runMutation(internal.internal.learning.recordCrisisFeedback, {
            userId,
            alertId: recentAlert._id,
            connectedWith988: false,
            wasHelpful: false,
            followUpResponse: response,
          });
        }

        await ctx.scheduler.runAfter(
          48 * 60 * 60 * 1000,
          internal.internal.sms.sendCrisisFollowUpNudge,
          { userId }
        );
      }
    });
  },
});

/**
 * Send crisis follow-up nudge (T+72h)
 * Second check-in if user replied NO/UNSURE
 */
export const sendCrisisFollowUpNudge = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    await withUserPhone(ctx, userId, async (user, phone) => {
      const hasResponded = await hasRecentInbound(ctx, userId, 24);
      if (hasResponded) {
        return;
      }

      const timezone = getUserMetadata(user).timezone;
      if (!isQuietHours(timezone)) {
        return;
      }

      const message =
        "Just checking in again. Human counselors at 988 (call) or 741741 (text) are available 24/7 if you need support.";

      await sendSMS(ctx, phone, message);
    });
  },
});

/**
 * Send stress-spike follow-up (ask-first pattern)
 * Only sends if user has opted into proactive check-ins
 */
export const sendScoreSpikeFollowUp = internalAction({
  args: {
    userId: v.id("users"),
    oldScore: v.number(),
    newScore: v.number(),
    zones: v.any(),
  },
  handler: async (ctx, { userId, oldScore, newScore, zones }) => {
    await withUserPhone(ctx, userId, async (user, phone) => {
      if (!isQuietHours(getUserMetadata(user).timezone)) {
        return;
      }

      const message =
        "Heads up: your last check-in was higher than usual. Want 1–2 quick ideas some caregivers use when stress spikes? Reply YES or NO.";

      await sendSMS(ctx, phone, message);

      const metadata = user.metadata || {};
      await ctx.runMutation(internal.internal.users.updateProfile, {
        userId,
        field: "lastSpikeFollowUpAt",
        value: Date.now(),
      });

      await ctx.runMutation(internal.internal.learning.logGuardrailEvent, {
        userId,
        type: "stress_spike_followup_sent",
        severity: "medium",
        context: {
          oldScore,
          newScore,
          delta: newScore - oldScore,
          timestamp: Date.now(),
        },
      });
    });
  },
});

/**
 * Handle stress-spike follow-up response (YES/NO)
 * Called when user replies to spike follow-up
 */
export const handleSpikeFollowUpResponse = internalAction({
  args: {
    userId: v.id("users"),
    response: v.string(), // "YES" or "NO"
    zones: v.any(), // User's zones for intervention matching
  },
  handler: async (ctx, { userId, response, zones }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      const upperResponse = response.toUpperCase().trim();

      if (upperResponse === "YES") {
        const zoneIds = Object.keys(zones || {})
          .filter((z) => zones[z] !== undefined && zones[z] !== null)
          .sort((a, b) => (zones[b] || 0) - (zones[a] || 0))
          .slice(0, 2);

        const interventions = await ctx.runQuery(
          internal.interventions.findInterventions,
          {
            zones: zoneIds,
            limit: 2,
          }
        );

        if (interventions.length > 0) {
          const interventionLines = interventions
            .slice(0, 2)
            .map((intervention: any, i: number) => {
              const num = i + 1;
              return `• ${intervention.title} — ${intervention.description}`;
            })
            .join("\n");

          const message = `Thanks for saying yes. Two quick options you can try now:\n${interventionLines}\nWant more like these? Reply MORE.`;

          await sendSMS(ctx, phone, message);
        } else {
          await sendSMS(
            ctx,
            phone,
            "Thanks for saying yes. I can help you find resources or support. What would help most right now?"
          );
        }
      } else if (upperResponse === "NO") {
        await sendSMS(
          ctx,
          phone,
          "Got it. If you want to talk to a human, 988/741741 are 24/7."
        );
      }
    });
  },
});

/**
 * Send subscription message based on scenario
 */
export const sendSubscriptionMessage = internalAction({
  args: {
    userId: v.id("users"),
    scenario: v.union(
      v.literal("new_user"),
      v.literal("active"),
      v.literal("grace_period"),
      v.literal("grace_expired"),
      v.literal("past_due"),
      v.literal("incomplete"),
      v.literal("unknown")
    ),
    gracePeriodEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, { userId, scenario, gracePeriodEndsAt }) => {
    await withUserPhone(ctx, userId, async (_user, phone) => {
      let message: string;

      switch (scenario) {
        case "new_user":
          message =
            "Caring for a loved one? GiveCare provides 24/7 text-based support to help with overwhelm, isolation, and finding resources. Reply SIGNUP to get started.";
          break;

        case "grace_period":
          if (gracePeriodEndsAt) {
            const daysRemaining = Math.ceil(
              (gracePeriodEndsAt - Date.now()) / 86400000
            );
            message = `Your GiveCare support is paused. You have ${daysRemaining} day(s) to resubscribe and keep your 24/7 caregiving support active. Reply RESUBSCRIBE to continue.`;
          } else {
            message =
              "Your GiveCare support is paused. Reply RESUBSCRIBE to restore your 24/7 caregiving support.";
          }
          break;

        case "grace_expired":
          message =
            "Your 24/7 caregiving support has ended. Reply RESUBSCRIBE to restore your personalized help with overwhelm, isolation, and finding resources.";
          break;

        case "past_due":
          message =
            "Your payment failed. Reply UPDATEPAYMENT to fix your billing and keep your 24/7 caregiving support active.";
          break;

        case "incomplete":
          message =
            "You started signing up for GiveCare's 24/7 text-based caregiving support. Reply SIGNUP to complete your subscription and get personalized help.";
          break;

        case "active":
          message =
            "You're already subscribed! You have full access to GiveCare.";
          break;

        case "unknown":
        default:
          message =
            "There's an issue with your subscription. Reply HELP for assistance or visit givecareapp.com/support";
          break;
      }

      await sendSMS(ctx, phone, message);
    });
  },
});

/**
 * Log SMS issues for observability (missing phone, etc.)
 */
export const logSmsIssue = internalMutation({
  args: {
    userId: v.id("users"),
    reason: v.literal("missing_phone"),
    context: v.optional(v.string()),
  },
  handler: async (ctx, { userId, reason, context }) => {
    await ctx.db.insert("events", {
      userId,
      type: "sms.missing_phone",
      payload: {
        reason,
        context,
        timestamp: Date.now(),
      },
    });
  },
});
