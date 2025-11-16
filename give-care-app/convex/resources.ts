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
import { findWorstZone } from "./lib/scoreCalculator";
import { getZoneDisplayName } from "./lib/sdoh";

/**
 * Extract ZIP code from query string (inline helper)
 */
function extractZipFromQuery(query: string): string | null {
  const zipMatch = query.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
}

/**
 * National resources (hardcoded list for graceful degradation)
 */
const NATIONAL_RESOURCES: Record<string, string[]> = {
  respite: [
    "Family Caregiver Alliance: caregiver.org",
    "ARCH National Respite: archrespite.org",
    "National Respite Locator: archrespite.org/respitelocator",
  ],
  support: [
    "Family Caregiver Alliance: caregiver.org",
    "AARP Caregiving: aarp.org/caregiving",
    "Caregiver Action Network: caregiveraction.org",
  ],
  default: [
    "Family Caregiver Alliance: caregiver.org",
    "AARP Caregiving: aarp.org/caregiving",
    "National Alliance for Caregiving: caregiving.org",
  ],
};

function getNationalResources(category?: string): string[] {
  return NATIONAL_RESOURCES[category || "default"] || NATIONAL_RESOURCES.default;
}

/**
 * Search resources with graceful degradation
 * No ZIP → national resources, Has ZIP → local, Has score → targeted by worst zone
 */
export const searchResources = internalAction({
  args: {
    userId: v.id("users"),
    query: v.string(),
    category: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    zone: v.optional(v.string()), // P1-P6 zone for targeted resources
    hasScore: v.optional(v.boolean()), // Whether user has a score
  },
  handler: async (ctx, { userId, query, category, zipCode, zone, hasScore }) => {
    // Extract ZIP from query if present
    const zipFromQuery = extractZipFromQuery(query);
    const zip = zipCode || zipFromQuery;
    
    // Get user to check for ZIP and score
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    const userZip = zip || user?.zipCode || (user?.metadata as any)?.zipCode;
    const userHasScore = hasScore !== undefined ? hasScore : (user?.gcSdohScore !== undefined && user.gcSdohScore !== null);
    const userZones = user?.zones || (user?.metadata as any)?.zones;
    
    // Graceful degradation: No ZIP → return national resources
    if (!userZip) {
      const nationalResources = getNationalResources(category);
      return {
        resources: `National resources:\n${nationalResources.map(r => `• ${r}`).join('\n')}\n\nShare your ZIP for local options?`,
        message: "I found some national resources. Share your ZIP code for local options near you.",
      };
    }

    // Has ZIP → Google Maps search for local resources
    // If has score + worst zone → add zone context to query
    let searchQuery = query;
    let targetZone: string | undefined = zone;
    
    if (userHasScore && userZones && !targetZone) {
      // Find worst zone for targeted resources
      const worstZone = findWorstZone(userZones as any);
      if (worstZone) {
        targetZone = worstZone;
        const zoneName = getZoneDisplayName(worstZone);
        // Enhance query with zone context
        searchQuery = `${query} for ${zoneName.toLowerCase()} support`;
      }
    }

    // Call Maps Grounding API for local search
    try {
      const result = await searchWithMapsGrounding(
        searchQuery,
        category || "caregiving",
        { zipCode: userZip },
        3000 // 3s timeout
      );

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
      // Fallback to national resources on error
      const nationalResources = getNationalResources(category);
      return {
        resources: `I couldn't find local results. Here are national resources:\n${nationalResources.map(r => `• ${r}`).join('\n')}`,
        message: "Local search unavailable. Here are national resources.",
      };
    }
  },
});
