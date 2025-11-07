/**
 * Query Optimization Tests (Issue 3)
 *
 * Tests for unbounded .collect() fixes in functions/users.ts
 * Verifies database-level filtering works correctly and efficiently
 */

import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import schema from '../convex/schema'
import { internal } from '../convex/_generated/api'

const DAY_MS = 24 * 60 * 60 * 1000

describe('Query Optimization - Scheduled Queries', () => {
  describe('getEligibleForCrisisDaily', () => {
    it('should return only crisis users with active journey phase and recent crisis events', async () => {
      const t = convexTest(schema)
      const now = Date.now()
      const twoDaysAgo = now - 2 * DAY_MS
      const fiveDaysAgo = now - 5 * DAY_MS

      // Insert test users
      const userId1 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+11111111111',
          createdAt: now,
          updatedAt: now,
        })
      })

      // Create eligible profile: crisis + active + recent crisis event + not contacted recently
      await t.run(async (ctx) => {
        await ctx.db.insert('caregiverProfiles', {
          userId: userId1,
          burnoutBand: 'crisis',
          journeyPhase: 'active',
          lastCrisisEventAt: fiveDaysAgo, // Within last 7 days
          lastContactAt: fiveDaysAgo, // Not contacted in 2+ days
          createdAt: now,
          updatedAt: now,
        })
      })

      // Create ineligible profile: crisis but not active
      const userId2 = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+12222222222',
          createdAt: now,
          updatedAt: now,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('caregiverProfiles', {
          userId: userId2,
          burnoutBand: 'crisis',
          journeyPhase: 'maintenance', // Not active
          lastCrisisEventAt: fiveDaysAgo,
          createdAt: now,
          updatedAt: now,
        })
      })

      // Query should only return eligible users
      const eligible = await t.query(internal.functions.users.getEligibleForCrisisDaily)

      expect(eligible).toHaveLength(1)
      expect(eligible[0]?.phoneNumber).toBe('+11111111111')
    })

    it('should exclude users contacted within last 2 days', async () => {
      const t = convexTest(schema)
      const now = Date.now()
      const oneDayAgo = now - 1 * DAY_MS
      const fiveDaysAgo = now - 5 * DAY_MS

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+13333333333',
          createdAt: now,
          updatedAt: now,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('caregiverProfiles', {
          userId,
          burnoutBand: 'crisis',
          journeyPhase: 'active',
          lastCrisisEventAt: fiveDaysAgo,
          lastContactAt: oneDayAgo, // Recently contacted - should exclude
          createdAt: now,
          updatedAt: now,
        })
      })

      const eligible = await t.query(internal.functions.users.getEligibleForCrisisDaily)

      expect(eligible).toHaveLength(0)
    })
  })

  describe('getEligibleForHighBurnoutCheckin', () => {
    it('should return only high burnout users with active journey phase', async () => {
      const t = convexTest(schema)
      const now = Date.now()
      const fourDaysAgo = now - 4 * DAY_MS

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+14444444444',
          createdAt: now,
          updatedAt: now,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('caregiverProfiles', {
          userId,
          burnoutBand: 'high',
          journeyPhase: 'active',
          lastProactiveMessageAt: fourDaysAgo, // >3 days
          lastContactAt: fourDaysAgo, // >2 days
          createdAt: now,
          updatedAt: now,
        })
      })

      const eligible = await t.query(internal.functions.users.getEligibleForHighBurnoutCheckin)

      expect(eligible).toHaveLength(1)
      expect(eligible[0]?.phoneNumber).toBe('+14444444444')
    })

    it('should exclude users proactively messaged within last 3 days', async () => {
      const t = convexTest(schema)
      const now = Date.now()
      const twoDaysAgo = now - 2 * DAY_MS

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15555555555',
          createdAt: now,
          updatedAt: now,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('caregiverProfiles', {
          userId,
          burnoutBand: 'high',
          journeyPhase: 'active',
          lastProactiveMessageAt: twoDaysAgo, // <3 days - should exclude
          lastContactAt: now - 5 * DAY_MS,
          createdAt: now,
          updatedAt: now,
        })
      })

      const eligible = await t.query(internal.functions.users.getEligibleForHighBurnoutCheckin)

      expect(eligible).toHaveLength(0)
    })
  })

  describe('getEligibleForModerateCheckin', () => {
    it('should return only moderate burnout users eligible for weekly check-in', async () => {
      const t = convexTest(schema)
      const now = Date.now()
      const eightDaysAgo = now - 8 * DAY_MS

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+16666666666',
          createdAt: now,
          updatedAt: now,
        })
      })

      await t.run(async (ctx) => {
        await ctx.db.insert('caregiverProfiles', {
          userId,
          burnoutBand: 'moderate',
          journeyPhase: 'active',
          lastProactiveMessageAt: eightDaysAgo, // >7 days
          lastContactAt: eightDaysAgo, // >3 days
          createdAt: now,
          updatedAt: now,
        })
      })

      const eligible = await t.query(internal.functions.users.getEligibleForModerateCheckin)

      expect(eligible).toHaveLength(1)
      expect(eligible[0]?.phoneNumber).toBe('+16666666666')
    })
  })

  describe('Query Performance', () => {
    it('should efficiently query 100+ crisis users using composite index', async () => {
      const t = convexTest(schema)
      const now = Date.now()
      const fiveDaysAgo = now - 5 * DAY_MS

      // Insert 100 crisis users (50 eligible, 50 ineligible)
      for (let i = 0; i < 100; i++) {
        const userId = await t.run(async (ctx) => {
          return await ctx.db.insert('users', {
            phoneNumber: `+1${String(i).padStart(10, '0')}`,
            createdAt: now,
            updatedAt: now,
          })
        })

        await t.run(async (ctx) => {
          await ctx.db.insert('caregiverProfiles', {
            userId,
            burnoutBand: 'crisis',
            // Alternate between active (eligible) and maintenance (ineligible)
            journeyPhase: i % 2 === 0 ? 'active' : 'maintenance',
            lastCrisisEventAt: fiveDaysAgo,
            lastContactAt: fiveDaysAgo,
            createdAt: now,
            updatedAt: now,
          })
        })
      }

      // Query should use composite index and filter efficiently
      const start = Date.now()
      const eligible = await t.query(internal.functions.users.getEligibleForCrisisDaily)
      const duration = Date.now() - start

      // Should only return eligible users (active journeyPhase)
      expect(eligible).toHaveLength(50)

      // Query should complete quickly (composite index makes it O(log n))
      // Relaxed timeout for test environment
      expect(duration).toBeLessThan(500)
    })
  })
})
