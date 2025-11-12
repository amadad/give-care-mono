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
 * Sends signup page link with phone pre-filled
 */
export const handleResubscribeAction = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user to extract phone
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId: args.userId });
    if (!user?.phone) {
      await ctx.runAction(internal.internal.sms.sendAgentResponse, {
        userId: args.userId,
        text: "Please visit givecareapp.com/signup to get started.",
      });
      return;
    }

    // Check if user already has active subscription
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

    // Send signup page link with phone pre-filled
    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.givecareapp.com";
    const signupUrl = `${siteUrl}/signup?phone=${encodeURIComponent(user.phone)}`;

    await ctx.runAction(internal.internal.sms.sendAgentResponse, {
      userId: args.userId,
      text: `Get started: ${signupUrl}`,
    });
  },
});

/**
 * Handle billing portal request (wrapper action)
 * Sends Stripe billing portal link for managing subscription
 */
export const handleBillingPortalAction = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get subscription to check for Stripe customer ID
    const subscription = await ctx.runQuery(internal.internal.subscriptions.getByUserId, {
      userId: args.userId,
    });

    if (!subscription?.stripeCustomerId) {
      // User doesn't have a Stripe customer - can't access portal
      await ctx.runAction(internal.internal.sms.sendAgentResponse, {
        userId: args.userId,
        text: "You don't have a billing account yet. Reply SIGNUP to create your subscription.",
      });
      return;
    }

    try {
      // Create billing portal session
      const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.givecareapp.com";
      const result = await ctx.runAction(
        internal.internal.stripeActions.createBillingPortalSession,
        {
          userId: args.userId,
          returnUrl: `${siteUrl}/account`,
        }
      );

      if (result?.url) {
        // Send portal URL via SMS
        await ctx.runAction(internal.internal.sms.sendAgentResponse, {
          userId: args.userId,
          text: `Manage your billing here: ${result.url}`,
        });
      }
    } catch (error) {
      // Send error message if portal creation fails
      await ctx.runAction(internal.internal.sms.sendAgentResponse, {
        userId: args.userId,
        text: "Sorry, we couldn't access your billing portal. Please try again later or visit givecareapp.com/account",
      });
      console.error("Failed to create billing portal session:", error);
    }
  },
});

/**
 * Send subscription message based on scenario (wrapper action)
 * Sends appropriate message for each subscription scenario
 */
export const sendSubscriptionMessageAction = internalAction({
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
  handler: async (ctx, args) => {
    await ctx.runAction(internal.internal.sms.sendSubscriptionMessage, {
      userId: args.userId,
      scenario: args.scenario,
      gracePeriodEndsAt: args.gracePeriodEndsAt,
    });
  },
});
