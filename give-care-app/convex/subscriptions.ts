/**
 * Internal mutations for managing user subscriptions
 * These are called by Stripe webhook handlers
 */

import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'

/**
 * Create a pending user record when checkout starts
 * Called from createCheckoutSession action
 */
export const createPendingUser = internalMutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, { fullName, email, phoneNumber, stripeCustomerId }) => {
    // Check if user already exists by phone number
    const existing = await ctx.db
      .query('users')
      .withIndex('by_phone', (q: any) => q.eq('phoneNumber', phoneNumber))
      .first()

    if (existing) {
      // Update existing user (auth fields only)
      await ctx.db.patch(existing._id, {
        name: fullName,
        email,
        stripeCustomerId,
        updatedAt: Date.now(),
      })

      return existing._id
    }

    // Create new user (auth fields only)
    const userId = await ctx.db.insert('users', {
      name: fullName,
      email,
      phoneNumber,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Populate profile defaults directly on user record
    await ctx.db.patch(userId, {
      firstName: fullName.split(' ')[0],
      journeyPhase: 'onboarding',
      assessmentInProgress: false,
      assessmentCurrentQuestion: 0,
      pressureZones: [],
      onboardingAttempts: {},
      updatedAt: Date.now(),
    })

    // Initialize subscription fields
    await ctx.db.patch(userId, {
      stripeCustomerId,
      subscriptionStatus: 'incomplete', // Will become "active" after payment
      updatedAt: Date.now(),
    })

    return userId
  },
})

/**
 * Update user with checkout session ID
 * Note: Checkout session is temporary - we retrieve final subscription data from Stripe webhooks
 */
export const updateCheckoutSession = internalMutation({
  args: {
    userId: v.id('users'),
    checkoutSessionId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Update user timestamp (checkout session ID not stored in normalized schema)
    await ctx.db.patch(userId, {
      updatedAt: Date.now(),
    })
    // Note: checkoutSessionId is temporary metadata - final subscription data comes from webhooks
  },
})

/**
 * Activate subscription after successful payment
 */
export const activateSubscription = internalMutation({
  args: {
    userId: v.id('users'),
    stripeSubscriptionId: v.string(),
    subscriptionStatus: v.union(
      v.literal('active'),
      v.literal('trialing'),
      v.literal('past_due'),
      v.literal('canceled'),
      v.literal('incomplete')
    ),
  },
  handler: async (ctx, { userId, stripeSubscriptionId, subscriptionStatus }) => {
    await ctx.db.patch(userId, {
      stripeSubscriptionId,
      subscriptionStatus,
      journeyPhase: 'active',
      updatedAt: Date.now(),
    })
  },
})

/**
 * Update subscription status (for renewals, cancellations, etc.)
 *
 * All valid Stripe subscription statuses:
 * https://stripe.com/docs/api/subscriptions/object#subscription_object-status
 */
export const updateSubscriptionStatus = internalMutation({
  args: {
    userId: v.id('users'),
    subscriptionStatus: v.union(
      // Active states
      v.literal('active'),
      v.literal('trialing'),
      // Payment issue states
      v.literal('past_due'),
      v.literal('unpaid'),
      // Incomplete states
      v.literal('incomplete'),
      v.literal('incomplete_expired'),
      // Ended states
      v.literal('canceled'),
      v.literal('paused'),
      // Legacy/fallback
      v.literal('none')
    ),
  },
  handler: async (ctx, { userId, subscriptionStatus }) => {
    const user = await ctx.db.get(userId)
    if (!user) throw new Error('User not found')

    // Determine journey phase based on subscription status
    let journeyPhase = user.journeyPhase

    // Move to churned if subscription ends
    if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscriptionStatus)) {
      journeyPhase = 'churned'
    }
    // Keep paused users in their current phase (temporary hold)
    else if (subscriptionStatus === 'paused') {
      // No change to journey phase
    }

    const updates: Partial<typeof user> & { updatedAt: number } = {
      subscriptionStatus,
      updatedAt: Date.now(),
    }

    // Update journey phase if it changed
    if (journeyPhase && journeyPhase !== user.journeyPhase) {
      updates.journeyPhase = journeyPhase
    }

    await ctx.db.patch(userId, updates)
  },
})

/**
 * Fix user subscription status (admin utility)
 * Manually activates a subscription for users where Stripe webhook missed
 */
export const fixUserSubscription = mutation({
  args: {
    phoneNumber: v.string(),
    subscriptionStatus: v.union(
      v.literal('active'),
      v.literal('trialing'),
      v.literal('incomplete')
    ),
  },
  handler: async (ctx, { phoneNumber, subscriptionStatus }) => {
    // Find user by phone
    const user = await ctx.db
      .query('users')
      .withIndex('by_phone', (q: any) => q.eq('phoneNumber', phoneNumber))
      .first()

    if (!user) {
      throw new Error(`User not found with phone: ${phoneNumber}`)
    }

    const updates: Partial<typeof user> & { updatedAt: number } = {
      subscriptionStatus,
      updatedAt: Date.now(),
    }

    // Move to active journey phase if activating
    if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
      updates.journeyPhase = 'active'
    }

    await ctx.db.patch(user._id, updates)

    return {
      success: true,
      userId: user._id,
      newStatus: subscriptionStatus,
    }
  },
})

/**
 * Check if user has active subscription
 * Used for route protection on the web app
 */
export const checkSubscription = query({
  args: {
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { phoneNumber, email }) => {
    if (!phoneNumber && !email) {
      return { isActive: false, user: null }
    }

    let user
    if (phoneNumber) {
      user = await ctx.db
        .query('users')
        .withIndex('by_phone', (q: any) => q.eq('phoneNumber', phoneNumber))
        .first()
    } else if (email) {
      user = await ctx.db
        .query('users')
        .withIndex('email', (q: any) => q.eq('email', email))
        .first()
    }

    if (!user) {
      return { isActive: false, user: null }
    }

    const isActive =
      user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'

    return {
      isActive,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        subscriptionStatus: user.subscriptionStatus,
        journeyPhase: user.journeyPhase,
      },
    }
  },
})
