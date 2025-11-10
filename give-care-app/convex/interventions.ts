import { query } from './_generated/server';
import { v } from 'convex/values';

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

    const interventions = await ctx.db.query('interventions').collect();
    const scored = interventions
      .filter((intervention) => evidenceRank(intervention.evidenceLevel) >= minRank)
      .map((intervention) => {
        const overlap = intervention.targetZones.filter((zone) =>
          targetZones.size === 0 ? true : targetZones.has(zone.toLowerCase())
        );
        return {
          ...intervention,
          overlapCount: overlap.length,
        };
      })
      .filter((intervention) => targetZones.size === 0 || intervention.overlapCount > 0)
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

