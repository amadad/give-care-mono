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

/**
 * Handle resubscribe request (wrapper action)
 * Creates checkout session and sends URL via SMS
 */
export const handleResubscribeAction = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user already has active subscription
    // Get subscription directly via query
    const subscription = await ctx.runQuery(internal.internal.subscriptions.getByUserId, {
      userId: args.userId,
    });

    // Check if subscription is active
    const hasAccess = subscription?.status === "active" || 
      (subscription?.status === "canceled" && 
       subscription.gracePeriodEndsAt && 
       Date.now() < subscription.gracePeriodEndsAt);

    if (hasAccess) {
      // User already has access - send confirmation message
      await ctx.runAction(internal.internal.sms.sendAgentResponse, {
        userId: args.userId,
        text: "You're already subscribed! You have full access to GiveCare.",
      });
      return;
    }

    try {
      // Create checkout session
      const result = await ctx.runAction(
        internal.internal.stripeActions.createCheckoutSessionForResubscribe,
        {
          userId: args.userId,
          successUrl: "https://www.givecareapp.com/signup?resubscribed=true",
          cancelUrl: "https://www.givecareapp.com/signup?canceled=true",
        }
      );

      if (result?.url) {
        // Send checkout URL via SMS
        await ctx.runAction(internal.internal.sms.sendAgentResponse, {
          userId: args.userId,
          text: `Click here to resubscribe: ${result.url}`,
        });
      }
    } catch (error) {
      // Send error message if checkout creation fails
      await ctx.runAction(internal.internal.sms.sendAgentResponse, {
        userId: args.userId,
        text: "Sorry, we couldn't create your checkout session. Please try again later or visit givecareapp.com/signup",
      });
      console.error("Failed to create checkout session for resubscribe:", error);
    }
  },
});
