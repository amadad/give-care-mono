/**
 * TEMPORARY CLEANUP FUNCTIONS
 * Delete after running to remove deprecated tables from Convex
 */

import { internalMutation, internalQuery } from './_generated/server'

/**
 * Check how much data is in deprecated tables
 */
export const checkDeprecatedTables = internalQuery({
  args: {},
  handler: async (ctx) => {
    const caregiverProfiles = await ctx.db.query('caregiverProfiles').collect()
    const subscriptions = await ctx.db.query('subscriptions').collect()
    const conversationState = await ctx.db.query('conversationState').collect()

    // Check other potentially unused tables
    const caregivers = await ctx.db.query('caregivers').collect()
    const adminUsers = await ctx.db.query('adminUsers').collect()
    const conversationFeedback = await ctx.db.query('conversationFeedback').collect()
    const newsletterSubscribers = await ctx.db.query('newsletterSubscribers').collect()

    return {
      deprecated: {
        caregiverProfiles: caregiverProfiles.length,
        subscriptions: subscriptions.length,
        conversationState: conversationState.length,
      },
      old: {
        caregivers: caregivers.length,
        adminUsers: adminUsers.length,
        conversationFeedback: conversationFeedback.length,
        newsletterSubscribers: newsletterSubscribers.length,
      }
    }
  }
})

/**
 * Delete all data from deprecated tables (CAUTION: cannot be undone)
 */
export const deleteDeprecatedTables = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete caregiverProfiles
    const profiles = await ctx.db.query('caregiverProfiles').collect()
    for (const profile of profiles) {
      await ctx.db.delete(profile._id)
    }

    // Delete subscriptions
    const subs = await ctx.db.query('subscriptions').collect()
    for (const sub of subs) {
      await ctx.db.delete(sub._id)
    }

    // Delete conversationState
    const states = await ctx.db.query('conversationState').collect()
    for (const state of states) {
      await ctx.db.delete(state._id)
    }

    return {
      deleted: {
        caregiverProfiles: profiles.length,
        subscriptions: subs.length,
        conversationState: states.length,
      }
    }
  }
})

/**
 * Delete old unused tables
 */
export const deleteOldTables = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Delete caregivers
    const caregivers = await ctx.db.query('caregivers').collect()
    for (const c of caregivers) {
      await ctx.db.delete(c._id)
    }

    // Delete adminUsers
    const adminUsers = await ctx.db.query('adminUsers').collect()
    for (const a of adminUsers) {
      await ctx.db.delete(a._id)
    }

    // Delete conversationFeedback
    const feedback = await ctx.db.query('conversationFeedback').collect()
    for (const f of feedback) {
      await ctx.db.delete(f._id)
    }

    // Delete newsletterSubscribers (migrated to emailContacts)
    const subscribers = await ctx.db.query('newsletterSubscribers').collect()
    for (const s of subscribers) {
      await ctx.db.delete(s._id)
    }

    return {
      deleted: {
        caregivers: caregivers.length,
        adminUsers: adminUsers.length,
        conversationFeedback: feedback.length,
        newsletterSubscribers: subscribers.length,
      }
    }
  }
})
