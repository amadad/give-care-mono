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
 */
export const ZONE_INTERVENTIONS: Record<string, Intervention[]> = {
  emotional_wellbeing: [
    { title: 'Crisis Text Line', desc: 'Text HOME to 741741 for 24/7 emotional support', helpful: 92 },
    { title: '5-Minute Mindfulness', desc: 'Quick guided meditation for emotional reset', helpful: 85 },
    { title: 'Caregiver Stress Relief', desc: 'Evidence-based techniques for managing overwhelm', helpful: 83 },
    { title: 'Emotion Check-In Guide', desc: 'Simple tool to process difficult feelings', helpful: 79 },
  ],
  physical_health: [
    { title: 'Respite Care Finder', desc: 'Find temporary care support in your area', helpful: 78 },
    { title: 'Physical Self-Care Guide', desc: 'Simple exercises and stretches for caregivers', helpful: 73 },
    { title: 'Sleep Hygiene Tips', desc: 'Practical strategies for better rest despite caregiving', helpful: 81 },
    { title: 'Caregiver Health Screening', desc: 'Free checklist to monitor your own wellbeing', helpful: 76 },
  ],
  financial_concerns: [
    { title: 'Financial Assistance Programs', desc: 'Government and nonprofit support resources', helpful: 81 },
    { title: 'Caregiver Benefits Guide', desc: 'Tax credits and financial aid you may qualify for', helpful: 76 },
    { title: 'Budgeting for Care Costs', desc: 'Template to track and plan caregiving expenses', helpful: 74 },
    { title: 'Emergency Financial Help', desc: 'Quick access funds for urgent care needs', helpful: 79 },
  ],
  time_management: [
    { title: 'Caregiving Task Checklist', desc: 'Organize and prioritize daily responsibilities', helpful: 79 },
    { title: 'Ask for Help Script', desc: 'How to request support from family/friends', helpful: 84 },
    { title: 'Weekly Planning Template', desc: 'Balance caregiving with your own needs', helpful: 77 },
    { title: 'Time-Saving Care Hacks', desc: 'Efficient routines from experienced caregivers', helpful: 82 },
  ],
  social_support: [
    { title: 'Local Caregiver Support Groups', desc: 'Connect with others who understand', helpful: 88 },
    { title: 'Online Caregiver Community', desc: 'Join virtual meetups and forums', helpful: 82 },
    { title: 'Community Resources Navigator', desc: 'Find local support services', helpful: 77 },
    { title: 'Transportation Assistance', desc: 'Programs for medical appointments and errands', helpful: 74 },
  ],
};
