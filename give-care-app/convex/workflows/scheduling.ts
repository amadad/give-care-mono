/**
 * Scheduling Workflow
 *
 * Updates check-in schedules based on user burnout scores.
 * Frequency adapts to current risk level (daily/weekly/biweekly).
 */

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { RRule } from 'rrule';
import { DateTime } from 'luxon';

// ============================================================================
// SCHEDULE UPDATE MUTATION
// ============================================================================

/**
 * Update check-in schedule based on latest score
 * Frequency: 72+ = daily, 45-71 = weekly, <45 = biweekly
 */
export const updateCheckInSchedule = internalMutation({
  args: {
    userId: v.id('users'),
    // Keep minimal API; we look up latest score ourselves for idempotency
  },
  handler: async (ctx, { userId }) => {
    // Get latest score
    const latest = await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    if (!latest) return; // No score yet, skip scheduling

    // Derive frequency from score/band
    const freq = bandToFrequency(latest.composite, latest.band);

    // Get user preferences
    const user = await ctx.db.get(userId);
    if (!user) return;

    const md = (user.metadata ?? {}) as Record<string, unknown>;
    const tz = (md.timezone as string) ?? 'America/New_York';
    const preferredHour = ((md.profile as any)?.preferredCheckInHour as number) ?? 19;

    // Build RRULE
    const rrule = rruleFor(freq, preferredHour);
    const nextRun = calculateNextRun(rrule, tz);

    // Upsert trigger
    const existing = await ctx.db
      .query('triggers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('type'), 'recurring'))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rrule,
        nextRun,
        status: 'active',
        timezone: tz,
      });
    } else {
      await ctx.db.insert('triggers', {
        userId,
        userExternalId: user.externalId,
        rrule,
        timezone: tz,
        nextRun,
        payload: { type: 'ema_checkin' },
        type: 'recurring',
        status: 'active',
      });
    }
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map score/band to check-in frequency
 * Higher score = worse (more support needed)
 */
function bandToFrequency(score: number, band: string): 'DAILY' | 'WEEKLY' | 'BIWEEKLY' {
  if (score >= 72 || band === 'high') return 'DAILY';
  if (score >= 45) return 'WEEKLY';
  return 'BIWEEKLY';
}

/**
 * Build RRULE string for given frequency and hour
 */
function rruleFor(freq: 'DAILY' | 'WEEKLY' | 'BIWEEKLY', hour: number): string {
  if (freq === 'DAILY') {
    return `FREQ=DAILY;BYHOUR=${hour};BYMINUTE=0`;
  } else if (freq === 'WEEKLY') {
    return `FREQ=WEEKLY;BYDAY=MO;BYHOUR=${hour};BYMINUTE=0`;
  } else {
    return `FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;BYHOUR=${hour};BYMINUTE=0`;
  }
}

/**
 * Calculate next run time from RRULE + timezone
 * Returns epoch milliseconds
 * Exported for use in checkIns workflow
 */
export function calculateNextRun(rruleString: string, timezone: string, from = Date.now()): number {
  try {
    const rule = RRule.fromString(rruleString);
    const dt = DateTime.fromMillis(from, { zone: timezone });
    const next = rule.after(dt.toJSDate(), true);
    return next ? next.getTime() : from + 24 * 3600 * 1000; // Fallback: +1 day
  } catch (error) {
    console.error('[scheduling] Error calculating next run:', error);
    // Fallback: +1 day
    return from + 24 * 3600 * 1000;
  }
}

