import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

const MAX_RECENT_MESSAGES = 20 // Keep last 20 messages for context window

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

    // 2) Update recentMessages sliding window in conversationState
    // FIX: This was missing, causing context loss between messages
    const conversationState = await ctx.db
      .query('conversationState')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    // Get existing messages or initialize empty array
    const existingMessages = conversationState?.recentMessages || []

    // Append new messages
    const newMessages = [
      ...existingMessages,
      {
        role: 'user',
        content: userMessage,
        timestamp: startTime ?? now,
      },
      {
        role: 'assistant',
        content: agentMessage,
        timestamp: now,
      },
    ]

    // Keep only last MAX_RECENT_MESSAGES (sliding window)
    const recentMessages = newMessages.slice(-MAX_RECENT_MESSAGES)

    // Upsert conversationState record
    if (conversationState) {
      await ctx.db.patch(conversationState._id, {
        recentMessages,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('conversationState', {
        userId,
        recentMessages,
        updatedAt: now,
      })
    }

    // 3) Patch user context (denormalized)
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

