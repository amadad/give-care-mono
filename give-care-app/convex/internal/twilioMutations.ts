/**
 * Twilio Wrapper Actions
 * Wrapper actions that call Twilio actions directly
 * Used to work around scheduler path resolution issue when scheduling actions from mutations
 * 
 * The path resolution bug occurs when scheduling internal.twilio.* actions directly from mutations.
 * By wrapping them in actions (not mutations), mutations can schedule these wrappers successfully.
 * 
 * Mutations can schedule actions, but NOT other mutations. So these must be actions.
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Send STOP confirmation (wrapper action)
 */
export const sendStopConfirmationAction = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Call the action directly (action → action via ctx.runAction)
    // This avoids the scheduler path resolution bug
    await ctx.runAction(internal.internal.sms.sendStopConfirmation, {
      userId: args.userId,
    });
  },
});

/**
 * Send HELP message (wrapper action)
 */
export const sendHelpMessageAction = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Call the action directly (action → action via ctx.runAction)
    await ctx.runAction(internal.internal.sms.sendHelpMessage, {
      userId: args.userId,
    });
  },
});

/**
 * Send crisis response (wrapper action)
 */
export const sendCrisisResponseAction = internalAction({
  args: {
    userId: v.id("users"),
    isDVHint: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Call the action directly (action → action via ctx.runAction)
    await ctx.runAction(internal.internal.sms.sendCrisisResponse, {
      userId: args.userId,
      isDVHint: args.isDVHint,
    });
  },
});

/**
 * Send resubscribe message (wrapper action)
 */
export const sendResubscribeMessageAction = internalAction({
  args: {
    userId: v.id("users"),
    gracePeriodEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Call the action directly (action → action via ctx.runAction)
    await ctx.runAction(internal.internal.sms.sendResubscribeMessage, {
      userId: args.userId,
      gracePeriodEndsAt: args.gracePeriodEndsAt,
    });
  },
});

/**
 * Send agent response (wrapper action)
 * Used by internal/agents.ts to avoid scheduler path resolution issues
 */
export const sendAgentResponseAction = internalAction({
  args: {
    userId: v.id("users"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Call the action directly (action → action via ctx.runAction)
    await ctx.runAction(internal.internal.sms.sendAgentResponse, {
      userId: args.userId,
      text: args.text,
    });
  },
});
