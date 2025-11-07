/**
 * RRULE Trigger System (Task 8)
 *
 * Replaces fixed cron scheduling with per-user customizable schedules using RRULE.
 *
 * Key Features:
 * - RRULE-based recurrence (RFC 5545)
 * - Timezone support (IANA timezones)
 * - Per-user customizable schedules
 * - Automatic next occurrence calculation
 * - Missed trigger handling
 *
 * Processes triggers every 15 minutes via cron job in convex/crons.ts
 */

import { internalMutation, mutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { RRule } from 'rrule'
import { logSafe } from './utils/logger'

/**
 * Process all due triggers
 *
 * Runs every 15 minutes via cron (configured in convex/crons.ts)
 *
 * Algorithm:
 * 1. Query all triggers where nextOccurrence <= now AND enabled = true
 * 2. For each trigger:
 *    a. Send SMS to user
 *    b. Calculate next occurrence using RRULE
 *    c. Update trigger with new nextOccurrence and lastTriggeredAt
 * 3. Skip triggers that are too old (>24h missed)
 */
export const processDueTriggers = internalMutation({
  handler: async ctx => {
    const now = Date.now()
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000

    // Query all enabled triggers that are due
    const dueTriggers = await ctx.db
      .query('triggers')
      .withIndex('by_next_occurrence')
      .filter(q => q.and(q.lte(q.field('nextOccurrence'), now), q.eq(q.field('enabled'), true)))
      .collect()

    logSafe('Triggers', 'Found due triggers', { count: dueTriggers.length })

    let processed = 0
    let skipped = 0
    let errors = 0

    for (const trigger of dueTriggers) {
      try {
        // Skip triggers that are too old (>24h missed) - likely server downtime
        if (trigger.nextOccurrence < twentyFourHoursAgo) {
          logSafe('Triggers', 'Skipping old trigger', {
            triggerId: trigger._id,
            hoursOld: Math.floor((now - trigger.nextOccurrence) / (1000 * 60 * 60)),
          })

          // Recalculate next occurrence without sending message
          const nextOccurrence = calculateNextOccurrence(
            trigger.recurrenceRule,
            trigger.timezone,
            now
          )
          await ctx.db.patch(trigger._id, {
            nextOccurrence,
          })
          skipped++
          continue
        }

        // Get user (subscription fields are denormalized)
        const user = await ctx.db.get(trigger.userId)
        if (!user || !user.phoneNumber) {
          logSafe('Triggers', 'User not found or missing phone', { userId: trigger.userId })
          errors++
          continue
        }

        // Check subscription status before sending
        const isSubscribed =
          user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'

        if (!isSubscribed) {
          logSafe('Triggers', 'Skipping trigger - no active subscription', {
            triggerId: trigger._id,
            userId: trigger.userId,
            status: user.subscriptionStatus,
          })
          // Still update next occurrence so we don't keep trying
          const nextOccurrence = calculateNextOccurrence(
            trigger.recurrenceRule,
            trigger.timezone,
            now
          )
          await ctx.db.patch(trigger._id, {
            nextOccurrence,
            lastTriggeredAt: now,
          })
          skipped++
          continue
        }

        // Send SMS
        await ctx.scheduler.runAfter(0, internal.twilio.sendOutboundSMS, {
          to: user.phoneNumber,
          body: trigger.message,
        })

        // Log conversation
        await ctx.db.insert('conversations', {
          userId: trigger.userId,
          role: 'assistant',
          text: trigger.message,
          mode: 'sms',
          agentName: 'scheduled',
          timestamp: now,
        })

        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(
          trigger.recurrenceRule,
          trigger.timezone,
          now
        )

        // Update trigger
        await ctx.db.patch(trigger._id, {
          nextOccurrence,
          lastTriggeredAt: now,
        })

        logSafe('Triggers', 'Processed trigger', {
          triggerId: trigger._id,
          userId: trigger.userId,
          next: new Date(nextOccurrence).toISOString(),
        })
        processed++
      } catch (error) {
        logSafe('Triggers', 'Error processing trigger', {
          triggerId: trigger._id,
          error: String(error),
        })
        errors++
      }
    }

    logSafe('Triggers', 'Processing complete', { processed, skipped, errors })

    return {
      processed,
      skipped,
      errors,
      total: dueTriggers.length,
    }
  },
})

/**
 * Create a new trigger for a user
 *
 * Used by the setWellnessSchedule tool
 * NOTE: Made public (not internal) so agent tools can call it via api.triggers.createTrigger
 */
export const createTrigger = mutation({
  args: {
    userId: v.id('users'),
    recurrenceRule: v.string(),
    type: v.string(),
    message: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate RRULE
    try {
      RRule.fromString(args.recurrenceRule)
    } catch (error) {
      throw new Error(`Invalid RRULE: ${error}`)
    }

    // Calculate initial next occurrence
    const nextOccurrence = calculateNextOccurrence(args.recurrenceRule, args.timezone, Date.now())

    // Check for existing trigger of same type
    const existing = await ctx.db
      .query('triggers')
      .withIndex('by_user_type', q => q.eq('userId', args.userId).eq('type', args.type))
      .filter(q => q.eq(q.field('enabled'), true))
      .first()

    if (existing) {
      // Update existing trigger
      await ctx.db.patch(existing._id, {
        recurrenceRule: args.recurrenceRule,
        message: args.message,
        timezone: args.timezone,
        nextOccurrence,
      })

      logSafe('Triggers', 'Updated existing trigger', {
        triggerId: existing._id,
        userId: args.userId,
      })

      return existing._id
    } else {
      // Create new trigger
      const triggerId = await ctx.db.insert('triggers', {
        userId: args.userId,
        recurrenceRule: args.recurrenceRule,
        type: args.type,
        message: args.message,
        timezone: args.timezone,
        enabled: true,
        nextOccurrence,
        createdAt: Date.now(),
      })

      logSafe('Triggers', 'Created trigger', {
        triggerId,
        userId: args.userId,
        next: new Date(nextOccurrence).toISOString(),
      })

      return triggerId
    }
  },
})

/**
 * Disable a trigger for a user
 */
export const disableTrigger = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const trigger = await ctx.db
      .query('triggers')
      .withIndex('by_user_type', q => q.eq('userId', args.userId).eq('type', args.type))
      .first()

    if (trigger) {
      await ctx.db.patch(trigger._id, { enabled: false })
      logSafe('Triggers', 'Disabled trigger', { triggerId: trigger._id, userId: args.userId })
      return true
    }

    return false
  },
})

