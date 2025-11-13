/**
 * Seed Interventions
 *
 * Idempotent mutation to seed all 16 interventions across various zones.
 * Inserts into interventions and intervention_zones tables.
 *
 * Signature: internal.scripts.seedInterventions()
 */

import { internalMutation } from '../_generated/server';
import { INTERVENTION_SEEDS } from '../lib/interventionSeeds';

export const seedInterventions = internalMutation({
  args: {},
  handler: async (ctx) => {
    let seeded = 0;
    let skipped = 0;

    // Seed all 16 interventions
    for (const seed of INTERVENTION_SEEDS) {
      // Check if already exists (idempotent)
      const existing = await ctx.db
        .query('interventions')
        .filter((q) => q.eq(q.field('title'), seed.title))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert intervention
      const interventionId = await ctx.db.insert('interventions', {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        targetZones: seed.targetZones,
        evidenceLevel: seed.evidenceLevel,
        duration: seed.duration,
        tags: seed.tags,
        content: seed.content,
      });

      // Insert zone mappings into join table
      for (const zone of seed.targetZones) {
        await ctx.db.insert('intervention_zones', {
          interventionId,
          zone: zone.toLowerCase(),
        });
      }

      seeded++;
    }

    return {
      seeded,
      skipped,
      total: INTERVENTION_SEEDS.length,
    };
  },
});
