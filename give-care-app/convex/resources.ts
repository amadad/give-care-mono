/**
 * Resource Search
 * Google Maps Grounding API integration (policy-compliant)
 * 
 * Following Convex Pattern: Action → Query → Mutation
 */

"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { searchWithMapsGrounding } from "./lib/maps";
import {
  extractZipFromQuery,
  inferCategory,
  CATEGORY_TTLS,
  formatCachedResultsForSMS,
  zipToApproximateLatLng,
} from "./lib/mapsUtils";
import type { LocationData } from "./lib/mapsUtils";

/**
 * Search resources using Google Maps Grounding
 * Called from searchResources tool
 */
export const searchResources = internalAction({
  args: {
    userId: v.id("users"),
    query: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { userId, query, category }) => {
    // Step 1: Extract location (query → user metadata → error)
    const zipFromQuery = extractZipFromQuery(query);
    const userLocation = await ctx.runQuery(
      internal.resources.getLocationFromUserQuery,
      { userId }
    );

    const zip = zipFromQuery || userLocation?.zipCode;
    if (!zip) {
      return {
        error: "missing_zip",
        suggestion: "What's your 5-digit zip code so I can find nearby support?",
      };
    }

    // Step 2: Emit resource.search event
    await ctx.runMutation(internal.events.emitResourceSearch, {
      userId,
      query,
      category: category || inferCategory(query),
      zip,
    });

    // Step 3: Check cache (query)
    const resolvedCategory = category || inferCategory(query);
    const cache = await ctx.runQuery(internal.resources.getCachedResources, {
      category: resolvedCategory,
      zip,
    });

    if (cache && cache.placeIds.length > 0) {
      // Cache hit - format from placeIds
      // Note: For SMS, we format placeIds directly (no Places Details API call needed)
      const text = formatCachedResultsForSMS(cache.placeIds, resolvedCategory);
      return {
        resources: text,
        sources: cache.placeIds.map((id) => ({ placeId: id })),
      };
    }

    // Step 3: Call Maps Grounding API (action - network call)
    try {
      // Get approximate lat/lng from zip for better location context
      const approximateLocation = zipToApproximateLatLng(zip);
      const location: LocationData = {
        zipCode: zip,
        latitude: approximateLocation?.latitude,
        longitude: approximateLocation?.longitude,
      };

      const result = await searchWithMapsGrounding(
        query,
        resolvedCategory,
        location,
        3000 // 3s timeout
      );

      // Step 4: Save to cache (mutation - transactional)
      const ttlDays = CATEGORY_TTLS[resolvedCategory] || 14;
      await ctx.runMutation(internal.resources.saveToCache, {
        category: resolvedCategory,
        zip,
        placeIds: result.resources.map((r) => r.placeId),
        ttlDays,
      });

      return {
        resources: result.text,
        sources: result.resources.map((r) => ({
          placeId: r.placeId,
          name: r.name,
          address: r.address,
        })),
        widgetToken: result.widgetToken,
      };
    } catch (error) {
      // Error handling
      if (error instanceof Error && error.message.includes("timeout")) {
        return {
          error: "timeout",
          message: "Search is taking longer than expected. Please try again.",
        };
      }
      if (error instanceof Error && error.message.includes("No Maps Grounding results")) {
        return {
          error: "no_results",
          message: `I couldn't find ${resolvedCategory} resources near ${zip}. Try a more specific query.`,
        };
      }
      // Re-throw unexpected errors
      throw error;
    }
  },
});
