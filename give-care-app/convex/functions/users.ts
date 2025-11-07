/**
 * User management functions
 * All caregiver, subscription, and conversation fields now live on users table.
 */

import { mutation, internalMutation, internalQuery } from '../_generated/server'
import type { MutationCtx } from '../_generated/server'
import { v } from 'convex/values'

const filterUndefined = (updates: Record<string, unknown>) => {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined)
  return Object.fromEntries(entries)
}

const patchUser = async (ctx: MutationCtx, userId: any, updates: Record<string, unknown>) => {
  const clean = filterUndefined(updates)
  if (Object.keys(clean).length === 0) return
  clean.updatedAt = Date.now()
  await ctx.db.patch(userId, clean)
}

const getOrCreateUserByPhone = async (ctx: MutationCtx, phoneNumber: string) => {
  const existing = await ctx.db
    .query('users')
    .withIndex('by_phone', (q: any) => q.eq('phoneNumber', phoneNumber))
    .unique()

  if (existing) return existing

  const now = Date.now()
  const userId = await ctx.db.insert('users', {
    phoneNumber,
    createdAt: now,
    updatedAt: now,
    subscriptionStatus: 'incomplete',
  })

  return (await ctx.db.get(userId))!
}

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
    return await ctx.db.get(args.userId)
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
    const user = await getOrCreateUserByPhone(ctx, args.phoneNumber)

    if (args.rcsCapable) {
      await patchUser(ctx, user._id, { rcsCapable: args.rcsCapable })
    }

    return user._id
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

    await patchUser(ctx, userId, cleanUpdates)

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
    await patchUser(ctx, args.userId, {
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

    await patchUser(ctx, userId, {
      assessmentInProgress: updates.assessmentInProgress,
      assessmentType: updates.assessmentType,
      assessmentCurrentQuestion: updates.assessmentCurrentQuestion,
    })
  },
})

export const updateLastContact = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await patchUser(ctx, args.userId, {
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
    await patchUser(ctx, args.userId, {
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
    const userUpdates: Record<string, any> = {}
    if (updates.firstName !== undefined) userUpdates.firstName = updates.firstName
    if (updates.relationship !== undefined) userUpdates.relationship = updates.relationship
    if (updates.careRecipientName !== undefined)
      userUpdates.careRecipientName = updates.careRecipientName
    if (updates.zipCode !== undefined) userUpdates.zipCode = updates.zipCode
    if (updates.journeyPhase !== undefined) userUpdates.journeyPhase = updates.journeyPhase
    if (updates.onboardingAttempts !== undefined)
      userUpdates.onboardingAttempts = updates.onboardingAttempts
    if (updates.onboardingCooldownUntil !== undefined) {
      userUpdates.onboardingCooldownUntil = updates.onboardingCooldownUntil
        ? Date.parse(updates.onboardingCooldownUntil)
        : undefined
    }
    if (updates.assessmentInProgress !== undefined)
      userUpdates.assessmentInProgress = updates.assessmentInProgress
    if (updates.assessmentType !== undefined) userUpdates.assessmentType = updates.assessmentType
    if (updates.assessmentCurrentQuestion !== undefined)
      userUpdates.assessmentCurrentQuestion = updates.assessmentCurrentQuestion
    if (updates.assessmentSessionId !== undefined)
      userUpdates.assessmentSessionId = updates.assessmentSessionId
    if (updates.burnoutScore !== undefined) userUpdates.burnoutScore = updates.burnoutScore
    if (updates.burnoutBand !== undefined) userUpdates.burnoutBand = updates.burnoutBand
    if (updates.burnoutConfidence !== undefined)
      userUpdates.burnoutConfidence = updates.burnoutConfidence
    if (updates.pressureZones !== undefined) userUpdates.pressureZones = updates.pressureZones
    if (updates.pressureZoneScores !== undefined)
      userUpdates.pressureZoneScores = updates.pressureZoneScores

    await patchUser(ctx, userId, userUpdates)

    return { success: true }
  },
})

// PUBLIC MUTATIONS (for external use)

export const getOrCreateByPhone = internalMutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    return await getOrCreateUserByPhone(ctx, args.phoneNumber)
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

    await patchUser(ctx, args.userId, cleanUpdates)

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

    await patchUser(ctx, userId, cleanUpdates)

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

    // Use composite index on users + database-level filtering
    const users = await ctx.db
      .query('users')
      .withIndex('by_band_journey', (q: any) =>
        q.eq('burnoutBand', 'crisis').eq('journeyPhase', 'active')
      )
      .filter(q =>
        q.and(
          q.neq(q.field('lastCrisisEventAt'), undefined),
          q.gt(q.field('lastCrisisEventAt'), sevenDaysAgo),
          q.or(
            q.eq(q.field('lastContactAt'), undefined),
            q.lt(q.field('lastContactAt'), twoDaysAgo)
          )
        )
      )
      .collect()

    return users
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

    const users = await ctx.db
      .query('users')
      .withIndex('by_band_journey', (q: any) =>
        q.eq('burnoutBand', 'crisis').eq('journeyPhase', 'active')
      )
      .filter(q =>
        q.and(
          q.neq(q.field('lastCrisisEventAt'), undefined),
          q.lte(q.field('lastCrisisEventAt'), sevenDaysAgo),
          q.or(
            q.eq(q.field('lastProactiveMessageAt'), undefined),
            q.lt(q.field('lastProactiveMessageAt'), oneWeekAgo)
          ),
          q.or(
            q.eq(q.field('lastContactAt'), undefined),
            q.lt(q.field('lastContactAt'), threeDaysAgo)
          )
        )
      )
      .collect()

    return users
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

    const users = await ctx.db
      .query('users')
      .withIndex('by_band_journey', (q: any) =>
        q.eq('burnoutBand', 'high').eq('journeyPhase', 'active')
      )
      .filter(q =>
        q.and(
          q.or(
            q.eq(q.field('lastProactiveMessageAt'), undefined),
            q.lt(q.field('lastProactiveMessageAt'), threeDaysAgo)
          ),
          q.or(
            q.eq(q.field('lastContactAt'), undefined),
            q.lt(q.field('lastContactAt'), twoDaysAgo)
          )
        )
      )
      .collect()

    return users
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

    const users = await ctx.db
      .query('users')
      .withIndex('by_band_journey', (q: any) =>
        q.eq('burnoutBand', 'moderate').eq('journeyPhase', 'active')
      )
      .filter(q =>
        q.and(
          q.or(
            q.eq(q.field('lastProactiveMessageAt'), undefined),
            q.lt(q.field('lastProactiveMessageAt'), oneWeekAgo)
          ),
          q.or(
            q.eq(q.field('lastContactAt'), undefined),
            q.lt(q.field('lastContactAt'), threeDaysAgo)
          )
        )
      )
      .collect()

    return users
  },
})

/**
 * Get dormant users at specific milestones (day 7, 14, 30, 31+)
 */
export const getDormantAtMilestones = internalQuery({
  handler: async ctx => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * DAY_MS

    const users = await ctx.db
      .query('users')
      .withIndex('by_last_contact')
      .filter(q =>
        q.and(
          q.lte(q.field('lastContactAt'), sevenDaysAgo),
          q.eq(q.field('journeyPhase'), 'active'),
          q.or(
            q.eq(q.field('reactivationMessageCount'), undefined),
            q.lt(q.field('reactivationMessageCount'), 3)
          )
        )
      )
      .collect()

    return users
  },
})
