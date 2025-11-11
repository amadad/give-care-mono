import { beforeEach, describe, expect, it } from 'vitest';
import { initConvexTest } from '../../convex/test.setup.js';
import { api, internal } from '../../convex/_generated/api.js';

const FIVE_MINUTES = 5 * 60 * 1000;

describe('resources.searchResources action', () => {
  let t: ReturnType<typeof initConvexTest>;

  beforeEach(() => {
    t = initConvexTest();
  });

  it('returns an error when no zip can be resolved', async () => {
    const result = await t.action(api.resources.searchResources, {
      query: 'Looking for respite care',
      metadata: {},
    });

    expect(result.error).toBe('missing_zip');
    expect(result.message).toContain('Zip code required');
  });

  it('falls back to stub results when Maps credentials are missing', async () => {
    const originalGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const result = await t.action(api.resources.searchResources, {
        query: 'Need respite care support',
        zip: '11576',
      });

      expect(result.error).toBeUndefined();
      expect(result.cached).toBe(false);
      expect(result.sources).toHaveLength(3);
      expect(result.sources?.every((source: any) => source.source === 'stubbed')).toBe(true);
      expect(result.resources).toContain('Care Collective');
      expect(result.fromRace).toBe(true);
    } finally {
      if (originalGoogleKey !== undefined) {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogleKey;
      } else {
        delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      }

      if (originalGeminiKey !== undefined) {
        process.env.GEMINI_API_KEY = originalGeminiKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    }
  });

  it('returns fresh cached results when TTL has not expired', async () => {
    const now = Date.now();
    const expiresAt = now + FIVE_MINUTES;

    const cachedResources = [
      {
        name: 'Respite Oasis',
        address: '123 Main St',
        hours: 'Mon-Fri 9a-5p',
        rating: 4.9,
        category: 'respite',
      },
    ];

    await t.mutation(internal.internal.recordResourceLookup, {
      userId: undefined,
      category: 'respite',
      zip: '11576',
      results: cachedResources,
      expiresAt,
    });

    const result = await t.action(api.resources.searchResources, {
      query: 'respite help in 11576',
      zip: '11576',
      category: 'respite',
    });

    expect(result.cached).toBe(true);
    expect(result.resources).toContain('Respite Oasis');
    expect(result.sources).toEqual(cachedResources);
    expect(result.widgetToken).toContain('resources-respite-11576');
  });

  it('returns stale cached results while refreshing in background', async () => {
    const now = Date.now();
    const expiresAt = now - FIVE_MINUTES;

    const cachedResources = [
      {
        name: 'Respite Hub',
        address: '500 Elm St',
        hours: '24/7 hotline',
        rating: 4.6,
        category: 'respite',
      },
    ];

    await t.mutation(internal.internal.recordResourceLookup, {
      userId: undefined,
      category: 'respite',
      zip: '11576',
      results: cachedResources,
      expiresAt,
    });

    const result = await t.action(api.resources.searchResources, {
      query: 'respite hub in 11576',
      zip: '11576',
      category: 'respite',
    });

    expect(result.cached).toBe(true);
    expect(result.stale).toBe(true);
    expect(result.resources).toContain('Respite Hub');
    expect(result.expiresAt).toBe(expiresAt);
  });
});
