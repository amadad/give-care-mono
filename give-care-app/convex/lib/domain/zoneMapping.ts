/**
 * Zone Mapping Domain Logic
 * Pure function to map pressure zones to resource categories
 * No Convex dependencies
 */

export type PressureZone =
  | "zone_time"
  | "zone_emotional"
  | "zone_physical"
  | "zone_social"
  | "zone_financial";

export type ResourceCategory =
  | "respite"
  | "transport"
  | "meals"
  | "support"
  | "community"
  | "homecare"
  | "medical"
  | "sdoh_financial";

/**
 * Map pressure zone to resource categories
 * Pure function - CONVEX_01.md helper pattern
 */
export function mapZoneToCategories(zone: PressureZone): ResourceCategory[] {
  switch (zone) {
    case "zone_time":
      return ["respite", "transport", "meals"];
    case "zone_emotional":
      return ["support", "community"];
    case "zone_physical":
      return ["homecare", "medical"];
    case "zone_social":
      return ["support", "community"];
    case "zone_financial":
      return ["sdoh_financial", "community"];
    default:
      return ["support"]; // Fallback
  }
}

/**
 * Map multiple zones to combined resource categories
 * Pure function
 */
export function mapZonesToCategories(
  zones: PressureZone[]
): ResourceCategory[] {
  const categorySet = new Set<ResourceCategory>();
  for (const zone of zones) {
    const categories = mapZoneToCategories(zone);
    categories.forEach((cat) => categorySet.add(cat));
  }
  return Array.from(categorySet);
}

