/**
 * AI-Native Resource Search
 * Zero hardcoded resources - pure AI-powered intent interpretation
 *
 * Architecture:
 * 1. Interpret intent → Map to SDOH zones
 * 2. Has ZIP? → Maps Grounding (local)
 * 3. No ZIP? → Search Grounding or Gemini knowledge (national)
 * 4. Tiered search with graceful fallback
 */

"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { interpretSearchIntent, getZoneDisplayName } from "./lib/intentInterpreter";
import { searchWithMapsGrounding } from "./lib/maps";
import { tieredSearch } from "./lib/search";

/**
 * AI-Native Resource Search
 * Interprets user intent and finds relevant resources dynamically
 */
export const searchResources = internalAction({
  args: {
    userId: v.id("users"),
    query: v.string(),
    category: v.optional(v.string()), // Legacy - ignored
    zipCode: v.optional(v.string()),
    zone: v.optional(v.string()), // Legacy - ignored
    hasScore: v.optional(v.boolean()), // Legacy - ignored
  },
  handler: async (ctx, { userId, query, zipCode }) => {
    // Get user context
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    const userZip = zipCode || user?.zipCode || (user?.metadata as any)?.zipCode;
    const userLat = (user?.metadata as any)?.latitude;
    const userLng = (user?.metadata as any)?.longitude;

    try {
      // STEP 1: Interpret Intent (AI-powered)
      const intent = await interpretSearchIntent(query, {
        zones: user?.zones,
        gcSdohScore: user?.gcSdohScore,
        metadata: user?.metadata,
      });

      // STEP 2: Choose search strategy based on location availability
      const shouldUseLocal =
        !!userZip && intent.isGeographical === true;

      if (shouldUseLocal) {
        // LOCAL SEARCH: Use Maps Grounding when query is truly geographical
        return await searchLocalResources(intent, {
          zipCode: userZip,
          latitude: userLat,
          longitude: userLng,
        });
      } else {
        // NATIONAL SEARCH: Use Search Grounding or Gemini knowledge
        return await searchNationalResources(intent);
      }
    } catch (error) {
      // Fallback: Simple Gemini response without grounding
      return {
        resources: `I had trouble finding specific resources. Could you clarify what you're looking for? For example: "respite care near me" or "caregiver support groups"`,
        error: (error as Error).message,
        suggestion: userZip
          ? "Try refining your search or checking if the location is correct."
          : "Share your ZIP code for local options: 'My ZIP is 12345'",
      };
    }
  },
});

/**
 * Search for local resources using Maps Grounding
 * Tries each tier until successful
 */
async function searchLocalResources(
  intent: any,
  location: { zipCode: string; latitude?: number; longitude?: number }
): Promise<any> {
  let lastError: Error | null = null;

  // Try each search tier (specific → general)
  for (const tier of intent.searchTiers) {
    try {
      const result = await searchWithMapsGrounding(tier, location);

      // Success! Return formatted results
      return {
        resources: formatMapsResponse(result.text, intent),
        sources: result.resources.map((r: any) => ({
          placeId: r.placeId,
          name: r.name,
          address: r.address,
        })),
        widgetToken: result.widgetToken,
        intent: {
          zones: intent.sdohZones,
          reasoning: intent.reasoning,
        },
      };
    } catch (error) {
      console.log(`Maps search tier failed: ${tier}`, error);
      lastError = error as Error;
      // If Maps returns a clear "no results" signal, fall back early
      const message = (lastError as Error).message || String(lastError);
      if (message.includes("No Maps Grounding results found")) {
        break;
      }
      continue; // Try next tier for transient errors
    }
  }

  // All tiers failed or no local results - fall back to national search
  try {
    return await searchNationalResources(intent);
  } catch (nationalError) {
    // Preserve original Maps error when available
    throw lastError || (nationalError as Error);
  }
}

/**
 * Search for national resources using Search Grounding or Gemini
 * Tries each tier until successful
 */
async function searchNationalResources(intent: any): Promise<any> {
  try {
    // Use tiered search with Gemini (Search Grounding optional)
    const result = await tieredSearch(
      intent.searchTiers,
      false // Set to true to enable Search Grounding (if available)
    );

    return {
      resources: formatNationalResponse(result.text, intent),
      sources: result.sources.length > 0 ? result.sources : undefined,
      intent: {
        zones: intent.sdohZones,
        reasoning: intent.reasoning,
      },
      message: "These are online resources. Share your ZIP code for local options.",
    };
  } catch (error) {
    throw new Error(`National search failed: ${(error as Error).message}`);
  }
}

/**
 * Format Maps Grounding response for SMS
 * Add SDOH zone context
 */
function formatMapsResponse(text: string, intent: any): string {
  const zoneContext = intent.sdohZones.length > 0
    ? `\n\nRelated to: ${intent.sdohZones.map(getZoneDisplayName).join(", ")}`
    : "";

  return `${text}${zoneContext}`;
}

/**
 * Format national search response for SMS
 * Add SDOH zone context and ZIP prompt
 */
function formatNationalResponse(text: string, intent: any): string {
  const zoneContext = intent.sdohZones.length > 0
    ? `\n\nThese address: ${intent.sdohZones.map(getZoneDisplayName).join(", ")}`
    : "";

  return `${text}${zoneContext}\n\nShare your ZIP for local options.`;
}
