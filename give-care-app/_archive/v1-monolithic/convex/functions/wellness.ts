/**
 * Wellness tracking functions
 * Query and mutate wellness_scores table
 * Implements burnout score trends and pressure zone tracking
 */

import { query, internalMutation } from '../_generated/server'
import { v } from 'convex/values'
import { verifyUserOwnership } from '../lib/auth'
import * as Wellness from '../model/wellness'
// Denormalized: Update users table directly (no caregiverProfiles helper)

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
// Ownership checks moved to shared helper: verifyUserOwnership

// QUERIES

export const getLatestScore = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId)
    return Wellness.latestScore(ctx, args.userId)
  },
})

export const getScoreHistory = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId)
    return Wellness.scoreHistory(ctx, args.userId, args.limit || 30)
  },
})

export const trend = query({
  args: {
    userId: v.id('users'),
    windowDays: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId)
    return Wellness.trend(ctx, args.userId, args.windowDays)
  },
})

export const getPressureZoneTrends = query({
  args: {
    userId: v.id('users'),
    windowDays: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyUserOwnership(ctx, args.userId)
    return Wellness.pressureZoneTrends(ctx, args.userId, args.windowDays)
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
    return Wellness.saveScore(ctx, args)
  },
})
