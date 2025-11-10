"use node";

import { action, internalAction } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { searchWithMapsGrounding } from './lib/maps';

const CATEGORY_TTLS_DAYS: Record<string, number> = {
  respite: 30,
  respite_care: 30,
  support: 14,
  support_group: 7,
  daycare: 30,
  homecare: 30,
  medical: 14,
  community: 14,
  meals: 7,
  transport: 7,
  hospice: 30,
  memory: 30,
};

const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  respite: /respite|break/i,
  support: /support|group/i,
  daycare: /day\s*care|adult/i,
  homecare: /home\s*care|in[-\s]?home/i,
  medical: /nurse|doctor|medical/i,
  community: /community|center/i,
  meals: /meal|food/i,
  transport: /transport|ride/i,
  hospice: /hospice|end of life/i,
  memory: /memory|alzheim/i,
};

const normalizeZip = (zip?: string) => {
  if (!zip) return undefined;
  const digits = zip.replace(/\D/g, '');
  return digits.length >= 5 ? digits.slice(0, 5) : undefined;
};

/**
 * Extract zip code from query text (e.g., "support groups in 11576" or "11576")
 */
const extractZipFromQuery = (query: string): string | undefined => {
  // Look for 5-digit zip codes in the query
  const zipMatch = query.match(/\b\d{5}\b/);
  if (zipMatch) {
    return normalizeZip(zipMatch[0]);
  }
  return undefined;
};

const inferCategory = (query: string, fallback = 'respite') => {
  for (const [category, regex] of Object.entries(CATEGORY_KEYWORDS)) {
    if (regex.test(query)) return category;
  }
  return fallback;
};

const buildStubResults = (category: string, zip: string) => [
  {
    name: `${category} Care Collective`,
    address: `${zip.slice(0, 3)}12 Oak Street`,
    hours: 'Mon-Sat 8a-8p',
    rating: 4.8,
    source: 'stubbed',
    phone: '(555) 123-0000',
    category,
  },
  {
    name: `${category} Support Hub`,
    address: `${zip.slice(0, 3)}45 Maple Ave`,
    hours: '24/7 hotline',
    rating: 4.7,
    source: 'stubbed',
    phone: '(555) 234-1111',
    category,
  },
  {
    name: `${category} Community Center`,
    address: `${zip.slice(0, 3)}78 Elm Blvd`,
    hours: 'Mon-Fri 9a-6p',
    rating: 4.6,
    source: 'stubbed',
    phone: '(555) 678-2222',
    category,
  },
];

const resolveZipFromMetadata = (metadata: Record<string, unknown> | undefined): string | undefined => {
  if (!metadata) return undefined;
  const direct = metadata.zip as string | undefined;
  if (direct) return direct;
  const nestedProfile = metadata.profile as Record<string, unknown> | undefined;
  if (nestedProfile?.zipCode) return String(nestedProfile.zipCode);
  return metadata.zipCode as string | undefined;
};

export const searchResources = action({
  args: {
    query: v.string(),
    metadata: v.optional(v.any()),
    userId: v.optional(v.string()),
    category: v.optional(v.string()),
    zip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const metadata = (args.metadata ?? {}) as Record<string, unknown>;
    // ✅ Priority 1: Extract zip from query if provided (e.g., "support groups in 11576")
    let resolvedZip =
      normalizeZip(args.zip) ||
      extractZipFromQuery(args.query) ||
      normalizeZip(resolveZipFromMetadata(metadata)) ||
      undefined;

    if (!resolvedZip && args.userId) {
      const user = await ctx.runQuery(internal.internal.getByExternalIdQuery, {
        externalId: args.userId,
      });
      if (user?.metadata) {
        resolvedZip = normalizeZip(resolveZipFromMetadata(user.metadata as Record<string, unknown>));
      }
    }

    if (!resolvedZip) {
      return {
        error: 'missing_zip',
        message: 'Zip code required to search for nearby resources.',
        suggestion: "What's your 5-digit zip code so I can tailor nearby support?",
      };
    }

    const category = (args.category ?? inferCategory(args.query)).toLowerCase();
    const ttlDays = CATEGORY_TTLS_DAYS[category] ?? 14;
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const cache = await ctx.runQuery(internal.internal.getResourceLookupCache, {
      category,
      zip: resolvedZip,
    });

    if (cache && cache.expiresAt && cache.expiresAt > now) {
      const text = cache.results
        .map(
          (resource: any, idx: number) =>
            `${idx + 1}. ${resource.name} — ${resource.address} (${resource.hours}, rating ${resource.rating})`
        )
        .join('\n');

      return {
        resources: text,
        sources: cache.results,
        widgetToken: `resources-${category}-${resolvedZip}-${cache._id}`,
        cached: true,
        expiresAt: cache.expiresAt,
      };
    }

    // ✅ Use Gemini Maps Grounding instead of stub data
    let results;
    let summaryText;
    let widgetToken: string | undefined;
    
    try {
      const mapsResult = await searchWithMapsGrounding(args.query, category, resolvedZip);
      results = mapsResult.resources;
      summaryText = mapsResult.text;
      widgetToken = mapsResult.widgetToken;
    } catch (error) {
      console.error('[resources] Maps Grounding failed, using fallback:', error);
      // Fallback to stub data if Maps Grounding fails
      results = buildStubResults(category, resolvedZip);
      summaryText = results
        .map(
          (resource, idx) =>
            `${idx + 1}. ${resource.name} — ${resource.address} (${resource.hours}, rating ${resource.rating})`
        )
        .join('\n');
    }

    // Cache results for future queries
    await ctx.runMutation(internal.internal.recordResourceLookup, {
      userId: undefined,
      category,
      zip: resolvedZip,
      results,
      expiresAt: now + ttlMs,
    });

    return {
      resources: summaryText,
      sources: results,
      widgetToken: widgetToken || `resources-${category}-${resolvedZip}-${now}`,
      cached: false,
      expiresAt: now + ttlMs,
    };
  },
});

// ============================================================================
// RESOURCE CACHE CLEANUP ACTION (for cron jobs)
// ============================================================================

export const cleanupResourceCache = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get expired cache entries (batched for efficiency)
    const batch = await ctx.runQuery(internal.internal.listExpiredResourceCache, { 
      now,
      limit: 200, // Process in batches to avoid timeouts
    });
    
    if (batch.ids.length === 0) {
      return { deleted: 0 };
    }
    
    // Delete expired entries
    const result = await ctx.runMutation(internal.internal.deleteResourceCacheBatch, { 
      ids: batch.ids 
    });
    
    return { deleted: result.deleted };
  },
});

