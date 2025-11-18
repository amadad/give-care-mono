"use node";

/**
 * Google Maps Grounding via Gemini API
 * Natural query interpretation - NO forced categories
 *
 * See: https://ai.google.dev/gemini-api/docs/maps-grounding
 */

import { GoogleGenAI } from '@google/genai';

export interface LocationData {
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

export interface MapsGroundingResult {
  resources: Array<{
    placeId: string;
    name: string;
    address?: string;
    uri?: string;
    types?: string[];
  }>;
  widgetToken?: string;
  text: string; // Formatted response
  searchQuery: string; // The actual query used
}

const MAPS_FETCH_TIMEOUT_MS = 5000; // 5 seconds timeout

/**
 * Search using Google Maps Grounding with natural query
 * Gemini interprets the query and uses Maps when geographically relevant
 */
export async function searchWithMapsGrounding(
  query: string,
  location: LocationData,
  timeoutMs: number = MAPS_FETCH_TIMEOUT_MS
): Promise<MapsGroundingResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build natural query with location context
  const searchQuery = `${query} near ${location.zipCode}`;

  // Config per official docs
  const config: any = {
    tools: [{ googleMaps: { enableWidget: true } }],
    maxOutputTokens: 500,
  };

  // Add lat/lng context if available (improves accuracy)
  if (location.latitude && location.longitude) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      },
    };
  }

  // Timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Maps Grounding timeout")), timeoutMs);
  });

  const apiPromise = ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: searchQuery,
    config,
  });

  const response = await Promise.race([apiPromise, timeoutPromise]);

  // Extract grounding metadata
  const candidate = response.candidates?.[0];
  if (!candidate) {
    throw new Error("No response candidate from Maps Grounding");
  }

  const groundingMetadata = candidate.groundingMetadata as any;
  if (!groundingMetadata?.groundingChunks) {
    throw new Error("No Maps Grounding results found");
  }

  // Extract place data (policy-compliant: placeId, name, address, types)
  const resources = groundingMetadata.groundingChunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any) => {
      const maps = chunk.maps;
      return {
        placeId: maps.placeId || maps.id || '',
        name: maps.title || maps.name || 'Unknown',
        address: maps.formattedAddress || maps.address,
        uri: maps.uri,
        types: maps.types || [],
      };
    })
    .filter((r: any) => r.placeId); // Only include valid places

  const widgetToken = groundingMetadata.googleMapsWidgetContextToken;

  // Get response text
  const text = candidate.content?.parts?.[0]?.text ||
    formatPlacesForSMS(resources);

  return {
    resources,
    widgetToken,
    text,
    searchQuery,
  };
}

/**
 * Format places for SMS display
 * Fallback if Gemini doesn't provide formatted text
 */
function formatPlacesForSMS(
  places: Array<{ name: string; address?: string; uri?: string }>
): string {
  if (places.length === 0) {
    return "No locations found.";
  }

  const lines = places.slice(0, 3).map((place, i) => {
    const num = i + 1;
    const addr = place.address ? `\n   ${place.address}` : '';
    const link = place.uri ? `\n   ${place.uri}` : '';
    return `${num}. ${place.name}${addr}${link}`;
  });

  return `Found ${places.length} location${places.length > 1 ? 's' : ''}:\n${lines.join('\n\n')}`;
}
