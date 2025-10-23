/**
 * Internal mutations for managing user subscriptions
 * These are called by Stripe webhook handlers
 */

import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'

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
      // Update existing user
      await ctx.db.patch(existing._id, {
        name: fullName,
        email,
        stripeCustomerId,
        updatedAt: Date.now(),
      })
      return existing._id
    }

    // Create new user with pending status
    const userId = await ctx.db.insert('users', {
      // Auth fields
      name: fullName,
      email,
      phone: phoneNumber,

      // Caregiver fields
      phoneNumber,
      firstName: fullName.split(' ')[0], // Extract first name
      journeyPhase: 'onboarding',
      assessmentInProgress: false,
      assessmentCurrentQuestion: 0,
      pressureZones: [],
      onboardingAttempts: {},
      rcsCapable: false,
      languagePreference: 'en',

      // Stripe fields
      stripeCustomerId,
      subscriptionStatus: 'incomplete', // Will become "active" after payment

      // App state
      appState: {},

      // Timestamps
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return userId
  },
})

/**
 * Update user with checkout session ID
 */
export const updateCheckoutSession = internalMutation({
  args: {
    userId: v.id('users'),
    checkoutSessionId: v.string(),
  },
  handler: async (ctx, { userId, checkoutSessionId }) => {
    await ctx.db.patch(userId, {
      // Store in appState.metadata as JSON string
      appState: {
        metadata: JSON.stringify({ checkoutSessionId }),
      },
      updatedAt: Date.now(),
    })
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
      journeyPhase: 'active', // Move from onboarding to active
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

    await ctx.db.patch(userId, {
      subscriptionStatus,
      journeyPhase,
      updatedAt: Date.now(),
    })
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

    const isActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'

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
