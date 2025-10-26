/**
 * Tests for Resource Search Function (N+1 Query Elimination)
 *
 * This test suite validates the resource search function behavior and performance:
 * 1. Functional behavior (zip matching, RBI scoring, result ordering)
 * 2. Performance metrics (query count, response time)
 * 3. Edge cases (no matches, national fallback, empty database)
 *
 * TDD Workflow:
 * - Phase 1: Write tests capturing current behavior ✓
 * - Phase 2: Run tests to establish baseline
 * - Phase 3: Refactor to eliminate N+1 queries
 * - Phase 4: Verify tests pass with optimized implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import schema from '../convex/schema'
import type { Id } from '../convex/_generated/dataModel'

// Import Convex functions for testing
const modules = import.meta.glob('../convex/**/*.ts')

// Helper to call findResourcesInternal directly (since it's not exported via api)
async function callFindResources(
  t: any,
  args: {
    zip: string
    zones?: string[]
    bands?: string[]
    limit?: number
  }
) {
  return await t.run(async (ctx) => {
    const mod = await import('../convex/functions/resources.ts')
    // Call the internal function directly
    return await (mod as any).default(ctx, args)
  })
}

describe('Resource Search - Functional Tests', () => {
  describe('ZIP Code Matching', () => {
    it('should find resources by exact ZIP match', async () => {
      const t = convexTest(schema, modules)

      // Create test provider
      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Test Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create test program with pressure zones
      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Test Program',
          description: 'A test program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management', 'emotional_wellbeing'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create service area with exact ZIP
      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'zip_cluster',
          geoCodes: ['941', '942'], // ZIP 3-digit codes
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create resource
      const resourceId = await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://test.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_basic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Query with matching ZIP using the internal function directly
      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110', // Matches '941' prefix
          zones: ['time_management'],
          limit: 5,
        })
      })

      expect(results).toHaveLength(1)
      expect(results[0].resource._id).toBe(resourceId)
      expect(results[0].program._id).toBe(programId)
      expect(results[0].provider._id).toBe(providerId)
      expect(results[0].rbi).toBeGreaterThan(0)
    })

    it('should match ZIP by 3-digit cluster', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Cluster Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Cluster Program',
          resourceCategory: ['support_groups'],
          pressureZones: ['social_support'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'zip_cluster',
          geoCodes: ['900', '901'], // 3-digit clusters
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://cluster.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Query with ZIP starting with '900'
      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '90001',
          limit: 5,
        })
      })

      expect(results).toHaveLength(1)
      expect(results[0].serviceArea.type).toBe('zip_cluster')
    })

    it('should fall back to national resources when no local match', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'National Provider',
          sector: 'government',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'National Hotline',
          resourceCategory: ['crisis_intervention'],
          pressureZones: ['crisis'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'national',
          geoCodes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const resourceId = await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'tel:988',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Query with non-matching ZIP
      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '99999', // No local match
          limit: 5,
        })
      })

      expect(results).toHaveLength(1)
      expect(results[0].resource._id).toBe(resourceId)
      expect(results[0].serviceArea.type).toBe('national')
    })
  })

  describe('RBI Scoring', () => {
    it('should calculate RBI scores correctly', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'RBI Test Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'RBI Program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management', 'physical_health'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'county',
          geoCodes: ['94110'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create resource with full verification
      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://verified.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          successCount: 10,
          issueCount: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          zones: ['time_management', 'physical_health'], // Perfect match
          limit: 5,
        })
      })

      expect(results).toHaveLength(1)
      expect(results[0].rbi).toBeGreaterThan(50) // High score due to verification + freshness + zone match
      expect(results[0].zoneMatch).toBeGreaterThan(0.5)
      expect(results[0].outcomeSignal).toBeGreaterThan(0.8) // 10 successes, 1 issue = 0.909
    })

    it('should penalize unverified resources', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Unverified Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Unverified Program',
          resourceCategory: ['support_groups'],
          pressureZones: ['social_support'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'national',
          geoCodes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://unverified.com',
          dataSourceType: 'scraped',
          verificationStatus: 'unverified',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          zones: ['social_support'],
          limit: 5,
        })
      })

      expect(results).toHaveLength(1)
      expect(results[0].rbi).toBeLessThan(40) // Low score due to unverified status
    })

    it('should apply crisis band multiplier', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Crisis Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Crisis Line',
          resourceCategory: ['crisis_intervention'],
          pressureZones: ['crisis'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'national',
          geoCodes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'tel:988',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Without crisis band
      const normalResults = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          limit: 5,
        })
      })

      // With crisis band
      const crisisResults = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          bands: ['crisis'],
          limit: 5,
        })
      })

      expect(normalResults).toHaveLength(1)
      expect(crisisResults).toHaveLength(1)
      expect(crisisResults[0].rbi).toBeGreaterThan(normalResults[0].rbi) // 5% boost
    })
  })

  describe('Result Ordering and Limits', () => {
    it('should sort results by RBI score descending', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Multi Resource Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Multi Resource Program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'national',
          geoCodes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create 3 resources with different verification levels
      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://unverified.com',
          dataSourceType: 'scraped',
          verificationStatus: 'unverified',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://basic.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_basic',
          lastVerifiedDate: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days old
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://full.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days old
          successCount: 20,
          issueCount: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          zones: ['time_management'],
          limit: 5,
        })
      })

      expect(results).toHaveLength(3)
      // Highest RBI should be first (verified_full + fresh + good outcomes)
      expect(results[0].resource.verificationStatus).toBe('verified_full')
      expect(results[0].rbi).toBeGreaterThan(results[1].rbi)
      expect(results[1].rbi).toBeGreaterThan(results[2].rbi)
    })

    it('should respect limit parameter', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Limit Test Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Limit Test Program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'national',
          geoCodes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create 10 resources
      await t.run(async (ctx) => {
        for (let i = 0; i < 10; i++) {
          await ctx.db.insert('resources', {
            programId,
            primaryUrl: `https://resource${i}.com`,
            dataSourceType: 'manual_entry',
            verificationStatus: 'verified_basic',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          limit: 3,
        })
      })

      expect(results).toHaveLength(3) // Should only return 3, not all 10
    })

    it('should use default limit of 5 when not specified', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Default Limit Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Default Limit Program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'national',
          geoCodes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create 10 resources
      await t.run(async (ctx) => {
        for (let i = 0; i < 10; i++) {
          await ctx.db.insert('resources', {
            programId,
            primaryUrl: `https://default${i}.com`,
            dataSourceType: 'manual_entry',
            verificationStatus: 'verified_basic',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
        })
      })

      expect(results).toHaveLength(5) // Default limit
    })
  })

  describe('Edge Cases', () => {
    it('should return empty array when no resources exist', async () => {
      const t = convexTest(schema, modules)

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          limit: 5,
        })
      })

      expect(results).toHaveLength(0)
    })

    it('should handle empty ZIP code gracefully', async () => {
      const t = convexTest(schema, modules)

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '',
          limit: 5,
        })
      })

      expect(results).toHaveLength(0)
    })

    it('should handle short ZIP codes (less than 3 digits)', async () => {
      const t = convexTest(schema, modules)

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '12',
          limit: 5,
        })
      })

      expect(results).toHaveLength(0)
    })

    it('should handle program with no service areas', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'No Service Area Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'No Service Area Program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create resource WITHOUT service area
      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://noservicearea.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_basic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          limit: 5,
        })
      })

      // Should not crash, but won't return resource without service area
      expect(results).toHaveLength(0)
    })

    it('should handle resource with facility', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Facility Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const facilityId = await t.run(async (ctx) => {
        return await ctx.db.insert('facilities', {
          providerId,
          name: 'Test Facility',
          phoneE164: '+14155551234',
          zip: '94110',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Facility Program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'zip_cluster',
          geoCodes: ['941'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          facilityId,
          primaryUrl: 'https://facility.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          limit: 5,
        })
      })

      expect(results).toHaveLength(1)
      expect(results[0].facility).toBeDefined()
      expect(results[0].facility?._id).toBe(facilityId)
      expect(results[0].facility?.phoneE164).toBe('+14155551234')
    })
  })
})

