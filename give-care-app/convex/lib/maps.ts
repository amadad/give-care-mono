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
 * 
 * ✅ Optimized for Maps Grounding: zip code in query provides accurate location
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
  
  // ✅ Use zip code in query - Maps Grounding understands zip codes natively
  // Format: "category near ZIP_CODE" for best results
  // If user provided additional context in query, include it
  const userQuery = query.trim();
  if (userQuery && userQuery.length > 0 && !userQuery.toLowerCase().includes(zip)) {
    return `${searchTerm} near ${zip} ${userQuery}`;
  }
  return `${searchTerm} near ${zip}`;
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
        hours: maps.hours?.openNow ? 'Open now' : maps.hours?.weekdayText?.join(', ') || undefined,
        rating: typeof maps.rating === 'number' ? maps.rating : undefined,
        phone: maps.phoneNumber || maps.internationalPhoneNumber || undefined,
        category: 'caregiving',
        placeId: maps.placeId,
        uri: maps.uri,
      };
    });
}

/**
 * Search for caregiving resources using Gemini Maps Grounding
 * 
 * ⚡ Performance optimizations:
 * - 3s timeout to prevent blocking
 * - Faster model (gemini-2.5-flash-lite) for speed
 * - Reduced max tokens for faster responses
 */
export async function searchWithMapsGrounding(
  query: string,
  category: string,
  zip: string,
  timeoutMs: number = 3000 // ✅ 3s timeout to prevent blocking
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
    // Build query with location context (zip code in query is sufficient for Maps Grounding)
    const mapsQuery = buildCaregivingQuery(query, category, zip);
    
    // ✅ Maps Grounding works best with zip code in query - lat/lng is optional
    // Only use approximate lat/lng if we want to prioritize it, but zip in query should be enough
    // Note: The rough approximation can cause inaccurate results, so we'll rely on zip in query
    const location = null; // ✅ Disable rough approximation - let Maps Grounding use zip from query
    
    // ✅ Use @google/genai for Maps Grounding (cleaner than REST API)
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required (or GEMINI_API_KEY for backward compatibility)');
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const config: any = {
      tools: [{ googleMaps: {} }],
      // ✅ Optimize for speed
      maxOutputTokens: 200, // Reduced from default for faster responses
    };

    // ✅ Skip location config - Maps Grounding will use zip code from query for better accuracy
    // The rough approximation was causing inaccurate results

    // ✅ Add timeout to prevent blocking
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Maps Grounding timeout after 3s')), timeoutMs);
    });

    const apiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash-lite', // ✅ Faster model for speed
      contents: mapsQuery,
      config,
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);

    // Extract grounding metadata from response (matching official example)
    const candidate = response.candidates?.[0];
    
    if (!candidate) {
      console.error('[maps-grounding] No candidate in response');
      throw new Error('No response candidate from Maps Grounding API');
    }

    const groundingMetadata = candidate.groundingMetadata;
    
    if (!groundingMetadata || !groundingMetadata.groundingChunks || groundingMetadata.groundingChunks.length === 0) {
      // ✅ Reduced logging - only log essential info, not full JSON
      console.error('[maps-grounding] No grounding chunks', { zip, category, hasResponse: !!response.text });
      throw new Error('No Maps Grounding results found. Try a more specific query or check your location.');
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
    // ✅ Only log error message, not full stack trace
    console.error('[maps-grounding] Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

