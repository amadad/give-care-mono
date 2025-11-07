/**
 * Jobs Pattern - Idempotent Side-Effects
 *
 * Mutations to manage the jobs queue
 */

import { internalMutation, internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { v } from 'convex/values'
import {
  ensureUniqueJob,
  claimNextJob,
  completeJob,
  failJob,
  type JobType,
} from '../lib/idempotency'

/**
 * Enqueue a job with idempotency
 */
export const enqueue = internalMutation({
  args: {
    key: v.string(),
    type: v.string(),
    payload: v.any(),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, { key, type, payload, maxAttempts }) => {
    const jobId = await ensureUniqueJob(
      ctx.db,
      key,
      type as JobType,
      payload,
      maxAttempts
    )
    return { jobId }
  },
})

/**
 * Claim next pending job for processing
 */
export const claim = internalMutation({
  args: {
    type: v.optional(v.string()),
  },
  handler: async (ctx, { type }) => {
    return await claimNextJob(ctx.db, type as JobType | undefined)
  },
})

/**
 * Mark job as completed
 */
export const complete = internalMutation({
  args: {
    jobId: v.id('jobs'),
    result: v.optional(v.any()),
  },
  handler: async (ctx, { jobId, result }) => {
    await completeJob(ctx.db, jobId, result)
  },
})

/**
 * Mark job as failed and schedule retry
 */
export const fail = internalMutation({
  args: {
    jobId: v.id('jobs'),
    error: v.string(),
    attempts: v.number(),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, { jobId, error, attempts, maxAttempts }) => {
    await failJob(ctx.db, jobId, error, attempts, maxAttempts)
  },
})

/**
 * Worker: Process pending jobs
 *
 * Called by cron every 30 seconds
 */
export const processJobs = internalAction({
  args: {
    type: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { type, batchSize = 10 }) => {
    const processed: string[] = []
    const failed: string[] = []

    // Process batch
    for (let i = 0; i < batchSize; i++) {
      const job = await ctx.runMutation(internal.functions.jobs.claim, { type })

      if (!job) break // No more pending jobs

      try {
        // Route to specific handler based on job type
        switch (job.type) {
          case 'send_sms':
            await handleSendSMS(ctx, job)
            break
          case 'send_email':
            await handleSendEmail(ctx, job)
            break
          case 'process_inbound_sms':
            await handleProcessInboundSMS(ctx, job)
            break
          default:
            throw new Error(`Unknown job type: ${job.type}`)
        }

        // Mark complete
        await ctx.runMutation(internal.functions.jobs.complete, {
          jobId: job._id,
        })

        processed.push(job._id)
      } catch (error: any) {
        // Retry with exponential backoff
        await ctx.runMutation(internal.functions.jobs.fail, {
          jobId: job._id,
          error: error.message || 'Unknown error',
          attempts: job.attempts,
          maxAttempts: job.maxAttempts || 3,
        })

        failed.push(job._id)
      }
    }

    return { processed: processed.length, failed: failed.length }
  },
})

/**
 * Job Handler: Send SMS
 */
async function handleSendSMS(ctx: any, job: any) {
  const { to, body, replyToSid } = job.payload

  // Send via Twilio action
  await ctx.runAction(internal.actions.twilio.sendSMS, {
    to,
    body,
  })

  console.log(`[Jobs] Sent SMS to ${to}`)
}

/**
 * Job Handler: Send Email
 */
async function handleSendEmail(ctx: any, job: any) {
  const { to, subject, body } = job.payload

  // TODO: Implement email sending via Resend
  console.log(`[Jobs] Would send email to ${to}: ${subject}`)
}

/**
 * Job Handler: Process Inbound SMS
 */
async function handleProcessInboundSMS(ctx: any, job: any) {
  const { from, body, messageSid } = job.payload

  // Process through MessageHandler
  await ctx.runAction(internal.twilio.onIncomingMessage, {
    from,
    body,
    messageSid,
    twilioSignature: '', // Already verified at HTTP layer
    requestUrl: '',
    params: {},
  })

  console.log(`[Jobs] Processed inbound SMS from ${from}`)
}

/**
 * Get job statistics
 */
export const getStats = internalMutation({
  handler: async (ctx) => {
    const allJobs = await ctx.db.query('jobs').collect()

    const byStatus = allJobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const byType = allJobs.reduce(
      (acc, job) => {
        acc[job.type] = (acc[job.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const failed = allJobs.filter((j) => j.status === 'failed')
    const pending = allJobs.filter((j) => j.status === 'pending')
    const oldestPending = pending.sort((a, b) => a.createdAt - b.createdAt)[0]

    return {
      total: allJobs.length,
      byStatus,
      byType,
      failedCount: failed.length,
      pendingCount: pending.length,
      oldestPendingAge: oldestPending
        ? Date.now() - oldestPending.createdAt
        : 0,
    }
  },
})
