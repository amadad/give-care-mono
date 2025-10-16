/**
 * Discovery Agent (gpt-5-mini)
 *
 * Responsible for:
 * - Finding authoritative resource sources
 * - Evaluating source credibility
 * - Prioritizing sources for extraction
 *
 * This agent uses gpt-5-mini for balanced speed and accuracy.
 */

"use node";

import { Agent } from '@openai/agents';
import type { DiscoveredSource, DiscoveryContext } from '../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger({ agentName: 'discovery' });

/**
 * Discovery Agent instructions
 */
const DISCOVERY_INSTRUCTIONS = `You are the Discovery Agent for the GiveCare resource discovery pipeline.

Your job is to find high-quality, authoritative sources of caregiver support resources
using autonomous web research.

## Research Strategy

### 1. Query Construction
Build search queries targeting:
- Federal agencies (eldercare.acl.gov, va.gov, medicare.gov, etc.)
- State aging departments
- Area Agencies on Aging (AAAs)
- Verified nonprofits (Alzheimer's Association, AARP, etc.)
- 211 directories

### 2. Source Evaluation
Evaluate sources based on:
- **Authority** (government, nonprofit, university)
- **Freshness** (recently updated)
- **Comprehensiveness** (resource directories vs single programs)
- **Data quality** (structured vs unstructured)

### 3. Credibility Scoring (0-100)
- Federal government (.gov): 95-100
- State/local government (.gov): 85-95
- Verified nonprofits: 75-90
- Community organizations: 60-75
- Commercial directories: 40-60
- Unknown sources: 20-40

### 4. Prioritization
**High priority:**
- Government resource directories
- 211 databases
- State aging departments
- National nonprofits (Alzheimer's Assoc, Family Caregiver Alliance)

**Medium priority:**
- Local Area Agencies on Aging
- Regional nonprofits
- University aging programs

**Low priority:**
- Commercial care finders
- Individual service providers
- Blog posts or news articles

## Blocklist
Avoid:
- Paywalled content
- Commercial advertising directories
- User-generated content (forums, reviews)
- Outdated sources (last updated >2 years ago)
- Low-quality content farms

## Output Format
Return array of DiscoveredSource objects with:
- url (string)
- title (string)
- snippet (string preview)
- sourceType (government|nonprofit|state_agency|local_agency|aggregator|other)
- credibilityScore (0-100)
- priority (high|medium|low)
- estimatedResourceCount (optional)

Sort by priority (high first), then credibility score (highest first).
`;

/**
 * Discovery Agent definition
 */
export const discoveryAgent = new Agent({
  name: 'Discovery',
  model: 'gpt-5-mini', // Balanced speed/accuracy for search
  instructions: DISCOVERY_INSTRUCTIONS,
  tools: [
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for resource sources using DuckDuckGo',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            limit: {
              type: 'number',
              description: 'Max results to return'
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'evaluate_source_credibility',
        description: 'Evaluate credibility of a source URL',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to evaluate'
            },
            title: {
              type: 'string',
              description: 'Page title'
            },
            snippet: {
              type: 'string',
              description: 'Page snippet or description'
            }
          },
          required: ['url']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'check_url_accessibility',
        description: 'Check if URL is accessible (HEAD request)',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to check'
            }
          },
          required: ['url']
        }
      }
    }
  ]
});

/**
 * Execute discovery workflow
 *
 * @param query - Search query for resources
 * @param context - Discovery context
 * @returns Discovered sources
 */
export async function executeDiscoveryWorkflow(
  query: string,
  context: Partial<DiscoveryContext>
): Promise<DiscoveredSource[]> {
  const sessionId = `discovery-${Date.now()}`;

  logger.info('Starting discovery workflow', { sessionId, query });

  try {
    // TODO: Implement agent execution using OpenAI Agents SDK
    // This will involve:
    // 1. Search web using workers-research or DuckDuckGo
    // 2. Evaluate each result for credibility
    // 3. Filter and prioritize sources
    // 4. Return sorted array of DiscoveredSource

    logger.info('Discovery workflow completed', { sessionId });

    return [];
  } catch (error) {
    logger.error('Discovery workflow failed', error, { sessionId });
    return [];
  }
}
