/**
 * Internal Subscription Functions
 */

import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";

export type SubscriptionAccessScenario = {
  hasAccess: boolean;
  scenario:
    | "new_user"
    | "active"
    | "grace_period"
    | "grace_expired"
    | "past_due"
    | "incomplete"
    | "unknown";
  gracePeriodEndsAt?: number;
};

/**
 * Pure helper to derive access scenario from a subscription row
 * Used by both inbound and internal queries
 */
export function computeAccessScenario(subscription: any): SubscriptionAccessScenario {
  if (!subscription) {
    return { hasAccess: false, scenario: "new_user" };
  }

  const now = Date.now();

  if (subscription.status === "active") {
    return { hasAccess: true, scenario: "active" };
  }

  if (subscription.status === "canceled" && subscription.gracePeriodEndsAt) {
    if (now < subscription.gracePeriodEndsAt) {
      return {
        hasAccess: true,
        scenario: "grace_period",
        gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      };
    }
    return { hasAccess: false, scenario: "grace_expired" };
  }

  if (subscription.status === "past_due") {
    return { hasAccess: false, scenario: "past_due" };
  }

  // Future-proof: allow for additional statuses like "incomplete"
  return { hasAccess: false, scenario: "unknown" };
}

/**
 * Get subscription by user ID
 */
export const getByUserId = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Get subscription access scenario for a user
 * Normalizes access checks across inbound + internal queries
 */
export const getAccessScenario = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return computeAccessScenario(subscription);
  },
});

/**
 * Create test subscription (for simulation tests only)
 */
export const createTestSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("plus"), v.literal("enterprise")),
  },
  handler: async (ctx, { userId, plan }) => {
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId,
      stripeCustomerId: `test_cus_${Date.now()}`,
      planId: plan === "plus" ? "monthly" : "annual", // Map to schema's planId enum
      status: "active",
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    return subscriptionId;
  },
});
