/**
 * Consolidated Workflows
 *
 * All durable workflows, cron actions, and helper queries/mutations in one file.
 * Previously split across 10 files, now consolidated for simplicity.
 */

import { WorkflowManager } from '@convex-dev/workflow';
import { components, internal, api } from './_generated/api';
import { internalAction, internalQuery, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { CATALOG } from './lib/assessmentCatalog';
import { DataModel, Id } from './_generated/dataModel';
import { RRule } from 'rrule';
import { DateTime } from 'luxon';
import { LANGUAGE_MODELS } from './lib/models';
import {
  toAssessmentAnswers,
  mapToInterventionZones,
  FACT_EXTRACTION_TIMEOUT_MS,
  CONTEXT_BUILDING_TIMEOUT_MS,
  DEFAULT_MEMORY_LIMIT,
} from './lib/utils';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

const wf = new WorkflowManager(components.workflow);
const workflow = new WorkflowManager(components.workflow);

// ============================================================================
// CHECK-INS WORKFLOW
// ============================================================================

/**
 * Cron entrypoint: Pull due triggers, send EMA questions
 * Runs every 15 minutes
 */
export const dispatchDue = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.runQuery(internal.workflows.listDueTriggers, { now });

    for (const trg of due) {
      await wf.start(ctx, internal.workflows.sendEMACheckIn, {
        triggerId: trg._id,
        userId: trg.userId,
      });
    }
  },
});

/**
 * Durable step: Send EMA question, update nextRun
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
      await step.runMutation(internal.internal.startAssessmentInternal, {
        userId: user._id,
        definition: 'ema',
        channel: 'sms',
      });
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

    // Update nextRun
    const trigger = await step.runQuery(internal.workflows.getTrigger, { triggerId });
    if (trigger) {
      const nextRun = calculateNextRun(trigger.rrule, trigger.timezone);
      await step.runMutation(internal.workflows.bumpNextRun, {
        triggerId,
        nextRun,
      });
    }

    return { sent: true };
  },
});

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

export const getTrigger = internalQuery({
  args: { triggerId: v.id('triggers') },
  handler: async (ctx, { triggerId }) => {
    return await ctx.db.get(triggerId);
  },
});

export const bumpNextRun = internalMutation({
  args: { triggerId: v.id('triggers'), nextRun: v.number() },
  handler: async (ctx, { triggerId, nextRun }) => {
    await ctx.db.patch(triggerId, { nextRun });
  },
});

// ============================================================================
// TRENDS WORKFLOW
// ============================================================================

/**
 * Detect score trends and trigger intervention suggestions
 * Runs every 6 hours via cron
 */
export const detectScoreTrends = internalAction({
  args: {},
  handler: async (ctx) => {
    const allUserScores = await ctx.runQuery(internal.workflows.getAllUserScores, {});

    for (const { userId, scores } of allUserScores) {
      if (scores.length < 2) continue;

      const upDown = scores[0].composite - scores[1].composite;
      const declining = upDown >= 5;

      if (declining) {
        const assessment = await ctx.runQuery(internal.internal.getAssessmentById, {
          assessmentId: scores[0].assessmentId,
        });

        if (assessment) {
          const catalog = CATALOG[assessment.definitionId as 'ema' | 'bsfc' | 'reach2' | 'sdoh'];
          const normalized = toAssessmentAnswers(assessment.answers);
          const { pressureZones } = catalog.score(normalized);

          await ctx.scheduler.runAfter(0, internal.workflows.suggestInterventions, {
            userId,
            assessmentId: scores[0].assessmentId,
            zones: pressureZones,
          });
        }
      }
    }
  },
});

export const getUserScores = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(5);
  },
});

export const getAllUserScores = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const scorePromises = users.map(async (user) => {
      const scores = await ctx.db
        .query('scores')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .take(2);
      return { userId: user._id, scores };
    });
    const allScores = await Promise.all(scorePromises);
    return allScores.filter((item) => item.scores.length >= 2);
  },
});

// ============================================================================
// ENGAGEMENT WORKFLOW
// ============================================================================

/**
 * Monitor user engagement and send re-engagement messages
 * Runs every 24 hours via cron
 */
