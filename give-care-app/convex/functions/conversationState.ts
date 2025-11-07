import { internalQuery } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get conversationState for a user
 * Returns null if not found (new user)
 */
export const getByUser = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const state = await ctx.db
      .query('conversationState')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    return state
  },
})

/**
 * Get recent conversation history from conversations table
 * Used as fallback when conversationState.recentMessages is empty (migration case)
 */
export const getRecentFromConversations = internalQuery({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 20 }) => {
    const messages = await ctx.db
      .query('conversations')
      .withIndex('by_user_time', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit)

    // Reverse to get chronological order (oldest first)
    return messages.reverse().map((m) => ({
      role: m.role,
      content: m.text,
      timestamp: m.timestamp,
    }))
  },
})
