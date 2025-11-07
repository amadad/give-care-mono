/**
 * Newsletter subscription management
 * Handles subscription and unsubscription for marketing site
 */

import { v } from 'convex/values'
import { mutation, query } from '../_generated/server'
import { ensureAdmin } from '../lib/auth'

/**
 * Subscribe to newsletter
 * Public mutation - called from marketing site
 * REFACTORED: Single transaction (was 3 RPC calls)
 */
export const subscribe = mutation({
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

    // Read + write in ONE transaction
    const existing = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_email', (q: any) => q.eq('email', normalizedEmail))
      .first()

    if (existing && !existing.unsubscribed) {
      return {
        success: true,
        message: 'Already subscribed',
        alreadySubscribed: true,
      }
    }

    const now = Date.now()

    if (existing) {
      // Resubscribe
      await ctx.db.patch(existing._id, {
        unsubscribed: false,
        resubscribedAt: now,
        updatedAt: now,
      })
    } else {
      // New subscriber
      await ctx.db.insert('newsletterSubscribers', {
        email: normalizedEmail,
        subscribedAt: now,
        unsubscribed: false,
        updatedAt: now,
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
 * Public mutation - called from unsubscribe links
 * REFACTORED: Single transaction (was 1 RPC call to mutation)
 */
export const unsubscribe = mutation({
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
    const now = Date.now()

    // Read + write in ONE transaction
    const subscriber = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_email', (q: any) => q.eq('email', normalizedEmail))
      .first()

    if (!subscriber) {
      // Create a record for this email as unsubscribed
      await ctx.db.insert('newsletterSubscribers', {
        email: normalizedEmail,
        subscribedAt: now,
        unsubscribed: true,
        unsubscribedAt: now,
        updatedAt: now,
      })
    } else {
      // Mark existing subscriber as unsubscribed
      await ctx.db.patch(subscriber._id, {
        unsubscribed: true,
        unsubscribedAt: now,
        updatedAt: now,
      })
    }

    return {
      success: true,
      message: `${normalizedEmail} has been unsubscribed`,
      email: normalizedEmail,
    }
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
    await ensureAdmin(ctx)
    const subscribers = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_subscribed', q => q.eq('unsubscribed', false))
      .order('desc')
      .take(limit || 100)

    return subscribers
  },
})
