import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

/**
 * Scheduled cron jobs for proactive messaging (Task 1: Scheduled Functions)
 *
 * All times in UTC. Pacific Time conversion:
 * - PT Standard Time (Nov-Mar): PT = UTC - 8
 * - PT Daylight Time (Mar-Nov): PT = UTC - 7
 *
 * Example: 9am PT Standard = 5pm UTC (17:00)
 */
const crons = cronJobs()

/**
 * TIERED WELLNESS CHECK-INS
 * Runs daily at 9am PT (17:00 UTC during standard time)
 *
 * Cadence varies by burnout level:
 * - Crisis (first 7 days): Daily
 * - Crisis (after day 7): Weekly
 * - High burnout: Every 3 days
 * - Moderate: Weekly
 * - Mild/Thriving: No proactive messages
 */
crons.daily(
  'tiered-wellness-checkins',
  {
    hourUTC: 17,
    minuteUTC: 0,
  },
  internal.functions.scheduling.sendTieredWellnessCheckins
)

/**
 * DORMANT USER REACTIVATION
 * Runs daily at 11am PT (19:00 UTC during standard time)
 *
 * Escalating schedule with hard stops:
 * - Day 7: First reactivation
 * - Day 14: Second reactivation
 * - Day 30: Final reactivation
 * - Day 31+: Mark as churned (stop messaging)
 */
crons.daily(
  'dormant-reactivation',
  {
    hourUTC: 19,
    minuteUTC: 0,
  },
  internal.functions.scheduling.reactivateDormantUsers
)

/**
 * WEEKLY ADMIN REPORT
 * Runs Monday at 8am PT (16:00 UTC during standard time)
 *
 * Generates weekly stats:
 * - Total users, crisis count, engagement rate
 * - Assessments completed, interventions delivered
 * - Message volume, costs, churn rate
 */
crons.weekly(
  'weekly-admin-report',
  {
    hourUTC: 16,
    minuteUTC: 0,
    dayOfWeek: 'monday',
  },
  internal.functions.scheduling.generateWeeklyReport
)

/**
 * RRULE TRIGGER PROCESSOR (Task 8)
 * Runs every 15 minutes
 *
 * Processes personalized wellness check-in triggers based on RRULE schedules.
 * Replaces fixed cron times with per-user customizable schedules.
 *
 * Features:
 * - Timezone-aware scheduling (IANA timezones)
 * - Daily, weekly, custom patterns (RFC 5545 RRULE)
 * - Automatic next occurrence calculation
 * - Missed trigger handling (skips >24h old)
 */
crons.interval('process-rrule-triggers', { minutes: 15 }, internal.triggers.processDueTriggers)

/**
 * BATCH SUMMARIZATION - CREATE (Task 9)
 * Runs weekly on Sunday at 3am PT (11:00 UTC during standard time)
 *
 * Creates OpenAI Batch API job for conversation summarization:
 * - 50% cost savings vs sync API (gpt-5-nano batch pricing)
 * - 24-hour turnaround time (non-urgent weekly job)
 * - Processes active users with >30 messages
 *
 * Batch API:
 * - Input: gpt-5-nano $0.025/1M tokens (vs $0.05 sync)
 * - Output: gpt-5-nano $0.20/1M tokens (vs $0.40 sync)
 * - Historical messages (>= 7 days, >20 messages): Compressed to 500 tokens
 *
 * See batchSummarization.ts for implementation details.
 */
crons.weekly(
  'batch-summarization-create',
  {
    hourUTC: 11,
    minuteUTC: 0,
    dayOfWeek: 'sunday',
  },
  internal.batchSummarization.createWeeklySummarizationBatch
)

/**
 * BATCH SUMMARIZATION - PROCESS (Task 9)
 * Runs every hour
 *
 * Checks status of pending OpenAI Batch API jobs:
 * - Retrieves batch status from OpenAI
 * - Downloads completed batch results
 * - Applies summaries to user profiles
 * - Updates batchJobs table
 *
 * Typical flow:
 * 1. Sunday 3am: Create batch (status: validating → in_progress)
 * 2. Monday 3am: Check status (status: completed)
 * 3. Monday 3am: Download results and apply summaries
 */
crons.interval('batch-summarization-process', { hours: 1 }, internal.batchSummarization.processBatchJobs)

/**
 * ENGAGEMENT WATCHER (Task 11)
 * Runs every 6 hours
 *
 * Detects disengagement patterns and high-stress bursts:
 * - Pattern 1: Sudden drop (averageMessagesPerDay > 3, recentMessageCount === 0)
 * - Pattern 2: Crisis burst (3+ crisis keywords in 6 hours: help, overwhelm, give up)
 *
 * Creates alerts for admin dashboard intervention
 */
crons.interval('engagement-watcher', { hours: 6 }, internal.watchers.watchCaregiverEngagement)

/**
 * WELLNESS TREND WATCHER (Task 11)
 * Runs weekly on Monday at 9am PT (16:00 UTC during standard time)
 *
 * Detects worsening wellness trends over 4 consecutive weeks:
 * - Analyzes last 4 wellness scores (by_user_recorded index)
 * - Flags if scores consistently worsen (overallScore increasing each week)
 * - Sends proactive SMS: "I've noticed your stress levels trending up..."
 *
 * Expected impact: 20-30% churn reduction through early intervention
 */
crons.weekly(
  'wellness-trend-watcher',
  {
    hourUTC: 16,
    minuteUTC: 0,
    dayOfWeek: 'monday',
  },
  internal.watchers.watchWellnessTrends
)

/**
 * EMAIL: ASSESSMENT DAY 3 FOLLOW-UP
 * Runs daily at 9am EST (14:00 UTC)
 *
 * Sends Day 3 assessment follow-up emails to contacts who completed
 * their assessment 2.5-3.5 days ago and opted into follow-ups.
 */
crons.daily(
  'assessment-day3-followup',
  { hourUTC: 14, minuteUTC: 0 },
  internal.email.sequences.sendDay3Followup
)

/**
 * EMAIL: ASSESSMENT DAY 7 FOLLOW-UP
 * Runs daily at 9am EST (14:00 UTC)
 *
 * Sends Day 7 assessment follow-up emails to contacts who completed
 * their assessment 6.5-7.5 days ago and opted into follow-ups.
 */
crons.daily(
  'assessment-day7-followup',
  { hourUTC: 14, minuteUTC: 0 },
  internal.email.sequences.sendDay7Followup
)

/**
 * EMAIL: ASSESSMENT DAY 14 FOLLOW-UP
 * Runs daily at 9am EST (14:00 UTC)
 *
 * Sends Day 14 assessment follow-up emails to contacts who completed
 * their assessment 13.5-14.5 days ago and opted into follow-ups.
 */
crons.daily(
  'assessment-day14-followup',
  { hourUTC: 14, minuteUTC: 0 },
  internal.email.sequences.sendDay14Followup
)

/**
 * EMAIL: WEEKLY WELLNESS SUMMARY
 * Runs Sundays at 10am EST (15:00 UTC)
 *
 * Sends weekly wellness summary to all active newsletter subscribers.
 * Uses LLM-composable email system to personalize content based on
 * assessment data and pressure zones.
 */
crons.weekly(
  'weekly-wellness-summary',
  { hourUTC: 15, minuteUTC: 0, dayOfWeek: 'sunday' },
  internal.email.campaigns.sendWeeklySummary
)

export default crons
