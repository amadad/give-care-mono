/**
 * Analytics Functions
 *
 * Queries for charts and metrics in the admin dashboard analytics page
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'
import { ensureAdmin } from '../lib/auth'
import * as Analytics from '../model/analytics'

/**
 * Get burnout distribution histogram
 * Returns user counts grouped by burnout score buckets (0-9, 10-19, ..., 90-100)
 */
export const getBurnoutDistribution = query({
  args: {},
  handler: async ctx => {
    await ensureAdmin(ctx)
    return Analytics.getBurnoutDistribution(ctx)
  },
})

/**
 * Get user journey funnel data
 * Shows user distribution across journey phases
 */
export const getUserJourneyFunnel = query({
  args: {},
  handler: async ctx => {
    await ensureAdmin(ctx)
    return Analytics.getUserJourneyFunnel(ctx)
  },
})

/**
 * Get daily SMS volume trends (last 30 days)
 */
export const getDailyMetrics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    return Analytics.getDailyMetrics(ctx, args.days || 30)
  },
})

/**
 * Get agent performance metrics
 * Shows average latency and call counts by agent type
 */
export const getAgentPerformance = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    return Analytics.getAgentPerformance(ctx, args.days || 7)
  },
})

/**
 * Summarization performance metrics grouped by summary version
 */
export const getSummaryPerformance = query({
  args: {},
  handler: async ctx => {
    await ensureAdmin(ctx)
    return Analytics.getSummaryPerformance(ctx)
  },
})

/**
 * Get quality metrics (evaluation scores by dimension)
 * Returns average ratings and week-over-week changes
 */
export const getQualityMetrics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    return Analytics.getQualityMetrics(ctx, args.days || 30)
  },
})

/**
 * Get recent feedback (last N user ratings)
 */
export const getRecentFeedback = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    return Analytics.getRecentFeedback(ctx, args.limit || 10)
  },
})

/**
 * Get quality score trends over time (daily averages for last 30 days)
 */
export const getQualityTrends = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx)
    return Analytics.getQualityTrends(ctx, args.days || 30)
  },
})

// Helper function
// helper moved to model/analytics
