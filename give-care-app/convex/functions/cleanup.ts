/**
 * Cleanup utilities - delete test users and related data
 * Run manually from Convex dashboard or CLI
 */

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

export const deleteAllUsers = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    let deletedCount = 0;

    for (const user of users) {
      try {
        // Delete related records first (cascade order)
        // 1. Conversations
        const conversations = await ctx.db
          .query('conversations')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .collect();
        for (const conv of conversations) {
          await ctx.db.delete(conv._id);
        }

        // 2. Knowledge usage
        const knowledgeUsage = await ctx.db
          .query('knowledgeUsage')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .collect();
        for (const usage of knowledgeUsage) {
          await ctx.db.delete(usage._id);
        }

        // 3. Assessment responses (via sessions)
        const sessions = await ctx.db
          .query('assessmentSessions')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .collect();
        for (const session of sessions) {
          const responses = await ctx.db
            .query('assessmentResponses')
            .withIndex('by_session', (q) => q.eq('sessionId', session._id))
            .collect();
          for (const response of responses) {
            await ctx.db.delete(response._id);
          }
          await ctx.db.delete(session._id);
        }

        // 4. Wellness scores
        const wellnessScores = await ctx.db
          .query('wellnessScores')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .collect();
        for (const score of wellnessScores) {
          await ctx.db.delete(score._id);
        }

        // 5. Finally, delete the user
        await ctx.db.delete(user._id);
        deletedCount++;
      } catch (error) {
        // Log error but continue with other users
        console.error(`Failed to delete user ${user.phoneNumber}:`, error);
      }
    }

    return {
      deleted: deletedCount,
      total: users.length,
      message: `Deleted ${deletedCount} of ${users.length} users`
    };
  }
});

/**
 * Delete a single user by phone number (safer for testing)
 */
export const deleteUserByPhone = internalMutation({
  args: {
    phoneNumber: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phoneNumber', args.phoneNumber))
      .unique();

    if (!user) {
      return { success: false, message: `User ${args.phoneNumber} not found` };
    }

    try {
      // Delete related records first (cascade order)
      // 1. Conversations
      const conversations = await ctx.db
        .query('conversations')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      for (const conv of conversations) {
        await ctx.db.delete(conv._id);
      }

      // 2. Knowledge usage
      const knowledgeUsage = await ctx.db
        .query('knowledgeUsage')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      for (const usage of knowledgeUsage) {
        await ctx.db.delete(usage._id);
      }

      // 3. Assessment responses (via sessions)
      const sessions = await ctx.db
        .query('assessmentSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      for (const session of sessions) {
        const responses = await ctx.db
          .query('assessmentResponses')
          .withIndex('by_session', (q) => q.eq('sessionId', session._id))
          .collect();
        for (const response of responses) {
          await ctx.db.delete(response._id);
        }
        await ctx.db.delete(session._id);
      }

      // 4. Wellness scores
      const wellnessScores = await ctx.db
        .query('wellnessScores')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      for (const score of wellnessScores) {
        await ctx.db.delete(score._id);
      }

      // 5. Finally, delete the user
      await ctx.db.delete(user._id);

      return {
        success: true,
        message: `Deleted user ${args.phoneNumber} and all related data`,
        deletedRecords: {
          conversations: conversations.length,
          knowledgeUsage: knowledgeUsage.length,
          assessmentSessions: sessions.length,
          wellnessScores: wellnessScores.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete user ${args.phoneNumber}: ${error}`
      };
    }
  }
});
