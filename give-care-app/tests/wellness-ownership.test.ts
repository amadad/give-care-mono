/**
 * Tests for Wellness Function Ownership Verification
 *
 * Security Tests: Ensures wellness functions enforce proper authorization
 *
 * All 4 public query functions must enforce ownership verification:
 * - getLatestScore
 * - getScoreHistory
 * - trend
 * - getPressureZoneTrends
 *
 * Tests verify:
 * 1. Authenticated users can only access their own wellness data
 * 2. Attempts to access other users' data throw proper authorization errors
 * 3. Unauthenticated requests are rejected
 */

import { describe, it, expect } from 'vitest'
import { convexTest } from 'convex-test'
import schema from '../convex/schema'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'

// Import Convex functions for testing
const modules = import.meta.glob('../convex/**/*.ts')

describe('Wellness Functions - Ownership Verification', () => {
  describe('getLatestScore - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s latest score', async () => {
      const t = convexTest(schema, modules)

      // Create two users
      const userAId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      const userBId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15559876543',
          firstName: 'Bob',
          journeyPhase: 'active',
          burnoutScore: 72,
          burnoutBand: 'high',
          pressureZones: [],
        })
      })

      // Create wellness score for User B
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId: userBId,
          overallScore: 72,
          band: 'high',
          pressureZones: ['financial_concerns', 'physical_health'],
          pressureZoneScores: { financial_concerns: 75, physical_health: 70 },
          recordedAt: Date.now(),
        })
      })

      // User A tries to access User B's data - should throw
      const asUserA = t.withIdentity({ subject: userAId })
      await expect(
        asUserA.query(api.functions.wellness.getLatestScore, { userId: userBId })
      ).rejects.toThrow(/Unauthorized.*another user/i)
    })

    it('should ALLOW when user accesses their own latest score', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Create wellness score
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId,
          overallScore: 45,
          band: 'moderate',
          pressureZones: ['emotional_wellbeing', 'time_management'],
          pressureZoneScores: { emotional_wellbeing: 55, time_management: 60 },
          recordedAt: Date.now(),
        })
      })

      // User A accesses their own data - should succeed
      const asUser = t.withIdentity({ subject: userId })
      const result = await asUser.query(api.functions.wellness.getLatestScore, { userId })

      expect(result).toBeDefined()
      expect(result?.overallScore).toBe(45)
    })

    it('should REJECT when user is not authenticated', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Unauthenticated request - should throw
      await expect(
        t.query(api.functions.wellness.getLatestScore, { userId })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should REJECT when requested userId does not exist', async () => {
      const t = convexTest(schema, modules)

      // Create a real user to authenticate as
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      const fakeUserId = 'fake_user_123' as Id<'users'>

      // Request non-existent user - should throw
      const asUser = t.withIdentity({ subject: userId })
      await expect(
        asUser.query(api.functions.wellness.getLatestScore, { userId: fakeUserId })
      ).rejects.toThrow(/user not found|user does not exist/i)
    })
  })

  describe('getScoreHistory - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s score history', async () => {
      const t = convexTest(schema, modules)

      // Create two users
      const userAId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      const userBId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15559876543',
          firstName: 'Bob',
          journeyPhase: 'active',
          burnoutScore: 72,
          burnoutBand: 'high',
          pressureZones: [],
        })
      })

      // User A tries to access User B's history - should throw
      await expect(
        t.withIdentity({ subject: userAId }).query(api.functions.wellness.getScoreHistory, { userId: userBId })
      ).rejects.toThrow(/Unauthorized.*another user/i)
    })

    it('should ALLOW when user accesses their own score history', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Create scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId,
          overallScore: 45,
          band: 'moderate',
          pressureZones: ['emotional_wellbeing'],
          pressureZoneScores: { emotional_wellbeing: 55 },
          recordedAt: Date.now(),
        })
      })

      // User A accesses their own history - should succeed
      const result = await t.withIdentity({ subject: userId }).query(api.functions.wellness.getScoreHistory, { userId })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should REJECT when user is not authenticated', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Unauthenticated request - should throw
      await expect(
        t.query(api.functions.wellness.getScoreHistory, { userId })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should respect limit parameter when returning own data', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Create 5 scores
      await t.run(async (ctx) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert('wellnessScores', {
            userId,
            overallScore: 40 + i,
            band: 'moderate',
            pressureZones: [],
            pressureZoneScores: {},
            recordedAt: Date.now() - i * 86400000,
          })
        }
      })

      // Request with limit=3
      const result = await t.withIdentity({ subject: userId }).query(api.functions.wellness.getScoreHistory, { userId, limit: 3 })

      expect(result).toHaveLength(3)
    })
  })

  describe('trend - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s trend data', async () => {
      const t = convexTest(schema, modules)

      // Create two users
      const userAId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      const userBId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15559876543',
          firstName: 'Bob',
          journeyPhase: 'active',
          burnoutScore: 72,
          burnoutBand: 'high',
          pressureZones: [],
        })
      })

      // User A tries to access User B's trend - should throw
      await expect(
        t.withIdentity({ subject: userAId }).query(api.functions.wellness.trend, { userId: userBId, windowDays: 30 })
      ).rejects.toThrow(/Unauthorized.*another user/i)
    })

    it('should ALLOW when user accesses their own trend data', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Create scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId,
          overallScore: 45,
          band: 'moderate',
          pressureZones: ['emotional_wellbeing'],
          pressureZoneScores: { emotional_wellbeing: 55 },
          recordedAt: Date.now(),
        })
      })

      // User A accesses their own trend - should succeed
      const result = await t.withIdentity({ subject: userId }).query(api.functions.wellness.trend, { userId, windowDays: 30 })

      expect(result).toBeDefined()
      expect(result.count).toBeGreaterThanOrEqual(0)
    })

    it('should REJECT when user is not authenticated', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Unauthenticated request - should throw
      await expect(
        t.query(api.functions.wellness.trend, { userId, windowDays: 30 })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should return valid trend structure for own data', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Create scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId,
          overallScore: 45,
          band: 'moderate',
          pressureZones: [],
          pressureZoneScores: {},
          recordedAt: Date.now(),
        })
      })

      // Get trend
      const result = await t.withIdentity({ subject: userId }).query(api.functions.wellness.trend, { userId, windowDays: 30 })

      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('average')
      expect(result).toHaveProperty('trend')
    })
  })

  describe('getPressureZoneTrends - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s pressure zone trends', async () => {
      const t = convexTest(schema, modules)

      // Create two users
      const userAId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      const userBId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15559876543',
          firstName: 'Bob',
          journeyPhase: 'active',
          burnoutScore: 72,
          burnoutBand: 'high',
          pressureZones: [],
        })
      })

      // User A tries to access User B's zones - should throw
      await expect(
        t.withIdentity({ subject: userAId }).query(api.functions.wellness.getPressureZoneTrends, { userId: userBId, windowDays: 30 })
      ).rejects.toThrow(/Unauthorized.*another user/i)
    })

    it('should ALLOW when user accesses their own pressure zone trends', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Create scores
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId,
          overallScore: 45,
          band: 'moderate',
          pressureZones: ['emotional_wellbeing'],
          pressureZoneScores: { emotional_wellbeing: 55 },
          recordedAt: Date.now(),
        })
      })

      // User A accesses their own zones - should succeed
      const result = await t.withIdentity({ subject: userId }).query(api.functions.wellness.getPressureZoneTrends, { userId, windowDays: 30 })

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should REJECT when user is not authenticated', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Unauthenticated request - should throw
      await expect(
        t.query(api.functions.wellness.getPressureZoneTrends, { userId, windowDays: 30 })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should return valid pressure zone trend structure for own data', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Create scores with zones
      await t.run(async (ctx) => {
        await ctx.db.insert('wellnessScores', {
          userId,
          overallScore: 45,
          band: 'moderate',
          pressureZones: ['emotional_wellbeing', 'time_management'],
          pressureZoneScores: { emotional_wellbeing: 55, time_management: 60 },
          recordedAt: Date.now(),
        })
      })

      // Get zone trends
      const result = await t.withIdentity({ subject: userId }).query(api.functions.wellness.getPressureZoneTrends, { userId, windowDays: 30 })

      expect(typeof result).toBe('object')
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Edge Cases - Ownership Verification', () => {
    it('should allow user with Convex Auth (no clerkId) to access their own data', async () => {
      const t = convexTest(schema, modules)

      // Create user with Convex Auth (no clerkId field needed)
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      // Should succeed - user._id matches identity.subject
      const result = await t.withIdentity({ subject: userId }).query(api.functions.wellness.getLatestScore, { userId })

      // Should return null since no wellness scores exist
      expect(result).toBeNull()
    })

    it('should handle multiple concurrent ownership checks correctly', async () => {
      const t = convexTest(schema, modules)

      // Create two users
      const userAId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      const userBId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15559876543',
          firstName: 'Bob',
          journeyPhase: 'active',
          burnoutScore: 72,
          burnoutBand: 'high',
          pressureZones: [],
        })
      })

      // User A tries to access both their own data (should succeed) and User B's data (should fail)
      const authorizedPromise = t.withIdentity({ subject: userAId }).query(api.functions.wellness.getLatestScore, { userId: userAId })
      const unauthorizedPromise = t.withIdentity({ subject: userAId }).query(api.functions.wellness.getLatestScore, { userId: userBId })

      const results = await Promise.allSettled([unauthorizedPromise, authorizedPromise])

      expect(results[0].status).toBe('rejected')
      expect(results[1].status).toBe('fulfilled')
    })
  })

  describe('Error Message Quality', () => {
    it('should provide clear error message for unauthorized access', async () => {
      const t = convexTest(schema, modules)

      // Create two users
      const userAId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      const userBId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15559876543',
          firstName: 'Bob',
          journeyPhase: 'active',
          burnoutScore: 72,
          burnoutBand: 'high',
          pressureZones: [],
        })
      })

      try {
        await t.withIdentity({ subject: userAId }).query(api.functions.wellness.getLatestScore, { userId: userBId })
        throw new Error('Should have thrown')
      } catch (error: any) {
        expect(error.message).toMatch(/unauthorized/i)
      }
    })

    it('should provide clear error message for unauthenticated access', async () => {
      const t = convexTest(schema, modules)

      // Create user
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          phoneNumber: '+15551234567',
          firstName: 'Alice',
          journeyPhase: 'active',
          burnoutScore: 45,
          burnoutBand: 'moderate',
          pressureZones: [],
        })
      })

      try {
        await t.query(api.functions.wellness.getLatestScore, { userId })
        throw new Error('Should have thrown')
      } catch (error: any) {
        expect(error.message).toMatch(/unauthenticated/i)
      }
    })
  })
})