export const monitorEngagement = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.internal.getAllUsers, {});

    for (const u of users) {
      const recent = await ctx.runQuery(internal.workflows.getRecentRuns, {
        userId: u._id,
        days: 7,
      });

      if (recent.length === 0 && u.phone) {
        const name = ((u.metadata as any)?.profile?.firstName as string) || 'there';
        const msg = `Hi ${name}, we haven't heard from you in a while. How are you doing? Reply anytime if you need support.`;

        await ctx.runAction(internal.inbound.sendSmsResponse, {
          to: u.phone,
          userId: u.externalId,
          text: msg,
        });
      }
    }
  },
});

export const getRecentRuns = internalQuery({
  args: { userId: v.id('users'), days: v.number() },
  handler: async (ctx, { userId, days }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return await ctx.db
      .query('agent_runs')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), user.externalId),
          q.gte(q.field('_creationTime'), cutoff)
        )
      )
      .collect();
  },
});

// ============================================================================
// INTERVENTIONS WORKFLOW
// ============================================================================

/**
 * Suggest interventions after assessment completion
 */
export const suggestInterventions = wf.define({
  args: {
    userId: v.id('users'),
    assessmentId: v.id('assessments'),
    zones: v.array(v.string()),
  },
  handler: async (step, { userId, assessmentId, zones }) => {
    const user = await step.runQuery(internal.internal.getUserById, { userId });
    if (!user?.phone) return;

    const externalId = user.externalId;
    const assessment = await step.runQuery(internal.internal.getAssessmentById, { assessmentId });
    const definition = (assessment?.definitionId as any) || 'bsfc';

    const interventionZones = mapToInterventionZones(definition, zones);
    if (interventionZones.length === 0) return;

    const prefs = await step.runQuery(internal.workflows.userPrefs, { userId });

    const interventions = await step.runQuery(internal.workflows.getInterventionsByZonesInternal, {
      zones: interventionZones,
      minEvidenceLevel: 'moderate',
      limit: 5,
    });

    const filtered = interventions
      .filter((i: any) => !prefs.disliked.has(String(i._id)))
      .sort((a: any, b: any) => {
        const aLiked = prefs.liked.has(String(a._id)) ? 1 : 0;
        const bLiked = prefs.liked.has(String(b._id)) ? 1 : 0;
        return bLiked - aLiked;
      })
      .slice(0, 3);

    if (filtered.length > 0) {
      const msg =
        `Based on your results, here are a few to try:\n` +
        filtered
          .map((i: any, idx: number) => `${idx + 1}. ${i.title} (${i.evidenceLevel})`)
          .join('\n');

      await step.runAction(
        internal.inbound.sendSmsResponse,
        {
          to: user.phone,
          userId: externalId,
          text: msg,
        },
        { retry: true }
      );
    }
  },
});

export const userPrefs = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const items = await ctx.db
      .query('intervention_events')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return {
      liked: new Set(
        items
          .filter((i) => i.status === 'liked' || i.status === 'helpful')
          .map((i) => i.interventionId)
      ),
      disliked: new Set(
        items
          .filter((i) => i.status === 'disliked' || i.status === 'not_helpful')
          .map((i) => i.interventionId)
      ),
    };
  },
});

