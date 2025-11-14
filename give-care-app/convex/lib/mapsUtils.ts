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

  const zipCode = (user.metadata as any)?.zipCode as string | undefined;
  if (!zipCode) return null;

  // For lat/lng, would need geocoding service (future enhancement)
  return { zipCode };
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
 * Zone-specific query refinements for targeted resource matching
 * Adds urgency/context modifiers based on caregiver's pressure zones
 */
export const ZONE_QUERY_MODIFIERS: Record<string, Record<string, string>> = {
  emotional: {
    support: "bereavement support groups grief counseling for caregivers",
    hospice: "hospice family support grief counseling end-of-life resources",
    memory: "Alzheimer's caregiver support groups dementia family resources",
    community: "caregiver wellness programs mental health support",
  },
  physical: {
    respite: "emergency respite care temporary caregiver relief",
    daycare: "drop-in adult day care flexible respite programs",
    homecare: "overnight care services caregiver relief programs",
    medical: "caregiver health screening wellness checkups",
  },
  social: {
    support: "in-person caregiver support groups community meetups",
    community: "caregiver social events peer connection programs",
    daycare: "socialization programs adult day care community activities",
    transport: "group transportation shared rides social outings",
  },
  time: {
    respite: "emergency respite care same-day drop-in services",
    daycare: "flexible adult day care extended hours programs",
    meals: "home meal delivery ready-to-eat senior nutrition",
    transport: "on-demand medical transportation scheduling services",
    homecare: "short-term home care hourly services",
  },
  financial: {
    medical: "low-cost medical equipment rental sliding scale",
    homecare: "affordable home care services Medicaid accepted",
    community: "free caregiver resources no-cost support programs",
    meals: "subsidized meal programs low-cost senior nutrition",
    support: "free support groups no-cost caregiver counseling",
  },
};

/**
 * Build caregiving query for Maps Grounding
 * IMPORTANT: Queries target CAREGIVER support, not care recipient facilities
 *
 * Zone → Category Mapping (from FEATURES.md):
 * - Emotional: support, hospice, memory (support groups)
 * - Physical: respite, daycare, homecare (breaks for caregiver)
 * - Social: support, community (connection with others)
 * - Time: respite, daycare, meals, transport (time-saving services)
 * - Financial: medical, homecare, community (cost-effective options)
 */
export function buildCaregivingQuery(
  query: string,
  category: string,
  zip: string,
  zones?: string[]
): string {
  const categoryMap: Record<string, string> = {
    // Caregiver-specific search terms
    respite: "respite care for caregivers adult day care",
    support: "caregiver support groups family caregiver programs",
    daycare: "adult day care centers social day programs",
    homecare: "home care agencies elder care services",
    medical: "medical equipment rental caregiver supplies",
    community: "senior centers community programs for caregivers",
    meals: "meal delivery services for seniors elderly nutrition",
    transport: "non-emergency medical transportation senior transport",
    hospice: "hospice support services palliative care",
    memory: "Alzheimer's support groups dementia caregiver resources",
  };

  let searchTerm = categoryMap[category] || category;

  // Enhance search term with zone-specific modifiers
  if (zones && zones.length > 0) {
    // Use the highest priority zone's modifier if available
    for (const zone of zones) {
      const zoneModifiers = ZONE_QUERY_MODIFIERS[zone];
      if (zoneModifiers && zoneModifiers[category]) {
        searchTerm = zoneModifiers[category];
        break; // Use first matching zone modifier
      }
    }
  }

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

