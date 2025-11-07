/**
 * Analytics Functions
 *
 * Queries for charts and metrics in the admin dashboard analytics page
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get burnout distribution histogram
 * Returns user counts grouped by burnout score buckets (0-9, 10-19, ..., 90-100)
 */
export const getBurnoutDistribution = query({
  args: {},
  handler: async ctx => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_burnout')
      .collect()

    // Group by burnout score buckets (0-9, 10-19, ..., 90-100)
    const distribution = Array(10).fill(0)
    users.forEach(u => {
      if (u.burnoutScore !== undefined) {
        const bucket = Math.min(9, Math.floor((u.burnoutScore as number) / 10))
        distribution[bucket]++
      }
    })

    return distribution.map((count, i) => ({
      range: `${i * 10}-${i * 10 + 9}`,
      count,
    }))
  },
})

/**
 * Get user journey funnel data
 * Shows user distribution across journey phases
 */
export const getUserJourneyFunnel = query({
  args: {},
  handler: async ctx => {
    const profiles = await ctx.db
      .query('users')
      .withIndex('by_journey')
      .collect()

    // Count users by journey phase
    const phases = ['onboarding', 'active', 'maintenance', 'crisis', 'churned']
    const funnel = phases.map(phase => ({
      phase,
      count: profiles.filter(p => (p as any).journeyPhase === phase).length,
    }))

    return funnel
  },
})

/**
 * Get daily SMS volume trends (last 30 days)
 */
export const getDailyMetrics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000

    const conversations = await ctx.db
      .query('conversations')
      .filter(q => q.gte(q.field('timestamp'), startDate))
      .collect()

    // Group by day
    const dailyData: Record<string, { sent: number; received: number }> = {}

    conversations.forEach(c => {
      const date = new Date(c.timestamp).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { sent: 0, received: 0 }
      }

      if (c.role === 'assistant') {
        dailyData[date].sent++
      } else if (c.role === 'user') {
        dailyData[date].received++
      }
    })

    // Convert to array sorted by date
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        sent: data.sent,
        received: data.received,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
})

/**
 * Get agent performance metrics
 * Shows average latency and call counts by agent type
 */
export const getAgentPerformance = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 7
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000

    const conversations = await ctx.db
      .query('conversations')
      .filter(q =>
        q.and(q.gte(q.field('timestamp'), startDate), q.neq(q.field('agentName'), undefined))
      )
      .collect()

    // Group by agent
    const agentStats: Record<string, { latencies: number[]; calls: number }> = {}

    conversations.forEach(c => {
      const agent = c.agentName || 'unknown'
      if (!agentStats[agent]) {
        agentStats[agent] = { latencies: [], calls: 0 }
      }

      agentStats[agent].calls++
      if (c.latency !== undefined) {
        agentStats[agent].latencies.push(c.latency)
      }
    })

    // Calculate averages
    return Object.entries(agentStats).map(([agent, stats]) => ({
      agent,
      calls: stats.calls,
      avgLatency:
        stats.latencies.length > 0
          ? Math.round(stats.latencies.reduce((sum, l) => sum + l, 0) / stats.latencies.length)
          : 0,
    }))
  },
})

/**
 * Summarization performance metrics grouped by summary version
 */
