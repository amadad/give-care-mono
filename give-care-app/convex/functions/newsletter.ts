/**
 * Newsletter subscription management
 * Handles subscription and unsubscription for marketing site
 */

import { v } from 'convex/values'
import { action, mutation, query } from '../_generated/server'
import { api } from '../_generated/api'

/**
 * Subscribe to newsletter
 * Public action - called from marketing site
 */
export const subscribe = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim()

    // Check if already subscribed
    const existing = await ctx.runQuery(api.functions.newsletter.getByEmail, {
      email: normalizedEmail,
    })

    if (existing && !existing.unsubscribed) {
      return {
        success: true,
        message: 'Already subscribed',
        alreadySubscribed: true,
      }
    }

    // Store in database
    if (existing) {
      // Resubscribe
      await ctx.runMutation(api.functions.newsletter.resubscribe, {
        email: normalizedEmail,
      })
    } else {
      // New subscriber
      await ctx.runMutation(api.functions.newsletter.create, {
        email: normalizedEmail,
      })
    }

    return {
      success: true,
      message: 'Successfully subscribed to newsletter',
      email: normalizedEmail,
    }
  },
})

/**
 * Unsubscribe from newsletter
 * Public action - called from unsubscribe links
 */
export const unsubscribe = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Mark as unsubscribed in database
    await ctx.runMutation(api.functions.newsletter.markUnsubscribed, {
      email: normalizedEmail,
    })

    return {
      success: true,
      message: `${normalizedEmail} has been unsubscribed`,
      email: normalizedEmail,
    }
  },
})

// Internal mutations and queries

export const create = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const now = Date.now()

    const id = await ctx.db.insert('newsletterSubscribers', {
      email,
      subscribedAt: now,
      unsubscribed: false,
      updatedAt: now,
    })

    return id
  },
})

export const resubscribe = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const subscriber = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_email', (q: any) => q.eq('email', email))
      .first()

    if (!subscriber) {
      throw new Error('Subscriber not found')
    }

    await ctx.db.patch(subscriber._id, {
      unsubscribed: false,
      subscribedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return subscriber._id
  },
})

export const markUnsubscribed = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const subscriber = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_email', (q: any) => q.eq('email', email))
      .first()

    if (!subscriber) {
      // Create a record for this email as unsubscribed
      await ctx.db.insert('newsletterSubscribers', {
        email,
        subscribedAt: Date.now(),
        unsubscribed: true,
        unsubscribedAt: Date.now(),
        updatedAt: Date.now(),
      })
      return
    }

    await ctx.db.patch(subscriber._id, {
      unsubscribed: true,
      unsubscribedAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const subscriber = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_email', (q: any) => q.eq('email', email))
      .first()

    return subscriber
  },
})

/**
 * List all active subscribers (admin only)
 */
export const listActive = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const subscribers = await ctx.db
      .query('newsletterSubscribers')
      .filter(q => q.eq(q.field('unsubscribed'), false))
      .order('desc')
      .take(limit || 100)

    return subscribers
  },
})
