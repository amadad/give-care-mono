/**
 * Interventions Workflow
 *
 * Automatically suggests interventions after assessments based on pressure zones.
 * Respects user preferences (liked/disliked interventions).
 */

import { WorkflowManager } from '@convex-dev/workflow';
import { components, api, internal } from '../_generated/api';
import { internalQuery } from '../_generated/server';
import { v } from 'convex/values';
import { mapToInterventionZones } from '../lib/zones';
import { DataModel, Id } from '../_generated/dataModel';

const wf = new WorkflowManager(components.workflow);

// ============================================================================
// SUGGEST INTERVENTIONS WORKFLOW
// ============================================================================

/**
 * Suggest interventions after assessment completion
 * Filters out disliked, prioritizes liked interventions
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

    // Get assessment to determine definition
    const assessment = await step.runQuery(internal.internal.getAssessmentById, {
      assessmentId,
    });
    const definition = (assessment?.definitionId as any) || 'bsfc';

    // Map assessment zones to intervention zones
    const interventionZones = mapToInterventionZones(definition, zones);

    if (interventionZones.length === 0) return;

    // Get user preferences (liked/disliked)
    const prefs = await step.runQuery(internal.workflows.interventions.userPrefs, {
      userId,
    });

    // Fetch interventions via direct query in workflow step
    // Note: Workflows can't call public queries, so we'll query directly
    const interventions = await step.runQuery(internal.workflows.interventions.getInterventionsByZonesInternal, {
      zones: interventionZones,
      minEvidenceLevel: 'moderate',
      limit: 5,
    });

    // Filter out disliked, prioritize liked
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

// ============================================================================
// HELPER QUERIES
// ============================================================================

/**
 * Get user intervention preferences (liked/disliked sets)
 */
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

/**
 * Get interventions by zones (internal version for workflows)
 */
export const getInterventionsByZonesInternal = internalQuery({
  args: {
    zones: v.array(v.string()),
    minEvidenceLevel: v.optional(v.union(v.literal('high'), v.literal('moderate'), v.literal('low'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { zones, minEvidenceLevel = 'moderate', limit = 5 }) => {
    const EVIDENCE_ORDER: Record<string, number> = {
      high: 3,
      moderate: 2,
      low: 1,
    };
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
        return {
          ...intervention,
          overlapCount: overlap.length,
        };
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