export const getInterventionsByZonesInternal = internalQuery({
  args: {
    zones: v.array(v.string()),
    minEvidenceLevel: v.optional(v.union(v.literal('high'), v.literal('moderate'), v.literal('low'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { zones, minEvidenceLevel = 'moderate', limit = 5 }) => {
    const EVIDENCE_ORDER: Record<string, number> = { high: 3, moderate: 2, low: 1 };
    const evidenceRank = (level: string) => EVIDENCE_ORDER[level] ?? 0;
    const targetZones = new Set(zones.map((zone) => zone.toLowerCase()));
    const minRank = evidenceRank(minEvidenceLevel);

    if (targetZones.size === 0) {
      const interventions = await ctx.db
        .query('interventions')
        .withIndex('by_evidence', (q) => q.eq('evidenceLevel', minEvidenceLevel))
        .take(limit * 2);

      return interventions
        .filter((intervention) => evidenceRank(intervention.evidenceLevel) >= minRank)
        .sort((a, b) => {
          const evidenceDiff = evidenceRank(b.evidenceLevel) - evidenceRank(a.evidenceLevel);
          return evidenceDiff !== 0 ? evidenceDiff : a.title.localeCompare(b.title);
        })
        .slice(0, limit);
    }

    const matchingInterventionIds = new Set<Id<'interventions'>>();
    for (const zone of targetZones) {
      const zoneMatches = await ctx.db
        .query('intervention_zones')
        .withIndex('by_zone', (q) => q.eq('zone', zone))
        .collect();
      for (const match of zoneMatches) {
        matchingInterventionIds.add(match.interventionId);
      }
    }

    if (matchingInterventionIds.size === 0) {
      return [];
    }

    const interventionIds = Array.from(matchingInterventionIds);
    const interventions = await Promise.all(interventionIds.map((id) => ctx.db.get(id)));

    type InterventionDoc = DataModel['interventions']['document'];
    const scored = interventions
      .filter((intervention): intervention is InterventionDoc => {
        if (!intervention) return false;
        return 'evidenceLevel' in intervention && 'targetZones' in intervention;
      })
      .filter((intervention) => evidenceRank(intervention.evidenceLevel) >= minRank)
      .map((intervention) => {
        const overlap = intervention.targetZones.filter((zone: string) =>
          targetZones.has(zone.toLowerCase())
        );
        return { ...intervention, overlapCount: overlap.length };
      })
      .filter((intervention) => intervention.overlapCount > 0)
      .sort((a, b) => {
        const evidenceDiff = evidenceRank(b.evidenceLevel) - evidenceRank(a.evidenceLevel);
        if (evidenceDiff !== 0) return evidenceDiff;
        if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;
        return a.title.localeCompare(b.title);
      })
      .slice(0, limit)
      .map(({ overlapCount: _overlap, ...rest }) => rest);

    return scored;
  },
});

// ============================================================================
// CRISIS WORKFLOW
// ============================================================================

/**
 * Crisis escalation workflow
 */
export const crisisEscalation = workflow.define({
  args: {
    userId: v.id('users'),
    threadId: v.string(),
    messageText: v.string(),
    crisisTerms: v.array(v.string()),
    severity: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
  },
  handler: async (step, args): Promise<{
    success: boolean;
    alertId: any;
    emergencyContactNotified: boolean;
  }> => {
    const alertId: any = await step.runMutation(internal.workflows.logCrisisEvent, {
      userId: args.userId,
      severity: args.severity,
      terms: args.crisisTerms,
      messageText: args.messageText,
    });

    let emergencyContactNotified = false;
    if (args.severity === 'high') {
      const notificationResult: any = await step.runAction(
        internal.workflows.notifyEmergencyContact,
        {
          userId: args.userId,
          alertId,
          messageText: args.messageText,
        }
      );
      emergencyContactNotified = notificationResult.sent;
    }

    await step.runMutation(internal.workflows.scheduleFollowUp, {
      userId: args.userId,
      alertId,
      hoursFromNow: 24,
    });

    return { success: true, alertId, emergencyContactNotified };
  },
});

/**
 * Follow-up workflow for crisis check-ins
 */
export const crisisFollowUp = workflow.define({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
  },
  handler: async (step, args): Promise<{
    success: boolean;
    followUpSent: boolean;
  }> => {
    const recentActivity: any = await step.runQuery(internal.workflows.checkRecentActivity, {
      userId: args.userId,
      hoursAgo: 24,
    });

    let followUpSent = false;
    if (!recentActivity.hasActivity) {
      await step.runAction(internal.workflows.sendFollowUpMessage, {
        userId: args.userId,
        alertId: args.alertId,
      });
      followUpSent = true;
    }

    await step.runMutation(internal.workflows.updateCrisisEvent, {
      alertId: args.alertId,
      status: 'processed',
    });

    return { success: true, followUpSent };
  },
});

export const logCrisisEvent = internalMutation({
  args: {
    userId: v.id('users'),
    severity: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    terms: v.array(v.string()),
    messageText: v.string(),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.insert('alerts', {
      userId: args.userId,
      type: 'crisis_detected',
      severity: args.severity === 'high' ? 'critical' : args.severity === 'medium' ? 'high' : 'medium',
      message: `Crisis detected: ${args.terms.join(', ')}`,
      context: {
        terms: args.terms,
        originalMessage: args.messageText,
        detectedAt: Date.now(),
      },
      channel: 'sms',
      status: 'pending',
    });
    return alert;
  },
});

export const notifyEmergencyContact = internalAction({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
    messageText: v.string(),
  },
  handler: async (ctx, args): Promise<{ sent: boolean; recipient?: string }> => {
    const user = await ctx.runQuery(internal.internal.getUserById, { userId: args.userId });
    if (!user) return { sent: false };

    const hasConsent = user.consent?.emergency ?? false;
    if (!hasConsent) return { sent: false };

    const emergencyContact: any = user.metadata?.emergencyContact;
    if (!emergencyContact || !emergencyContact.email) return { sent: false };

    return { sent: false, recipient: emergencyContact.email };
  },
});

export const scheduleFollowUp = internalMutation({
  args: {
    userId: v.id('users'),
    alertId: v.id('alerts'),
    hoursFromNow: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      args.hoursFromNow * 60 * 60 * 1000,
      internal.workflows.crisisFollowUp,
      {
        userId: args.userId,
        alertId: args.alertId,
      }
    );
  },
});

