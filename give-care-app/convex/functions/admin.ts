/**
 * Admin Dashboard Functions
 *
 * Queries and mutations for the admin dashboard at admin.givecare.app
 *
 * Security: Should be protected by Convex Auth (admin role required)
 */

import { query, mutation } from '../_generated/server'
import { v } from 'convex/values'
import { ensureAdmin } from '../lib/auth'
import * as AdminModel from '../model/admin'
// Denormalized: use users table directly (no enrichment helpers)

/**
 * Get system-wide metrics for dashboard home page
 */
export const getSystemMetrics = query({
  args: {},
  handler: async ctx => {
    await ensureAdmin(ctx)
    return AdminModel.getSystemMetrics(ctx)
  },
})

/**
 * Get all users with filtering, search, and pagination
 */
export const getAllUsers = query({
  args: {
    search: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),
    burnoutBand: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    return AdminModel.getAllUsers(ctx, args)
  },
})

/**
 * Get detailed info for a single user
 */
export const getUserDetails = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get recent conversations (last 10)
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user_time', q => q.eq('userId', args.userId))
      .order('desc')
      .take(10)

    // Get wellness score history (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const wellnessHistory = await ctx.db
      .query('wellnessScores')
      .withIndex('by_user_recorded', q => q.eq('userId', args.userId))
      .filter(q => q.gte(q.field('recordedAt'), thirtyDaysAgo))
      .collect()

    // Get assessment history (last 5 completed)
    const assessments = await ctx.db
      .query('assessmentSessions')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .filter(q => q.eq(q.field('completed'), true))
      .order('desc')
      .take(5)

    return {
      user,
      conversations: conversations.map(c => ({
        _id: c._id,
        role: c.role,
        text: c.text,
        timestamp: c.timestamp,
        agentName: c.agentName,
        latency: c.latency,
      })),
      wellnessHistory: wellnessHistory.map(w => ({
        score: w.overallScore,
        recordedAt: w.recordedAt,
        band: w.band,
        pressureZones: w.pressureZones,
      })),
      assessments: assessments.map(a => ({
        _id: a._id,
        type: a.type,
        overallScore: a.overallScore,
        completedAt: a.completedAt,
      })),
    }
  },
})

/**
 * Get crisis alerts (users in crisis band + pending follow-ups)
 */
export const getCrisisAlerts = query({
  args: {},
  handler: async ctx => {
    // Users in crisis band
    const crisisUsers = await ctx.db
      .query('users')
      .withIndex('by_burnout_band', q => q.eq('burnoutBand', 'crisis'))
      .collect()

    // Users pending 24hr crisis follow-up (lastCrisisEventAt within last 7 days, crisisFollowupCount < 7)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    const pendingFollowups = (await ctx.db
      .query('users')
      .withIndex('by_band_crisis', q => q.eq('burnoutBand', 'crisis'))
      .filter(q =>
        q.and(
          q.neq(q.field('lastCrisisEventAt'), undefined),
          q.gt(q.field('lastCrisisEventAt'), sevenDaysAgo),
          q.or(
            q.eq(q.field('crisisFollowupCount'), undefined),
            q.lt(q.field('crisisFollowupCount'), 7)
          )
        )
      )
      .collect()) as any[]

    // Calculate next follow-up time for each
    const pendingWithTimers = pendingFollowups.map(u => {
      const hoursSinceCrisis = (Date.now() - (u.lastCrisisEventAt || 0)) / (1000 * 60 * 60)
      const nextFollowupHours = 24 * ((u.crisisFollowupCount || 0) + 1) // 24h, 48h, 72h, etc.
      const hoursUntilNext = Math.max(0, nextFollowupHours - hoursSinceCrisis)

      return {
        _id: u._id,
        firstName: u.firstName || 'Unknown',
        phoneNumber: u.phoneNumber,
        burnoutScore: u.burnoutScore,
        lastCrisisEventAt: u.lastCrisisEventAt,
        crisisFollowupCount: u.crisisFollowupCount || 0,
        hoursUntilNextFollowup: Math.round(hoursUntilNext * 10) / 10,
      }
    })

    return {
      crisisUsers: crisisUsers.map((u: any) => ({
        _id: u._id,
        firstName: u.firstName || 'Unknown',
        phoneNumber: u.phoneNumber,
        burnoutScore: u.burnoutScore,
        pressureZones: u.pressureZones,
        lastContactAt: u.lastContactAt,
      })),
      pendingFollowups: pendingWithTimers.sort(
        (a, b) => a.hoursUntilNextFollowup - b.hoursUntilNextFollowup
      ),
    }
  },
})

/**
 * Send admin message to user (via SMS)
 *
 * NOTE: This is a placeholder. Full implementation requires:
 * 1. Twilio integration
 * 2. Admin authentication/authorization
 * 3. Audit logging
 */
