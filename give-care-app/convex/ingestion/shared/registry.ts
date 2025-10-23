/**
 * Source adapter registry
 *
 * Metadata about each data source (license, refresh cadence, etc.)
 */

export interface SourceMetadata {
  license: 'public' | 'terms' | 'owner'
  refreshCadenceDays: number
  notes?: string
}

export const SOURCE_REGISTRY: Record<string, SourceMetadata> = {
  eldercare: {
    license: 'public',
    refreshCadenceDays: 90,
    notes: 'Eldercare Locator (ACL) - Public domain government data',
  },
  '211': {
    license: 'terms',
    refreshCadenceDays: 30,
    notes: '211 directory - Check local 211 terms of service',
  },
  carelinq: {
    license: 'terms',
    refreshCadenceDays: 30,
    notes: 'CarelinQ API - Requires partner agreement',
  },
  manual: {
    license: 'owner',
    refreshCadenceDays: 180,
    notes: 'Manually curated by GiveCare team',
  },
  other: {
    license: 'owner',
    refreshCadenceDays: 90,
    notes: 'Unknown source - manual review required',
  },
}

/**
 * Get metadata for a source
 */
export function getSourceMetadata(aggregatorSource: string): SourceMetadata {
  return SOURCE_REGISTRY[aggregatorSource] ?? SOURCE_REGISTRY.other
}

/**
 * Service type to pressure zone mapping
 *
 * Used for automatic categorization when zones aren't provided
 */
export const SERVICE_TO_ZONES: Record<string, string[]> = {
  respite: ['physical_health', 'time_management'],
  support_group: ['social_support', 'emotional_wellbeing'],
  financial_aid: ['financial_concerns'],
  medicare_help: ['financial_concerns', 'time_management'],
  counseling: ['emotional_wellbeing'],
  crisis_support: ['emotional_wellbeing'],
  legal_planning: ['financial_concerns'],
  navigation: ['financial_concerns', 'social_support'],
  equipment_devices: ['physical_health', 'financial_concerns'],
  education_training: ['time_management', 'emotional_wellbeing'],
  caregiver_support: ['social_support', 'emotional_wellbeing'],
}

/**
 * Map service types to pressure zones
 */
export function mapServicesToZones(serviceTypes: string[]): string[] {
  const zones = new Set<string>()

  for (const serviceType of serviceTypes) {
    const zonesList = SERVICE_TO_ZONES[serviceType]
    if (zonesList) {
      zonesList.forEach(zone => zones.add(zone))
    }
  }

  return Array.from(zones)
}
