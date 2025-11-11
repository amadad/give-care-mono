import { query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { DataModel, Id } from './_generated/dataModel';

const EVIDENCE_ORDER: Record<string, number> = {
  high: 3,
  moderate: 2,
  low: 1,
};

const evidenceRank = (level: string) => EVIDENCE_ORDER[level] ?? 0;

export const getByZones = query({
  args: {
    zones: v.array(v.string()),
    minEvidenceLevel: v.optional(v.union(v.literal('high'), v.literal('moderate'), v.literal('low'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { zones, minEvidenceLevel = 'moderate', limit = 5 }) => {
    const targetZones = new Set(zones.map((zone) => zone.toLowerCase()));
    const minRank = evidenceRank(minEvidenceLevel);

    // SPEED: Use indexed join table instead of full table scan
    // O(log n) lookup per zone instead of O(n) scan
    if (targetZones.size === 0) {
      // No zones specified - return all interventions (still use index for evidence level)
      const interventions = await ctx.db
        .query('interventions')
        .withIndex('by_evidence', (q) => q.eq('evidenceLevel', minEvidenceLevel))
        .take(limit * 2); // Fetch extra for sorting
      
      return interventions
        .filter((intervention) => evidenceRank(intervention.evidenceLevel) >= minRank)
        .sort((a, b) => {
          const evidenceDiff = evidenceRank(b.evidenceLevel) - evidenceRank(a.evidenceLevel);
          return evidenceDiff !== 0 ? evidenceDiff : a.title.localeCompare(b.title);
        })
        .slice(0, limit);
    }

    // SPEED: Query intervention_zones by index for each target zone
    // Collect unique intervention IDs that match any target zone
    const matchingInterventionIds = new Set<Id<'interventions'>>();
    
    for (const zone of targetZones) {
      const zoneMatches = await ctx.db
        .query('intervention_zones')
        .withIndex('by_zone', (q) => q.eq('zone', zone))
        .collect(); // Indexed lookup - fast!
      
      for (const match of zoneMatches) {
        matchingInterventionIds.add(match.interventionId);
      }
    }

    if (matchingInterventionIds.size === 0) {
      return [];
    }

    // SPEED: Fetch interventions by ID (batch get) instead of full scan
    const interventionIds = Array.from(matchingInterventionIds);
    const interventions = await Promise.all(
      interventionIds.map((id) => ctx.db.get(id))
    );

    // Filter by evidence level and calculate overlap scores
    // Type guard: ensure we have intervention documents (not other table types)
    type InterventionDoc = DataModel['interventions']['document'];
    const scored = interventions
      .filter((intervention): intervention is InterventionDoc => {
        if (!intervention) return false;
        // Type guard: check if it's an intervention by checking for intervention-specific fields
        return 'evidenceLevel' in intervention && 'targetZones' in intervention;
      })
      .filter((intervention) => evidenceRank(intervention.evidenceLevel) >= minRank)
      .map((intervention) => {
        // Count how many target zones this intervention matches
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

// ============================================================================
// INTERVENTION PREFERENCES
// ============================================================================

/**
 * Record intervention event (tried, liked, disliked, helpful, not_helpful)
 */
export const recordInterventionEvent = internalMutation({
  args: {
    userId: v.id('users'),
    interventionId: v.string(),
    status: v.string(), // 'tried' | 'liked' | 'disliked' | 'helpful' | 'not_helpful'
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('intervention_events', {
      userId: args.userId,
      interventionId: args.interventionId,
      status: args.status,
      metadata: args.metadata,
    });
  },
});