export const checkRecentActivity = internalQuery({
  args: { userId: v.id('users'), hoursAgo: v.number() },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - args.hoursAgo * 60 * 60 * 1000;
    const recentRuns = await ctx.db
      .query('agent_runs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('_creationTime'), cutoffTime))
      .take(1);
    return {
      hasActivity: recentRuns.length > 0,
      lastSeen: recentRuns[0]?._creationTime,
    };
  },
});

export const sendFollowUpMessage = internalAction({
  args: { userId: v.id('users'), alertId: v.id('alerts') },
  handler: async (ctx, args) => {
    const userDoc = await ctx.runQuery(internal.internal.getUserById, { userId: args.userId });
    if (!userDoc || !userDoc.phone) return { sent: false };

    const userName = userDoc.metadata?.profile?.firstName || 'there';
    const message = `Hi ${userName}, this is a follow-up from GiveCare. We wanted to check in and see how you're doing. If you need support, please reach out anytime. 988 Suicide & Crisis Lifeline is available 24/7.`;

    await ctx.runAction(internal.inbound.sendSmsResponse, {
      to: userDoc.phone,
      text: message,
      userId: userDoc.externalId,
    });

    return { sent: true };
  },
});

export const updateCrisisEvent = internalMutation({
  args: { alertId: v.id('alerts'), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: 'processed',
      payload: {
        followUpStatus: args.status,
        processedAt: Date.now(),
      },
    });
  },
});

// ============================================================================
// MEMORY WORKFLOW
// ============================================================================

/**
 * Memory enrichment workflow
 */
export const enrichMemory = workflow.define({
  args: {
    userId: v.string(),
    threadId: v.string(),
    recentMessages: v.array(v.any()),
  },
  handler: async (step, { userId, threadId, recentMessages }) => {
    const user = await step.runQuery(internal.internal.getByExternalIdQuery, {
      externalId: userId,
    });
    if (!user) {
      console.warn(`[memory-enrichment] User not found: ${userId}`);
      return { enriched: 0, contextReady: false };
    }

    const facts = await step.runAction(
      internal.workflows.extractFacts,
      { userId, recentMessages },
      { retry: true }
    );

    if (facts && facts.length > 0) {
      await step.runMutation(internal.workflows.saveFacts, {
        convexUserId: user._id,
        facts,
      });
    }

    const enrichedContext = await step.runAction(
      internal.workflows.buildContext,
      { userId, threadId },
      { retry: true }
    );

    await step.runMutation(internal.workflows.updateContext, {
      convexUserId: user._id,
      enrichedContext,
    });

    return { enriched: facts.length, contextReady: true };
  },
});

export const extractFacts = internalAction({
  args: { userId: v.string(), recentMessages: v.array(v.any()) },
  handler: async (ctx, { userId, recentMessages }) => {
    if (recentMessages.length < 2) return [];

    const limitedMessages = recentMessages.slice(-3);
    const conversationText = limitedMessages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Fact extraction timeout after 2s')), FACT_EXTRACTION_TIMEOUT_MS);
      });

      const extractionPromise = generateObject({
        model: LANGUAGE_MODELS.memory,
        prompt: `Extract important long-term facts about this caregiver from the conversation below.
Focus on:
- Care recipient details (name, condition, relationship) - use 'family_health'
- Caregiver stress levels, triggers, coping strategies
- Important dates, routines, preferences
- Crisis indicators or concerning patterns

Conversation:
${conversationText}`,
        schema: z.array(
          z.object({
            fact: z.string().describe('The fact to remember'),
            category: z.enum(['care_routine', 'preference', 'crisis_trigger', 'intervention_result', 'family_health']),
            importance: z.number().min(1).max(10).describe('Importance score 1-10'),
          })
        ),
        temperature: 0.2,
        providerOptions: {
          google: {
            topP: 0.8,
            maxOutputTokens: 300,
          },
        },
      });

      const result = await Promise.race([extractionPromise, timeoutPromise]);
      return result.object;
    } catch (error) {
      console.error('[memory-enrichment] Fact extraction failed:', error);
      return [];
    }
  },
});

