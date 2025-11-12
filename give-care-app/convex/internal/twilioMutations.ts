/**
 * Twilio Wrapper Mutations
 * Wrapper mutations that call Twilio actions via ctx.runAction
 * Used to work around scheduler path resolution issue when scheduling actions from mutations
 * 
 * The path resolution bug occurs when scheduling internal.twilio.* actions directly from mutations.
 * By wrapping them in mutations that call actions via ctx.runAction, we avoid the scheduler bug.
 * 
 * Note: ctx.runAction is blocking, but SMS sending is fast enough (<500ms) that this doesn't
 * significantly impact mutation latency. The mutation still completes quickly.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Send STOP confirmation (wrapper mutation)
 */
export const sendStopConfirmationMutation = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Call the action directly (mutation → action via ctx.runAction)
    // This avoids the scheduler path resolution bug
    await ctx.runAction(internal.twilio.sendStopConfirmation, {
      userId: args.userId,
    });
  },
});

/**
 * Send HELP message (wrapper mutation)
 */
export const sendHelpMessageMutation = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Call the action directly (mutation → action via ctx.runAction)
    await ctx.runAction(internal.twilio.sendHelpMessage, {
      userId: args.userId,
    });
  },
});

/**
 * Send crisis response (wrapper mutation)
 */
export const sendCrisisResponseMutation = internalMutation({
  args: {
    userId: v.id("users"),
    isDVHint: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Call the action directly (mutation → action via ctx.runAction)
    await ctx.runAction(internal.twilio.sendCrisisResponse, {
      userId: args.userId,
      isDVHint: args.isDVHint,
    });
  },
});

/**
 * Send resubscribe message (wrapper mutation)
 */
export const sendResubscribeMessageMutation = internalMutation({
  args: {
    userId: v.id("users"),
    gracePeriodEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Call the action directly (mutation → action via ctx.runAction)
    await ctx.runAction(internal.twilio.sendResubscribeMessage, {
      userId: args.userId,
      gracePeriodEndsAt: args.gracePeriodEndsAt,
    });
  },
});