/**
 * Enable a trigger for a user
 */
export const enableTrigger = internalMutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const trigger = await ctx.db
      .query('triggers')
      .withIndex('by_user_type', q => q.eq('userId', args.userId).eq('type', args.type))
      .first()

    if (trigger) {
      // Recalculate next occurrence when re-enabling
      const nextOccurrence = calculateNextOccurrence(
        trigger.recurrenceRule,
        trigger.timezone,
        Date.now()
      )

      await ctx.db.patch(trigger._id, {
        enabled: true,
        nextOccurrence,
      })

      logSafe('Triggers', 'Enabled trigger', { triggerId: trigger._id, userId: args.userId })
      return true
    }

    return false
  },
})

/**
 * Get all triggers for a user
 */
export const getUserTriggers = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const triggers = await ctx.db
      .query('triggers')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .collect()

    return triggers
  },
})

// ========================================
// RRULE Utilities
// ========================================

/**
 * Calculate next occurrence from RRULE with timezone support
 *
 * FIX #2: This function now properly handles user timezones by:
 * 1. Parsing the RRULE (which uses hour/minute in local time)
 * 2. Interpreting the result as being in the user's timezone
 * 3. Converting to UTC for storage
 *
 * Example:
 * - User in PT sets "daily at 9am"
 * - RRULE: "FREQ=DAILY;BYHOUR=9;BYMINUTE=0"
 * - RRule.after() returns Date with 9:00 (interpreted as UTC by JavaScript)
 * - We reinterpret that 9:00 as 9:00 PT
 * - Convert to UTC: 9:00 PT = 17:00 UTC (during DST) or 18:00 UTC (standard time)
 * - Store UTC timestamp
 *
 * @param rruleString - RRULE format string (e.g., "FREQ=DAILY;BYHOUR=9;BYMINUTE=0")
 * @param timezone - IANA timezone (e.g., "America/Los_Angeles")
 * @param after - Calculate next occurrence after this timestamp (default: now)
 * @returns Unix timestamp (milliseconds) of next occurrence in UTC
 */
function calculateNextOccurrence(
  rruleString: string,
  timezone: string,
  after: number = Date.now()
): number {
  try {
    // Parse RRULE (hour/minute are in local time, but RRule treats them as UTC)
    const rrule = RRule.fromString(rruleString)

    // Get next occurrence from RRule (this returns a Date with the time in UTC)
    const nextDateUTC = rrule.after(new Date(after), false) // false = exclude 'after' date

    if (!nextDateUTC) {
      // RRULE has no more occurrences (e.g., UNTIL date passed)
      // Return far future timestamp to prevent re-processing
      return Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year from now
    }

    // FIX #2: Reinterpret the time as being in the user's timezone
    // RRule gave us 2025-10-17T09:00:00.000Z (9am UTC)
    // But user meant 9am in their timezone

    // Extract the date/time components (these are what the user meant)
    const year = nextDateUTC.getUTCFullYear()
    const month = nextDateUTC.getUTCMonth() + 1 // JS months are 0-indexed
    const day = nextDateUTC.getUTCDate()
    const hour = nextDateUTC.getUTCHours()
    const minute = nextDateUTC.getUTCMinutes()

    // Build ISO string in user's timezone format: "2025-10-17T09:00"
    const localTimeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

    // Parse as being in the user's timezone and convert to UTC
    // We'll use a simple offset calculation based on timezone
    const utcTimestamp = convertLocalToUTC(localTimeString, timezone)

    return utcTimestamp
  } catch (error) {
    logSafe('Triggers', 'Error parsing RRULE', { rruleString, error: String(error) })
    throw error
  }
}

