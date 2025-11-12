/**
 * Seed Promo Codes Migration
 * 
 * Idempotent migration to seed 15 promo codes.
 * Can be run multiple times safely (checks for existing codes).
 */

import { internalMutation } from '../_generated/server';
import { PROMO_CODE_SEEDS } from './promoSeeds';

export const seedPromoCodes = internalMutation({
  args: {},
  handler: async (ctx) => {
    let seeded = 0;
    let skipped = 0;

    for (const seed of PROMO_CODE_SEEDS) {
      // Check if already exists (idempotent)
      const existing = await ctx.db
        .query('promo_codes')
        .withIndex('by_code', (q) => q.eq('code', seed.code))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert promo code
      await ctx.db.insert('promo_codes', {
        code: seed.code,
        discountType: seed.discountType,
        discountValue: seed.discountValue,
        maxUses: seed.maxUses,
        usedCount: 0,
        expiresAt: seed.expiresAt,
        active: seed.active,
      });

      seeded++;
    }

    return {
      seeded,
      skipped,
      total: PROMO_CODE_SEEDS.length,
    };
  },
});

