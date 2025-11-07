import { z } from 'zod';
import { capability } from './factory';

export const scheduleFollowUp = capability({
  name: 'schedule.followup',
  description: 'Schedules a follow-up check-in in Convex scheduler',
  costHint: 'medium',
  latencyHint: 'low',
  io: {
    input: z.object({
      timezone: z.string().default('UTC'),
      cadence: z.enum(['daily', 'weekly']),
      preferredHour: z.number().min(0).max(23).optional(),
    }),
  },
  async run({ timezone, cadence, preferredHour }, ctx) {
    const runAt = ctx.services.scheduling.computeNextCheckIn({ timezone, cadence, preferredHour });
    const jobId = await ctx.scheduler.enqueue(
      'followup.checkin',
      { userId: ctx.userId, cadence },
      runAt,
      { userExternalId: ctx.context.userId, timezone }
    );
    ctx.trace.push('schedule.followup', { jobId, runAt: runAt.toISOString() });
    return { jobId, runAt };
  },
});
