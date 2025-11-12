/**
 * Internal User Functions
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Update user profile metadata
 */
export const updateProfile = internalMutation({
  args: {
    userId: v.id("users"),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { userId, field, value }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const metadata = user.metadata || {};
    await ctx.db.patch(userId, {
      metadata: {
        ...metadata,
        [field]: value,
      },
    });
  },
});

/**
 * Get user by ID
 */
export const getUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

/**
 * Get all users (for trend detection)
 * Note: In production, this should be paginated or use a more efficient query
 */
export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all users (limit to prevent timeout)
    // TODO: Add pagination or use a more efficient approach
    return await ctx.db.query("users").take(1000);
  },
});

/**
 * Get users who need check-ins
 * Returns users with checkInFrequency set who haven't been checked in recently
 * CONVEX_01.md: Single query, filter in code for small result sets
 */
export const getUsersWithCheckIns = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all users (limit to prevent timeout)
    // CONVEX_01.md: "Only use .collect with a small number"
    const allUsers = await ctx.db.query("users").take(1000);

    const now = Date.now();
    const eligibleUsers: Array<{ _id: any }> = [];

    for (const user of allUsers) {
      const metadata = user.metadata || {};
      const checkInFrequency = metadata.checkInFrequency as
        | "daily"
        | "weekly"
        | undefined;

      if (!checkInFrequency) {
        continue; // No check-in frequency set
      }

      // Get last EMA assessment completion date
      const lastEMA = await ctx.db
        .query("assessments")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userId", user._id).eq("definitionId", "ema")
        )
        .order("desc")
        .first();

      const lastCheckInDate = lastEMA?.completedAt || 0;
      const hoursSinceCheckIn = (now - lastCheckInDate) / (1000 * 60 * 60);

      // Check eligibility based on frequency
      let isEligible = false;
      if (checkInFrequency === "daily") {
        // Daily: check-in if > 24 hours ago
        isEligible = hoursSinceCheckIn >= 24;
      } else if (checkInFrequency === "weekly") {
        // Weekly: check-in if > 7 days ago
        isEligible = hoursSinceCheckIn >= 24 * 7;
      }

      if (isEligible) {
        // Check subscription access (only active users)
        const subscription = await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        const hasAccess =
          subscription?.status === "active" ||
          (subscription?.status === "canceled" &&
            subscription.gracePeriodEndsAt &&
            Date.now() < subscription.gracePeriodEndsAt);

        if (hasAccess) {
          eligibleUsers.push({ _id: user._id });
        }
      }
    }

    // Limit to 100 users per run (CONVEX_01.md best practice)
    return eligibleUsers.slice(0, 100);
  },
});

/**
 * Get inactive users for engagement monitoring
 * Returns users with lastEngagementDate > days ago who aren't already escalated
 * CONVEX_01.md: Single query, filter in code for small result sets
 */
export const getInactiveUsers = internalQuery({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 5 }) => {
    // Get all users (limit to prevent timeout)
    // CONVEX_01.md: "Only use .collect with a small number"
    const allUsers = await ctx.db.query("users").take(1000);

    const now = Date.now();
    const threshold = days * 24 * 60 * 60 * 1000; // days in milliseconds
    const eligibleUsers: Array<{ _id: any }> = [];

    for (const user of allUsers) {
      // Must have lastEngagementDate
      if (!user.lastEngagementDate) {
        continue;
      }

      // Must be > days ago
      const daysSince = now - user.lastEngagementDate;
      if (daysSince < threshold) {
        continue;
      }

      // Exclude already escalated users
      // escalationLevel can be: "none" | "day5" | "day7" | "day14" | undefined
      // Only exclude if explicitly set to a non-"none" value
      const escalationLevel = user.engagementFlags?.escalationLevel;
      if (escalationLevel && escalationLevel !== "none") {
        continue; // Already escalated (day5, day7, or day14)
      }

      // Check subscription access (only active users)
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      const hasAccess =
        subscription?.status === "active" ||
        (subscription?.status === "canceled" &&
          subscription.gracePeriodEndsAt &&
          Date.now() < subscription.gracePeriodEndsAt);

      if (hasAccess) {
        eligibleUsers.push({ _id: user._id });
      }
    }

    // Limit to 100 users per run (CONVEX_01.md best practice)
    return eligibleUsers.slice(0, 100);
  },
});
