/**
 * Zone Mapping Utilities
 *
 * Maps assessment-specific zones (REACH informational, SDOH transportation, etc.)
 * to intervention zones (emotional, physical, social, time, financial).
 */

import { AssessmentSlug } from './assessmentCatalog';

/**
 * Map assessment-specific zones to intervention zones
 * Used when suggesting interventions after assessments
 */
export function mapToInterventionZones(
  definition: AssessmentSlug,
  zones: string[]
): string[] {
  const mapped: string[] = [];

  for (const zone of zones) {
    // REACH-II zones
    if (definition === 'reach2') {
      if (zone === 'informational' || zone === 'spiritual') {
        mapped.push('social');
      } else {
        // emotional, time, social map directly
        mapped.push(zone);
      }
    }
    // SDOH zones
    else if (definition === 'sdoh') {
      if (zone === 'transportation') {
        mapped.push('time');
      } else if (zone === 'housing') {
        mapped.push('physical');
      } else if (zone === 'community' || zone === 'clinical') {
        mapped.push('social');
      } else {
        // financial maps directly
        mapped.push(zone);
      }
    }
    // EMA and BSFC zones map directly
    else {
      mapped.push(zone);
    }
  }

  // Remove duplicates
  return [...new Set(mapped)];
}

