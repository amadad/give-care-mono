/**
 * Core Internal Functions
 * Used by tests and internal workflows
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Ensure user exists (create if needed)
 * Used by checkout flow and tests
 */
export const ensureUserMutation = internalMutation({
  args: {
    externalId: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    channel: v.union(v.literal("sms"), v.literal("email"), v.literal("web")),
  },
  handler: async (ctx, { externalId, phone, email, name, channel }) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .first();

    if (existing) {
      return existing;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      externalId,
      phone: phone || externalId,
      email,
      name,
      channel,
      locale: "en-US",
      consent: {
        emergency: true,
        marketing: true,
      },
      metadata: {},
    });

    const user = await ctx.db.get(userId);
    return user!;
  },
});

/**
 * Update user metadata
 * Used by checkout flow to link Stripe customer ID
 */
export const updateUserMetadata = internalMutation({
  args: {
    userId: v.id("users"),
    metadata: v.any(),
  },
  handler: async (ctx, { userId, metadata }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, {
      metadata: {
        ...(user.metadata || {}),
        ...metadata,
      },
    });
  },
});

/**
 * Get user by ID
 * Used by tests and internal queries
 */
export const getUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});
