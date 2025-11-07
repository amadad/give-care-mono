import { action, mutation, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { requireHarnessToken } from '../model/security';
import * as Triggers from '../model/triggers';

export const enqueueOnce = mutation({
  args: {
    token: v.string(),
    job: v.object({
      name: v.string(),
      payload: v.any(),
      runAt: v.string(),
      userExternalId: v.string(),
      timezone: v.string(),
    }),
  },
  handler: async (ctx, { token, job }) => {
    requireHarnessToken(token);
    const triggerId = await Triggers.createTrigger(ctx, {
      userExternalId: job.userExternalId,
      rrule: `DTSTART:${job.runAt.replace(/[-:]/g, '').slice(0, 15)}\nRRULE:FREQ=DAILY;COUNT=1`,
      timezone: job.timezone,
      nextRun: job.runAt,
      payload: { ...job.payload, name: job.name },
      type: 'one_off',
    });
    return triggerId;
  },
});

export const createTrigger = mutation({
  args: {
    token: v.string(),
    trigger: v.object({
      userExternalId: v.string(),
      rrule: v.string(),
      timezone: v.string(),
      nextRun: v.string(),
      payload: v.any(),
    }),
  },
  handler: async (ctx, { token, trigger }) => {
    requireHarnessToken(token);
    return Triggers.createTrigger(ctx, {
      ...trigger,
      type: 'recurring',
    });
  },
});

export const cancelTrigger = mutation({
  args: {
    token: v.string(),
    triggerId: v.id('triggers'),
  },
  handler: async (ctx, { token, triggerId }) => {
    requireHarnessToken(token);
    await Triggers.cancelTrigger(ctx, triggerId);
  },
});

const processBatch = async (ctx: Parameters<typeof Triggers.dueTriggers>[0], batchSize = 25) => {
  const due = await Triggers.dueTriggers(ctx, Date.now(), batchSize);
  for (const trigger of due) {
    await ctx.db.insert('alerts', {
      userId: trigger.userId,
      type: 'scheduled_trigger',
      severity: 'medium',
      context: { payload: trigger.payload, timezone: trigger.timezone },
      message: 'Scheduled follow-up ready. Reach out with a gentle nudge.',
      channel: 'email',
      payload: trigger.payload ?? {},
      status: 'pending',
    });
    await ctx.runMutation(internal.scheduler.advanceTriggerMutation, { triggerId: trigger._id });
  }
  return due.length;
};

export const processDueTriggers = action({
  args: {
    token: v.string(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { token, batchSize }) => {
    requireHarnessToken(token);
    const processed = await processBatch(ctx, batchSize ?? 25);
    return { processed };
  },
});

export const internalProcessDueTriggers = internalAction({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { batchSize }) => {
    await processBatch(ctx, batchSize ?? 25);
  },
});
