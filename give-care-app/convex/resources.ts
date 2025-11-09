"use node";

/**
 * Resources - External resource search
 *
 * Merges functions/resources.ts and lib/maps.ts
 * Handles Gemini search and Google Maps integration.
 *
 * Uses Gemini API with Google Maps grounding to find local caregiving resources
 * such as respite care, support groups, medical facilities, and community services.
 */

import { action } from './_generated/server';
import { v } from 'convex/values';
import { GoogleGenAI } from '@google/genai';

// ============================================================================
// TYPES
// ============================================================================

interface LocationContext {
  zipCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface ResourceQuery {
  query: string;
  location: LocationContext;
  radius?: number; // in meters, optional
}

interface MapSource {
  uri: string;
  title: string;
  placeId: string;
}

interface ResourceResult {
  text: string;
  sources: MapSource[];
  widgetToken?: string;
}

// ============================================================================
// GOOGLE MAPS GROUNDING
// ============================================================================

/**
 * Build caregiving-specific query with context
 */
const buildCaregivingQuery = (userQuery: string, location: LocationContext): string => {
  // Enhance query with caregiving context if not already specific
  const caregivingKeywords = [
    'respite',
    'adult day care',
    'support group',
    'caregiver',
    'hospice',
    'home health',
    'senior center',
    'nursing',
    'memory care',
    'assisted living',
  ];

  const hasCaregicingContext = caregivingKeywords.some((keyword) =>
    userQuery.toLowerCase().includes(keyword)
  );

  let enhancedQuery = userQuery;

  if (!hasCaregicingContext) {
    enhancedQuery = `Caregiving resource: ${userQuery}`;
  }

  // Add location hint - prefer zip code, then address
  if (location.zipCode) {
    enhancedQuery += ` near ${location.zipCode}`;
  } else if (location.address) {
    enhancedQuery += ` near ${location.address}`;
  }

  return enhancedQuery;
};

/**
 * Search for local caregiving resources using Google Maps grounding
 *
 * @param query - Natural language query (e.g., "respite care near me", "adult day care centers")
 * @param location - User's location (latitude, longitude)
 * @returns Grounded response with sources and optional widget token
 */
export const searchLocalResources = async (
  request: ResourceQuery
): Promise<ResourceResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build location-aware prompt
  const enhancedQuery = buildCaregivingQuery(request.query, request.location);

