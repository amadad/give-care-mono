/**
 * Categorizer Agent (gpt-5-nano)
 *
 * Responsible for:
 * - Mapping service types to pressure zones
 * - Using SERVICE_TO_ZONES taxonomy
 * - Adding zone confidence scores
 *
 * This agent uses gpt-5-nano for fast classification.
 */

"use node";

import { Agent } from '@openai/agents';
import type { CategorizedRecord, IntermediateRecord } from '../shared/types';
import { SERVICE_TO_ZONES, mapServicesToZones } from '../shared/taxonomy';
import { createLogger } from '../utils/logger';

const logger = createLogger({ agentName: 'categorizer' });

/**
 * Categorizer Agent instructions
 */
const CATEGORIZER_INSTRUCTIONS = `You are the Categorizer Agent for the GiveCare resource discovery pipeline.

Your job is to map service types to pressure zones using the SERVICE_TO_ZONES taxonomy.

## Pressure Zones (5 total)
1. **physical_health** - Care recipient health management, medical care, ADL assistance
2. **emotional_wellbeing** - Caregiver stress, grief, mental health, isolation
3. **financial_concerns** - Cost of care, benefits navigation, financial planning
4. **time_management** - Balancing caregiving with life, respite, scheduling
5. **social_support** - Connection, community, peer support

## Service Type → Pressure Zone Mapping
- **respite** → [physical_health, time_management]
- **support_group** → [social_support, emotional_wellbeing]
- **counseling** → [emotional_wellbeing]
- **crisis_support** → [emotional_wellbeing]
- **financial_aid** → [financial_concerns]
- **medicare_help** → [financial_concerns, time_management]
- **legal_planning** → [financial_concerns]
- **navigation** → [financial_concerns, social_support]
- **equipment_devices** → [physical_health, financial_concerns]
- **education_training** → [time_management, emotional_wellbeing]
- **caregiver_support** → [social_support, emotional_wellbeing]

## Categorization Process
1. Review serviceTypes array from IntermediateRecord
2. Map each service type to pressure zones using taxonomy
3. Deduplicate zones (no duplicates in output)
4. Calculate confidence score (0-100):
   - Direct mapping from taxonomy: 100
   - Ambiguous service type: 70-90
   - Inferred from description: 50-70

## Output Format
Return CategorizedRecord with:
- All fields from IntermediateRecord
- **zones** (array) - Mapped pressure zones
- **categoryConfidence** (number) - 0-100 confidence score

## Edge Cases
- If serviceTypes is empty → Try to infer from title + description
- If no zones can be mapped → Default to [social_support] with confidence 50
- If multiple service types → Union of all mapped zones
`;

/**
 * Categorizer Agent definition
 */
export const categorizerAgent = new Agent({
  name: 'Categorizer',
  model: 'gpt-5-nano', // Fast classification
  instructions: CATEGORIZER_INSTRUCTIONS,
  tools: [
    {
      type: 'function',
      function: {
        name: 'map_service_to_zones',
        description: 'Map service type to pressure zones using taxonomy',
        parameters: {
          type: 'object',
          properties: {
            serviceType: {
              type: 'string',
              description: 'Service type to map'
            }
          },
          required: ['serviceType']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'infer_service_type_from_text',
        description: 'Infer service type from title and description',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Program title'
            },
            description: {
              type: 'string',
              description: 'Program description'
            }
          },
          required: ['title']
        }
      }
    }
  ]
});

/**
 * Execute categorization workflow
 *
 * @param record - IntermediateRecord to categorize
 * @returns CategorizedRecord with zones populated
 */
export async function executeCategorizationWorkflow(
  record: IntermediateRecord
): Promise<CategorizedRecord> {
  const sessionId = `categorizer-${Date.now()}`;

  logger.info('Starting categorization workflow', {
    sessionId,
    title: record.title
  });

  try {
    // Map service types to zones using taxonomy
    const mappedZones = mapServicesToZones(record.serviceTypes);

    // If no zones mapped, default to social_support
    const zones = mappedZones.length > 0
      ? mappedZones
      : ['social_support'];

    // Calculate confidence
    const confidence = mappedZones.length > 0 ? 100 : 50;

    logger.info('Categorization workflow completed', {
      sessionId,
      zones,
      confidence
    });

    return {
      ...record,
      zones,
      categoryConfidence: confidence
    };
  } catch (error) {
    logger.error('Categorization workflow failed', error, {
      sessionId,
      title: record.title
    });

    // Fallback: return with default zone
    return {
      ...record,
      zones: ['social_support'],
      categoryConfidence: 50
    };
  }
}
