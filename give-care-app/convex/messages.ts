import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

export const processIncomingMessage = internalMutation({
  args: {
    userId: v.id('users'),
    userMessage: v.string(),
    agentMessage: v.string(),
    contextUpdates: v.optional(v.any()),
    messageSid: v.optional(v.string()),
    startTime: v.optional(v.number()),
  },
  handler: async (ctx, { userId, userMessage, agentMessage, contextUpdates, messageSid, startTime }) => {
    const now = Date.now()

    // 1) Insert both conversation messages atomically
    await ctx.db.insert('conversations', {
      userId,
      role: 'user',
      text: userMessage,
      mode: 'sms',
      messageSid,
      timestamp: startTime ?? now,
    })

    await ctx.db.insert('conversations', {
      userId,
      role: 'assistant',
      text: agentMessage,
      mode: 'sms',
      timestamp: now,
    })

    // 2) Patch user context (denormalized)
    const updates: Record<string, unknown> = {
      lastContactAt: now,
      updatedAt: now,
    }
    if (contextUpdates && typeof contextUpdates === 'object') {
      Object.assign(updates, contextUpdates as Record<string, unknown>)
    }

    await ctx.db.patch(userId, updates)

    return { success: true }
  },
})

