"use node";

/**
 * Google Maps Grounding via Gemini API (using @ai-sdk/google)
 *
 * Uses Gemini Maps Grounding to find real caregiving resources.
 * See: https://ai.google.dev/gemini-api/docs/maps-grounding
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

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
    
    // ✅ Try using @ai-sdk/google with Maps Grounding via providerOptions
    // Attempt to pass Maps Grounding config through providerOptions
    try {
      const response = await generateText({
        model: google('gemini-2.5-flash'),
        prompt: mapsQuery,
        // Try passing tools through providerOptions
        // Note: toolConfig may need to be passed differently or via raw API
        providerOptions: {
          google: {
            // Maps Grounding tools/config - not in types yet, using as any
            tools: [{ googleMaps: {} }],
            ...(location && {
              toolConfig: {
                retrievalConfig: {
                  latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                  },
                },
              },
            }),
          } as any,
        },
      });

      // Extract grounding metadata from providerMetadata
      const providerMetadata = response.providerMetadata as any;
      const groundingMetadata = providerMetadata?.google?.groundingMetadata;
      
      if (!groundingMetadata) {
        // If no grounding metadata, fall back to REST API
        throw new Error('No grounding metadata in AI SDK response, falling back to REST API');
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
    } catch (aiSdkError) {
      // Fall back to direct REST API if AI SDK doesn't support Maps Grounding
      console.log('[maps-grounding] AI SDK approach failed, using REST API fallback:', aiSdkError);
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }

      const requestBody: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: mapsQuery }],
          },
        ],
        tools: [{ googleMaps: {} }],
      };

      // Add location config if available
      if (location) {
        requestBody.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        };
      }

      const apiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Gemini API error: ${apiResponse.status} ${errorText}`);
      }

      const responseData = await apiResponse.json();
      
      // Extract results from grounding metadata
      const candidate = responseData.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      
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
    }
  } catch (error) {
    console.error('[maps-grounding] Error:', error);
    throw error;
  }
}

