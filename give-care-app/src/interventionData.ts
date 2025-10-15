/**
 * Static intervention mapping for MVP
 * Maps pressure zones to curated resources
 */

export interface Intervention {
  title: string;
  desc: string;
  helpful: number;
}

/**
 * ZONE_INTERVENTIONS maps pressure zone identifiers to curated interventions.
 *
 * CRITICAL: Keys MUST match the zone identifiers emitted by identifyPressureZones()
 * in burnoutCalculator.ts (lines 171-210):
 *   - emotional_wellbeing
 *   - physical_health
 *   - financial_concerns
 *   - time_management
 *   - social_support
 *
 * NOTE: Changed from array to single object (code only ever accessed [0] index)
 */
export const ZONE_INTERVENTIONS: Record<string, Intervention> = {
  emotional_wellbeing: {
    title: 'Crisis Text Line',
    desc: 'Text HOME to 741741 for 24/7 emotional support',
    helpful: 92
  },
  physical_health: {
    title: 'Respite Care Finder',
    desc: 'Find temporary care support in your area',
    helpful: 78
  },
  financial_concerns: {
    title: 'Financial Assistance Programs',
    desc: 'Government and nonprofit support resources',
    helpful: 81
  },
  time_management: {
    title: 'Caregiving Task Checklist',
    desc: 'Organize and prioritize daily responsibilities',
    helpful: 79
  },
  social_support: {
    title: 'Local Caregiver Support Groups',
    desc: 'Connect with others who understand',
    helpful: 88
  },
};
