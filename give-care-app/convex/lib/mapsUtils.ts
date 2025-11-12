/**
 * Maps Utilities
 * Location extraction, query building, SMS formatting
 */

import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface LocationData {
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Extract zip code from query (e.g., "respite care in 11576")
 */
export function extractZipFromQuery(query: string): string | null {
  const zipMatch = query.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
}

/**
 * Get location from user metadata
 */
export async function getLocationFromUser(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<LocationData | null> {
  const user = await ctx.db.get(userId);
  if (!user?.metadata) return null;

  const profile = (user.metadata as any)?.profile;
  if (!profile) return null;

  const zipCode = profile.zipCode as string | undefined;
  // For lat/lng, would need geocoding service (future enhancement)
  return { zipCode: zipCode || undefined };
}

/**
 * Convert zip to approximate lat/lng (US only, rough)
 * For production, use Google Geocoding API
 */
export function zipToApproximateLatLng(zip: string): { latitude: number; longitude: number } | null {
  // Rough approximation: US zip codes
  const zipNum = parseInt(zip.slice(0, 3), 10);
  
  // Very rough approximation based on US zip code ranges
  if (zipNum >= 900 && zipNum <= 999) {
    // West Coast
    return {
      latitude: 34.0 + (zipNum - 900) * 0.1,
      longitude: -118.0 - (zipNum - 900) * 0.05,
    };
  } else if (zipNum >= 100 && zipNum <= 270) {
    // East Coast
    return {
      latitude: 40.0 + (zipNum - 100) * 0.05,
      longitude: -74.0 - (zipNum - 100) * 0.05,
    };
  } else if (zipNum >= 400 && zipNum <= 699) {
    // Central
    return {
      latitude: 38.0 + (zipNum - 400) * 0.05,
      longitude: -90.0 - (zipNum - 400) * 0.05,
    };
  }
  
  // Default to US center if unknown
  return { latitude: 39.8283, longitude: -98.5795 };
}

/**
 * Build caregiving query for Maps Grounding
 */
export function buildCaregivingQuery(query: string, category: string, zip: string): string {
  const categoryMap: Record<string, string> = {
    respite: "respite care facilities",
    support: "caregiver support groups",
    daycare: "adult day care centers",
    homecare: "home health care agencies",
    medical: "medical care facilities",
    community: "community care resources",
    meals: "meal delivery services for seniors",
    transport: "medical transportation services",
    hospice: "hospice care facilities",
    memory: "memory care facilities",
  };
  const searchTerm = categoryMap[category] || category;
  
  // Use zip code in query - Maps Grounding understands zip codes natively
  const userQuery = query.trim();
  if (userQuery && userQuery.length > 0 && !userQuery.toLowerCase().includes(zip)) {
    return `${searchTerm} near ${zip} ${userQuery}`;
  }
  return `${searchTerm} near ${zip}`;
}

/**
 * Infer category from query text
 */
export function inferCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('respite')) return 'respite';
  if (lowerQuery.includes('support group')) return 'support';
  if (lowerQuery.includes('day care')) return 'daycare';
  if (lowerQuery.includes('home care')) return 'homecare';
  if (lowerQuery.includes('medical')) return 'medical';
  if (lowerQuery.includes('community')) return 'community';
  if (lowerQuery.includes('meals')) return 'meals';
  if (lowerQuery.includes('transport')) return 'transport';
  if (lowerQuery.includes('hospice')) return 'hospice';
  if (lowerQuery.includes('memory')) return 'memory';
  return 'support'; // Default category
}

/**
 * Category TTLs (in days)
 */
export const CATEGORY_TTLS: Record<string, number> = {
  respite: 30,      // Changes infrequently
  support: 7,       // Weekly updates
  daycare: 14,      // Bi-weekly
  homecare: 14,
  medical: 14,
  community: 14,
  meals: 1,         // Changes daily
  transport: 7,
  hospice: 30,
  memory: 30,
};

/**
 * Truncate text to SMS length
 */
function truncateToSMSLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format resources for SMS (<160 chars per item)
 * Includes Google Maps attribution per guidelines
 */
export function formatResourcesForSMS(
  resources: Array<{ placeId: string; name: string; address?: string }>,
  category: string
): string {
  // Limit to 3-5 results for SMS
  const displayResults = resources.slice(0, 5);
  
  if (displayResults.length === 0) {
    return `I couldn't find specific ${category} resources. Try searching with a more specific query or check your zip code.`;
  }
  
  // Format each result: "Name — Address"
  // Keep under 160 chars per item
  const formatted = displayResults.map((r, idx) => {
    const address = r.address || "Address available";
    const line = `${idx + 1}. ${r.name} — ${address}`;
    return truncateToSMSLength(line, 160);
  }).join("\n");

  // Add Google Maps attribution per guidelines
  // Format: "Sources (Google Maps):" followed by links
  // Per guidelines: Sources must be viewable within one user interaction
  const sources = displayResults
    .filter(r => r.placeId)
    .map((r, idx) => {
      // Build Google Maps URI from placeId
      // Format: maps.google.com/?cid=PLACE_ID or maps.google.com/?place_id=PLACE_ID
      const uri = r.placeId.startsWith('places/') 
        ? `maps.google.com/?place_id=${r.placeId.replace('places/', '')}`
        : `maps.google.com/?cid=${r.placeId}`;
      return `${idx + 1}. ${r.name} - ${uri}`;
    })
    .join("\n");

  return `${formatted}\n\nSources (Google Maps):\n${sources}`;
}

/**
 * Format cached results for SMS (when we only have placeIds)
 */
export function formatCachedResultsForSMS(
  placeIds: string[],
  category: string
): string {
  // For cached results, we only have placeIds
  // Format minimal info with Google Maps links
  const displayResults = placeIds.slice(0, 5);
  
  if (displayResults.length === 0) {
    return `I couldn't find cached ${category} resources. Try searching again.`;
  }
  
  const formatted = displayResults.map((placeId, idx) => {
    const uri = placeId.startsWith('places/') 
      ? `maps.google.com/?place_id=${placeId.replace('places/', '')}`
      : `maps.google.com/?cid=${placeId}`;
    return `${idx + 1}. Resource - ${uri}`;
  }).join("\n");

  const sources = displayResults.map((placeId, idx) => {
    const uri = placeId.startsWith('places/') 
      ? `maps.google.com/?place_id=${placeId.replace('places/', '')}`
      : `maps.google.com/?cid=${placeId}`;
    return `${idx + 1}. Resource - ${uri}`;
  }).join("\n");

  return `${formatted}\n\nSources (Google Maps):\n${sources}`;
}

