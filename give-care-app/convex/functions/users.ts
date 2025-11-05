/**
 * User management functions
 * CRUD operations for users table (normalized schema)
 * Uses helpers from lib/userHelpers.ts for multi-table joins
 */

import { mutation, query, internalMutation, internalQuery } from '../_generated/server'
import { v } from 'convex/values'
import {
  getEnrichedUser,
  getEnrichedUserByPhone,
  getOrCreateEnrichedUserByPhone,
  updateCaregiverProfile,
  updateSubscription,
  updateConversationState,
} from '../lib/userHelpers'

// QUERIES

export const getUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

export const getEnrichedUserById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await getEnrichedUser(ctx, args.userId)
  },
})

export const getUserByPhone = internalQuery({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_phone', (q: any) => q.eq('phoneNumber', args.phoneNumber))
      .unique()
  },
})

// MUTATIONS

export const createUser = internalMutation({
  args: {
    phoneNumber: v.string(),
    rcsCapable: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Create user and all related tables using helper
    const enrichedUser = await getOrCreateEnrichedUserByPhone(ctx, args.phoneNumber)

    // Update RCS capability if provided
    if (args.rcsCapable) {
      await updateCaregiverProfile(ctx, enrichedUser._id, {
        rcsCapable: args.rcsCapable,
      })
    }

    return enrichedUser._id
  },
})

export const updateProfile = internalMutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    careRecipientName: v.optional(v.string()),
    zipCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {}
    if (updates.firstName !== undefined) cleanUpdates.firstName = updates.firstName
    if (updates.relationship !== undefined) cleanUpdates.relationship = updates.relationship
    if (updates.careRecipientName !== undefined)
      cleanUpdates.careRecipientName = updates.careRecipientName
    if (updates.zipCode !== undefined) cleanUpdates.zipCode = updates.zipCode

    await updateCaregiverProfile(ctx, userId, cleanUpdates)

    return { success: true }
  },
})

export const updateWellness = internalMutation({
  args: {
    userId: v.id('users'),
    burnoutScore: v.number(),
    pressureZones: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await updateCaregiverProfile(ctx, args.userId, {
      burnoutScore: args.burnoutScore,
      pressureZones: args.pressureZones,
    })
  },
})

export const updateAssessmentState = internalMutation({
  args: {
    userId: v.id('users'),
    assessmentInProgress: v.boolean(),
    assessmentType: v.optional(v.string()),
    assessmentCurrentQuestion: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args

    await updateCaregiverProfile(ctx, userId, {
      assessmentInProgress: updates.assessmentInProgress,
      assessmentType: updates.assessmentType,
      assessmentCurrentQuestion: updates.assessmentCurrentQuestion,
    })
  },
})

export const updateLastContact = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await updateCaregiverProfile(ctx, args.userId, {
      lastContactAt: Date.now(),
    })
  },
})

export const updateJourneyPhase = internalMutation({
  args: {
    userId: v.id('users'),
    journeyPhase: v.string(),
  },
  handler: async (ctx, args) => {
    await updateCaregiverProfile(ctx, args.userId, {
      journeyPhase: args.journeyPhase,
    })
  },
})