  try {
    // Build config with optional location context
    const config: any = {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      tools: [{ googleMaps: { enableWidget: true } }],
    };

    // Add location context if available (lat/lng takes precedence for precision)
    if (request.location.latitude && request.location.longitude) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: request.location.latitude,
            longitude: request.location.longitude,
          },
        },
      };
    }
    // Note: Google Maps grounding also uses the text query itself for location
    // (e.g., "near 90210" in the query works without explicit lat/lng)

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: enhancedQuery,
      config,
    });

    const text = response.text ?? '';

    // Extract grounding metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources: MapSource[] = [];

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.maps) {
          sources.push({
            uri: chunk.maps.uri || '',
            title: chunk.maps.title || '',
            placeId: chunk.maps.placeId || '',
          });
        }
      }
    }

    const widgetToken = groundingMetadata?.googleMapsWidgetContextToken;

    return {
      text,
      sources,
      widgetToken,
    };
  } catch (error) {
    console.error('Google Maps grounding error:', error);
    throw new Error(`Resource search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Extract location from user profile or session
 *
 * Priority:
 * 1. Zip code (most common - users provide during onboarding)
 * 2. Full address
 * 3. Lat/lng (if geocoded previously)
 */
export const extractLocation = (metadata: Record<string, unknown>): LocationContext | null => {
  const profile = metadata.profile as Record<string, unknown> | undefined;

  if (!profile) {
    return null;
  }

  return {
    zipCode: profile.zipCode as string | undefined,
    address: profile.address as string | undefined,
    latitude: profile.latitude as number | undefined,
    longitude: profile.longitude as number | undefined,
  };
};

/**
 * Common caregiving resource queries
 */
export const CAREGIVING_QUERIES = {
  respiteCare: 'Find respite care centers or services that provide temporary relief for family caregivers',
  supportGroups: 'Find caregiver support groups or peer support meetings in my area',
  adultDayCare: 'Find adult day care centers that provide supervised activities and care during daytime hours',
  homeCare: 'Find home health care agencies that provide in-home medical and personal care services',
  medicalSupplies: 'Find medical supply stores that sell mobility aids, incontinence products, and home medical equipment',
  seniorCenters: 'Find senior centers or community centers with programs for older adults',
  mealDelivery: 'Find meal delivery services like Meals on Wheels for seniors',
  transportation: 'Find senior transportation services or medical transport providers',
  hospice: 'Find hospice care providers that offer end-of-life care and support',
  memoryCare: 'Find memory care facilities or Alzheimer\'s programs and resources',
} as const;

// ============================================================================
// PUBLIC ACTIONS
// ============================================================================

/**
 * Search for local caregiving resources using Google Maps grounding
 *
 * This action uses Gemini API with Google Maps to find:
 * - Respite care centers
 * - Support groups
 * - Adult day care facilities
 * - Home health agencies
 * - Medical supply stores
 * - Community resources
 *
 * Returns grounded results with sources and optional widget token for rendering
 */
export const searchResources = action({
  args: {
    query: v.string(),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
        address: v.optional(v.string()),
      })
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { query, location, metadata }) => {
    // Extract location from params or user metadata
    let finalLocation = location;

    if (!finalLocation && metadata) {
      const extracted = extractLocation(metadata as Record<string, unknown>);
      if (extracted && extracted.latitude !== undefined && extracted.longitude !== undefined) {
        finalLocation = extracted as { address?: string; latitude: number; longitude: number };
      }
    }

    if (!finalLocation || (!('zipCode' in finalLocation) && !finalLocation.address && !finalLocation.latitude)) {
      return {
        error: 'I need your zip code to find nearby resources. What\'s your zip code?',
        text: '',
        sources: [],
      };
    }

    try {
      const result = await searchLocalResources({
        query,
        location: finalLocation,
      });

      return {
        text: result.text,
        sources: result.sources,
        widgetToken: result.widgetToken,
      };
    } catch (error) {
      console.error('Resource search error:', error);
      return {
        error: error instanceof Error ? error.message : 'Resource search failed',
        text: '',
        sources: [],
      };
    }
  },
});

/**
 * Get common caregiving resource query templates
 */
export const getResourceTemplates = action({
  args: {},
  handler: async () => {
    return {
      templates: [
        {
          id: 'respiteCare',
          title: 'Respite Care',
          query: 'Find respite care centers or services that provide temporary relief for family caregivers',
          category: 'Support Services',
        },
        {
          id: 'supportGroups',
          title: 'Support Groups',
          query: 'Find caregiver support groups or peer support meetings in my area',
          category: 'Emotional Support',
        },
        {
          id: 'adultDayCare',
          title: 'Adult Day Care',
          query: 'Find adult day care centers that provide supervised activities and care during daytime hours',
          category: 'Daytime Care',
        },
        {
          id: 'homeCare',
          title: 'Home Health Care',
          query: 'Find home health care agencies that provide in-home medical and personal care services',
          category: 'Medical Services',
        },
        {
          id: 'medicalSupplies',
          title: 'Medical Supplies',
          query:
            'Find medical supply stores that sell mobility aids, incontinence products, and home medical equipment',
          category: 'Equipment',
        },
        {
          id: 'seniorCenters',
          title: 'Senior Centers',
          query: 'Find senior centers or community centers with programs for older adults',
          category: 'Community',
        },
        {
          id: 'mealDelivery',
          title: 'Meal Delivery',
          query: 'Find meal delivery services like Meals on Wheels for seniors',
          category: 'Nutrition',
        },
        {
          id: 'transportation',
          title: 'Transportation',
          query: 'Find senior transportation services or medical transport providers',
          category: 'Transportation',
        },
        {
          id: 'hospice',
          title: 'Hospice Care',
          query: 'Find hospice care providers that offer end-of-life care and support',
          category: 'Medical Services',
        },
        {
          id: 'memoryCare',
          title: 'Memory Care',
          query: "Find memory care facilities or Alzheimer's programs and resources",
          category: 'Specialized Care',
        },
      ],
    };
  },
});
