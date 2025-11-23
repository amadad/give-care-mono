/**
 * Internal User Functions
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getUserMetadata, normalizePhone } from "../lib/utils";
import { requireUser } from "../lib/userHelpers";
import { computeAccessScenario } from "./subscriptions";

/**
 * Create or update user from signup form
 * Returns userId for checkout session
 */
export const upsertUserFromSignup = internalMutation({
  args: {
    phone: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { phone, email, name }) => {
    const normalized = normalizePhone(phone);

    // Try to find existing user by phone
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", normalized))
      .first();

    if (existing) {
      // Update existing user with new info
      await ctx.db.patch(existing._id, {
        email,
        name,
      });
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      externalId: normalized,
      phone: normalized,
      email,
      name,
      channel: "sms",
      locale: "en-US",
      consent: {
        emergency: true,
        marketing: true,
      },
      metadata: {
        onboardingStage: "new",
        onboardingMilestones: [],
      },
    });

    return userId;
  },
});

/**
 * Update user profile metadata
 * Profile fields (firstName, careRecipientName, relationship, etc.) are nested in metadata.profile
 * Other fields (zipCode, timezone, onboardingStage, etc.) go directly in metadata
 */
export const updateProfile = internalMutation({
  args: {
    userId: v.id("users"),
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { userId, field, value }) => {
    const user = await requireUser(ctx.db, userId);

    const metadata = getUserMetadata(user);

    // Profile fields go in metadata.profile, everything else at metadata level
    const profileFields = ['firstName', 'careRecipientName', 'relationship'];

    if (profileFields.includes(field)) {
      const profile = metadata.profile || {};
      await ctx.db.patch(userId, {
        metadata: {
          ...metadata,
          profile: {
            ...profile,
            [field]: value,
          },
        },
      });
    } else {
      await ctx.db.patch(userId, {
        metadata: {
          ...metadata,
          [field]: value,
        },
      });
    }
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
    // Use _creationTime ordering for consistent results
    return await ctx.db
      .query("users")
      .order("desc")
      .take(1000);
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
    // Use _creationTime ordering for consistent results
    const allUsers = await ctx.db
      .query("users")
      .order("desc")
      .take(1000);

    const userIdKeys = new Set(allUsers.map((u) => String((u._id as any).id ?? u._id)));
    const subscriptions = await ctx.db.query("subscriptions").order("desc").take(2000);
    const subsByUser = new Map<string, any>();
    for (const sub of subscriptions) {
      const key = String((sub.userId as any).id ?? sub.userId);
      if (userIdKeys.has(key) && !subsByUser.has(key)) {
        subsByUser.set(key, sub);
      }
    }

    const now = Date.now();
    const eligibleUsers: Array<{ _id: any }> = [];

    for (const user of allUsers) {
      const metadata = getUserMetadata(user);
      const checkInFrequency = metadata.checkInFrequency;

      if (!checkInFrequency) {
        continue; // No check-in frequency set
      }

      // Use lastEMA timestamp instead of per-user assessment query
      const lastEMA =
        user.lastEMA ||
        metadata.lastEMA ||
        0;
      const lastCheckInDate = lastEMA;
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
        // Check subscription access (only active or grace-period users)
        const subKey = String((user._id as any).id ?? user._id);
        const access = computeAccessScenario(subsByUser.get(subKey));

        if (access.hasAccess) {
          eligibleUsers.push({ _id: user._id });
        }
      }
    }

    // Limit to 100 users per run (CONVEX_01.md best practice)
    return eligibleUsers.slice(0, 100);
  },
});

/**
 * Get recent inbound receipt for a user (to check if user has responded)
 */
export const getRecentInboundReceipt = internalQuery({
  args: {
    userId: v.id("users"),
    since: v.number(), // Timestamp threshold
  },
  handler: async (ctx, { userId, since }) => {
    // Query inbound_receipts for this user since threshold
    // Limit to recent 100 receipts to prevent unbounded collection
    // Filter in code since we need to check receivedAt >= since
    const receipts = await ctx.db
      .query("inbound_receipts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100); // Safety limit

    // Find most recent receipt after threshold
    const recent = receipts
      .filter((r) => r.receivedAt && r.receivedAt >= since)
      .sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0))[0];

    return recent || null;
  },
});

/**
 * Get recent LLM usage for a user
 */
export const getRecentUsage = internalQuery({
  args: {
    userId: v.id("users"),
    since: v.number(),
  },
  handler: async (ctx, { userId, since }) => {
    const usage = await ctx.db
      .query("llm_usage")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), since))
      .take(200);
    return usage;
  },
});

/**
 * Get recent guardrail events for a user
 */
export const getRecentGuardrailEvents = internalQuery({
  args: {
    userId: v.id("users"),
    since: v.number(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, { userId, since, type }) => {
    // Limit to recent 200 events to prevent unbounded collection
    // Server-side filter on createdAt, then narrow by type
    const events = await ctx.db
      .query("guardrail_events")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("createdAt"), since))
      .order("desc")
      .take(200); // Safety limit

    return type ? events.filter((e) => e.type === type) : events;
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
    // Use _creationTime ordering for consistent results
    const allUsers = await ctx.db
      .query("users")
      .order("desc")
      .take(1000);

    const userIdKeys = new Set(allUsers.map((u) => String((u._id as any).id ?? u._id)));
    const subscriptions = await ctx.db.query("subscriptions").order("desc").take(2000);
    const subsByUser = new Map<string, any>();
    for (const sub of subscriptions) {
      const key = String((sub.userId as any).id ?? sub.userId);
      if (userIdKeys.has(key) && !subsByUser.has(key)) {
        subsByUser.set(key, sub);
      }
    }

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

      // Note: engagementFlags removed as part of simplification
      // All users are eligible for check-ins if they meet other criteria

      // Check subscription access (only active or grace-period users)
      const subKey = String((user._id as any).id ?? user._id);
      const access = computeAccessScenario(subsByUser.get(subKey));

      if (access.hasAccess) {
        eligibleUsers.push({ _id: user._id });
      }
    }

    // Limit to 100 users per run (CONVEX_01.md best practice)
    return eligibleUsers.slice(0, 100);
  },
});

/**
 * Get most recent crisis alert for user
 * Used to link feedback to the correct crisis event
 */
export const getRecentCrisisAlert = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const alert = await ctx.db
      .query("alerts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("type"), "crisis"))
      .order("desc")
      .first();

    return alert;
  },
});

/**
 * Get alert by ID
 */
export const getAlert = internalQuery({
  args: {
    alertId: v.id("alerts"),
  },
  handler: async (ctx, { alertId }) => {
    return await ctx.db.get(alertId);
  },
});