export const updateContextState = internalMutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    careRecipientName: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),
    onboardingAttempts: v.optional(v.any()),
    onboardingCooldownUntil: v.optional(v.string()), // FIX #4: Add cooldown field
    assessmentInProgress: v.optional(v.boolean()),
    assessmentType: v.optional(v.string()),
    assessmentCurrentQuestion: v.optional(v.number()),
    assessmentSessionId: v.optional(v.string()),
    burnoutScore: v.optional(v.number()),
    burnoutBand: v.optional(v.string()),
    burnoutConfidence: v.optional(v.number()),
    pressureZones: v.optional(v.array(v.string())),
    pressureZoneScores: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args

    // Build updates for caregiverProfiles table
    const profileUpdates: Record<string, any> = {}
    if (updates.firstName !== undefined) profileUpdates.firstName = updates.firstName
    if (updates.relationship !== undefined) profileUpdates.relationship = updates.relationship
    if (updates.careRecipientName !== undefined)
      profileUpdates.careRecipientName = updates.careRecipientName
    if (updates.zipCode !== undefined) profileUpdates.zipCode = updates.zipCode
    if (updates.journeyPhase !== undefined) profileUpdates.journeyPhase = updates.journeyPhase
    if (updates.onboardingAttempts !== undefined)
      profileUpdates.onboardingAttempts = updates.onboardingAttempts
    if (updates.onboardingCooldownUntil !== undefined) {
      profileUpdates.onboardingCooldownUntil = updates.onboardingCooldownUntil
        ? Date.parse(updates.onboardingCooldownUntil)
        : undefined
    }
    if (updates.burnoutScore !== undefined) profileUpdates.burnoutScore = updates.burnoutScore
    if (updates.burnoutBand !== undefined) profileUpdates.burnoutBand = updates.burnoutBand
    if (updates.burnoutConfidence !== undefined)
      profileUpdates.burnoutConfidence = updates.burnoutConfidence
    if (updates.pressureZones !== undefined) profileUpdates.pressureZones = updates.pressureZones
    if (updates.pressureZoneScores !== undefined)
      profileUpdates.pressureZoneScores = updates.pressureZoneScores

    // Assessment fields stay on caregiverProfiles for now
    // TODO: Move to assessmentSessions table in future refactor
    if (updates.assessmentInProgress !== undefined)
      profileUpdates.assessmentInProgress = updates.assessmentInProgress
    if (updates.assessmentType !== undefined) profileUpdates.assessmentType = updates.assessmentType
    if (updates.assessmentCurrentQuestion !== undefined)
      profileUpdates.assessmentCurrentQuestion = updates.assessmentCurrentQuestion
    if (updates.assessmentSessionId !== undefined)
      profileUpdates.assessmentSessionId = updates.assessmentSessionId

    // Update caregiverProfiles if any fields present
    if (Object.keys(profileUpdates).length > 0) {
      await updateCaregiverProfile(ctx, userId, profileUpdates)
    }

    return { success: true }
  },
})

// PUBLIC MUTATIONS (for external use)

export const getOrCreateByPhone = internalMutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    // Use helper that handles all table creation
    return await getOrCreateEnrichedUserByPhone(ctx, args.phoneNumber)
  },
})

export const patchProfile = mutation({
  args: {
    userId: v.id('users'),
    updates: v.object({
      firstName: v.optional(v.string()),
      relationship: v.optional(v.string()),
      careRecipientName: v.optional(v.string()),
      zipCode: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error('user not found')

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {}
    if (args.updates.firstName !== undefined) cleanUpdates.firstName = args.updates.firstName
    if (args.updates.relationship !== undefined)
      cleanUpdates.relationship = args.updates.relationship
    if (args.updates.careRecipientName !== undefined)
      cleanUpdates.careRecipientName = args.updates.careRecipientName
    if (args.updates.zipCode !== undefined) cleanUpdates.zipCode = args.updates.zipCode

    await updateCaregiverProfile(ctx, args.userId, cleanUpdates)

    return { success: true }
  },
})

// Generic update function for scheduling module
export const updateUser = internalMutation({
  args: {
    userId: v.id('users'),
    journeyPhase: v.optional(v.string()),
    lastProactiveMessageAt: v.optional(v.number()),
    lastCrisisEventAt: v.optional(v.number()),
    crisisFollowupCount: v.optional(v.number()),
    reactivationMessageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = {}
    if (updates.journeyPhase !== undefined) cleanUpdates.journeyPhase = updates.journeyPhase
    if (updates.lastProactiveMessageAt !== undefined)
      cleanUpdates.lastProactiveMessageAt = updates.lastProactiveMessageAt
    if (updates.lastCrisisEventAt !== undefined)
      cleanUpdates.lastCrisisEventAt = updates.lastCrisisEventAt
    if (updates.crisisFollowupCount !== undefined)
      cleanUpdates.crisisFollowupCount = updates.crisisFollowupCount
    if (updates.reactivationMessageCount !== undefined)
      cleanUpdates.reactivationMessageCount = updates.reactivationMessageCount

    await updateCaregiverProfile(ctx, userId, cleanUpdates)

    return { success: true }
  },
})

// =============================================================================
// ELIGIBILITY QUERIES FOR SCHEDULED FUNCTIONS (Task 1)
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Get crisis users eligible for DAILY check-ins (first 7 days post-crisis)
 */
export const getEligibleForCrisisDaily = internalQuery({
  handler: async ctx => {
    const now = Date.now()
    const twoDaysAgo = now - 2 * DAY_MS
    const sevenDaysAgo = now - 7 * DAY_MS

    const profiles = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'crisis'))
      .collect()

    // Filter: crisis within last 7 days, not contacted in 2+ days
    const eligibleProfiles = profiles.filter(
      profile =>
        profile.journeyPhase === 'active' &&
        profile.lastCrisisEventAt &&
        profile.lastCrisisEventAt > sevenDaysAgo &&
        (!profile.lastContactAt || profile.lastContactAt < twoDaysAgo)
    )

    // Return enriched users (filter out any nulls)
    const enrichedUsers = await Promise.all(
      eligibleProfiles.map(profile => getEnrichedUser(ctx, profile.userId))
    )
    return enrichedUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})

/**
 * Get crisis users eligible for WEEKLY check-ins (after day 7)
 */
export const getEligibleForCrisisWeekly = internalQuery({
  handler: async ctx => {
    const now = Date.now()
    const threeDaysAgo = now - 3 * DAY_MS
    const sevenDaysAgo = now - 7 * DAY_MS
    const oneWeekAgo = now - 7 * DAY_MS

    const profiles = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'crisis'))
      .collect()

    // Filter: crisis >7 days ago, not proactively messaged in 7+ days, not contacted in 3+ days
    const eligibleProfiles = profiles.filter(
      profile =>
        profile.journeyPhase === 'active' &&
        profile.lastCrisisEventAt &&
        profile.lastCrisisEventAt <= sevenDaysAgo &&
        (!profile.lastProactiveMessageAt || profile.lastProactiveMessageAt < oneWeekAgo) &&
        (!profile.lastContactAt || profile.lastContactAt < threeDaysAgo)
    )

    // Return enriched users (filter out any nulls)
    const enrichedUsers = await Promise.all(
      eligibleProfiles.map(profile => getEnrichedUser(ctx, profile.userId))
    )
    return enrichedUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})

