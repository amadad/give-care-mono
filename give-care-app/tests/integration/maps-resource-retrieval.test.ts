/**
 * Google Maps Resource Retrieval Integration Test
 *
 * PURPOSE: Verify Google Maps API integration works end-to-end
 * NO MOCKS: Real Google Maps API calls (when credentials available)
 *
 * NOTE: These tests will use stub data if Google API credentials are missing
 */

import { describe, it, expect } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { initConvexTest } from '../../convex/test.setup';

describe('Google Maps Resource Retrieval Integration', () => {
  const hasGoogleCredentials =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  it('should retrieve resources with zip code', async () => {
    const t = initConvexTest();

    // 1. Create user with zip code
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382936',
      email: 'maps_test_1@test.com',
      name: 'Maps Test User 1',
    });

    await t.mutation(internal.internal.users.updateProfile, {
      userId,
      field: 'zipCode',
      value: '11576',
    });

    // 2. Search for resources
    const result = await t.action(internal.resources.searchResources, {
      query: 'respite care near me',
      userId,
    });

    // 3. Verify results
    expect(result.error).toBeUndefined();
    expect(result.resources).toBeDefined();
    expect(result.sources).toBeDefined();

    if (hasGoogleCredentials) {
      // Real Google Maps API response
      expect(result.sources).not.toEqual([]);
      expect(result.cached).toBeDefined();
      // Should contain place information
      expect(result.resources).toMatch(/care|support|resource/i);
    } else {
      // Stub response when no credentials
      expect(result.sources?.every((s: any) => s.source === 'stubbed')).toBe(true);
      expect(result.resources).toContain('Care Collective');
    }
  });

  it('should cache results and return cached on subsequent searches', async () => {
    const t = initConvexTest();

    // 1. Create user
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382937',
      email: 'maps_test_2@test.com',
      name: 'Maps Test User 2',
    });

    await t.mutation(internal.internal.users.updateProfile, {
      userId,
      field: 'zipCode',
      value: '11576',
    });

    // 2. First search - fresh results
    const firstResult = await t.action(internal.resources.searchResources, {
      query: 'support groups',
      category: 'support',
      userId,
    });

    expect(firstResult.error).toBeUndefined();
    const firstCached = firstResult.cached || false;

    // 3. Second search - should use cache
    const secondResult = await t.action(internal.resources.searchResources, {
      query: 'support groups',
      category: 'support',
      userId,
    });

    expect(secondResult.error).toBeUndefined();
    expect(secondResult.cached).toBe(true);

    // 4. Results should be consistent
    expect(secondResult.resources).toBe(firstResult.resources);
  });

  it('should handle different resource categories', async () => {
    const t = initConvexTest();

    // 1. Create user
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382938',
      email: 'maps_test_3@test.com',
      name: 'Maps Test User 3',
    });

    await t.mutation(internal.internal.users.updateProfile, {
      userId,
      field: 'zipCode',
      value: '11576',
    });

    // 2. Test different categories
    const categories = [
      { query: 'respite care', category: 'respite' },
      { query: 'support groups', category: 'support' },
      { query: 'adult day care', category: 'daycare' },
      { query: 'home health care', category: 'homecare' },
    ];

    for (const { query, category } of categories) {
      const result = await t.action(internal.resources.searchResources, {
        query,
        category,
        userId,
      });

      expect(result.error).toBeUndefined();
      expect(result.resources).toBeDefined();
      expect(result.sources).toBeDefined();
    }
  });

  it('should include Google Maps attribution in results', async () => {
    const t = initConvexTest();

    // 1. Create user
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382939',
      email: 'maps_test_4@test.com',
      name: 'Maps Test User 4',
    });

    await t.mutation(internal.internal.users.updateProfile, {
      userId,
      field: 'zipCode',
      value: '11576',
    });

    // 2. Search for resources
    const result = await t.action(internal.resources.searchResources, {
      query: 'memory care facilities',
      category: 'memory',
      userId,
    });

    expect(result.error).toBeUndefined();

    // 3. Verify Google Maps attribution
    expect(result.resources).toBeDefined();
    expect(result.resources).toContain('Google Maps');

    // 4. Verify sources have proper structure
    if (result.sources && result.sources.length > 0) {
      const firstSource = result.sources[0];
      expect(firstSource).toHaveProperty('name');

      // If using real Google Maps, should have placeId or address
      if (hasGoogleCredentials && !result.cached) {
        expect(
          firstSource.placeId || firstSource.address || firstSource.source === 'stubbed'
        ).toBeTruthy();
      }
    }
  });

  it('should return widget token when available', async () => {
    const t = initConvexTest();

    // 1. Create user
    const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
      phone: '+15162382940',
      email: 'maps_test_5@test.com',
      name: 'Maps Test User 5',
    });

    await t.mutation(internal.internal.users.updateProfile, {
      userId,
      field: 'zipCode',
      value: '11576',
    });

    // 2. Search for resources
    const result = await t.action(internal.resources.searchResources, {
      query: 'hospice care',
      category: 'hospice',
      userId,
    });

    expect(result.error).toBeUndefined();

    // 3. Verify widget token format
    expect(result.widgetToken).toBeDefined();
    // Widget token should contain category and zip
    expect(result.widgetToken).toContain('hospice');
    expect(result.widgetToken).toContain('11576');
  });

  it.skipIf(!hasGoogleCredentials)(
    'should call real Google Maps API and return place details',
    async () => {
      const t = initConvexTest();

      // 1. Create user
      const userId = await t.mutation(internal.internal.users.upsertUserFromSignup, {
        phone: '+15162382941',
        email: 'maps_test_6@test.com',
        name: 'Maps Test User 6',
      });

      await t.mutation(internal.internal.users.updateProfile, {
        userId,
        field: 'zipCode',
        value: '11576',
      });

      // 2. Search for resources (real API call)
      const result = await t.action(internal.resources.searchResources, {
        query: 'senior centers',
        category: 'community',
        userId,
      });

      expect(result.error).toBeUndefined();

      // 3. Verify real Google Maps response
      expect(result.sources).toBeDefined();
      expect(result.sources?.length).toBeGreaterThan(0);

      // Real sources should not be stubbed
      expect(result.sources?.every((s: any) => s.source === 'stubbed')).toBe(false);

      // Should have place details
      const firstSource = result.sources![0];
      expect(firstSource.name).toBeDefined();
      expect(firstSource.name).not.toBe('Care Collective'); // Not stub data
    }
  );
});
