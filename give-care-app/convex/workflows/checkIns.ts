/**
 * Check-ins Workflow
 *
 * Dispatches proactive EMA check-ins based on scheduled triggers.
 * Runs every 15 minutes via cron, sends EMA questions, updates nextRun.
 */

import { WorkflowManager } from '@convex-dev/workflow';
import { components, internal, api } from '../_generated/api';
import { internalAction, internalQuery, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { CATALOG } from '../lib/assessmentCatalog';
import { calculateNextRun } from './scheduling';

const wf = new WorkflowManager(components.workflow);

// ============================================================================
// CRON ENTRYPOINT
// ============================================================================

/**
 * Cron entrypoint: Pull due triggers, send EMA questions
 * Runs every 15 minutes
 */
export const dispatchDue = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.runQuery(internal.workflows.checkIns.listDueTriggers, { now });

    for (const trg of due) {
      await wf.start(ctx, internal.workflows.checkIns.sendEMACheckIn, {
        triggerId: trg._id,
        userId: trg.userId,
      });
    }
  },
});

// ============================================================================
// WORKFLOW: SEND EMA CHECK-IN
// ============================================================================

/**
 * Durable step: Send EMA question, update nextRun
 * Handles session creation, question sending, and schedule updates
 */
export const sendEMACheckIn = wf.define({
  args: { triggerId: v.id('triggers'), userId: v.id('users') },
  handler: async (step, { triggerId, userId }) => {
    const user = await step.runQuery(internal.internal.getUserById, { userId });
    if (!user?.phone) return { sent: false };

    const externalId = user.externalId;
    const name = ((user.metadata)?.profile?.firstName as string) || 'there';

    // Start or continue EMA session
    const active = await step.runQuery(internal.internal.getActiveSessionInternal, {
      userId: user._id,
      definition: 'ema',
    });

    let session = active;
    if (!session) {
      // Start new session
      await step.runMutation(internal.internal.startAssessmentInternal, {
        userId: user._id,
        definition: 'ema',
        channel: 'sms',
      });
      // Fetch the session we just created
      session = await step.runQuery(internal.internal.getActiveSessionInternal, {
        userId: user._id,
        definition: 'ema',
      });
    }

    if (!session) {
      console.error('[checkIns] Failed to create/fetch EMA session');
      return { sent: false };
    }

    // Get question from catalog
    const catalog = CATALOG['ema'];
    const questionIndex = session.questionIndex ?? 0;
    const question = catalog.items[questionIndex];
    const total = catalog.length;

    // Send SMS
    const msg = `Hi ${name}! ${question.text} (${questionIndex + 1} of ${total}) (Reply "skip" to move on)`;
    await step.runAction(
      internal.inbound.sendSmsResponse,
      {
        to: user.phone,
        text: msg,
        userId: externalId,
      },
      { retry: true }
    );

    // Update nextRun (reuse calculateNextRun from scheduling.ts)
    const trigger = await step.runQuery(internal.workflows.checkIns.getTrigger, { triggerId });
    if (trigger) {
      const nextRun = calculateNextRun(trigger.rrule, trigger.timezone);
      await step.runMutation(internal.workflows.checkIns.bumpNextRun, {
        triggerId,
        nextRun,
      });
    }

    return { sent: true };
  },
});

// ============================================================================
// HELPER QUERIES/MUTATIONS
// ============================================================================

/**
 * List triggers that are due (nextRun <= now)
 */
export const listDueTriggers = internalQuery({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    return await ctx.db
      .query('triggers')
      .withIndex('by_nextRun', (q) => q.lte('nextRun', now))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();
  },
});

/**
 * Get trigger by ID
 */
export const getTrigger = internalQuery({
  args: { triggerId: v.id('triggers') },
  handler: async (ctx, { triggerId }) => {
    return await ctx.db.get(triggerId);
  },
});

/**
 * Update nextRun for a trigger
 */
export const bumpNextRun = internalMutation({
  args: { triggerId: v.id('triggers'), nextRun: v.number() },
  handler: async (ctx, { triggerId, nextRun }) => {
    await ctx.db.patch(triggerId, { nextRun });
  },
});