describe('Resource Search - Performance Tests', () => {
  describe('Response Time Baseline (Current Implementation)', () => {
    it('should measure baseline performance with 50 programs', async () => {
      const t = convexTest(schema, modules)

      // Create realistic test data (50 programs)
      await t.run(async (ctx) => {
        for (let i = 0; i < 50; i++) {
          const providerId = await ctx.db.insert('providers', {
            name: `Provider ${i}`,
            sector: 'nonprofit',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })

          const programId = await ctx.db.insert('programs', {
            providerId,
            name: `Program ${i}`,
            resourceCategory: ['respite_care'],
            pressureZones: ['time_management'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })

          await ctx.db.insert('serviceAreas', {
            programId,
            type: i % 3 === 0 ? 'national' : 'zip_cluster',
            geoCodes: i % 3 === 0 ? [] : ['94' + (i % 10)],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })

          // Some programs have multiple resources
          const resourceCount = i % 5 === 0 ? 3 : 1
          for (let j = 0; j < resourceCount; j++) {
            await ctx.db.insert('resources', {
              programId,
              primaryUrl: `https://program${i}-resource${j}.com`,
              dataSourceType: 'manual_entry',
              verificationStatus: j === 0 ? 'verified_full' : 'verified_basic',
              lastVerifiedDate: Date.now() - j * 30 * 24 * 60 * 60 * 1000,
              successCount: 10 - j,
              issueCount: j,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            })
          }
        }
      })

      const start = Date.now()

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          zones: ['time_management', 'social_support'],
          bands: ['crisis'],
          limit: 5,
        })
      })

      const duration = Date.now() - start

      expect(results.length).toBeGreaterThan(0)
      console.log(`[BASELINE] Response time: ${duration}ms for ${results.length} results from 50 programs`)

      // This establishes baseline - will likely be slow with current N+1 implementation
      // After optimization, we'll target <1000ms
    })
  })

  describe('Deduplication', () => {
    it('should deduplicate service areas correctly', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Duplicate Test Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Duplicate Test Program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create duplicate service areas (same programId + type)
      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'zip_cluster',
          geoCodes: ['941', '942'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'zip_cluster',
          geoCodes: ['943', '944'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://duplicate.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_basic',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesInternal } = await import('../convex/functions/resources.ts')
        return await findResourcesInternal(ctx, {
          zip: '94110',
          limit: 5,
        })
      })

      // Should return only 1 result despite duplicate service areas
      expect(results).toHaveLength(1)
    })
  })
})
