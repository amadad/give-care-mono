"use node";

/**
 * Google Maps Grounding via Gemini API
 *
 * Uses Gemini Maps Grounding to find real caregiving resources.
 * See: https://ai.google.dev/gemini-api/docs/maps-grounding
 *
 * Note: Maps Grounding is not yet available as a tool in @ai-sdk/google
 * (only googleSearch, urlContext, fileSearch, codeExecution are available).
 * Using @google/genai SDK for Maps Grounding until @ai-sdk/google adds support.
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Convert zip code to approximate lat/lng (US only, rough approximation)
 * For production, use a proper geocoding service
 */
function zipToApproximateLatLng(zip: string): { latitude: number; longitude: number } | null {
  // Rough approximation: US zip codes
  // This is a simplified approach - for production, use Google Geocoding API
  const zipNum = parseInt(zip.slice(0, 3), 10);
  
  // Very rough approximation based on US zip code ranges
  // East Coast: 010-270 (roughly 40-45°N, 70-80°W)
  // West Coast: 900-999 (roughly 32-48°N, 115-125°W)
  // Central: 400-699 (roughly 35-45°N, 85-100°W)
  
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
 * Build caregiving-specific query for Maps Grounding
 */
function buildCaregivingQuery(query: string, category: string, zip: string): string {
  const categoryMap: Record<string, string> = {
    respite: 'respite care facilities',
    respite_care: 'respite care services',
    support: 'caregiver support groups',
    support_group: 'caregiver support groups',
    daycare: 'adult day care centers',
    homecare: 'home health care agencies',
    medical: 'medical care facilities',
    community: 'community care resources',
    meals: 'meal delivery services for seniors',
    transport: 'medical transportation services',
    hospice: 'hospice care facilities',
    memory: 'memory care facilities',
  };

  const searchTerm = categoryMap[category] || category;
  
  // Use zip code in query for better location context
  return `${searchTerm} near ${zip} zip code. ${query}`;
}

/**
 * Extract structured results from Maps Grounding response
 */
function extractMapsResults(groundingMetadata: any): Array<{
  name: string;
  address: string;
  hours?: string;
  rating?: number;
  phone?: string;
  category: string;
  placeId?: string;
  uri?: string;
}> {
  if (!groundingMetadata?.groundingChunks) {
    return [];
  }

  return groundingMetadata.groundingChunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any, idx: number) => {
      const maps = chunk.maps;
      return {
        name: maps.title || `Resource ${idx + 1}`,
        address: maps.address || 'Address not available',
        hours: maps.hours || undefined,
        rating: maps.rating || undefined,
        phone: maps.phoneNumber || undefined,
        category: 'caregiving',
        placeId: maps.placeId,
        uri: maps.uri,
      };
    });
}

/**
 * Search for caregiving resources using Gemini Maps Grounding
 */
export async function searchWithMapsGrounding(
  query: string,
  category: string,
  zip: string
): Promise<{
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
}> {
  try {
    // Build query with location context
    const mapsQuery = buildCaregivingQuery(query, category, zip);
    
    // Get approximate lat/lng for better grounding
    const location = zipToApproximateLatLng(zip);
    
    // ✅ Use @google/genai for Maps Grounding (cleaner than REST API)
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
    });

    if (!ai) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required (or GEMINI_API_KEY for backward compatibility)');
    }

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    // Add location config if available
    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: mapsQuery,
      config,
    });

    // Extract grounding metadata from response
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    
    if (!groundingMetadata) {
      throw new Error('No Maps Grounding metadata in response');
    }

    const resources = extractMapsResults(groundingMetadata);
    
    // Get widget token if available
    const widgetToken = groundingMetadata?.googleMapsWidgetContextToken;

    // Format for SMS
    const text = resources.length > 0
      ? resources
          .slice(0, 5) // Limit to 5 for SMS
          .map(
            (r, idx) =>
              `${idx + 1}. ${r.name} — ${r.address}${r.hours ? ` (${r.hours})` : ''}${r.rating ? `, rating ${r.rating}` : ''}`
          )
          .join('\n')
      : `I couldn't find specific ${category} resources near ${zip}. Try searching with a more specific query or check your zip code.`;

    return {
      resources,
      widgetToken,
      text,
    };
  } catch (error) {
    console.error('[maps-grounding] Error:', error);
    throw error;
  }
}