/**
 * Get high burnout users eligible for check-ins (every 3 days)
 */
export const getEligibleForHighBurnoutCheckin = internalQuery({
  handler: async ctx => {
    const now = Date.now()
    const twoDaysAgo = now - 2 * DAY_MS
    const threeDaysAgo = now - 3 * DAY_MS

    const profiles = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'high'))
      .collect()

    // Filter: active, not proactively messaged in 3+ days, not contacted in 2+ days
    const eligibleProfiles = profiles.filter(
      profile =>
        profile.journeyPhase === 'active' &&
        (!profile.lastProactiveMessageAt || profile.lastProactiveMessageAt < threeDaysAgo) &&
        (!profile.lastContactAt || profile.lastContactAt < twoDaysAgo)
    )

    // Return enriched users (filter out any nulls)
    const enrichedUsers = await Promise.all(
      eligibleProfiles.map(profile => getEnrichedUser(ctx, profile.userId))
    )
    return enrichedUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})

/**
 * Get moderate burnout users eligible for check-ins (weekly)
 */
export const getEligibleForModerateCheckin = internalQuery({
  handler: async ctx => {
    const now = Date.now()
    const threeDaysAgo = now - 3 * DAY_MS
    const oneWeekAgo = now - 7 * DAY_MS

    const profiles = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'moderate'))
      .collect()

    // Filter: active, not proactively messaged in 7+ days, not contacted in 3+ days
    const eligibleProfiles = profiles.filter(
      profile =>
        profile.journeyPhase === 'active' &&
        (!profile.lastProactiveMessageAt || profile.lastProactiveMessageAt < oneWeekAgo) &&
        (!profile.lastContactAt || profile.lastContactAt < threeDaysAgo)
    )

    // Return enriched users (filter out any nulls)
    const enrichedUsers = await Promise.all(
      eligibleProfiles.map(profile => getEnrichedUser(ctx, profile.userId))
    )
    return enrichedUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})

/**
 * Get dormant users at specific milestones (day 7, 14, 30, 31+)
 */
export const getDormantAtMilestones = internalQuery({
  handler: async ctx => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * DAY_MS

    const profiles = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_last_contact')
      .filter(q =>
        q.and(
          q.lte(q.field('lastContactAt'), sevenDaysAgo),
          q.eq(q.field('journeyPhase'), 'active') // Only active users
        )
      )
      .collect()

    // Filter out users who already received 3 reactivation messages (in memory)
    const eligibleProfiles = profiles.filter(
      profile => (profile.reactivationMessageCount || 0) < 3
    )

    // Return enriched users (filter out any nulls)
    const enrichedUsers = await Promise.all(
      eligibleProfiles.map(profile => getEnrichedUser(ctx, profile.userId))
    )
    return enrichedUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})
