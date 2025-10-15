import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

/**
 * Scheduled cron jobs for proactive messaging (Task 1: Scheduled Functions)
 *
 * All times in UTC. Pacific Time conversion:
 * - PT Standard Time (Nov-Mar): PT = UTC - 8
 * - PT Daylight Time (Mar-Nov): PT = UTC - 7
 *
 * Example: 9am PT Standard = 5pm UTC (17:00)
 */
const crons = cronJobs();

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
);

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
);

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
);

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
crons.interval(
  'process-rrule-triggers',
  { minutes: 15 },
  internal.triggers.processDueTriggers
);

/**
 * CONVERSATION SUMMARIZATION (Task 9)
 * Runs daily at 3am PT (11:00 UTC during standard time)
 *
 * Automatically summarizes historical conversation messages to:
 * - Preserve context beyond OpenAI's 30-day session limit
 * - Reduce token costs by 60-80% for long-term users
 * - Enable infinite context retention
 *
 * Processes active users with >30 messages:
 * - Recent messages (< 7 days): Full detail preserved
 * - Historical messages (>= 7 days, >20 messages): Compressed to 500 tokens
 * - Critical facts: Never summarized (care recipient name, crisis history)
 */
crons.daily(
  'conversation-summarization',
  {
    hourUTC: 11,
    minuteUTC: 0,
  },
  internal.summarization.summarizeAllUsers
);

export default crons;
