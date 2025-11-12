/**
 * Subscription Service
 * Convex-aware service for subscription operations
 */

import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

/**
 * Subscription scenario types
 */
export type SubscriptionScenario =
  | "new_user"           // Never subscribed
  | "active"             // Active subscription
  | "grace_period"       // Canceled but within grace period
  | "grace_expired"      // Canceled and grace period expired
  | "past_due"           // Payment failed
  | "incomplete"         // Started checkout but didn't complete
  | "unknown";           // Other status

/**
 * Check subscription access
 * Returns detailed status for proper messaging
 */
export async function checkSubscriptionAccess(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<{
  hasAccess: boolean;
  scenario: SubscriptionScenario;
  isInGracePeriod: boolean;
  gracePeriodEndsAt?: number;
  status?: string;
  stripeCustomerId?: string;
}> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  // New user - never subscribed
  if (!subscription) {
    return {
      hasAccess: false,
      scenario: "new_user",
      isInGracePeriod: false
    };
  }

  // Active subscription
  if (subscription.status === "active") {
    return {
      hasAccess: true,
      scenario: "active",
      isInGracePeriod: false,
      status: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId,
    };
  }

  // Canceled - check grace period
  if (subscription.status === "canceled" && subscription.gracePeriodEndsAt) {
    const now = Date.now();
    const isInGracePeriod = now < subscription.gracePeriodEndsAt;

    return {
      hasAccess: isInGracePeriod,
      scenario: isInGracePeriod ? "grace_period" : "grace_expired",
      isInGracePeriod,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      status: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId,
    };
  }

  // Payment failed
  if (subscription.status === "past_due") {
    return {
      hasAccess: false,
      scenario: "past_due",
      isInGracePeriod: false,
      status: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId,
    };
  }

  // Incomplete checkout
  if (subscription.status === "incomplete" || subscription.status === "incomplete_expired") {
    return {
      hasAccess: false,
      scenario: "incomplete",
      isInGracePeriod: false,
      status: subscription.status,
      stripeCustomerId: subscription.stripeCustomerId,
    };
  }

  // Other statuses (canceled without grace, etc)
  return {
    hasAccess: false,
    scenario: "unknown",
    isInGracePeriod: false,
    status: subscription.status,
    stripeCustomerId: subscription.stripeCustomerId,
  };
}

