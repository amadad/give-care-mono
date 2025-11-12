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
