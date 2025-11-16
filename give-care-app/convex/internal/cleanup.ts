/**
 * Cleanup Functions
 * Data retention and cache cleanup
 */

import { internalAction, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";

const RETENTION_DAYS = 90;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100; // Process users in batches to avoid timeouts

/**
 * Cleanup old messages (90-day retention)
 * Deletes Agent Component threads and inbound_receipts older than 90 days
 */
export const cleanupOldMessages = internalAction({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - RETENTION_MS;
    let threadsDeleted = 0;
    let receiptsDeleted = 0;
    let usersProcessed = 0;
    let errors = 0;

    // Get all users (limited to 1000 by getAllUsers query)
    const users = await ctx.runQuery(internal.internal.users.getAllUsers, {});
    
    // Process users in batches to avoid timeouts
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      for (const user of batch) {
        try {
          // Get all threads for this user
          const threadsResult = await ctx.runQuery(
            components.agent.threads.listThreadsByUserId,
            {
              userId: user._id,
              paginationOpts: { cursor: null, numItems: 1000 }, // Get all threads
            }
          );

          // Delete old threads
          for (const thread of threadsResult.page) {
            if (thread._creationTime < cutoffTime) {
              try {
                // Delete thread and all its messages
                await ctx.runMutation(
                  components.agent.threads.deleteAllForThreadIdAsync,
                  {
                    threadId: thread._id,
                  }
                );
                threadsDeleted++;
              } catch (error) {
                console.error(`Failed to delete thread ${thread._id}:`, error);
                errors++;
              }
            }
          }

          // Clean up old inbound_receipts for this user
          const oldReceipts = await ctx.runQuery(
            internal.internal.cleanup.getOldReceipts,
            {
              userId: user._id,
              cutoffTime,
            }
          );

          for (const receipt of oldReceipts) {
            try {
              await ctx.runMutation(internal.internal.cleanup.deleteReceipt, {
                receiptId: receipt._id,
              });
              receiptsDeleted++;
            } catch (error) {
              console.error(`Failed to delete receipt ${receipt._id}:`, error);
              errors++;
            }
          }

          usersProcessed++;
        } catch (error) {
          console.error(`Failed to process user ${user._id}:`, error);
          errors++;
        }
      }
    }

    return {
      threadsDeleted,
      receiptsDeleted,
      usersProcessed,
      errors,
    };
  },
});

/**
 * Get old receipts for a user (query helper)
 */
export const getOldReceipts = internalQuery({
  args: {
    userId: v.id("users"),
    cutoffTime: v.number(),
  },
  handler: async (ctx, { userId, cutoffTime }) => {
    const receipts = await ctx.db
      .query("inbound_receipts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return receipts.filter((r) => (r.receivedAt || 0) < cutoffTime);
  },
});

/**
 * Delete a receipt (mutation helper)
 */
export const deleteReceipt = internalMutation({
  args: {
    receiptId: v.id("inbound_receipts"),
  },
  handler: async (ctx, { receiptId }) => {
    await ctx.db.delete(receiptId);
  },
});

