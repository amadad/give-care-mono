/**
 * Tests for Wellness Function Ownership Verification
 *
 * Security Issue: wellness.ts functions accept userId without verifying caller ownership.
 * Any authenticated user can read any other user's wellness/burnout data.
 *
 * This test suite ensures:
 * 1. Authenticated users can only access their own wellness data
 * 2. Attempts to access other users' data throw proper authorization errors
 * 3. All 4 public query functions enforce ownership verification:
 *    - getLatestScore (line 13)
 *    - getScoreHistory (line 24)
 *    - trend (line 40)
 *    - getPressureZoneTrends (line 69)
 *
 * Expected Implementation:
 * - Extract identity from ctx.auth.getUserIdentity()
 * - Look up user by userId to get their clerkId (or auth identifier)
 * - Compare identity.subject to user.clerkId
 * - Throw error if unauthorized
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Id } from '../convex/_generated/dataModel'

// Mock context structure based on Convex patterns
interface MockAuthIdentity {
  subject: string
  tokenIdentifier: string
}

interface MockDb {
  get: (id: Id<'users'>) => Promise<any>
  query: (table: string) => any
}

interface MockQueryContext {
  auth: {
    getUserIdentity: () => Promise<MockAuthIdentity | null>
  }
  db: MockDb
}

describe('Wellness Functions - Ownership Verification', () => {
  const USER_A_ID = 'user_a_123' as Id<'users'>
  const USER_B_ID = 'user_b_456' as Id<'users'>
  const USER_A_CLERK_ID = 'clerk_user_a'
  const USER_B_CLERK_ID = 'clerk_user_b'

  // Mock users in database
  const mockUsers = {
    [USER_A_ID]: {
      _id: USER_A_ID,
      _creationTime: Date.now(),
      clerkId: USER_A_CLERK_ID,
      phoneNumber: '+15551234567',
      firstName: 'Alice',
      burnoutScore: 45,
      burnoutBand: 'moderate',
    },
    [USER_B_ID]: {
      _id: USER_B_ID,
      _creationTime: Date.now(),
      clerkId: USER_B_CLERK_ID,
      phoneNumber: '+15559876543',
      firstName: 'Bob',
      burnoutScore: 72,
      burnoutBand: 'high',
    },
  }

  // Mock wellness scores
  const mockWellnessScores = [
    {
      _id: 'score_1' as Id<'wellnessScores'>,
      _creationTime: Date.now() - 86400000, // 1 day ago
      userId: USER_A_ID,
      overallScore: 45,
      band: 'moderate',
      pressureZones: ['emotional_wellbeing', 'time_management'],
      pressureZoneScores: { emotional_wellbeing: 55, time_management: 60 },
      recordedAt: Date.now() - 86400000,
    },
    {
      _id: 'score_2' as Id<'wellnessScores'>,
      _creationTime: Date.now() - 172800000, // 2 days ago
      userId: USER_A_ID,
      overallScore: 50,
      band: 'moderate',
      pressureZones: ['time_management'],
      pressureZoneScores: { time_management: 50 },
      recordedAt: Date.now() - 172800000,
    },
    {
      _id: 'score_3' as Id<'wellnessScores'>,
      _creationTime: Date.now() - 86400000,
      userId: USER_B_ID,
      overallScore: 72,
      band: 'high',
      pressureZones: ['financial_concerns', 'physical_health'],
      pressureZoneScores: { financial_concerns: 75, physical_health: 70 },
      recordedAt: Date.now() - 86400000,
    },
  ]

  function createMockContext(
    authenticatedClerkId: string | null
  ): MockQueryContext {
    return {
      auth: {
        getUserIdentity: async () => {
          if (authenticatedClerkId === null) return null
          return {
            subject: authenticatedClerkId,
            tokenIdentifier: `token_${authenticatedClerkId}`,
          }
        },
      },
      db: {
        get: async (id: Id<'users'>) => {
          return mockUsers[id as keyof typeof mockUsers] || null
        },
        query: (table: string) => {
          if (table === 'wellnessScores') {
            return {
              withIndex: (indexName: string, filterFn: any) => {
                // Mock the index filter
                return {
                  order: (direction: string) => ({
                    first: async () => {
                      // Return first score for the filtered userId
                      return mockWellnessScores[0] || null
                    },
                    take: async (limit: number) => {
                      // Return limited scores for the filtered userId
                      return mockWellnessScores.slice(0, limit)
                    },
                  }),
                  filter: (filterFn: any) => ({
                    collect: async () => {
                      return mockWellnessScores
                    },
                  }),
                }
              },
            }
          }
          return {
            withIndex: () => ({}),
          }
        },
      },
    }
  }

  describe('getLatestScore - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s latest score', async () => {
      // User A tries to access User B's data
      const ctx = createMockContext(USER_A_CLERK_ID)

      // Import the actual function (will be implemented)
      const { getLatestScore } = await import('../convex/functions/wellness')

      // This should throw an authorization error
      await expect(
        getLatestScore(ctx as any, { userId: USER_B_ID })
      ).rejects.toThrow(/unauthorized|not authorized|access denied/i)
    })

    it('should ALLOW when user accesses their own latest score', async () => {
      // User A accesses their own data
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getLatestScore } = await import('../convex/functions/wellness')

      // This should succeed
      const result = await getLatestScore(ctx as any, { userId: USER_A_ID })

      // Should return the score (or null if none exists)
      expect(result).toBeDefined()
    })

    it('should REJECT when user is not authenticated', async () => {
      // No authentication
      const ctx = createMockContext(null)

      const { getLatestScore } = await import('../convex/functions/wellness')

      // This should throw an authentication error
      await expect(
        getLatestScore(ctx as any, { userId: USER_A_ID })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should REJECT when requested userId does not exist', async () => {
      // User A tries to access non-existent user
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getLatestScore } = await import('../convex/functions/wellness')

      const FAKE_USER_ID = 'user_fake_999' as Id<'users'>

      // This should throw a user not found error
      await expect(
        getLatestScore(ctx as any, { userId: FAKE_USER_ID })
      ).rejects.toThrow(/user not found|user does not exist/i)
    })
  })

  describe('getScoreHistory - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s score history', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getScoreHistory } = await import('../convex/functions/wellness')

      await expect(
        getScoreHistory(ctx as any, { userId: USER_B_ID })
      ).rejects.toThrow(/unauthorized|not authorized|access denied/i)
    })

    it('should ALLOW when user accesses their own score history', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getScoreHistory } = await import('../convex/functions/wellness')

      const result = await getScoreHistory(ctx as any, {
        userId: USER_A_ID,
        limit: 10,
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should REJECT when user is not authenticated', async () => {
      const ctx = createMockContext(null)

      const { getScoreHistory } = await import('../convex/functions/wellness')

      await expect(
        getScoreHistory(ctx as any, { userId: USER_A_ID })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should respect limit parameter when returning own data', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getScoreHistory } = await import('../convex/functions/wellness')

      const result = await getScoreHistory(ctx as any, {
        userId: USER_A_ID,
        limit: 5,
      })

      expect(Array.isArray(result)).toBe(true)
      // Should not exceed limit (mock may return less)
    })
  })

  describe('trend - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s trend data', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { trend } = await import('../convex/functions/wellness')

      await expect(
        trend(ctx as any, { userId: USER_B_ID, windowDays: 30 })
      ).rejects.toThrow(/unauthorized|not authorized|access denied/i)
    })

    it('should ALLOW when user accesses their own trend data', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { trend } = await import('../convex/functions/wellness')

      const result = await trend(ctx as any, {
        userId: USER_A_ID,
        windowDays: 30,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('average')
      expect(result).toHaveProperty('trend')
    })

    it('should REJECT when user is not authenticated', async () => {
      const ctx = createMockContext(null)

      const { trend } = await import('../convex/functions/wellness')

      await expect(
        trend(ctx as any, { userId: USER_A_ID, windowDays: 30 })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should return valid trend structure for own data', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { trend } = await import('../convex/functions/wellness')

      const result = await trend(ctx as any, {
        userId: USER_A_ID,
        windowDays: 7,
      })

      expect(typeof result.count).toBe('number')
      expect(Array.isArray(result.trend)).toBe(true)
      // average can be null if no data
      if (result.average !== null) {
        expect(typeof result.average).toBe('number')
      }
    })
  })

  describe('getPressureZoneTrends - Ownership Verification', () => {
    it('should REJECT when user tries to access another user\'s pressure zone trends', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getPressureZoneTrends } = await import(
        '../convex/functions/wellness'
      )

      await expect(
        getPressureZoneTrends(ctx as any, { userId: USER_B_ID, windowDays: 30 })
      ).rejects.toThrow(/unauthorized|not authorized|access denied/i)
    })

    it('should ALLOW when user accesses their own pressure zone trends', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getPressureZoneTrends } = await import(
        '../convex/functions/wellness'
      )

      const result = await getPressureZoneTrends(ctx as any, {
        userId: USER_A_ID,
        windowDays: 30,
      })

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should REJECT when user is not authenticated', async () => {
      const ctx = createMockContext(null)

      const { getPressureZoneTrends } = await import(
        '../convex/functions/wellness'
      )

      await expect(
        getPressureZoneTrends(ctx as any, { userId: USER_A_ID, windowDays: 30 })
      ).rejects.toThrow(/unauthenticated|not authenticated|must be logged in/i)
    })

    it('should return valid pressure zone trend structure for own data', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getPressureZoneTrends } = await import(
        '../convex/functions/wellness'
      )

      const result = await getPressureZoneTrends(ctx as any, {
        userId: USER_A_ID,
        windowDays: 14,
      })

      expect(typeof result).toBe('object')
      // Each value should be a number (zone score average)
      for (const value of Object.values(result)) {
        if (value !== undefined) {
          expect(typeof value).toBe('number')
        }
      }
    })
  })

  describe('Edge Cases - Ownership Verification', () => {
    it('should handle user with no clerkId gracefully', async () => {
      // Create a user without clerkId (edge case)
      const ORPHAN_USER_ID = 'user_orphan' as Id<'users'>
      const orphanMockUsers = {
        ...mockUsers,
        [ORPHAN_USER_ID]: {
          _id: ORPHAN_USER_ID,
          _creationTime: Date.now(),
          // No clerkId field
          phoneNumber: '+15550000000',
        },
      }

      const ctx: MockQueryContext = {
        auth: {
          getUserIdentity: async () => ({
            subject: USER_A_CLERK_ID,
            tokenIdentifier: 'token',
          }),
        },
        db: {
          get: async (id: Id<'users'>) => {
            return orphanMockUsers[id as keyof typeof orphanMockUsers] || null
          },
          query: () => ({
            withIndex: () => ({
              order: () => ({
                first: async () => null,
              }),
            }),
          }),
        },
      }

      const { getLatestScore } = await import('../convex/functions/wellness')

      // User without clerkId should be treated as unauthorized access
      await expect(
        getLatestScore(ctx as any, { userId: ORPHAN_USER_ID })
      ).rejects.toThrow(/unauthorized|not authorized|user.*clerk/i)
    })

    it('should handle multiple concurrent ownership checks correctly', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getLatestScore, getScoreHistory } = await import(
        '../convex/functions/wellness'
      )

      // User A can access their own data in parallel
      const results = await Promise.allSettled([
        getLatestScore(ctx as any, { userId: USER_A_ID }),
        getScoreHistory(ctx as any, { userId: USER_A_ID }),
      ])

      // Both should succeed
      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('fulfilled')

      // But accessing User B's data should fail
      const unauthorizedResults = await Promise.allSettled([
        getLatestScore(ctx as any, { userId: USER_B_ID }),
        getScoreHistory(ctx as any, { userId: USER_B_ID }),
      ])

      expect(unauthorizedResults[0].status).toBe('rejected')
      expect(unauthorizedResults[1].status).toBe('rejected')
    })
  })

  describe('Error Message Quality', () => {
    it('should provide clear error message for unauthorized access', async () => {
      const ctx = createMockContext(USER_A_CLERK_ID)

      const { getLatestScore } = await import('../convex/functions/wellness')

      try {
        await getLatestScore(ctx as any, { userId: USER_B_ID })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        // Error message should be helpful but not leak sensitive info
        expect(error.message).toBeTruthy()
        expect(error.message.length).toBeGreaterThan(10)
        // Should not expose clerkId or other sensitive data
        expect(error.message).not.toContain(USER_B_CLERK_ID)
      }
    })

    it('should provide clear error message for unauthenticated access', async () => {
      const ctx = createMockContext(null)

      const { getScoreHistory } = await import('../convex/functions/wellness')

      try {
        await getScoreHistory(ctx as any, { userId: USER_A_ID })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.message).toBeTruthy()
        expect(error.message.length).toBeGreaterThan(10)
      }
    })
  })
})