export const getSummaryPerformance = query({
  args: {},
  handler: async ctx => {
    // Read summary usage from denormalized users table
    const users = await ctx.db
      .query('users')
      .withIndex('by_created')
      .take(2000)

    type AggregatedStats = {
      count: number
      usageCount: number
      totalCost: number
      totalTokens: number
    }

    const stats: Record<string, AggregatedStats> = {}
    let totalCost = 0
    let totalTokens = 0
    let totalUsageCount = 0

    users.forEach(state => {
      const hasSummary =
        typeof (state as any).historicalSummary === 'string' && (state as any).historicalSummary.length > 0
      const version = (state as any).historicalSummaryVersion || 'unversioned'
      const usage = (state as any).historicalSummaryTokenUsage

      if (!hasSummary && !usage) {
        return
      }

      if (!stats[version]) {
        stats[version] = { count: 0, usageCount: 0, totalCost: 0, totalTokens: 0 }
      }

      stats[version].count += 1

      if (usage) {
        stats[version].usageCount += 1
        stats[version].totalCost += usage.costUsd
        stats[version].totalTokens += usage.totalTokens
        totalCost += usage.costUsd
        totalTokens += usage.totalTokens
        totalUsageCount += 1
      }
    })

    const versions = Object.entries(stats)
      .map(([version, value]) => ({
        version,
        count: value.count,
        avgCostUsd:
          value.usageCount > 0 ? Number((value.totalCost / value.usageCount).toFixed(4)) : 0,
        avgTokens: value.usageCount > 0 ? Math.round(value.totalTokens / value.usageCount) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    const totalSummaries = versions.reduce((sum, entry) => sum + entry.count, 0)

    return {
      versions,
      totals: {
        distinctVersions: versions.length,
        totalSummaries,
        totalCostUsd: Number(totalCost.toFixed(4)),
        avgCostUsd: totalUsageCount > 0 ? Number((totalCost / totalUsageCount).toFixed(4)) : 0,
        avgTokens: totalUsageCount > 0 ? Math.round(totalTokens / totalUsageCount) : 0,
      },
    }
  },
})

/**
 * Get quality metrics (evaluation scores by dimension)
 * Returns average ratings and week-over-week changes
 */
export const getQualityMetrics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000

    const feedback = await ctx.db
      .query('conversationFeedback')
      .withIndex('by_timestamp', q => q.gte('timestamp', startDate))
      .collect()

    // Calculate average ratings by dimension
    const dimensions = ['empathy', 'clarity', 'trauma_informed', 'user_satisfaction']
    const avgRatings = dimensions.map(dim => {
      const ratings = feedback.filter(f => f.dimension === dim)
      const avg =
        ratings.length > 0 ? ratings.reduce((sum, f) => sum + f.rating, 0) / ratings.length : 0
      return {
        dimension: dim,
        avgRating: Math.round(avg * 10) / 10,
        count: ratings.length,
      }
    })

    // Calculate week-over-week change
    const lastWeekStart = Date.now() - 7 * 24 * 60 * 60 * 1000
    const prevWeekStart = Date.now() - 14 * 24 * 60 * 60 * 1000

    const lastWeekRatings = feedback.filter(f => f.timestamp >= lastWeekStart)
    const prevWeekRatings = feedback.filter(
      f => f.timestamp >= prevWeekStart && f.timestamp < lastWeekStart
    )

    const changes = dimensions.map(dim => {
      const lastWeekDim = lastWeekRatings.filter(f => f.dimension === dim)
      const prevWeekDim = prevWeekRatings.filter(f => f.dimension === dim)

      const lastWeekAvg =
        lastWeekDim.length > 0
          ? lastWeekDim.reduce((sum, f) => sum + f.rating, 0) / lastWeekDim.length
          : 0

      const prevWeekAvg =
        prevWeekDim.length > 0
          ? prevWeekDim.reduce((sum, f) => sum + f.rating, 0) / prevWeekDim.length
          : 0

      return {
        dimension: dim,
        change: Math.round((lastWeekAvg - prevWeekAvg) * 10) / 10,
      }
    })

    return { avgRatings, changes }
  },
})

/**
 * Get recent feedback (last N user ratings)
 */
export const getRecentFeedback = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10

    const feedback = await ctx.db
      .query('conversationFeedback')
      .withIndex('by_timestamp')
      .order('desc')
      .take(limit)

    // Join with users table to get user names
    const enrichedFeedback = await Promise.all(
      feedback.map(async f => {
        const user = await ctx.db.get(f.userId)
        return {
          _id: f._id,
          rating: f.rating,
          dimension: f.dimension,
          feedbackText: f.feedbackText,
          source: f.source,
          timestamp: f.timestamp,
          userName: (user as any)?.firstName || 'Unknown',
          timeAgo: getRelativeTime(f.timestamp),
        }
      })
    )

    return enrichedFeedback
  },
})

/**
 * Get quality score trends over time (daily averages for last 30 days)
 */
export const getQualityTrends = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000

    const feedback = await ctx.db
      .query('conversationFeedback')
      .withIndex('by_timestamp', q => q.gte('timestamp', startDate))
      .collect()

    // Group by date and dimension
    const dailyData: Record<string, Record<string, number[]>> = {}

    feedback.forEach(f => {
      const date = new Date(f.timestamp).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = {}
      }
      if (!dailyData[date][f.dimension]) {
        dailyData[date][f.dimension] = []
      }
      dailyData[date][f.dimension].push(f.rating)
    })

    // Calculate daily averages
    const trends = Object.entries(dailyData)
      .map(([date, dimensions]) => {
        const avgByDimension: Record<string, number> = {}
        Object.entries(dimensions).forEach(([dim, ratings]) => {
          avgByDimension[dim] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        })
        return { date, ...avgByDimension }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return trends
  },
})

// Helper function
function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
