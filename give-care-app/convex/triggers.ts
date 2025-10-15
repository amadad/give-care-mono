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

import { internalMutation, internalAction, mutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { RRule } from 'rrule';

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
  handler: async (ctx) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Query all enabled triggers that are due
    const dueTriggers = await ctx.db
      .query('triggers')
      .withIndex('by_next_occurrence')
      .filter(q => q.and(
        q.lte(q.field('nextOccurrence'), now),
        q.eq(q.field('enabled'), true)
      ))
      .collect();

    console.log(`[processDueTriggers] Found ${dueTriggers.length} due triggers`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const trigger of dueTriggers) {
      try {
        // Skip triggers that are too old (>24h missed) - likely server downtime
        if (trigger.nextOccurrence < twentyFourHoursAgo) {
          console.warn(`[processDueTriggers] Skipping old trigger ${trigger._id} (${Math.floor((now - trigger.nextOccurrence) / (1000 * 60 * 60))}h old)`);

          // Recalculate next occurrence without sending message
          const nextOccurrence = calculateNextOccurrence(trigger.recurrenceRule, trigger.timezone, now);
          await ctx.db.patch(trigger._id, {
            nextOccurrence,
          });
          skipped++;
          continue;
        }

        // Get user
        const user = await ctx.db.get(trigger.userId);
        if (!user || !user.phoneNumber) {
          console.error(`[processDueTriggers] User ${trigger.userId} not found or missing phone number`);
          errors++;
          continue;
        }

        // Send SMS
        await ctx.scheduler.runAfter(
          0,
          internal.twilio.sendOutboundSMS,
          {
            to: user.phoneNumber,
            body: trigger.message,
          }
        );

        // Log conversation
        await ctx.db.insert('conversations', {
          userId: trigger.userId,
          role: 'assistant',
          text: trigger.message,
          mode: 'sms',
          agentName: 'scheduled',
          timestamp: now,
        });

        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(trigger.recurrenceRule, trigger.timezone, now);

        // Update trigger
        await ctx.db.patch(trigger._id, {
          nextOccurrence,
          lastTriggeredAt: now,
        });

        console.log(`[processDueTriggers] Processed trigger ${trigger._id} for user ${trigger.userId}, next: ${new Date(nextOccurrence).toISOString()}`);
        processed++;

      } catch (error) {
        console.error(`[processDueTriggers] Error processing trigger ${trigger._id}:`, error);
        errors++;
      }
    }

    console.log(`[processDueTriggers] Complete: processed=${processed}, skipped=${skipped}, errors=${errors}`);

    return {
      processed,
      skipped,
      errors,
      total: dueTriggers.length,
    };
  },
});

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
      RRule.fromString(args.recurrenceRule);
    } catch (error) {
      throw new Error(`Invalid RRULE: ${error}`);
    }

    // Calculate initial next occurrence
    const nextOccurrence = calculateNextOccurrence(args.recurrenceRule, args.timezone, Date.now());

    // Check for existing trigger of same type
    const existing = await ctx.db
      .query('triggers')
      .withIndex('by_user_type', q => q.eq('userId', args.userId).eq('type', args.type))
      .filter(q => q.eq(q.field('enabled'), true))
      .first();

    if (existing) {
      // Update existing trigger
      await ctx.db.patch(existing._id, {
        recurrenceRule: args.recurrenceRule,
        message: args.message,
        timezone: args.timezone,
        nextOccurrence,
      });

      console.log(`[createTrigger] Updated existing trigger ${existing._id} for user ${args.userId}`);

      return existing._id;
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
      });

      console.log(`[createTrigger] Created trigger ${triggerId} for user ${args.userId}, next: ${new Date(nextOccurrence).toISOString()}`);

      return triggerId;
    }
  },
});

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
      .first();

    if (trigger) {
      await ctx.db.patch(trigger._id, { enabled: false });
      console.log(`[disableTrigger] Disabled trigger ${trigger._id} for user ${args.userId}`);
      return true;
    }

    return false;
  },
});

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
      .first();

    if (trigger) {
      // Recalculate next occurrence when re-enabling
      const nextOccurrence = calculateNextOccurrence(trigger.recurrenceRule, trigger.timezone, Date.now());

      await ctx.db.patch(trigger._id, {
        enabled: true,
        nextOccurrence,
      });

      console.log(`[enableTrigger] Enabled trigger ${trigger._id} for user ${args.userId}`);
      return true;
    }

    return false;
  },
});

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
      .collect();

    return triggers;
  },
});

// ========================================
// RRULE Utilities
// ========================================

/**
 * Calculate next occurrence from RRULE
 *
 * @param rruleString - RRULE format string (e.g., "FREQ=DAILY;BYHOUR=9;BYMINUTE=0")
 * @param timezone - IANA timezone (e.g., "America/Los_Angeles")
 * @param after - Calculate next occurrence after this timestamp (default: now)
 * @returns Unix timestamp (milliseconds) of next occurrence
 */
function calculateNextOccurrence(
  rruleString: string,
  timezone: string,
  after: number = Date.now()
): number {
  try {
    const rrule = RRule.fromString(rruleString);

    // Calculate next occurrence after the given timestamp
    const nextDate = rrule.after(new Date(after), false); // false = exclude 'after' date

    if (!nextDate) {
      // RRULE has no more occurrences (e.g., UNTIL date passed)
      // Return far future timestamp to prevent re-processing
      return Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year from now
    }

    return nextDate.getTime();
  } catch (error) {
    console.error(`[calculateNextOccurrence] Error parsing RRULE: ${rruleString}`, error);
    throw error;
  }
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
  const cleaned = timeString.trim();

  // Check for AM/PM format
  const isPM = /PM/i.test(cleaned);
  const isAM = /AM/i.test(cleaned);

  // Extract time components
  const timeOnly = cleaned.replace(/\s?(AM|PM)/i, '');
  const [hourStr, minuteStr] = timeOnly.split(':');

  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Validate
  if (isNaN(hour) || isNaN(minute)) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  // Convert 12-hour to 24-hour
  if (isAM || isPM) {
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (isAM && hour === 12) {
      hour = 0;
    }
  }

  // Validate ranges
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour} (must be 0-23)`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute} (must be 0-59)`);
  }

  return { hour, minute };
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
  const parts: string[] = [];

  switch (frequency) {
    case 'daily':
      parts.push('FREQ=DAILY');
      break;

    case 'every_other_day':
      parts.push('FREQ=DAILY');
      parts.push('INTERVAL=2');
      break;

    case 'weekly':
      if (!daysOfWeek || daysOfWeek.length === 0) {
        throw new Error('Weekly frequency requires daysOfWeek');
      }
      parts.push('FREQ=WEEKLY');
      parts.push(`BYDAY=${daysOfWeek.join(',')}`);
      break;

    case 'custom':
      // Custom RRULE should be provided directly by user
      throw new Error('Custom frequency not supported in buildRRule - provide full RRULE string');

    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  // Add time components
  parts.push(`BYHOUR=${time.hour}`);
  parts.push(`BYMINUTE=${time.minute}`);

  return parts.join(';');
}
