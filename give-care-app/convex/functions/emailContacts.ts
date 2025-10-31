/**
 * Email contact management for unified subscriber system
 * Handles newsletter subscribers, assessment completers, and future segments
 */

import { v } from 'convex/values'
import { mutation, query, internalMutation } from '../_generated/server'

/**
 * Upsert email contact (create or update)
 * Used by newsletter signup, assessment completion, etc.
 */
export const upsert = mutation({
  args: {
    email: v.string(),
    tags: v.array(v.string()),
    preferences: v.optional(
      v.object({
        newsletter: v.boolean(),
        assessmentFollowup: v.boolean(),
        productUpdates: v.boolean(),
      })
    ),
    assessmentData: v.optional(
      v.object({
        score: v.number(),
        band: v.string(),
        pressureZones: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.toLowerCase().trim()
    const now = Date.now()

    // Check if contact already exists
    const existing = await ctx.db
      .query('emailContacts')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .first()

    if (existing) {
      // Update existing contact
      const updatedTags = Array.from(new Set([...existing.tags, ...args.tags]))

      const updates: any = {
        tags: updatedTags,
        updatedAt: now,
      }

      // Merge preferences
      if (args.preferences) {
        updates.preferences = {
          ...existing.preferences,
          ...args.preferences,
        }
      }

      // Update assessment data if provided
      if (args.assessmentData) {
        updates.latestAssessmentScore = args.assessmentData.score
        updates.latestAssessmentBand = args.assessmentData.band
        updates.latestAssessmentDate = now
        updates.pressureZones = args.assessmentData.pressureZones
      }

      await ctx.db.patch(existing._id, updates)
      return { contactId: existing._id, isNew: false }
    } else {
      // Create new contact
      const contactId = await ctx.db.insert('emailContacts', {
        email: normalizedEmail,
        tags: args.tags,
        preferences: args.preferences || {
          newsletter: args.tags.includes('newsletter'),
          assessmentFollowup: args.tags.includes('assessment'),
          productUpdates: true,
        },
        latestAssessmentScore: args.assessmentData?.score,
        latestAssessmentBand: args.assessmentData?.band,
        latestAssessmentDate: args.assessmentData ? now : undefined,
        pressureZones: args.assessmentData?.pressureZones,
        emailsSentCount: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })

      return { contactId, isNew: true }
    }
  },
})

/**
 * Get contact by email
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.toLowerCase().trim()

    const contact = await ctx.db
      .query('emailContacts')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .first()

    return contact
  },
})

/**
 * Get contacts by tags (for segmentation)
 */
export const getByTags = query({
  args: {
    tags: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { tags, limit }) => {
    // Get all active contacts
    const contacts = await ctx.db
      .query('emailContacts')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .take(limit || 1000)

    // Filter by tags (contact must have ALL specified tags)
    return contacts.filter((contact) =>
      tags.every((tag) => contact.tags.includes(tag))
    )
  },
})

/**
 * Get contacts by assessment band (for targeted campaigns)
 */
export const getByBand = query({
  args: {
    band: v.string(), // Mild | Moderate | Severe
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { band, limit }) => {
    const contacts = await ctx.db
      .query('emailContacts')
      .withIndex('by_band', (q) => q.eq('latestAssessmentBand', band))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .take(limit || 1000)

    return contacts
  },
})

/**
 * Get all newsletter subscribers (active only)
 */
export const getNewsletterSubscribers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const contacts = await ctx.db
      .query('emailContacts')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .filter((q) => q.eq(q.field('preferences').newsletter, true))
      .take(limit || 1000)

    return contacts
  },
})

/**
 * Get assessment completers who opted into follow-up
 */
export const getAssessmentFollowupSubscribers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const contacts = await ctx.db
      .query('emailContacts')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .filter((q) =>
        q.and(
          q.eq(q.field('preferences').assessmentFollowup, true),
          q.neq(q.field('latestAssessmentScore'), undefined)
        )
      )
      .take(limit || 1000)

    return contacts
  },
})

/**
 * Unsubscribe contact
 */
export const unsubscribe = mutation({
  args: {
    email: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { email, reason }) => {
    const normalizedEmail = email.toLowerCase().trim()
    const now = Date.now()

    const contact = await ctx.db
      .query('emailContacts')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .first()

    if (!contact) {
      throw new Error('Contact not found')
    }

    await ctx.db.patch(contact._id, {
      status: 'unsubscribed',
      unsubscribedAt: now,
      unsubscribeReason: reason,
      preferences: {
        newsletter: false,
        assessmentFollowup: false,
        productUpdates: false,
      },
      updatedAt: now,
    })

    return { success: true }
  },
})

/**
 * Track email sent (for engagement metrics)
 */
export const trackEmailSent = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.toLowerCase().trim()
    const now = Date.now()

    const contact = await ctx.db
      .query('emailContacts')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .first()

    if (contact) {
      await ctx.db.patch(contact._id, {
        emailsSentCount: contact.emailsSentCount + 1,
        lastEmailSentAt: now,
        updatedAt: now,
      })
    }
  },
})

/**
 * List all contacts (admin only)
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { limit, status }) => {
    let query = ctx.db.query('emailContacts')

    if (status) {
      query = query.withIndex('by_status', (q) => q.eq('status', status))
    }

    const contacts = await query.order('desc').take(limit || 100)

    return contacts
  },
})

/**
 * Get contact stats (for admin dashboard)
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allContacts = await ctx.db.query('emailContacts').collect()

    const stats = {
      total: allContacts.length,
      active: allContacts.filter((c) => c.status === 'active').length,
      unsubscribed: allContacts.filter((c) => c.status === 'unsubscribed').length,
      newsletterSubscribers: allContacts.filter(
        (c) => c.status === 'active' && c.preferences.newsletter
      ).length,
      assessmentCompleters: allContacts.filter((c) => c.latestAssessmentScore !== undefined)
        .length,
      byBand: {
        Mild: allContacts.filter((c) => c.latestAssessmentBand === 'Mild').length,
        Moderate: allContacts.filter((c) => c.latestAssessmentBand === 'Moderate').length,
        Severe: allContacts.filter((c) => c.latestAssessmentBand === 'Severe').length,
      },
    }

    return stats
  },
})
