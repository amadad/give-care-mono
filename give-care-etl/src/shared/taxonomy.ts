/**
 * GiveCare Taxonomy - Service Types and Pressure Zones
 *
 * This taxonomy MUST match give-care-app/convex/ingestion/shared/registry.ts
 * to ensure resources are correctly categorized and queryable.
 */

// ============================================================================
// PRESSURE ZONES (5 total)
// ============================================================================

export const PRESSURE_ZONES = [
  'physical_health',
  'emotional_wellbeing',
  'financial_concerns',
  'time_management',
  'social_support'
] as const;

export type PressureZone = typeof PRESSURE_ZONES[number];

// ============================================================================
// SERVICE TYPES (11 total)
// ============================================================================

export const SERVICE_TYPES = [
  'respite',
  'support_group',
  'counseling',
  'crisis_support',
  'financial_aid',
  'medicare_help',
  'legal_planning',
  'navigation',
  'equipment_devices',
  'education_training',
  'caregiver_support'
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

// ============================================================================
// SERVICE TYPE → PRESSURE ZONE MAPPING
// ============================================================================

/**
 * Maps service types to pressure zones.
 * Used by Categorizer Agent to populate zones[] in IntermediateRecord.
 *
 * IMPORTANT: This MUST match give-care-app/convex/ingestion/shared/registry.ts
 */
export const SERVICE_TO_ZONES: Record<ServiceType, PressureZone[]> = {
  respite: ['physical_health', 'time_management'],
  support_group: ['social_support', 'emotional_wellbeing'],
  counseling: ['emotional_wellbeing'],
  crisis_support: ['emotional_wellbeing'],
  financial_aid: ['financial_concerns'],
  medicare_help: ['financial_concerns', 'time_management'],
  legal_planning: ['financial_concerns'],
  navigation: ['financial_concerns', 'social_support'],
  equipment_devices: ['physical_health', 'financial_concerns'],
  education_training: ['time_management', 'emotional_wellbeing'],
  caregiver_support: ['social_support', 'emotional_wellbeing']
};

/**
 * Helper function to map service types to pressure zones
 */
export function mapServicesToZones(serviceTypes: string[]): string[] {
  const zones = new Set<string>();

  for (const serviceType of serviceTypes) {
    const mappedZones = SERVICE_TO_ZONES[serviceType as ServiceType];
    if (mappedZones) {
      mappedZones.forEach(zone => zones.add(zone));
    }
  }

  return Array.from(zones);
}

// ============================================================================
// COVERAGE LEVELS
// ============================================================================

export const COVERAGE_LEVELS = ['national', 'state', 'county', 'zip', 'radius'] as const;
export type CoverageLevel = typeof COVERAGE_LEVELS[number];

// ============================================================================
// DATA SOURCE TYPES
// ============================================================================

export const DATA_SOURCE_TYPES = ['scraped', 'manual_entry', 'api'] as const;
export type DataSourceType = typeof DATA_SOURCE_TYPES[number];

// ============================================================================
// AGGREGATOR SOURCES
// ============================================================================

export const AGGREGATOR_SOURCES = ['eldercare', '211', 'carelinq', 'manual', 'other'] as const;
export type AggregatorSource = typeof AGGREGATOR_SOURCES[number];

// ============================================================================
// FUNDING SOURCES
// ============================================================================

export const FUNDING_SOURCES = ['federal', 'state', 'local', 'nonprofit', 'faith_based', 'private'] as const;
export type FundingSource = typeof FUNDING_SOURCES[number];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function isValidServiceType(value: string): value is ServiceType {
  return SERVICE_TYPES.includes(value as ServiceType);
}

export function isValidPressureZone(value: string): value is PressureZone {
  return PRESSURE_ZONES.includes(value as PressureZone);
}

export function isValidCoverage(value: string): value is CoverageLevel {
  return COVERAGE_LEVELS.includes(value as CoverageLevel);
}

export function isValidDataSourceType(value: string): value is DataSourceType {
  return DATA_SOURCE_TYPES.includes(value as DataSourceType);
}

export function isValidAggregatorSource(value: string): value is AggregatorSource {
  return AGGREGATOR_SOURCES.includes(value as AggregatorSource);
}

export function isValidFundingSource(value: string): value is FundingSource {
  return FUNDING_SOURCES.includes(value as FundingSource);
}
