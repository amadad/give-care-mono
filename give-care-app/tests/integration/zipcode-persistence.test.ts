/**
 * ZIP Code Persistence Integration Test
 *
 * PURPOSE: Verify zip code is stored and retrieved correctly
 * NO MOCKS: Real Convex mutations/queries/actions
 *
 * This test verifies the fix for the bug where:
 * - ZIP code was saved to metadata.zipCode
 * - But retrieved from metadata.profile.zipCode (wrong path!)
 */

import { describe, it, expect } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { initConvexTest } from '../../convex/test.setup';

describe('ZIP Code Persistence Integration', () => {
  it('should store and retrieve zip code from metadata.zipCode', async () => {
    const t = initConvexTest();

    // 1. Create user
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382932',
      email: 'test1@test.com',
      name: 'Test User 1',
    });

    expect(userId).toBeDefined();

    // 2. Update profile with zip code
    await t.mutation(internal.internal.users.updateProfile, {
      userId,
      field: 'zipCode',
      value: '11576',
    });

    // 3. Verify zip code is stored in metadata.zipCode
    const updatedUser = await t.query(internal.internal.users.getUser, {
      userId,
    });

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.metadata).toBeDefined();
    expect((updatedUser?.metadata as any).zipCode).toBe('11576');
    // Should NOT be nested under .profile
    expect((updatedUser?.metadata as any).profile?.zipCode).toBeUndefined();

    // 4. Verify getLocationFromUser can retrieve it
    const location = await t.run(async (ctx) => {
      const { getLocationFromUser } = await import('../../convex/lib/mapsUtils');
      return getLocationFromUser(ctx, userId);
    });

    expect(location).toBeDefined();
    expect(location?.zipCode).toBe('11576');
  });

  it('should not re-ask for zip code on second resource search', async () => {
    const t = initConvexTest();

    // 1. Create user
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382933',
      email: 'test2@test.com',
      name: 'Test User 2',
    });

    // 2. Store zip code
    await t.mutation(internal.internal.users.updateProfile, {
      userId,
      field: 'zipCode',
      value: '11576',
    });

    // 3. First resource search - should use stored zip code
    const firstSearch = await t.action(internal.resources.searchResources, {
      query: 'respite care',
      userId,
    });

    // Should NOT return missing_zip error
    expect(firstSearch.error).not.toBe('missing_zip');
    // Should have results (cached or fresh)
    expect(firstSearch.resources).toBeDefined();

    // 4. Second resource search - should still use stored zip code
    const secondSearch = await t.action(internal.resources.searchResources, {
      query: 'support groups',
      userId,
    });

    // Should NOT return missing_zip error
    expect(secondSearch.error).not.toBe('missing_zip');
    // Should have results
    expect(secondSearch.resources).toBeDefined();
  });

  it('should extract zip from query as fallback', async () => {
    const t = initConvexTest();

    // 1. Create user WITHOUT zip code stored
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382934',
      email: 'test3@test.com',
      name: 'Test User 3',
    });

    // 2. Search with zip code in query
    const result = await t.action(internal.resources.searchResources, {
      query: 'respite care in 11576',
      userId,
    });

    // Should NOT return missing_zip error (extracted from query)
    expect(result.error).not.toBe('missing_zip');
    // Should have results
    expect(result.resources).toBeDefined();

    // 3. Verify zip code was extracted correctly
    // The action should have used 11576 from the query
    expect(result.resources).toContain('11576');
  });

  it('should return missing_zip error when no zip available', async () => {
    const t = initConvexTest();

    // 1. Create user WITHOUT zip code
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382935',
      email: 'test4@test.com',
      name: 'Test User 4',
    });

    // 2. Search WITHOUT zip in query
    const result = await t.action(internal.resources.searchResources, {
      query: 'respite care',
      userId,
    });

    // Should return missing_zip error
    expect(result.error).toBe('missing_zip');
    expect(result.message).toContain('Zip code required');
  });
});
