/**
 * Batch Jobs - Mutations and Queries
 *
 * Database operations for OpenAI Batch API tracking.
 * Separated from batchSummarization.ts because mutations/queries
 * cannot be in "use node" files.
 */

import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'

/**
 * Store batch job in database
 */
export const storeBatchJob = internalMutation({
  args: {
    batchId: v.string(),
    status: v.string(),
    endpoint: v.string(),
    inputFileId: v.string(),
    requestCounts: v.object({
      total: v.number(),
      completed: v.number(),
      failed: v.number(),
    }),
    userIds: v.array(v.id('users')),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('batchJobs', args)
  },
})

/**
 * Get all pending batch jobs (validating or in_progress)
 */
export const getPendingBatches = internalQuery({
  args: {},
  handler: async ctx => {
    const validating = await ctx.db
      .query('batchJobs')
      .withIndex('by_status', q => q.eq('status', 'validating'))
      .collect()

    const inProgress = await ctx.db
      .query('batchJobs')
      .withIndex('by_status', q => q.eq('status', 'in_progress'))
      .collect()

    return [...validating, ...inProgress]
  },
})

/**
 * Get batch job by batch ID
 */
export const getBatchByBatchId = internalQuery({
  args: {
    batchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('batchJobs')
      .withIndex('by_batch_id', q => q.eq('batchId', args.batchId))
      .unique()
  },
})

/**
 * Update batch job status
 */
export const updateBatchStatus = internalMutation({
  args: {
    batchId: v.string(),
    status: v.string(),
    requestCounts: v.object({
      total: v.number(),
      completed: v.number(),
      failed: v.number(),
    }),
    outputFileId: v.optional(v.string()),
    errorFileId: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchJob = await ctx.db
      .query('batchJobs')
      .withIndex('by_batch_id', q => q.eq('batchId', args.batchId))
      .unique()

    if (!batchJob) {
      throw new Error(`Batch job not found: ${args.batchId}`)
    }

    await ctx.db.patch(batchJob._id, {
      status: args.status,
      requestCounts: args.requestCounts,
      outputFileId: args.outputFileId,
      errorFileId: args.errorFileId,
      completedAt: args.completedAt,
    })
  },
})
