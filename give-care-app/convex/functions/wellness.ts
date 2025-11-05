/**
 * Wellness tracking functions
 * Query and mutate wellness_scores table
 * Implements burnout score trends and pressure zone tracking
 */

import { mutation, query, internalMutation, internalQuery, QueryCtx } from '../_generated/server'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { Id } from '../_generated/dataModel'

/**
 * SECURITY HELPER: Verify userId ownership
 *
 * Ensures authenticated users can only access their own wellness data.
 * Prevents unauthorized access where User A could read User B's burnout scores.
 *
 * @param ctx - Query context with auth
 * @param requestedUserId - The userId being accessed
 * @throws Error if unauthenticated, user not found, or unauthorized
 */
async function verifyOwnership(ctx: QueryCtx, requestedUserId: Id<'users'>) {
  // 1. Check authentication
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Unauthenticated: Must be logged in to access wellness data')
  }

  // 2. Look up the requested user
  const user = await ctx.db.get(requestedUserId)
  if (!user) {
    throw new Error('User not found: User does not exist')
  }

  // 3. Verify ownership - Compare auth identity to user
  // For Convex Auth users: user._id should match identity.subject (which is the userId)
  // For users with clerkId (legacy/external auth): check that field
  const { clerkId } = user as typeof user & { clerkId?: string | null }
  const isOwner =
    user._id === identity.subject || // Direct ID match (Convex auth)
    (clerkId && clerkId === identity.subject) // Clerk ID match

  if (!isOwner) {
    throw new Error('Unauthorized: Cannot access another user\'s wellness data')
  }

  // 4. Additional check: user must have a valid auth identifier
  if (!user._id && !clerkId) {
    throw new Error('Unauthorized: User does not have valid authentication')
  }

  return user
}

// QUERIES

export const getLatestScore = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Verify ownership before accessing data
    await verifyOwnership(ctx, args.userId)

    return await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .order('desc')
      .first()
  },
})

export const getScoreHistory = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify ownership before accessing data
    await verifyOwnership(ctx, args.userId)

    const limit = args.limit || 30

    return await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit)
  },
})

export const trend = query({
  args: {
    userId: v.id('users'),
    windowDays: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify ownership before accessing data
    await verifyOwnership(ctx, args.userId)

    const cutoff = Date.now() - args.windowDays * 24 * 60 * 60 * 1000
    const points = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .filter(q => q.gte(q.field('recordedAt'), cutoff))
      .collect()

    if (!points.length) {
      return { count: 0, average: null, trend: [] }
    }

    const average = points.reduce((sum, p) => sum + p.overallScore, 0) / points.length

    const trend = points.map(p => ({
      score: p.overallScore,
      band: p.band,
      timestamp: p.recordedAt,
    }))

    return { count: points.length, average: Math.round(average * 10) / 10, trend }
  },
})

export const getPressureZoneTrends = query({
  args: {
    userId: v.id('users'),
    windowDays: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify ownership before accessing data
    await verifyOwnership(ctx, args.userId)

    const cutoff = Date.now() - args.windowDays * 24 * 60 * 60 * 1000
    const scores = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', (q: any) => q.eq('userId', args.userId))
      .filter(q => q.gte(q.field('recordedAt'), cutoff))
      .collect()

    if (!scores.length) {
      return {}
    }

    // Aggregate pressure zone scores over time
    const zoneAggregates: Record<string, { sum: number; count: number }> = {}

    for (const score of scores) {
      for (const zone of score.pressureZones) {
        if (!zoneAggregates[zone]) {
          zoneAggregates[zone] = { sum: 0, count: 0 }
        }
        const zoneScore = (score.pressureZoneScores as Record<string, number>)?.[zone] || 0
        zoneAggregates[zone].sum += zoneScore
        zoneAggregates[zone].count += 1
      }
    }

    // Calculate averages
    const zoneTrends: Record<string, number> = {}
    for (const [zone, data] of Object.entries(zoneAggregates)) {
      zoneTrends[zone] = Math.round((data.sum / data.count) * 10) / 10
    }

    return zoneTrends
  },
})

// MUTATIONS

export const saveScore = internalMutation({
  args: {
    userId: v.id('users'),
    overallScore: v.number(),
    confidence: v.optional(v.number()),
    band: v.optional(v.string()),
    pressureZones: v.array(v.string()),
    pressureZoneScores: v.any(), // Accept any object structure
    assessmentSource: v.optional(v.string()),
    assessmentType: v.optional(v.string()),
    assessmentSessionId: v.optional(v.id('assessmentSessions')),
  },
  handler: async (ctx, args) => {
    const scoreId = await ctx.db.insert('wellnessScores', {
      ...args,
      recordedAt: Date.now(),
    })

    // Update user's burnout score
    await ctx.db.patch(args.userId, {
      burnoutScore: args.overallScore,
      burnoutBand: args.band,
      burnoutConfidence: args.confidence,
      pressureZones: args.pressureZones,
      pressureZoneScores: args.pressureZoneScores,
      updatedAt: Date.now(),
    })

    // Schedule 7-day assessment reminder (Task 1: Revised cadence)
    // Changed from 14 days to 7 days (habit formation research)
    const profile = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first()

    if (profile && profile.journeyPhase === 'active') {
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      const firstName = profile.firstName || 'friend'

      await ctx.scheduler.runAfter(sevenDays, internal.functions.scheduling.sendScheduledMessage, {
        userId: args.userId,
        message: `Hi ${firstName}, ready for a quick check-in? It's been a week since your last assessment. (Reply YES when ready)`,
        type: 'assessment_reminder',
      })
    }

    return scoreId
  },
})
