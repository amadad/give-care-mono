/**
 * Message-related queries and mutations
 */

import { v } from 'convex/values'
import { internalQuery } from '../_generated/server'

/**
 * Get the last agent message for a user
 * Used by feedback tracking to determine timing and context
 */
export const getLastAgentMessage = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query('conversations')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .order('desc')
      .filter(q => q.eq(q.field('role'), 'assistant'))
      .first()

    if (!message) return null

    // Return message with fields needed for feedback tracking
    return {
      _id: message._id,
      content: message.text, // "text" field in conversations table
      timestamp: message._creationTime, // Use built-in creation time
      toolName: message.agentName, // Agent name (main/crisis/assessment)
      userMessage: undefined, // Not stored in conversations - would need to query previous message
    }
  },
})