export const buildContext = internalAction({
  args: { userId: v.string(), threadId: v.string() },
  handler: async (ctx, { userId, threadId }) => {
    const memories = await ctx.runQuery(api.public.listMemories, {
      userId,
      limit: DEFAULT_MEMORY_LIMIT,
    });

    if (!memories || memories.length === 0) {
      return null;
    }

    const memoriesText = memories
      .map((m: any) => `[${m.category}] ${m.content} (importance: ${m.importance})`)
      .join('\n');

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Context building timeout after 2s')), CONTEXT_BUILDING_TIMEOUT_MS);
      });

      const generationPromise = generateText({
        model: LANGUAGE_MODELS.memory,
        prompt: `Summarize these caregiver facts into a concise context paragraph (max 150 words) for use in future conversations:

${memoriesText}

Focus on:
- Who they are (name, relationship)
- Care situation (recipient, condition)
- Current challenges and stress levels
- Important patterns or triggers

Context summary:`,
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 200,
        providerOptions: {
          google: {},
        },
      });

      const result = await Promise.race([generationPromise, timeoutPromise]);
      return result.text;
    } catch (error) {
      console.error('[memory-enrichment] Context building failed:', error);
      return null;
    }
  },
});

export const saveFacts = internalMutation({
  args: { convexUserId: v.id('users'), facts: v.array(v.any()) },
  handler: async (ctx, { convexUserId, facts }) => {
    for (const fact of facts) {
      await ctx.db.insert('memories', {
        userId: convexUserId,
        category: fact.category || 'preference',
        content: fact.fact,
        importance: fact.importance || 5,
      });
    }
  },
});

export const updateContext = internalMutation({
  args: { convexUserId: v.id('users'), enrichedContext: v.union(v.string(), v.null()) },
  handler: async (ctx, { convexUserId, enrichedContext }) => {
    const user = await ctx.db.get(convexUserId);
    if (!user) return;

    const metadata = (user.metadata ?? {}) as Record<string, unknown>;
    metadata.enrichedContext = enrichedContext;
    metadata.contextUpdatedAt = Date.now();

    await ctx.db.patch(convexUserId, { metadata });
  },
});

// ============================================================================
// SCHEDULING WORKFLOW
// ============================================================================

/**
 * Update check-in schedule based on latest score
 */
export const updateCheckInSchedule = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const latest = await ctx.db
      .query('scores')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    if (!latest) return;

    const freq = bandToFrequency(latest.composite, latest.band);
    const user = await ctx.db.get(userId);
    if (!user) return;

    const md = (user.metadata ?? {}) as Record<string, unknown>;
    const tz = (md.timezone as string) ?? 'America/New_York';
    const preferredHour = ((md.profile as any)?.preferredCheckInHour as number) ?? 19;

    const rrule = rruleFor(freq, preferredHour);
    const nextRun = calculateNextRun(rrule, tz);

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

function bandToFrequency(score: number, band: string): 'DAILY' | 'WEEKLY' | 'BIWEEKLY' {
  if (score >= 72 || band === 'high') return 'DAILY';
  if (score >= 45) return 'WEEKLY';
  return 'BIWEEKLY';
}

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
 * Exported for use in checkIns workflow
 */
export function calculateNextRun(rruleString: string, timezone: string, from = Date.now()): number {
  try {
    const rule = RRule.fromString(rruleString);
    const dt = DateTime.fromMillis(from, { zone: timezone });
    const next = rule.after(dt.toJSDate(), true);
    return next ? next.getTime() : from + 24 * 3600 * 1000;
  } catch (error) {
    console.error('[scheduling] Error calculating next run:', error);
    return from + 24 * 3600 * 1000;
  }
}

// ============================================================================
// RESOURCES WORKFLOW
// ============================================================================

/**
 * Refresh resource cache with Maps Grounding results
 */
export const refresh = workflow.define({
  args: {
    query: v.string(),
    category: v.string(),
    zip: v.string(),
    ttlMs: v.number(),
  },
  handler: async (step, args) => {
    const mapsResult = await step.runAction(
      internal.resources._fetchWithMaps,
      {
        query: args.query,
        category: args.category,
        zip: args.zip,
      },
      { retry: true }
    );

    await step.runMutation(internal.internal.recordResourceLookup, {
      userId: undefined,
      category: args.category,
      zip: args.zip,
      results: mapsResult.resources,
      expiresAt: Date.now() + args.ttlMs,
    });

    return { success: true };
  },
});

