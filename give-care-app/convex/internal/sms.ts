/**
 * Internal SMS helper actions
 * Called via scheduler for async Twilio sending
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { sendSMS, getHelpMessage, getStopConfirmation } from "../lib/twilio";
import { getCrisisResponse } from "../lib/utils";
import { internal } from "../_generated/api";

/**
 * Send STOP confirmation
 */
export const sendStopConfirmation = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Use internal query to get user (actions can't access db directly)
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    await sendSMS(ctx, user.phone, getStopConfirmation());
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    await sendSMS(ctx, user.phone, getHelpMessage());
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    const response = getCrisisResponse(isDVHint);
    await sendSMS(ctx, user.phone, response);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    await sendSMS(ctx, user.phone, text);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    let message: string;
    if (gracePeriodEndsAt && Date.now() < gracePeriodEndsAt) {
      const daysRemaining = Math.ceil((gracePeriodEndsAt - Date.now()) / 86400000);
      message = `Your subscription has ended, but you have ${daysRemaining} day(s) to resubscribe without losing your progress. Reply RESUBSCRIBE to continue.`;
    } else {
      message = "Your subscription has ended. Reply RESUBSCRIBE to continue using GiveCare.";
    }

    await sendSMS(ctx, user.phone, message);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    // Send welcome message to start onboarding
    const welcomeMessage = `Welcome to GiveCare${user.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm here to support your caregiving journey 24/7. Who are you caring for?`;

    await sendSMS(ctx, user.phone, welcomeMessage);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    let message: string;
    switch (level) {
      case "day5":
        message = "We haven't heard from you in a few days. How are you doing?";
        break;
      case "day7":
        message = "Just checking in - we're here if you need support.";
        break;
      case "day14":
        message = "We miss you! Text back anytime to continue your caregiving support.";
        break;
    }

    await sendSMS(ctx, user.phone, message);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    const message = "You've reached your daily message limit. I'll be back tomorrow to continue supporting you.";
    await sendSMS(ctx, user.phone, message);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    // Map band to user-friendly text
    const bandText: Record<string, string> = {
      very_low: "very low stress",
      low: "low stress",
      moderate: "moderate stress",
      high: "high stress",
    };

    const message = `Thanks for completing your check-in! Your score is ${score} - that shows ${bandText[band] || band}. How are you feeling today?`;
    await sendSMS(ctx, user.phone, message);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    const message = "You started a check-in earlier. Want to finish it? Just reply with your answers.";
    await sendSMS(ctx, user.phone, message);
  },
});

/**
 * Send crisis follow-up message
 */
export const sendCrisisFollowUpMessage = internalAction({
  args: {
    userId: v.id("users"),
    hasResponded: v.boolean(),
  },
  handler: async (ctx, { userId, hasResponded }) => {
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    let message: string;
    if (hasResponded) {
      message = "I'm here to support you. What kind of support would help right now?";
    } else {
      message = "How are you doing today? I wanted to check in after our conversation yesterday.";
    }

    await sendSMS(ctx, user.phone, message);
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
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    let message: string;

    switch (scenario) {
      case "new_user":
        message = "Caring for a loved one? GiveCare provides 24/7 text-based support to help with overwhelm, isolation, and finding resources. Reply SIGNUP to get started.";
        break;

      case "grace_period":
        if (gracePeriodEndsAt) {
          const daysRemaining = Math.ceil((gracePeriodEndsAt - Date.now()) / 86400000);
          message = `Your GiveCare support is paused. You have ${daysRemaining} day(s) to resubscribe and keep your 24/7 caregiving support active. Reply RESUBSCRIBE to continue.`;
        } else {
          message = "Your GiveCare support is paused. Reply RESUBSCRIBE to restore your 24/7 caregiving support.";
        }
        break;

      case "grace_expired":
        message = "Your 24/7 caregiving support has ended. Reply RESUBSCRIBE to restore your personalized help with overwhelm, isolation, and finding resources.";
        break;

      case "past_due":
        message = "Your payment failed. Reply UPDATEPAYMENT to fix your billing and keep your 24/7 caregiving support active.";
        break;

      case "incomplete":
        message = "You started signing up for GiveCare's 24/7 text-based caregiving support. Reply SIGNUP to complete your subscription and get personalized help.";
        break;

      case "active":
        // This shouldn't happen, but just in case
        message = "You're already subscribed! You have full access to GiveCare.";
        break;

      case "unknown":
      default:
        message = "There's an issue with your subscription. Reply HELP for assistance or visit givecareapp.com/support";
        break;
    }

    await sendSMS(ctx, user.phone, message);
  },
});
