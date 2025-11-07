/**
 * Feedback System (Poke-inspired Implicit Feedback)
 *
 * Tracks user engagement signals passively to build training data
 * WITHOUT asking users explicit "was this helpful?" questions
 */

import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'

/**
 * Record implicit feedback signal
 * Called automatically when we detect engagement patterns
 */
export const recordImplicitFeedback = internalMutation({
  args: {
    userId: v.id('users'),
    conversationId: v.optional(v.id('conversations')),
    signal: v.string(),
    value: v.number(),
    context: v.object({
      agentResponse: v.optional(v.string()),
      userMessage: v.optional(v.string()),
      toolUsed: v.optional(v.string()),
      timeSincePrevious: v.optional(v.number()),
      sessionLength: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('feedback', {
      userId: args.userId,
      conversationId: args.conversationId,
      signal: args.signal,
      value: args.value,
      context: args.context,
      timestamp: Date.now(),
    })
  },
})

/**
 * Record multiple implicit feedback signals in batch
 * Avoids dangling promise warnings from multiple runMutation calls
 */
export const recordImplicitFeedbackBatch = internalMutation({
  args: {
    userId: v.id('users'),
    conversationId: v.optional(v.id('conversations')),
    signals: v.array(
      v.object({
        signal: v.string(),
        value: v.number(),
      })
    ),
    context: v.object({
      agentResponse: v.optional(v.string()),
      userMessage: v.optional(v.string()),
      toolUsed: v.optional(v.string()),
      timeSincePrevious: v.optional(v.number()),
      sessionLength: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now()

    // Insert all signals in parallel
    await Promise.all(
      args.signals.map(({ signal, value }) =>
        ctx.db.insert('feedback', {
          userId: args.userId,
          conversationId: args.conversationId,
          signal,
          value,
          context: args.context,
          timestamp,
        })
      )
    )
  },
})

/**
 * Mark last agent message as helpful based on positive signal
 * Used when we detect gratitude, follow-up questions, or other positive indicators
 */
export const markLastInteractionHelpful = internalMutation({
  args: {
    userId: v.id('users'),
    signal: v.string(), // "gratitude" | "follow_up" | "tool_success"
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Find last agent message
    const lastAgentMessage = await ctx.db
      .query('conversations')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .order('desc')
      .filter(q => q.eq(q.field('role'), 'assistant'))
      .first()

    if (!lastAgentMessage) return

    await ctx.db.insert('feedback', {
      userId: args.userId,
      conversationId: lastAgentMessage._id,
      signal: args.signal,
      value: 1.0, // Positive signal
      context: {
        agentResponse: lastAgentMessage.text,
        userMessage: args.userMessage,
        toolUsed: lastAgentMessage.agentName,
        sessionLength: await getSessionLength(ctx, args.userId),
      },
      timestamp: Date.now(),
    })
  },
})

/**
 * Mark last agent message as unhelpful based on negative signal
 * Used when we detect frustration, re-asking same question, or confusion
 */
export const markLastInteractionUnhelpful = internalMutation({
  args: {
    userId: v.id('users'),
    signal: v.string(), // "frustration" | "re_ask" | "confusion"
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    // Find last agent message
    const lastAgentMessage = await ctx.db
      .query('conversations')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .order('desc')
      .filter(q => q.eq(q.field('role'), 'assistant'))
      .first()

    if (!lastAgentMessage) return

    await ctx.db.insert('feedback', {
      userId: args.userId,
      conversationId: lastAgentMessage._id,
      signal: args.signal,
      value: 0.0, // Negative signal
      context: {
        agentResponse: lastAgentMessage.text,
        userMessage: args.userMessage,
        toolUsed: lastAgentMessage.agentName,
        sessionLength: await getSessionLength(ctx, args.userId),
      },
      timestamp: Date.now(),
    })
  },
})

/**
 * Export training data for DSPy or fine-tuning
 * Returns high-quality examples with feedback scores
 */
export const exportTrainingData = query({
  args: {
    minScore: v.optional(v.number()), // Minimum feedback score (default: 0.8)
    limit: v.optional(v.number()), // Max examples (default: 1000)
  },
  handler: async (ctx, args) => {
    const minScore = args.minScore ?? 0.8
    const limit = args.limit ?? 1000

    const feedback = await ctx.db
      .query('feedback')
      .withIndex('by_value')
      .filter(q => q.gte(q.field('value'), minScore))
      .order('desc')
      .take(limit)

    return feedback.map(f => ({
      // OpenAI fine-tuning format
      messages: [
        { role: 'user', content: f.context.userMessage || '' },
        { role: 'assistant', content: f.context.agentResponse || '' },
      ],

      // DSPy format
      question: f.context.userMessage,
      answer: f.context.agentResponse,

      // Metadata
      quality_score: f.value,
      signal: f.signal,
      tool_used: f.context.toolUsed,
      timestamp: f.timestamp,
    }))
  },
})

/**
 * Get feedback stats for analytics dashboard
 */
export const getFeedbackStats = query({
  args: {
    userId: v.optional(v.id('users')),
    days: v.optional(v.number()), // Last N days (default: 7)
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

    let allFeedback

    if (args.userId !== undefined) {
      allFeedback = await ctx.db
        .query('feedback')
        .withIndex('by_user', q => q.eq('userId', args.userId!))
        .filter(q => q.gte(q.field('timestamp'), cutoff))
        .collect()
    } else {
      allFeedback = await ctx.db
        .query('feedback')
        .withIndex('by_timestamp')
        .filter(q => q.gte(q.field('timestamp'), cutoff))
        .collect()
    }

    // Aggregate by signal type
    const bySignal: Record<string, number> = {}
    allFeedback.forEach(f => {
      bySignal[f.signal] = (bySignal[f.signal] || 0) + 1
    })

    // Calculate average helpfulness
    const avgScore = allFeedback.reduce((sum, f) => sum + f.value, 0) / allFeedback.length || 0

    // Count positive vs negative
    const positive = allFeedback.filter(f => f.value >= 0.5).length
    const negative = allFeedback.filter(f => f.value < 0.5).length

    return {
      total: allFeedback.length,
      averageScore: avgScore,
      positive,
      negative,
      bySignal,
      trainingExamples: allFeedback.filter(f => f.value >= 0.8).length,
    }
  },
})

/**
 * Helper: Get session length (message count in current session)
 *
 * Note: Limits query to first 100 messages to prevent unbounded collect().
 * Session length is approximate when user has >100 total messages.
 * For accurate session tracking, consider time-based index filtering.
 */
async function getSessionLength(ctx: any, userId: Id<'users'>): Promise<number> {
  // Limit messages query to prevent unbounded collect()
  // Takes first 100 messages (most recent if ordered by creation time)
  const messages = await ctx.db
    .query('conversations')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .take(100)

  // Simple heuristic: count messages in last 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  return messages.filter((m: any) => m._creationTime > oneDayAgo).length
}
