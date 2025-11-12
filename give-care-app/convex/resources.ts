"use node";

import { action, internalAction } from './_generated/server';
import { v } from 'convex/values';
import { internal, components } from './_generated/api';
import { searchWithMapsGrounding } from './lib/maps';
import { MS_PER_DAY, RACE_TIMEOUT_MS } from './lib/utils';
import { WorkflowManager } from '@convex-dev/workflow';
import type { ResourceResult } from './lib/types';

const workflow = new WorkflowManager(components.workflow);

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


const isCredentialErrorMessage = (message: string) => {
  const lower = message.toLowerCase();
  return (
    lower.includes('api key') ||
    lower.includes('credential') ||
    lower.includes('environment variable is required')
  );
};

const resolveZipFromMetadata = (metadata: Record<string, unknown> | undefined): string | undefined => {
  if (!metadata) return undefined;
  const direct = metadata.zip as string | undefined;
  if (direct) return direct;
  const nestedProfile = metadata.profile as Record<string, unknown> | undefined;
  if (nestedProfile?.zipCode && (typeof nestedProfile.zipCode === 'string' || typeof nestedProfile.zipCode === 'number')) {
    return String(nestedProfile.zipCode);
  }
  return metadata.zipCode as string | undefined;
};

// Return type for resource search action
type ResourceSearchResult =
  | { error: string; message?: string; suggestion?: string }
  | {
      resources: string;
      sources: ResourceResult[];
      widgetToken: string;
      cached: boolean;
      expiresAt?: number;
      stale?: boolean;
    };

// Public version - actions can be called from other actions
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
    // Priority 1: Extract zip from query if provided (e.g., "support groups in 11576")
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
    const ttlMs = ttlDays * MS_PER_DAY;
    const now = Date.now();

    const cache = await ctx.runQuery(internal.internal.getResourceLookupCache, {
      category,
      zip: resolvedZip,
    });

    /**
     * STALE-WHILE-REVALIDATE (SWR) CACHING PATTERN
     *
     * Convex docs note: "SWR and periodic invalidation are flawed strategies...
     * only for loose consistency expectations."
     *
     * WHY THIS IS ACCEPTABLE HERE:
     * - Resource data (local services) changes infrequently (weekly/monthly)
     * - Stale data is better than slow responses for user experience
     * - Maps Grounding API can be slow (>2s), we need <500ms response time
     * - Category-based TTLs match data volatility (support groups: 7d, respite: 30d)
     *
     * IMPLEMENTATION:
     * 1. Valid cache (< TTL): Return immediately
     * 2. Stale cache (> TTL): Return immediately + refresh in background via workflow
     * 3. No cache: Call Maps API (1.5s timeout), return results or error
     *
     * This provides:
     * - Fast responses (<500ms) via cache
     * - Eventual freshness via background refresh
     * - Clear error messages when Maps API fails (no stubs)
     */
    const isCacheValid = cache && cache.expiresAt && cache.expiresAt > now;
    const hasStaleCache = cache && cache.results && cache.results.length > 0;

    if (isCacheValid) {
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

    // If stale cache exists, return it immediately and refresh in background
    if (hasStaleCache) {
      const staleText = cache.results
        .map(
          (resource: any, idx: number) =>
            `${idx + 1}. ${resource.name} — ${resource.address} (${resource.hours}, rating ${resource.rating})`
        )
        .join('\n');

      // Refresh in background via durable workflow (non-blocking, retriable)
      void workflow.start(ctx, internal.workflows.refresh, {
        query: args.query,
        category,
        zip: resolvedZip,
        ttlMs,
      });

      return {
        resources: staleText,
        sources: cache.results,
        widgetToken: `resources-${category}-${resolvedZip}-${cache._id}`,
        cached: true, // Mark as cached even though stale
        expiresAt: cache.expiresAt,
        stale: true,
      };
    }

    // Call Maps Grounding API (1.5s timeout) - no stub fallbacks
    type MapsRaceResult = {
      resources: Array<{
        name: string;
        address: string;
        hours?: string;
        rating?: number;
        phone?: string;
        category: string;
        placeId?: string;
        uri?: string;
      }>;
      widgetToken?: string;
      text: string;
    };

    let mapsPromise: Promise<MapsRaceResult> | null = null;
    let mapsCredentialError = false;
    try {
      mapsPromise = searchWithMapsGrounding(args.query, category, resolvedZip, RACE_TIMEOUT_MS);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[resources] Failed to start Maps Grounding:', errorMessage);
      mapsCredentialError = isCredentialErrorMessage(errorMessage);
    }

    let results: ResourceResult[] = [];
    let summaryText = '';
    let widgetToken: string | undefined;
    let usedMapsGrounding = false;
    let fromRace = false;

    if (mapsPromise) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Maps Grounding timeout after 1.5s')), RACE_TIMEOUT_MS);
      });

      try {
        // Call Maps API with timeout
        const mapsResult = await Promise.race([mapsPromise, timeoutPromise]);
        results = mapsResult.resources.map(r => ({
          ...r,
          source: 'maps' as const,
          hours: r.hours ?? 'Hours not available',
          rating: r.rating ?? 0,
          phone: r.phone ?? 'Phone not available',
        }));
        summaryText = mapsResult.text;
        widgetToken = mapsResult.widgetToken;
        usedMapsGrounding = true;
        fromRace = true;
      } catch (error) {
        // Timeout or error - return clear error message (no stubs)
        fromRace = true;

        // Log error for debugging
        const message = error instanceof Error ? error.message : String(error);
        if (!(error instanceof Error && error.message.includes('timeout'))) {
          console.error('[resources] Maps Grounding failed:', message);
        }
        mapsCredentialError ||= isCredentialErrorMessage(message);
        
        // Return clear error message - no stub fallback
        if (mapsCredentialError) {
          summaryText = `I'm having trouble connecting to the resource search service. Please try again in a moment.`;
        } else {
          summaryText = `I'm still searching for ${category} resources near ${resolvedZip}. Please check back in a moment - real results are being fetched.`;
          // Schedule background refresh for timeout cases
          void workflow.start(ctx, internal.workflows.refresh, {
            query: args.query,
            category,
            zip: resolvedZip,
            ttlMs,
          });
        }
        results = [];
      }
    } else {
      // No Maps promise (credential error or missing API key)
      if (mapsCredentialError) {
        summaryText = `I'm having trouble connecting to the resource search service. Please try again later.`;
      } else {
        summaryText = `I'm searching for ${category} resources near ${resolvedZip}. Results will be available shortly - please check back in a moment.`;
      }
      results = [];
    }

    // Cache results for future queries (async, non-blocking)
    void ctx.runMutation(internal.internal.recordResourceLookup, {
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
      fromRace, // Indicates this was a race result
    };
  },
});

// ============================================================================
// INTERNAL ACTION FOR WORKFLOW USE
// ============================================================================

/**
 * Internal action for fetching Maps Grounding results
 * Used by workflow only - pure fetch, no cache writes
 */
export const _fetchWithMaps = internalAction({
  args: {
    query: v.string(),
    category: v.string(),
    zip: v.string(),
  },
  handler: async (_ctx, args) => {
    return await searchWithMapsGrounding(args.query, args.category, args.zip, 3000);
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

