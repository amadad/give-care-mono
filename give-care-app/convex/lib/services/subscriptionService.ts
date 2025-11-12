/**
 * Subscription Service
 * Convex-aware service for subscription operations
 */

import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

/**
 * Check subscription access
 * Returns access status and grace period info
 */
export async function checkSubscriptionAccess(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<{
  hasAccess: boolean;
  isInGracePeriod: boolean;
  gracePeriodEndsAt?: number;
  status?: string;
}> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!subscription) {
    return { hasAccess: false, isInGracePeriod: false };
  }

  // Crisis always available - bypass check
  // This check is done at the caller level

  // Check if subscription is active
  if (subscription.status === "active") {
    return {
      hasAccess: true,
      isInGracePeriod: false,
      status: subscription.status,
    };
  }

  // Check grace period for canceled subscriptions
  if (subscription.status === "canceled" && subscription.gracePeriodEndsAt) {
    const now = Date.now();
    const isInGracePeriod = now < subscription.gracePeriodEndsAt;

    return {
      hasAccess: isInGracePeriod,
      isInGracePeriod,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt,
      status: subscription.status,
    };
  }

  // No access
  return {
    hasAccess: false,
    isInGracePeriod: false,
    status: subscription.status,
  };
}

