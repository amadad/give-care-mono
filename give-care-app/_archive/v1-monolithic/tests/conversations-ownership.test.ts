/**
 * Tests for userId ownership verification in conversations functions
 *
 * Security issue: Public query functions at convex/functions/conversations.ts
 * lines 89 and 105 accept userId parameter without verifying that the caller
 * actually owns that userId. Any authenticated user can read any other user's
 * conversations by changing the userId parameter.
 *
 * This test suite verifies that:
 * 1. Unauthorized access attempts are rejected
 * 2. Legitimate access with matching userId succeeds
 * 3. Unauthenticated access is rejected
 * 4. Error messages are appropriate
 *
 * TDD Approach: Test the verification logic in isolation before integrating
 * with Convex query functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Id } from '../convex/_generated/dataModel'

// Import the helper function that will be implemented
// This will be in a separate file: convex/lib/auth.ts
import { verifyUserOwnership } from '../convex/lib/auth'

describe('Conversations Ownership Verification', () => {
  let mockCtx: any
  let mockDb: any
  let mockAuth: any

  const victimUserId = 'j57victim123456789012345' as Id<'users'>
  const attackerUserId = 'j57attack123456789012345' as Id<'users'>

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Mock database
    mockDb = {
      get: vi.fn(),
    }

    // Mock auth
    mockAuth = {
      getUserIdentity: vi.fn(),
    }

    // Mock context
    mockCtx = {
      db: mockDb,
      auth: mockAuth,
    }
  })

  describe('verifyUserOwnership - Unauthorized Access', () => {
    it('should reject access when userId does not match authenticated user (Convex Auth)', async () => {
      // Mock: Authenticated as different user
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: attackerUserId, // Authenticated as attacker's userId
      })

      // Mock: victim user lookup
      mockDb.get.mockResolvedValue({
        _id: victimUserId, // Different user
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'Victim',
      })

      // This should throw an error
      await expect(verifyUserOwnership(mockCtx, victimUserId)).rejects.toThrow(
        /not authorized/i
      )

      // Verify we checked auth and user
      expect(mockAuth.getUserIdentity).toHaveBeenCalled()
      expect(mockDb.get).toHaveBeenCalledWith(victimUserId)
    })

    it('should reject access when userId does not match authenticated user (Clerk Auth)', async () => {
      // Mock: Authenticated as attacker with Clerk
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: 'clerk_attacker_456',
      })

      // Mock: victim user lookup returns different clerkId
      mockDb.get.mockResolvedValue({
        _id: victimUserId,
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'Victim',
        clerkId: 'clerk_victim_123', // Different from authenticated user
      })

      // This should throw an error
      await expect(verifyUserOwnership(mockCtx, victimUserId)).rejects.toThrow(
        /not authorized/i
      )

      // Verify we checked auth and user
      expect(mockAuth.getUserIdentity).toHaveBeenCalled()
      expect(mockDb.get).toHaveBeenCalledWith(victimUserId)
    })

    it('should reject access when user is not authenticated', async () => {
      // Mock: No authentication
      mockAuth.getUserIdentity.mockResolvedValue(null)

      // This should throw an error
      await expect(verifyUserOwnership(mockCtx, victimUserId)).rejects.toThrow(
        /not authenticated/i
      )

      // Verify we checked auth
      expect(mockAuth.getUserIdentity).toHaveBeenCalled()
    })

    it('should reject access when identity subject is null', async () => {
      // Mock: Authentication with null subject
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: null,
      })

      // Should reject
      await expect(verifyUserOwnership(mockCtx, victimUserId)).rejects.toThrow(
        /not authenticated/i
      )
    })

    it('should reject access when userId does not exist', async () => {
      // Mock: Authenticated user
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: 'clerk_user_123',
      })

      // Mock: User not found
      mockDb.get.mockResolvedValue(null)

      const nonexistentUserId = 'j57abcdef123456789012345' as Id<'users'>

      // This should throw an error
      await expect(verifyUserOwnership(mockCtx, nonexistentUserId)).rejects.toThrow(
        /user not found/i
      )

      // Verify we tried to get the user
      expect(mockDb.get).toHaveBeenCalledWith(nonexistentUserId)
    })

    it('should reject access for Convex Auth user when authenticated as different user', async () => {
      const differentUserId = 'j57other0123456789012345' as Id<'users'>

      // Mock: Authenticated as Clerk user trying to access Convex Auth user
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: 'clerk_attacker_123',
      })

      // Mock: Convex Auth user (no clerkId)
      mockDb.get.mockResolvedValue({
        _id: victimUserId,
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'SMS User',
        // No clerkId field - pure Convex Auth
      })

      // This should throw an error - subject doesn't match _id and no clerkId
      await expect(verifyUserOwnership(mockCtx, victimUserId)).rejects.toThrow(
        /not authorized/i
      )

      // Verify we checked
      expect(mockAuth.getUserIdentity).toHaveBeenCalled()
      expect(mockDb.get).toHaveBeenCalledWith(victimUserId)
    })

    it('should reject access when user clerkId is empty string', async () => {
      const emptyClerkUserId = 'j57empty012345678901234' as Id<'users'>

      // Mock: Authenticated user
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: 'clerk_attacker_123',
      })

      // Mock: User with empty clerkId
      mockDb.get.mockResolvedValue({
        _id: emptyClerkUserId,
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'User',
        clerkId: '', // Empty string - not a valid match
      })

      // This should throw an error - empty string is falsy
      await expect(verifyUserOwnership(mockCtx, emptyClerkUserId)).rejects.toThrow(
        /not authorized/i
      )
    })
  })

  describe('verifyUserOwnership - Authorized Access', () => {
    it('should allow access when userId matches authenticated user (Convex Auth)', async () => {
      const userId = 'j57user0123456789012345' as Id<'users'>

      // Mock: Authenticated with Convex Auth (subject = userId)
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: userId, // Identity subject IS the userId
      })

      // Mock: Convex Auth user
      mockDb.get.mockResolvedValue({
        _id: userId,
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'Legitimate User',
      })

      // This should NOT throw
      await expect(verifyUserOwnership(mockCtx, userId)).resolves.toBeUndefined()

      // Verify we checked auth and user
      expect(mockAuth.getUserIdentity).toHaveBeenCalled()
      expect(mockDb.get).toHaveBeenCalledWith(userId)
    })

    it('should allow access when clerkId matches authenticated user (Clerk Auth)', async () => {
      const userId = 'j57user0123456789012345' as Id<'users'>

      // Mock: Authenticated with Clerk (subject = clerkId)
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: 'clerk_user_123',
      })

      // Mock: User with matching clerkId
      mockDb.get.mockResolvedValue({
        _id: userId,
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'Legitimate User',
        clerkId: 'clerk_user_123', // Same as authenticated user
      })

      // This should NOT throw
      await expect(verifyUserOwnership(mockCtx, userId)).resolves.toBeUndefined()

      // Verify we checked auth and user
      expect(mockAuth.getUserIdentity).toHaveBeenCalled()
      expect(mockDb.get).toHaveBeenCalledWith(userId)
    })

    it('should work with different clerk ID formats', async () => {
      const userId = 'j57user0123456789012345' as Id<'users'>

      // Test various clerk ID formats
      const clerkIds = [
        'clerk_user_123',
        'user_2ABCdefGHI123xyz',
        'clerk_2XYZabcDEF789uvw',
      ]

      for (const clerkId of clerkIds) {
        mockAuth.getUserIdentity.mockResolvedValue({
          subject: clerkId,
        })

        mockDb.get.mockResolvedValue({
          _id: userId,
          _creationTime: Date.now(),
          phoneNumber: '+15555551111',
          firstName: 'User',
          clerkId: clerkId,
        })

        // Should not throw
        await expect(verifyUserOwnership(mockCtx, userId)).resolves.toBeUndefined()
      }
    })
  })

  describe('Edge Cases', () => {
    it('should be case-sensitive when comparing clerkIds', async () => {
      const userId = 'j57user0123456789012345' as Id<'users'>

      // Mock: Authenticated with lowercase
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: 'clerk_user_123',
      })

      // Mock: User with uppercase (different)
      mockDb.get.mockResolvedValue({
        _id: userId,
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'User',
        clerkId: 'CLERK_USER_123', // Different case
      })

      // Should reject due to case mismatch
      await expect(verifyUserOwnership(mockCtx, userId)).rejects.toThrow(
        /not authorized/i
      )
    })

    it('should use strict matching (no whitespace trimming)', async () => {
      const userId = 'j57user0123456789012345' as Id<'users'>

      // Mock: Authenticated with whitespace
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: ' clerk_user_123 ',
      })

      // Mock: User without whitespace
      mockDb.get.mockResolvedValue({
        _id: userId,
        _creationTime: Date.now(),
        phoneNumber: '+15555551111',
        firstName: 'User',
        clerkId: 'clerk_user_123',
      })

      // Should reject - no trimming/normalization
      await expect(verifyUserOwnership(mockCtx, userId)).rejects.toThrow(
        /not authorized/i
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock: Authenticated
      mockAuth.getUserIdentity.mockResolvedValue({
        subject: 'clerk_user_123',
      })

      // Mock: Database throws error
      mockDb.get.mockRejectedValue(new Error('Database connection failed'))

      const userId = 'j57user0123456789012345' as Id<'users'>

      // Should propagate the database error
      await expect(verifyUserOwnership(mockCtx, userId)).rejects.toThrow(
        /database connection failed/i
      )
    })

    it('should handle auth service errors gracefully', async () => {
      // Mock: Auth throws error
      mockAuth.getUserIdentity.mockRejectedValue(new Error('Auth service unavailable'))

      const userId = 'j57user0123456789012345' as Id<'users'>

      // Should propagate the auth error
      await expect(verifyUserOwnership(mockCtx, userId)).rejects.toThrow(
        /auth service unavailable/i
      )
    })
  })
})
