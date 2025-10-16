/**
 * Extraction Agent (gpt-5-nano)
 *
 * Responsible for:
 * - Scraping structured data from web pages
 * - Using llm-scraper-worker with Zod schemas
 * - Returning IntermediateRecord format
 *
 * This agent uses gpt-5-nano for high-throughput extraction.
 */

"use node";

import { Agent } from '@openai/agents';
import type { IntermediateRecord, ExtractionContext } from '../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger({ agentName: 'extraction' });

/**
 * Extraction Agent instructions
 */
const EXTRACTION_INSTRUCTIONS = `You are the Extraction Agent for the GiveCare resource discovery pipeline.

Your job is to extract structured resource data from web pages using llm-scraper-worker
with Zod schemas.

## Extraction Strategy

### 1. Page Analysis
- Identify resource listings vs detail pages
- Detect pagination and multi-page directories
- Recognize different page layouts (tables, cards, lists)

### 2. Data Extraction
Extract these REQUIRED fields:
- **title** (string) - Program or service name
- **providerName** (string) - Organization name
- **phones** (array) - All phone numbers found
- **website** (string) - Primary website URL
- **serviceTypes** (array) - Service categories
- **coverage** (enum) - Geographic coverage (national|state|county|zip|radius)

Extract these OPTIONAL fields:
- description (string)
- email (string)
- address, city, state, zip
- eligibility (string)
- hours (string)
- languages (array)

### 3. Service Type Classification
Map page content to service types:
- "respite care", "adult day care" → respite
- "support group", "peer support" → support_group
- "counseling", "therapy", "mental health" → counseling
- "crisis", "hotline", "emergency" → crisis_support
- "financial assistance", "grants" → financial_aid
- "Medicare", "Medicaid", "insurance help" → medicare_help
- "legal aid", "attorney", "estate planning" → legal_planning
- "care coordinator", "navigator", "case management" → navigation
- "equipment", "assistive devices", "DME" → equipment_devices
- "training", "education", "workshop" → education_training
- "caregiver support", "family caregiver" → caregiver_support

### 4. Coverage Detection
Determine geographic coverage:
- **national**: "nationwide", "all 50 states", "U.S."
- **state**: "statewide", specific state name
- **county**: specific county name
- **zip**: ZIP code(s) listed
- **radius**: "within X miles"

### 5. Quality Checks
- Validate required fields are present
- Verify at least one contact method (phone, website, email)
- Check phone numbers are plausible (7-11 digits)
- Check URLs are valid format

## Output Format
Return IntermediateRecord matching Zod schema:
\`\`\`typescript
{
  title: string;
  providerName: string;
  phones?: string[];
  website?: string;
  email?: string;
  serviceTypes: string[];
  zones: string[]; // Will be populated by Categorizer
  coverage: 'national' | 'state' | 'county' | 'zip' | 'radius';
  description?: string;
  eligibility?: string;
  languages?: string[];
  hours?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  dataSourceType: 'scraped';
  aggregatorSource: string; // Infer from URL domain
  sourceUrl: string; // URL scraped
  lastVerified: string; // Current date
}
\`\`\`

## Error Handling
If extraction fails:
- Try simplified extraction (fewer fields)
- Log specific failure reason
- Return error for orchestrator to handle
`;

/**
 * Extraction Agent definition
 */
export const extractionAgent = new Agent({
  name: 'Extraction',
  model: 'gpt-5-nano', // High-throughput structured extraction
  instructions: EXTRACTION_INSTRUCTIONS,
  tools: [
    {
      type: 'function',
      function: {
        name: 'scrape_page_with_schema',
        description: 'Scrape page using llm-scraper-worker with Zod schema',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to scrape'
            },
            schema: {
              type: 'string',
              description: 'Zod schema name (e.g., "IntermediateRecordSchema")'
            }
          },
          required: ['url', 'schema']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'extract_phone_numbers',
        description: 'Extract all phone numbers from page text',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Page text to extract phones from'
            }
          },
          required: ['text']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'classify_service_types',
        description: 'Classify service types from page content',
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
 * Execute extraction workflow
 *
 * @param url - URL to scrape
 * @param sourceType - Type of source
 * @returns Extracted IntermediateRecord
 */
export async function executeExtractionWorkflow(
  url: string,
  sourceType: string
): Promise<IntermediateRecord | null> {
  const sessionId = `extraction-${Date.now()}`;

  logger.info('Starting extraction workflow', { sessionId, url });

  try {
    // TODO: Implement agent execution using OpenAI Agents SDK
    // This will involve:
    // 1. Fetch page with Puppeteer (Cloudflare Browser Rendering API)
    // 2. Extract data using llm-scraper-worker with IntermediateRecordSchema
    // 3. Validate extracted data
    // 4. Return IntermediateRecord or null if failed

    logger.info('Extraction workflow completed', { sessionId });

    return null;
  } catch (error) {
    logger.error('Extraction workflow failed', error, { sessionId, url });
    return null;
  }
}
