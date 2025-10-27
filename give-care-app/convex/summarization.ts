/**
 * Conversation Summarization (Task 9) - Queries & Mutations
 *
 * Implements automatic conversation summarization to:
 * - Preserve context beyond OpenAI's 30-day session limit
 * - Reduce token costs by 60-80% for long-term users
 * - Enable infinite context retention
 *
 * Architecture:
 * - Recent messages (< 7 days): Full detail preserved
 * - Historical messages (>= 7 days): Compressed to 500-token summary
 * - Critical facts: Never summarized (care recipient name, crisis history)
 *
 * Scheduled: Daily at 3am PT (11:00 UTC) for active users with >30 messages
 *
 * NOTE: Actions that use Node.js (OpenAI) are in summarizationActions.ts
 */

import { internalMutation, internalQuery, internalAction } from './_generated/server'
import type { ActionCtx, QueryCtx } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'

type ConversationMessage = {
  role: string
  content: string
  timestamp: number
}

type TokenSavingsResult = {
  fullConversationTokens: number
  withSummarizationTokens: number
  savingsPercent: number
}

type UserDoc = Doc<'users'>

/**
 * Split conversation history into recent (< 7 days) and historical (>= 7 days)
 */
export const splitMessagesByRecency = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    // Fetch all conversations for user, sorted chronologically
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user_time', q => q.eq('userId', args.userId))
      .order('asc') // Oldest first
      .collect()

    const recentMessages: Array<{ role: string; content: string; timestamp: number }> = []
    const historicalMessages: Array<{ role: string; content: string; timestamp: number }> = []

    for (const convo of conversations) {
      const message = {
        role: convo.role,
        content: convo.text,
        timestamp: convo.timestamp,
      }

      if (convo.timestamp >= sevenDaysAgo) {
        recentMessages.push(message)
      } else {
        historicalMessages.push(message)
      }
    }

    return {
      recentMessages,
      historicalMessages,
    }
  },
})

/**
 * Internal mutation to update user summary fields
 */
export const patchUserSummary = internalMutation({
  args: {
    userId: v.id('users'),
    recentMessages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    historicalSummary: v.string(),
    conversationStartDate: v.number(),
    totalInteractionCount: v.number(),
    historicalSummaryVersion: v.optional(v.string()),
    historicalSummaryTokenUsage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
        costUsd: v.number(),
        recordedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      recentMessages: args.recentMessages,
      historicalSummary: args.historicalSummary,
      conversationStartDate: args.conversationStartDate,
      totalInteractionCount: args.totalInteractionCount,
      historicalSummaryVersion: args.historicalSummaryVersion,
      historicalSummaryTokenUsage: args.historicalSummaryTokenUsage,
    })
  },
})

/**
 * Get active users for summarization
 */
export const getActiveUsers = internalQuery({
  handler: async ctx => {
    return await ctx.db
      .query('users')
      .withIndex('by_journey', q => q.eq('journeyPhase', 'active'))
      .collect()
  },
})

/**
 * Count messages for a user
 */
export const countUserMessages = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('conversations')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .collect()
    return messages.length
  },
})

/**
 * Helper: Get user by ID (for actions)
 */
export const _getUser = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx: QueryCtx, args: { userId: Id<'users'> }): Promise<UserDoc | null> => {
    const user = await ctx.db.get(args.userId)
    return (user as UserDoc | null) ?? null
  },
})

/**
 * Calculate token savings from summarization
 */
export const calculateTokenSavings = internalAction({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx: ActionCtx, args): Promise<TokenSavingsResult> => {
    const { recentMessages, historicalMessages } = (await ctx.runMutation(
      internal.summarization.splitMessagesByRecency,
      { userId: args.userId }
    )) as {
      recentMessages: ConversationMessage[]
      historicalMessages: ConversationMessage[]
    }

    const user = (await ctx.runQuery(internal.summarization._getUser, { userId: args.userId })) as
      | UserDoc
      | null

    // Rough token estimation: 1 token ≈ 4 characters
    const estimateTokens = (text: string) => Math.ceil(text.length / 4)

    // Full conversation tokens
    const allMessages: ConversationMessage[] = [...historicalMessages, ...recentMessages]
    const fullConversationTokens = allMessages.reduce<number>(
      (sum, message) => sum + estimateTokens(message.content),
      0
    )

    // With summarization: summary (max 500 tokens) + recent messages
    const summaryTokens = user?.historicalSummary ? estimateTokens(user.historicalSummary) : 0
    const recentTokens = recentMessages.reduce<number>(
      (sum, message) => sum + estimateTokens(message.content),
      0
    )
    const withSummarizationTokens = summaryTokens + recentTokens

    const savingsPercent =
      fullConversationTokens > 0
        ? ((fullConversationTokens - withSummarizationTokens) / fullConversationTokens) * 100
        : 0

    return {
      fullConversationTokens,
      withSummarizationTokens,
      savingsPercent: Math.round(savingsPercent),
    }
  },
})

/**
 * Estimate monthly cost savings at scale
 */
export const estimateMonthlyCostSavings = internalMutation({
  args: {
    userCount: v.number(),
    avgMessagesPerUser: v.number(),
  },
  handler: async (_ctx, args) => {
    // Cost assumptions (as of 2025)
    // gpt-4o-mini: $0.150 / 1M input tokens, $0.600 / 1M output tokens
    const INPUT_COST_PER_MILLION = 0.15
    const OUTPUT_COST_PER_MILLION = 0.6

    // Estimate tokens per message (avg 50 tokens)
    const tokensPerMessage = 50

    // Without summarization: Pass all messages every conversation
    // Assume 10 conversations/month per user
    const conversationsPerMonth = 10
    const tokensPerConversationFull = args.avgMessagesPerUser * tokensPerMessage
    const totalInputTokensWithoutSummarization =
      args.userCount * conversationsPerMonth * tokensPerConversationFull

    // With summarization: Pass summary (500 tokens) + recent messages (7 days ≈ 10 messages)
    const summaryTokens = 500
    const recentMessagesTokens = 10 * tokensPerMessage // ~500 tokens
    const tokensPerConversationWithSummary = summaryTokens + recentMessagesTokens
    const totalInputTokensWithSummarization =
      args.userCount * conversationsPerMonth * tokensPerConversationWithSummary

    // Calculate costs (input tokens only, output constant)
    const costWithoutSummarization =
      (totalInputTokensWithoutSummarization / 1_000_000) * INPUT_COST_PER_MILLION
    const costWithSummarization =
      (totalInputTokensWithSummarization / 1_000_000) * INPUT_COST_PER_MILLION

    // Add summarization generation cost (once per user per month, 500 output tokens)
    const summarizationGenerationCost =
      ((args.userCount * 500) / 1_000_000) * OUTPUT_COST_PER_MILLION
    const totalCostWithSummarization = costWithSummarization + summarizationGenerationCost

    return {
      costWithoutSummarization: Math.round(costWithoutSummarization * 100) / 100,
      costWithSummarization: Math.round(totalCostWithSummarization * 100) / 100,
      monthlySavings:
        Math.round((costWithoutSummarization - totalCostWithSummarization) * 100) / 100,
    }
  },
})
