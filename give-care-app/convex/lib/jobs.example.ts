/**
 * Example: Jobs Pattern Implementation
 *
 * This file demonstrates the complete jobs/outbox pattern for idempotent side-effects.
 * Use as a reference when implementing similar patterns.
 */

import { internalMutation, internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { v } from 'convex/values'
import {
  ensureUniqueJob,
  claimNextJob,
  completeJob,
  failJob,
  twilioJobKey,
  type JobType,
} from './idempotency'

// ============================================================================
// STEP 1: Enqueue Jobs (from webhooks or mutations)
// ============================================================================

/**
 * Enqueue a job with idempotency
 * Called from HTTP webhooks or scheduled tasks
 */
export const enqueueJob = internalMutation({
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

// ============================================================================
// STEP 2: Process Jobs (worker action)
// ============================================================================

/**
 * Job worker - processes pending jobs
 * Run this on a cron (e.g., every 30 seconds) or trigger manually
 *
 * Pattern:
 * 1. Claim job (atomic)
 * 2. Execute business logic
 * 3. Mark complete or retry with backoff
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
      const job = await ctx.runMutation(internal.lib.jobs.example.claimJob, {
        type,
      })

      if (!job) break // No more pending jobs

      try {
        // Route to specific handler based on job type
        switch (job.type) {
          case 'process_inbound_sms':
            await processInboundSMS(ctx, job)
            break
          case 'send_sms':
            await sendSMS(ctx, job)
            break
          case 'send_email':
            await sendEmail(ctx, job)
            break
          default:
            throw new Error(`Unknown job type: ${job.type}`)
        }

        // Mark complete
        await ctx.runMutation(internal.lib.jobs.example.markComplete, {
          jobId: job._id,
        })

        processed.push(job._id)
      } catch (error: any) {
        // Retry with exponential backoff
        await ctx.runMutation(internal.lib.jobs.example.markFailed, {
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

// ============================================================================
// STEP 3: Job Handlers (business logic)
// ============================================================================

/**
 * Process inbound SMS
 */
async function processInboundSMS(ctx: any, job: any) {
  const { messageSid, from, body } = job.payload

  // 1. Look up or create user
  const user = await ctx.runMutation(internal.functions.users.getOrCreateByPhone, {
    phoneNumber: from,
  })

  // 2. Process message through agent
  const result = await ctx.runAction(internal.services.MessageHandler.handle, {
    userId: user._id,
    message: body,
    messageSid,
  })

  // 3. Send response (enqueue another job for idempotency)
  await ctx.runMutation(internal.lib.jobs.example.enqueueJob, {
    key: `send_sms:${messageSid}:response`,
    type: 'send_sms',
    payload: {
      to: from,
      message: result.response,
      replyToSid: messageSid,
    },
  })
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(ctx: any, job: any) {
  const { to, message, replyToSid } = job.payload

  // Call Twilio component
  const result = await ctx.runAction(internal.twilio.sendOutboundSMS, {
    to,
    body: message,
  })

  // Log to conversations
  await ctx.runMutation(internal.functions.conversations.logMessage, {
    phoneNumber: to,
    role: 'assistant',
    text: message,
    mode: 'sms',
    messageSid: result.sid,
  })
}

/**
 * Send email via Resend
 */
async function sendEmail(ctx: any, job: any) {
  const { to, subject, html } = job.payload

  // Call Resend API
  // await fetch('https://api.resend.com/emails', { ... })

  // Log email sent
  await ctx.runMutation(internal.functions.emailContacts.recordEmailSent, {
    email: to,
    subject,
  })
}

// ============================================================================
// STEP 4: Helper Mutations (for job lifecycle)
// ============================================================================

export const claimJob = internalMutation({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, { type }) => {
    return await claimNextJob(ctx.db, type as JobType | undefined)
  },
})

export const markComplete = internalMutation({
  args: { jobId: v.id('jobs'), result: v.optional(v.any()) },
  handler: async (ctx, { jobId, result }) => {
    await completeJob(ctx.db, jobId, result)
  },
})

export const markFailed = internalMutation({
  args: {
    jobId: v.id('jobs'),
    error: v.string(),
    attempts: v.number(),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, { jobId, error, attempts, maxAttempts }) => {
    await failJob(ctx.db, jobId, error, attempts, maxAttempts || 3)
  },
})

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: HTTP webhook enqueues job
 */
export const exampleWebhook = internalAction({
  handler: async (ctx, { messageSid, from, body }: any) => {
    // Verify signature first (see lib/webhooks.ts)
    // ...

    // Enqueue job with idempotency key
    await ctx.runMutation(internal.lib.jobs.example.enqueueJob, {
      key: twilioJobKey(messageSid),
      type: 'process_inbound_sms',
      payload: { messageSid, from, body },
    })

    // Return 200 immediately (don't block on processing)
    return { success: true }
  },
})

/**
 * Example 2: Scheduled task sends batch of messages
 */
export const exampleScheduledTask = internalMutation({
  handler: async (ctx) => {
    // Find users to send proactive messages to
    const users = await ctx.db
      .query('userProfiles')
      .withIndex('by_band_contact', (q) =>
        q.eq('burnoutBand', 'high')
      )
      .take(100)

    // Enqueue a job for each user
    for (const user of users) {
      await ensureUniqueJob(
        ctx.db,
        `wellness_checkin:${user.userId}:${Date.now()}`,
        'send_sms',
        {
          to: user.userId, // Will be looked up
          message: 'How are you feeling today?',
        }
      )
    }

    return { enqueued: users.length }
  },
})

/**
 * Example 3: Monitor failed jobs
 */
export const getFailedJobs = internalMutation({
  handler: async (ctx) => {
    const failed = await ctx.db
      .query('jobs')
      .withIndex('by_type_status', (q) =>
        q.eq('type', 'send_sms').eq('status', 'failed')
      )
      .take(50)

    return failed.map((job) => ({
      id: job._id,
      key: job.key,
      attempts: job.attempts,
      lastError: job.lastError,
      createdAt: job.createdAt,
    }))
  },
})
