import type { MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { rrulestr } from 'rrule';
import * as Users from './users';

export type TriggerInput = {
  userExternalId: string;
  rrule: string;
  timezone: string;
  nextRun: string;
  payload: Record<string, unknown>;
  type: 'recurring' | 'one_off';
};

const nextRunFromRule = (rrule: string, from: Date) => {
  const rule = rrulestr(rrule);
  return rule.after(from, true)?.getTime() ?? null;
};

export const createTrigger = async (ctx: MutationCtx, input: TriggerInput) => {
  const user = await Users.getByExternalId(ctx, input.userExternalId);
  if (!user) {
    throw new Error(`User ${input.userExternalId} not found`);
  }
  const triggerId = await ctx.db.insert('triggers', {
    userId: user._id,
    userExternalId: input.userExternalId,
    rrule: input.rrule,
    timezone: input.timezone,
    payload: input.payload,
    nextRun: new Date(input.nextRun).getTime(),
    type: input.type,
    status: 'active',
  });
  return triggerId;
};

export const cancelTrigger = async (ctx: MutationCtx, triggerId: Doc<'triggers'>['_id']) => {
  await ctx.db.patch(triggerId, { status: 'paused' });
};

export const dueTriggers = async (ctx: MutationCtx, now = Date.now(), limit = 50) => {
  return ctx.db
    .query('triggers')
    .withIndex('by_nextRun', (q) => q.lte('nextRun', now))
    .take(limit);
};

export const advanceTrigger = async (ctx: MutationCtx, trigger: Doc<'triggers'>) => {
  if (trigger.type === 'one_off') {
    await ctx.db.patch(trigger._id, { status: 'paused' });
    return null;
  }
  const next = nextRunFromRule(trigger.rrule, new Date(trigger.nextRun));
  if (!next) {
    await ctx.db.patch(trigger._id, { status: 'paused' });
    return null;
  }
  await ctx.db.patch(trigger._id, { nextRun: next });
  return next;
};
