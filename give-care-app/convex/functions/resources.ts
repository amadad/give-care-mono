import { action } from '../_generated/server';
import { v } from 'convex/values';
import { searchLocalResources, extractLocation } from '../lib/maps';

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
      if (extracted) {
        finalLocation = extracted;
      }
    }

    if (!finalLocation || (!finalLocation.zipCode && !finalLocation.address && !finalLocation.latitude)) {
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
