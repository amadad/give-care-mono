/**
 * Idempotency Helpers
 *
 * Implements outbox pattern for side-effects using the jobs table.
 * Ensures exactly-once semantics for webhooks and external API calls.
 *
 * PATTERN:
 * 1. HTTP webhook → verify signature → ensureUniqueJob → return 200 fast
 * 2. Worker action → claim job → execute → mark done
 * 3. Retry with exponential backoff on failure
 */

import type { DbWriter } from './context'
import type { Id } from '../_generated/dataModel'

export type JobType =
  | 'process_inbound_sms'
  | 'send_sms'
  | 'send_email'
  | 'process_stripe_webhook'
  | 'run_agent'
  | 'generate_summary'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface JobPayload {
  [key: string]: unknown
}

export interface Job {
  _id: Id<'jobs'>
  key: string
  type: JobType
  payload: JobPayload
  status: JobStatus
  attempts: number
  maxAttempts?: number
  nextAttemptAt: number
  lastError?: string
  result?: unknown
  createdAt: number
  completedAt?: number
}

/**
 * Ensure unique job with idempotency key
 * If job exists, return existing job ID (dedupe)
 * If new, insert and return new job ID
 *
 * @param db - Database writer
 * @param key - Unique idempotency key (e.g., 'twilio:SMxxxxx', 'stripe:evt_xxx')
 * @param type - Job type
 * @param payload - Job-specific data
 * @param maxAttempts - Max retry attempts (default 3)
 * @returns Job ID
 */
export async function ensureUniqueJob(
  db: DbWriter,
  key: string,
  type: JobType,
  payload: JobPayload,
  maxAttempts = 3
): Promise<Id<'jobs'>> {
  const existing = await db
    .query('jobs')
    .withIndex('by_key', (q) => q.eq('key', key))
    .first()

  if (existing) {
    return existing._id
  }

  return db.insert('jobs', {
    key,
    type,
    payload,
    status: 'pending',
    attempts: 0,
    maxAttempts,
    nextAttemptAt: Date.now(), // Process immediately
    createdAt: Date.now(),
  })
}

/**
 * Claim next pending job for processing
 * Atomically marks job as 'processing' to prevent duplicate execution
 *
 * @param db - Database writer
 * @param type - Optional job type filter
 * @returns Job or null if none available
 */
export async function claimNextJob(
  db: DbWriter,
  type?: JobType
): Promise<Job | null> {
  const now = Date.now()

  // Find pending jobs ready to process
  let query = db
    .query('jobs')
    .withIndex('by_status_next', (q) => q.eq('status', 'pending'))
    .filter((q) => q.lte(q.field('nextAttemptAt'), now))

  if (type) {
    query = query.filter((q) => q.eq(q.field('type'), type))
  }

  const job = await query.first()

  if (!job) return null

  // Atomically claim job
  await db.patch(job._id, {
    status: 'processing',
    attempts: (job.attempts || 0) + 1,
  })

  return { ...job, status: 'processing', attempts: (job.attempts || 0) + 1 }
}

/**
 * Mark job as completed with optional result
 *
 * @param db - Database writer
 * @param jobId - Job ID
 * @param result - Optional result data
 */
export async function completeJob(
  db: DbWriter,
  jobId: Id<'jobs'>,
  result?: unknown
): Promise<void> {
  await db.patch(jobId, {
    status: 'completed',
    completedAt: Date.now(),
    result,
  })
}

/**
 * Mark job as failed with error and schedule retry
 * Uses exponential backoff: 2s, 4s, 8s, 16s, etc.
 *
 * @param db - Database writer
 * @param jobId - Job ID
 * @param error - Error message
 * @param attempts - Current attempt count
 * @param maxAttempts - Max retry attempts
 */
export async function failJob(
  db: DbWriter,
  jobId: Id<'jobs'>,
  error: string,
  attempts: number,
  maxAttempts = 3
): Promise<void> {
  const shouldRetry = attempts < maxAttempts

  if (shouldRetry) {
    // Exponential backoff: 2^attempts seconds
    const backoffMs = Math.pow(2, attempts) * 1000
    const nextAttemptAt = Date.now() + backoffMs

    await db.patch(jobId, {
      status: 'pending', // Allow retry
      lastError: error,
      nextAttemptAt,
    })
  } else {
    // Max attempts reached, mark as permanently failed
    await db.patch(jobId, {
      status: 'failed',
      lastError: error,
      completedAt: Date.now(),
    })
  }
}

/**
 * Generate idempotency key for Twilio webhook
 * Format: 'twilio:<MessageSid>'
 */
export function twilioJobKey(messageSid: string): string {
  return `twilio:${messageSid}`
}

/**
 * Generate idempotency key for Stripe webhook
 * Format: 'stripe:<event.id>'
 */
export function stripeJobKey(eventId: string): string {
  return `stripe:${eventId}`
}

/**
 * Generate idempotency key for user-scoped operation
 * Format: '<type>:<userId>:<timestamp>'
 */
export function userJobKey(type: string, userId: string, timestamp?: number): string {
  const ts = timestamp || Date.now()
  return `${type}:${userId}:${ts}`
}