export const sendAdminMessage = mutation({
  args: {
    userId: v.id('users'),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Log conversation
    await ctx.db.insert('conversations', {
      userId: args.userId,
      role: 'assistant',
      text: args.message,
      mode: 'sms',
      agentName: 'admin',
      timestamp: Date.now(),
    })

    // Update last contact directly on users
    await ctx.db.patch(args.userId, { lastContactAt: Date.now(), updatedAt: Date.now() })

    return { success: true }
  },
})

/**
 * Reset user's current assessment (clear session state)
 */
export const resetUserAssessment = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Clear assessment state
    await ctx.db.patch(args.userId, {
      assessmentInProgress: false,
      assessmentType: undefined,
      assessmentCurrentQuestion: 0,
      assessmentSessionId: undefined,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Get recent email delivery failures for monitoring
 */
export const getEmailFailures = query({
  args: {
    limit: v.optional(v.number()),
    retriedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { limit, retriedOnly }) => {
    await ensureAdmin(ctx)
    const maxLimit = Math.min(limit || 50, 200)

    // Build query based on filter
    const failures = retriedOnly !== undefined
      ? await ctx.db
          .query('emailFailures')
          .withIndex('by_retried', q => q.eq('retried', retriedOnly))
          .order('desc')
          .take(maxLimit)
      : await ctx.db
          .query('emailFailures')
          .order('desc')
          .take(maxLimit)

    return failures.map(f => ({
      _id: f._id,
      email: f.email,
      error: f.error,
      context: f.context,
      failedAt: f.failedAt,
      retried: f.retried,
    }))
  },
})

/**
 * Mark email failure as retried (after manual intervention)
 */
export const markEmailFailureRetried = mutation({
  args: {
    failureId: v.id('emailFailures'),
  },
  handler: async (ctx, { failureId }) => {
    await ensureAdmin(ctx)
    await ctx.db.patch(failureId, { retried: true })
    return { success: true }
  },
})

/**
 * Get system health metrics for /system dashboard page
 */
export const getSystemHealth = query({
  args: {},
  handler: async ctx => {
    await ensureAdmin(ctx)
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    // Placeholder data until rate limit table exists
    const maxUserUsage = 0
    const globalUsage = 0

    // Count priority tier users (users with subscriptionStatus === "active")
    const activeSubscriptions = await ctx.db
      .query('users')
      .withIndex('by_journey', q => q.eq('journeyPhase', 'active'))
      .filter(q => q.eq(q.field('subscriptionStatus'), 'active'))
      .collect()

    // OpenAI usage: Query conversations for token usage in last 24h
    const recentConvos = await ctx.db
      .query('conversations')
      .filter(q => q.gte(q.field('timestamp'), oneDayAgo))
      .collect()

    // Estimate tokens (rough approximation: 4 chars = 1 token)
    const totalChars = recentConvos.reduce((sum, c) => sum + (c.text?.length || 0), 0)
    const estimatedTokens = Math.floor(totalChars / 4)

    // Estimate cost (GPT-5 nano pricing: ~$0.50 per 1M tokens input, $1.50 per 1M tokens output)
    // Rough approximation: 60% input, 40% output
    const inputTokens = Math.floor(estimatedTokens * 0.6)
    const outputTokens = Math.floor(estimatedTokens * 0.4)
    const costToday = (inputTokens / 1000000) * 0.5 + (outputTokens / 1000000) * 1.5

    // Database performance: Calculate average query time from recent conversations
    const conversationsWithLatency = recentConvos.filter(c => c.latency !== undefined)

    // P95 latency
    const latencies = conversationsWithLatency.map(c => c.latency!).sort((a, b) => a - b)
    const p95Latency = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0

    const errors: Array<{ type: string; count: number; severity: string }> = []

    return {
      rateLimits: {
        perUser: {
          used: maxUserUsage,
          limit: 60, // Daily per-user SMS limit
          status: maxUserUsage > 50 ? 'warning' : 'ok',
        },
        global: {
          used: globalUsage,
          limit: 5000, // Daily global SMS limit
          status: globalUsage > 4000 ? 'warning' : 'ok',
        },
        priorityUsers: activeSubscriptions.length,
      },
      openai: {
        tokensToday: estimatedTokens,
        tokensLimit: 2000000, // 2M token daily budget
        costToday: Math.round(costToday * 100) / 100,
        budget: 10.0, // $10/day budget
      },
      database: {
        queryLatency: Math.round(p95Latency),
        connectionPoolActive: 0, // Convex manages this automatically
        connectionPoolMax: 0, // Not applicable for Convex
        storageUsed: 0, // Not easily queryable from Convex
        storageLimit: 10, // Placeholder
      },
      errors,
    }
  },
})
