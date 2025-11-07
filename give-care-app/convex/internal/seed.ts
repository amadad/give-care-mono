import { internalMutation } from '../_generated/server';
import { interventionsSeedData } from '../lib/interventions_seed';

/**
 * Seed interventions table with evidence-based data
 *
 * Run once via CLI:
 * npx convex run internal:internal/seed:seedInterventions
 *
 * Safe to run multiple times - clears existing data first
 */
export const seedInterventions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing interventions
    const existing = await ctx.db.query('interventions').collect();
    for (const intervention of existing) {
      await ctx.db.delete(intervention._id);
    }

    // Insert seed data
    let inserted = 0;
    for (const data of interventionsSeedData) {
      await ctx.db.insert('interventions', data);
      inserted++;
    }

    return {
      success: true,
      inserted,
      message: `Successfully seeded ${inserted} evidence-based interventions`,
    };
  },
});
