import { z } from 'zod';
import { capability } from './factory';
import { buildRRule, computeNextOccurrence, ScheduleRequest } from '../services/scheduling';

const triggerInputSchema = z.object({
  cadence: z.enum(['daily', 'weekly', 'monthly']) as z.ZodType<ScheduleRequest['cadence']>,
  timezone: z.string(),
  preferredHour: z.number().min(0).max(23).optional(),
  preferredMinute: z.number().min(0).max(59).optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  interval: z.number().min(1).max(30).optional(),
  payload: z.record(z.any()).default({}),
  startAt: z.string().datetime().optional(),
});

export const scheduleTrigger = capability({
  name: 'schedule.trigger',
  description: 'Registers a recurring wellness or assessment follow-up.',
  costHint: 'low',
  latencyHint: 'low',
  io: { input: triggerInputSchema },
  async run(args, ctx) {
    const input = triggerInputSchema.parse(args);
    const rrule = buildRRule({
      cadence: input.cadence,
      timezone: input.timezone,
      preferredHour: input.preferredHour,
      preferredMinute: input.preferredMinute,
      weekdays: input.weekdays as ScheduleRequest['weekdays'],
      interval: input.interval,
      startAt: input.startAt,
    });

    const nextRun = computeNextOccurrence({ timezone: input.timezone, rrule, startAt: input.startAt });

    const triggerId = await ctx.scheduler.scheduleTrigger({
      userExternalId: ctx.context.userId,
      rrule,
      timezone: input.timezone,
      nextRun,
      payload: { ...input.payload, cadence: input.cadence },
    });

    ctx.trace.push('schedule.trigger', { triggerId, nextRun: nextRun.toISOString() });

    return { triggerId, nextRun };
  },
});
