/**
 * Migration: Consolidate User Fields
 *
 * Migrates from old schema fields to new fields:
 * - phoneNumber → phone (consolidate duplicate phone fields)
 *
 * This migration:
 * 1. Copies phoneNumber to phone for users missing phone field
 * 2. Preserves existing data
 * 3. Safe to run multiple times (idempotent)
 */

import { internalMutation } from '../_generated/server';

export const consolidateUserFields = internalMutation({
  handler: async (ctx) => {
    console.log('Starting user fields migration...');

    const users = await ctx.db.query('users').collect();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const updates: Record<string, unknown> = {};
      let needsUpdate = false;

      // Consolidate phone fields: phoneNumber → phone
      if (user.phoneNumber && !user.phone) {
        updates.phone = user.phoneNumber;
        needsUpdate = true;
        console.log(`Migrating phone for user ${user._id}: ${user.phoneNumber} → phone`);
      }

      if (needsUpdate) {
        await ctx.db.patch(user._id, updates);
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`Migration complete:
      - Total users: ${users.length}
      - Migrated: ${migratedCount}
      - Skipped (already migrated): ${skippedCount}
    `);

    return {
      total: users.length,
      migrated: migratedCount,
      skipped: skippedCount,
    };
  },
});
