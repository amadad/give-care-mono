/**
 * Internal Subscription Functions
 */

import { internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";

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

