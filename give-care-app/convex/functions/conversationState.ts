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
