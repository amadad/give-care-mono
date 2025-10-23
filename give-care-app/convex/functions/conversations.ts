/**
 * Conversation logging functions
 * Logs SMS/RCS conversation history to Convex
 * Used for dashboard and analytics
 */

import { internalMutation, query } from '../_generated/server'
import { v } from 'convex/values'

// MUTATIONS

export const logMessage = internalMutation({
  args: {
    userId: v.id('users'),
    role: v.string(), // user | assistant | system
    text: v.string(),
    mode: v.string(), // sms | rcs | voice | web
    messageSid: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    toolCalls: v.optional(
      v.array(
        v.object({
          name: v.string(),
          args: v.any(),
        })
      )
    ),
    latency: v.optional(v.number()),
    serviceTier: v.optional(v.string()),
    tokenUsage: v.optional(
      v.object({
        input: v.number(),
        output: v.number(),
        total: v.number(),
      })
    ),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('conversations', args)
  },
})

/**
 * Batch insert multiple conversation messages at once
 * More efficient than calling logMessage multiple times
 */
export const logMessages = internalMutation({
  args: {
    messages: v.array(
      v.object({
        userId: v.id('users'),
        role: v.string(),
        text: v.string(),
        mode: v.string(),
        messageSid: v.optional(v.string()),
        sessionId: v.optional(v.string()),
        agentName: v.optional(v.string()),
        toolCalls: v.optional(
          v.array(
            v.object({
              name: v.string(),
              args: v.any(),
            })
          )
        ),
        latency: v.optional(v.number()),
        serviceTier: v.optional(v.string()),
        tokenUsage: v.optional(
          v.object({
            input: v.number(),
            output: v.number(),
            total: v.number(),
          })
        ),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, { messages }) => {
    // Batch insert all messages in parallel
    await Promise.all(messages.map(msg => ctx.db.insert('conversations', msg)))
  },
})

// QUERIES

export const getRecentConversations = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50

    return await ctx.db
      .query('conversations')
      .withIndex('by_user_time', (q: any) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit)
  },
})

export const getConversationMetrics = query({
  args: {
    userId: v.id('users'),
    since: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    const since = args.since || Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days

    const messages = await ctx.db
      .query('conversations')
      .withIndex('by_user_time', (q: any) => q.eq('userId', args.userId))
      .filter(q => q.gte(q.field('timestamp'), since))
      .collect()

    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    const totalLatency = assistantMessages.reduce((sum, m) => sum + (m.latency || 0), 0)
    const avgLatency = assistantMessages.length > 0 ? totalLatency / assistantMessages.length : 0

    const totalTokens = assistantMessages.reduce((sum, m) => sum + (m.tokenUsage?.total || 0), 0)
    const avgTokens = assistantMessages.length > 0 ? totalTokens / assistantMessages.length : 0

    // Agent breakdown
    const agentCounts = assistantMessages.reduce(
      (acc, m) => {
        const agent = m.agentName || 'unknown'
        acc[agent] = (acc[agent] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Service tier breakdown
    const tierCounts = assistantMessages.reduce(
      (acc, m) => {
        const tier = m.serviceTier || 'unknown'
        acc[tier] = (acc[tier] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Tool usage stats
    const toolUsage = assistantMessages.reduce(
      (acc, m) => {
        if (m.toolCalls && m.toolCalls.length > 0) {
          m.toolCalls.forEach(tool => {
            acc[tool.name] = (acc[tool.name] || 0) + 1
          })
        }
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      avgLatency: Math.round(avgLatency),
      avgTokens: Math.round(avgTokens),
      agentBreakdown: agentCounts,
      serviceTierBreakdown: tierCounts,
      toolUsage,
      since,
    }
  },
})

export const getServiceTierMetrics = query({
  args: {
    since: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    const since = args.since || Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days default

    const messages = await ctx.db
      .query('conversations')
      .filter(q => q.and(q.gte(q.field('timestamp'), since), q.eq(q.field('role'), 'assistant')))
      .collect()

    // Group by service tier
    const tierMetrics = messages.reduce(
      (acc, m) => {
        const tier = m.serviceTier || 'unknown'
        if (!acc[tier]) {
          acc[tier] = {
            count: 0,
            totalLatency: 0,
            totalTokens: 0,
            avgLatency: 0,
            avgTokens: 0,
          }
        }
        acc[tier].count++
        acc[tier].totalLatency += m.latency || 0
        acc[tier].totalTokens += m.tokenUsage?.total || 0
        return acc
      },
      {} as Record<string, any>
    )

    // Calculate averages
    Object.keys(tierMetrics).forEach(tier => {
      const stats = tierMetrics[tier]
      stats.avgLatency = stats.count > 0 ? Math.round(stats.totalLatency / stats.count) : 0
      stats.avgTokens = stats.count > 0 ? Math.round(stats.totalTokens / stats.count) : 0
    })

    return {
      byTier: tierMetrics,
      totalMessages: messages.length,
      since,
    }
  },
})