/**
 * Convert local time string in a given timezone to UTC timestamp
 *
 * This is a simplified implementation that uses Intl.DateTimeFormat
 * to determine timezone offsets without requiring external libraries.
 *
 * @param localTimeString - ISO format without timezone: "2025-10-17T09:00:00"
 * @param timezone - IANA timezone: "America/Los_Angeles"
 * @returns UTC timestamp in milliseconds
 */
function convertLocalToUTC(localTimeString: string, timezone: string): number {
  // Parse the local time string as if it's in the target timezone
  // We create two Date objects: one in UTC, one in the target timezone
  // The difference tells us the offset

  const date = new Date(localTimeString + 'Z') // Parse as UTC

  // Get the offset for this timezone at this specific date
  // (handles DST transitions automatically)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  // Format the date as it would appear in the target timezone
  const parts = formatter.formatToParts(date)
  const tzTime: any = {}
  parts.forEach(part => {
    if (part.type !== 'literal') {
      tzTime[part.type] = parseInt(part.value, 10)
    }
  })

  // Create a date object representing that same time in the local timezone
  const tzDate = new Date(
    tzTime.year,
    tzTime.month - 1, // JS months are 0-indexed
    tzTime.day,
    tzTime.hour,
    tzTime.minute,
    tzTime.second
  )

  // The difference between these two dates is the timezone offset
  const offset = date.getTime() - tzDate.getTime()

  // Parse the original local time string as a local date
  const [datePart, timePart] = localTimeString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  const localDate = new Date(year, month - 1, day, hour, minute, 0)

  // Apply the offset to convert to UTC
  return localDate.getTime() - offset
}

/**
 * Parse user-friendly time format to RRULE components
 *
 * Supports:
 * - "9:00 AM" → { hour: 9, minute: 0 }
 * - "2:30 PM" → { hour: 14, minute: 30 }
 * - "14:30" → { hour: 14, minute: 30 }
 * - "00:00" → { hour: 0, minute: 0 }
 *
 * @param timeString - Time in 12-hour (AM/PM) or 24-hour format
 * @returns { hour, minute } in 24-hour format
 */
export function parseTime(timeString: string): { hour: number; minute: number } {
  // Remove whitespace
  const cleaned = timeString.trim()

  // Check for AM/PM format
  const isPM = /PM/i.test(cleaned)
  const isAM = /AM/i.test(cleaned)

  // Extract time components
  const timeOnly = cleaned.replace(/\s?(AM|PM)/i, '')
  const [hourStr, minuteStr] = timeOnly.split(':')

  let hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)

  // Validate
  if (isNaN(hour) || isNaN(minute)) {
    throw new Error(`Invalid time format: ${timeString}`)
  }

  // Convert 12-hour to 24-hour
  if (isAM || isPM) {
    if (isPM && hour !== 12) {
      hour += 12
    } else if (isAM && hour === 12) {
      hour = 0
    }
  }

  // Validate ranges
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour} (must be 0-23)`)
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute} (must be 0-59)`)
  }

  return { hour, minute }
}

/**
 * Build RRULE string from user preferences
 *
 * @param frequency - "daily" | "every_other_day" | "weekly" | "custom"
 * @param time - Parsed time { hour, minute }
 * @param daysOfWeek - Optional array of day codes (e.g., ["MO", "WE", "FR"])
 * @returns RRULE string
 */
export function buildRRule(
  frequency: string,
  time: { hour: number; minute: number },
  daysOfWeek?: string[]
): string {
  const parts: string[] = []

  switch (frequency) {
    case 'daily':
      parts.push('FREQ=DAILY')
      break

    case 'every_other_day':
      parts.push('FREQ=DAILY')
      parts.push('INTERVAL=2')
      break

    case 'weekly':
      if (!daysOfWeek || daysOfWeek.length === 0) {
        throw new Error('Weekly frequency requires daysOfWeek')
      }
      parts.push('FREQ=WEEKLY')
      parts.push(`BYDAY=${daysOfWeek.join(',')}`)
      break

    case 'custom':
      // Custom RRULE should be provided directly by user
      throw new Error('Custom frequency not supported in buildRRule - provide full RRULE string')

    default:
      throw new Error(`Invalid frequency: ${frequency}`)
  }

  // Add time components
  parts.push(`BYHOUR=${time.hour}`)
  parts.push(`BYMINUTE=${time.minute}`)

  return parts.join(';')
}
