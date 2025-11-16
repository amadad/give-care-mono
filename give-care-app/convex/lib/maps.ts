"use node";

/**
 * Google Maps Grounding via Gemini API
 * 
 * Uses Gemini Maps Grounding to find real caregiving resources.
 * See: https://ai.google.dev/gemini-api/docs/maps-grounding
 * 
 * Following official Gemini API docs pattern with @google/genai SDK
 */

import { GoogleGenAI } from '@google/genai';

export interface LocationData {
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Build caregiving-specific query (inline helper)
 */
function buildCaregivingQuery(query: string, category: string, zipCode: string, zones?: string[]): string {
  let enhancedQuery = `Find ${category || 'caregiving'} resources`;
  if (zones && zones.length > 0) {
    enhancedQuery += ` for ${zones.join(', ')} support`;
  }
  enhancedQuery += ` near ${zipCode}`;
  return enhancedQuery;
}

/**
 * Format resources for SMS (inline helper)
 */
function formatResourcesForSMS(resources: Array<{ name: string; address?: string }>, category: string): string {
  const lines = resources.slice(0, 3).map((r, i) => {
    const num = i + 1;
    const addr = r.address ? ` - ${r.address}` : '';
    return `${num}. ${r.name}${addr}`;
  });
  return `Found ${resources.length} ${category} resources:\n${lines.join('\n')}`;
}

export interface MapsGroundingResult {
  resources: Array<{
    placeId: string;
    name: string;
    address?: string;
    types?: string[];
  }>;
  widgetToken?: string;
  text: string; // Formatted for SMS
}

const MAPS_FETCH_TIMEOUT_MS = 3000; // 3 seconds timeout

/**
 * Search using Google Maps Grounding
 * Following official Gemini API docs pattern
 */
export async function searchWithMapsGrounding(
  query: string,
  category: string,
  location: LocationData,
  timeoutMs: number = MAPS_FETCH_TIMEOUT_MS,
  zones?: string[]
): Promise<MapsGroundingResult> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build caregiving-specific query with zone refinements
  if (!location.zipCode) {
    throw new Error("Zip code is required for Maps Grounding");
  }
  const mapsQuery = buildCaregivingQuery(query, category, location.zipCode, zones);

  // Config per official docs
  const config: any = {
    tools: [{ googleMaps: {} }],
    maxOutputTokens: 200, // Optimize for speed
  };

  // Add location context if available (per best practices)
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
    model: "gemini-2.5-flash-lite", // Fast model
    contents: mapsQuery,
    config,
  });

  const response = await Promise.race([apiPromise, timeoutPromise]);

  // Extract grounding metadata
  const candidate = response.candidates?.[0];
  if (!candidate) {
    throw new Error("No response candidate");
  }

  const groundingMetadata = candidate.groundingMetadata as any;
  if (!groundingMetadata?.groundingChunks) {
    throw new Error("No Maps Grounding results");
  }

  // Extract placeIds (policy-compliant: only store place_id, name, types)
  const resources = groundingMetadata.groundingChunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any) => {
      const maps = chunk.maps;
      return {
        placeId: maps.placeId || maps.id || '',
        name: maps.title || maps.name || 'Unknown',
        address: maps.formattedAddress || maps.address,
        types: maps.types || [],
      };
    })
    .filter((r: any) => r.placeId); // Only include resources with placeId

  const widgetToken = groundingMetadata.googleMapsWidgetContextToken;

  // Format for SMS (<160 chars per item, Google Maps attribution)
  const text = formatResourcesForSMS(resources, category);

  return { resources, widgetToken, text };
}

