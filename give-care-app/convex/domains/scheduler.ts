/**
 * Scheduler domain handles trigger lifecycle and cron batch processing.
 */

import { internalAction, internalMutation, mutation } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import * as Core from '../core';

export const advanceTriggerMutation = internalMutation({
  args: {
    triggerId: v.id('triggers'),
  },
  handler: async (ctx, { triggerId }) => {
    const trigger = await ctx.db.get(triggerId);
    if (!trigger) return;
    await Core.advanceTrigger(ctx, trigger);
  },
});

export const enqueueOnce = mutation({
  args: {
    job: v.object({
      name: v.string(),
      payload: v.any(),
      runAt: v.string(),
      userExternalId: v.string(),
      timezone: v.string(),
    }),
  },
  handler: async (ctx, { job }) => {
    const triggerId = await Core.createTrigger(ctx, {
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
    trigger: v.object({
      userExternalId: v.string(),
      rrule: v.string(),
      timezone: v.string(),
      nextRun: v.string(),
      payload: v.any(),
    }),
  },
  handler: async (ctx, { trigger }) => {
    return Core.createTrigger(ctx, {
      ...trigger,
      type: 'recurring',
    });
  },
});

export const cancelTrigger = mutation({
  args: {
    triggerId: v.id('triggers'),
  },
  handler: async (ctx, { triggerId }) => {
    await Core.cancelTrigger(ctx, triggerId);
  },
});

export const processBatchInternal = internalMutation({
  args: {
    batchSize: v.number(),
  },
  handler: async (ctx, { batchSize }) => {
    const startTime = Date.now();
    console.info(`[scheduler] Starting batch processing, batchSize: ${batchSize}`);

    const due = await Core.dueTriggers(ctx, Date.now(), batchSize);
    console.info(`[scheduler] Found ${due.length} due triggers`);

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
      await ctx.runMutation(internal.domains.scheduler.advanceTriggerMutation, { triggerId: trigger._id });
    }

    const duration = Date.now() - startTime;
    console.info(`[scheduler] Completed batch processing in ${duration}ms, processed ${due.length} triggers`);
    return due.length;
  },
});

export const internalProcessDueTriggers = internalAction({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { batchSize }) => {
    await ctx.runMutation(internal.domains.scheduler.processBatchInternal, { batchSize: batchSize ?? 25 });
  },
});
