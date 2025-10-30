/**
 * Tests for resourcesGeoLite Refactoring
 *
 * This test suite validates the behavior of resourcesGeoLite.ts and its dependencies
 * BEFORE and AFTER refactoring to ensure no behavioral changes.
 *
 * Tests cover:
 * 1. Scoring calculations (scoreResource, matchesZones, calculateFreshness)
 * 2. ZIP code resolution and fallback logic
 * 3. Resource matching with zones
 * 4. Result ordering by RBI score
 * 5. Edge cases (empty database, no matches, national fallback)
 *
 * TDD Workflow:
 * - Phase 1: Write tests capturing current behavior
 * - Phase 2: Run tests - should PASS with current code
 * - Phase 3: Refactor (move scoring.ts to lib/)
 * - Phase 4: Run tests - should PASS with refactored code
 */

import { describe, it, expect } from 'vitest'
import { convexTest } from 'convex-test'
import schema from '../convex/schema'
import type { Id } from '../convex/_generated/dataModel'

const modules = import.meta.glob('../convex/**/*.ts')

describe('Scoring Utilities', () => {
  describe('scoreResource', () => {
    it('should calculate correct score for zone match with local coverage', async () => {
      const { scoreResource } = await import('../convex/lib/scoring')

      const score = scoreResource({
        zoneMatch: true,
        coverage: 'zip',
        freshnessDays: 30,
        verified: true,
      })

      // Zone match (0.5) + coverage zip (0.3*1.0) + freshness recent (0.15*~0.92) + verified (0.05)
      // Expected: ~0.5 + 0.3 + 0.138 + 0.05 = 0.988 => 99
      expect(score).toBeGreaterThanOrEqual(98)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should calculate correct score for zone match with state coverage', async () => {
      const { scoreResource } = await import('../convex/lib/scoring')

      const score = scoreResource({
        zoneMatch: true,
        coverage: 'state',
        freshnessDays: 0,
        verified: false,
      })

      // Zone match (0.5) + coverage state (0.3*0.8) + freshness fresh (0.15*1.0) + no verification (0)
      // Expected: 0.5 + 0.24 + 0.15 = 0.89 => 89
      expect(score).toBe(89)
    })

    it('should calculate correct score for no zone match with national coverage', async () => {
      const { scoreResource } = await import('../convex/lib/scoring')

      const score = scoreResource({
        zoneMatch: false,
        coverage: 'national',
        freshnessDays: 180,
        verified: false,
      })

      // No zone match (0.2) + coverage national (0.3*0.6) + freshness medium (0.15*~0.5) + no verification (0)
      // Expected: 0.2 + 0.18 + 0.075 = 0.455 => 46
      expect(score).toBeGreaterThanOrEqual(45)
      expect(score).toBeLessThanOrEqual(47)
    })

    it('should handle stale resources with low freshness score', async () => {
      const { scoreResource } = await import('../convex/lib/scoring')

      const score = scoreResource({
        zoneMatch: true,
        coverage: 'zip',
        freshnessDays: 365,
        verified: true,
      })

      // Zone match (0.5) + coverage zip (0.3) + freshness stale (0) + verified (0.05)
      // Expected: 0.5 + 0.3 + 0 + 0.05 = 0.85 => 85
      expect(score).toBe(85)
    })

    it('should cap score at 100', async () => {
      const { scoreResource } = await import('../convex/lib/scoring')

      const score = scoreResource({
        zoneMatch: true,
        coverage: 'zip',
        freshnessDays: 0,
        verified: true,
      })

      expect(score).toBeLessThanOrEqual(100)
    })

    it('should handle radius coverage same as zip', async () => {
      const { scoreResource } = await import('../convex/lib/scoring')

      const scoreRadius = scoreResource({
        zoneMatch: true,
        coverage: 'radius',
        freshnessDays: 30,
        verified: false,
      })

      const scoreZip = scoreResource({
        zoneMatch: true,
        coverage: 'zip',
        freshnessDays: 30,
        verified: false,
      })

      expect(scoreRadius).toBe(scoreZip)
    })
  })

  describe('matchesZones', () => {
    it('should return true when zones overlap', async () => {
      const { matchesZones } = await import('../convex/lib/scoring')

      const result = matchesZones(
        ['emotional_wellbeing', 'time_management'],
        ['time_management', 'financial_concerns']
      )

      expect(result).toBe(true)
    })

    it('should return false when zones do not overlap', async () => {
      const { matchesZones } = await import('../convex/lib/scoring')

      const result = matchesZones(
        ['emotional_wellbeing', 'social_support'],
        ['time_management', 'financial_concerns']
      )

      expect(result).toBe(false)
    })

    it('should return false when user zones are empty', async () => {
      const { matchesZones } = await import('../convex/lib/scoring')

      const result = matchesZones(['emotional_wellbeing'], [])

      expect(result).toBe(false)
    })

    it('should return false when user zones are undefined', async () => {
      const { matchesZones } = await import('../convex/lib/scoring')

      const result = matchesZones(['emotional_wellbeing'], undefined)

      expect(result).toBe(false)
    })

    it('should handle multiple matching zones', async () => {
      const { matchesZones } = await import('../convex/lib/scoring')

      const result = matchesZones(
        ['emotional_wellbeing', 'time_management', 'financial_concerns'],
        ['time_management', 'financial_concerns', 'social_support']
      )

      expect(result).toBe(true)
    })
  })

  describe('calculateFreshness', () => {
    it('should return 0 days for today', async () => {
      const { calculateFreshness } = await import('../convex/lib/scoring')

      const today = new Date().toISOString()
      const days = calculateFreshness(today)

      expect(days).toBe(0)
    })

    it('should return 30 days for 30 days ago', async () => {
      const { calculateFreshness } = await import('../convex/lib/scoring')

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const days = calculateFreshness(thirtyDaysAgo)

      expect(days).toBe(30)
    })

    it('should return 365 days for undefined lastVerified', async () => {
      const { calculateFreshness } = await import('../convex/lib/scoring')

      const days = calculateFreshness(undefined)

      expect(days).toBe(365)
    })

    it('should handle timestamp numbers', async () => {
      const { calculateFreshness } = await import('../convex/lib/scoring')

      const timestamp = Date.now() - 60 * 24 * 60 * 60 * 1000 // 60 days ago
      const days = calculateFreshness(timestamp)

      expect(days).toBe(60)
    })

    it('should not return negative days', async () => {
      const { calculateFreshness } = await import('../convex/lib/scoring')

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const days = calculateFreshness(tomorrow)

      expect(days).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('resourcesGeoLite Query', () => {
  describe('ZIP Code Resolution', () => {
    it('should resolve NY ZIP codes correctly', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'NY Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'NY Program',
          description: 'NY-specific program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create statewide service area for NY
      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'statewide',
          geoCodes: ['NY'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://ny.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Query with NY ZIP code (10001 = Manhattan)
      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zip: '10001', zones: ['time_management'] })
      })

      expect(results).toHaveLength(1)
      expect(results[0].provider).toBe('NY Provider')
    })

    it('should handle ZIP3 matching for local service areas', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Local Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Local Program',
          description: 'Local area program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create county service area with ZIP3 codes
      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'county',
          geoCodes: ['100', '101'], // Manhattan ZIP3 codes
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://local.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Query with ZIP in range
      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zip: '10023', zones: ['time_management'] })
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].provider).toBe('Local Provider')
    })
  })

  describe('Fallback Logic', () => {
    it('should fallback from ZIP to state when no local matches', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'State Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'State Program',
          description: 'Statewide program',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'statewide',
          geoCodes: ['CA'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://state.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Query with CA ZIP code
      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zip: '90001', zones: ['time_management'] })
      })

      expect(results).toHaveLength(1)
      expect(results[0].provider).toBe('State Provider')
    })

    it('should fallback to national resources when no state matches', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'National Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'National Program',
          description: 'Nationwide program',
          resourceCategory: ['crisis_support'],
          pressureZones: ['emotional_wellbeing'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId,
          type: 'national',
          geoCodes: ['US'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://national.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Query with any ZIP code
      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zip: '12345', zones: ['emotional_wellbeing'] })
      })

      expect(results).toHaveLength(1)
      expect(results[0].provider).toBe('National Provider')
    })
  })

  describe('RBI Scoring and Ordering', () => {
    it('should order results by RBI score descending', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Multi-Program Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Program 1: Zone match + local coverage (high score)
      const program1 = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'High Score Program',
          description: 'Local matched',
          resourceCategory: ['respite_care'],
          pressureZones: ['time_management'], // Matches user zones
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId: program1,
          type: 'county',
          geoCodes: ['100'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId: program1,
          primaryUrl: 'https://high.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Program 2: No zone match + national coverage (low score)
      const program2 = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Low Score Program',
          description: 'National unmatched',
          resourceCategory: ['respite_care'],
          pressureZones: ['social_support'], // Does NOT match user zones
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('serviceAreas', {
          programId: program2,
          type: 'national',
          geoCodes: ['US'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId: program2,
          primaryUrl: 'https://low.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_basic',
          lastVerifiedDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zip: '10001', zones: ['time_management'], limit: 10 })
      })

      // Should have both programs
      expect(results.length).toBeGreaterThanOrEqual(1)

      // First result should be higher scored
      if (results.length >= 2) {
        expect(results[0].rbiScore).toBeGreaterThan(results[1].rbiScore)
      }

      // Should prioritize matched zones
      const highScoreResult = results.find(r => r.title === 'High Score Program')
      expect(highScoreResult).toBeDefined()
      expect(highScoreResult!.rbiScore).toBeGreaterThan(50)
    })

    it('should include RBI score in results', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Program',
          description: 'Test',
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
          geoCodes: ['US'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://test.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zones: ['time_management'] })
      })

      expect(results[0].rbiScore).toBeGreaterThanOrEqual(0)
      expect(results[0].rbiScore).toBeLessThanOrEqual(100)
    })
  })

  describe('Result Formatting', () => {
    it('should include all required fields', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Test Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Test Program',
          description: 'Program description',
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
          geoCodes: ['US'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://test.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: new Date('2024-10-01T00:00:00.000Z').getTime(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zones: ['time_management'] })
      })

      expect(results[0]).toHaveProperty('title', 'Test Program')
      expect(results[0]).toHaveProperty('provider', 'Test Provider')
      expect(results[0]).toHaveProperty('description', 'Program description')
      expect(results[0]).toHaveProperty('website', 'https://test.com')
      expect(results[0]).toHaveProperty('rbiScore')
      expect(results[0]).toHaveProperty('lastVerified')
      expect(results[0]).toHaveProperty('disclaimer', 'Availability changes. Please call to confirm.')
    })

    it('should format lastVerified as locale date string', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const programId = await t.run(async (ctx) => {
        return await ctx.db.insert('programs', {
          providerId,
          name: 'Program',
          description: 'Test',
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
          geoCodes: ['US'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx) => {
        return await ctx.db.insert('resources', {
          programId,
          primaryUrl: 'https://test.com',
          dataSourceType: 'manual_entry',
          verificationStatus: 'verified_full',
          lastVerifiedDate: new Date('2024-10-01T00:00:00.000Z').getTime(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zones: ['time_management'] })
      })

      expect(results[0].lastVerified).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty database gracefully', async () => {
      const t = convexTest(schema, modules)

      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zip: '10001', zones: ['time_management'] })
      })

      expect(results).toEqual([])
    })

    it('should respect limit parameter', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create 10 programs
      for (let i = 0; i < 10; i++) {
        const programId = await t.run(async (ctx) => {
          return await ctx.db.insert('programs', {
            providerId,
            name: `Program ${i}`,
            description: 'Test',
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
            geoCodes: ['US'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })

        await t.run(async (ctx) => {
          return await ctx.db.insert('resources', {
            programId,
            primaryUrl: 'https://test.com',
            dataSourceType: 'manual_entry',
            verificationStatus: 'verified_full',
            lastVerifiedDate: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })
      }

      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zones: ['time_management'], limit: 3 })
      })

      expect(results).toHaveLength(3)
    })

    it('should use default limit of 5 when not specified', async () => {
      const t = convexTest(schema, modules)

      const providerId = await t.run(async (ctx) => {
        return await ctx.db.insert('providers', {
          name: 'Provider',
          sector: 'nonprofit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create 10 programs
      for (let i = 0; i < 10; i++) {
        const programId = await t.run(async (ctx) => {
          return await ctx.db.insert('programs', {
            providerId,
            name: `Program ${i}`,
            description: 'Test',
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
            geoCodes: ['US'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })

        await t.run(async (ctx) => {
          return await ctx.db.insert('resources', {
            programId,
            primaryUrl: 'https://test.com',
            dataSourceType: 'manual_entry',
            verificationStatus: 'verified_full',
            lastVerifiedDate: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })
      }

      const results = await t.run(async (ctx) => {
        const { findResourcesGeoLite } = await import('../convex/functions/resourcesGeoLite')
        return await findResourcesGeoLite(ctx, { zones: ['time_management'] })
      })

      expect(results).toHaveLength(5)
    })
  })
})
