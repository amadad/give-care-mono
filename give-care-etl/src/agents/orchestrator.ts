/**
 * Orchestrator Agent (gpt-5)
 *
 * Responsible for:
 * - Planning multi-step workflows
 * - Coordinating agent handoffs
 * - Error handling and retries
 * - Quality evaluation
 *
 * This agent uses gpt-5 for complex reasoning and decision-making.
 */

"use node";

import { Agent } from '@openai/agents';
import type { OrchestratorContext } from '../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger({ agentName: 'orchestrator' });

/**
 * Orchestrator Agent instructions
 *
 * These instructions guide the agent's behavior and decision-making.
 */
const ORCHESTRATOR_INSTRUCTIONS = `You are the Orchestrator for the GiveCare resource discovery pipeline.

Your role is to plan and coordinate multi-step workflows for discovering, extracting,
categorizing, and validating caregiver support resources.

## Available Specialist Agents

1. **Discovery Agent** - Find authoritative sources of resources
2. **Extraction Agent** - Scrape structured data from web pages
3. **Categorizer Agent** - Map service types to pressure zones
4. **Validator Agent** - Verify contact info and quality

## Your Responsibilities

### 1. Planning
- Break down tasks into sequential steps
- Determine which agents to call and in what order
- Estimate resource counts and time requirements

### 2. Coordination
- Hand off to specialist agents with clear instructions
- Monitor progress and handle agent responses
- Ensure data flows correctly through the pipeline

### 3. Error Handling
- Detect failures and determine retry strategy
- Skip problematic sources if retries fail
- Log errors for human review

### 4. Quality Control
- Evaluate quality of discovered sources
- Filter low-quality or duplicate resources
- Ensure minimum quality thresholds are met

## Workflow Pattern

Typical workflow:
1. Discovery Agent → Find 10-20 authoritative sources
2. Extraction Agent → Scrape each source (parallel, with rate limiting)
3. Categorizer Agent → Map service types to pressure zones
4. Validator Agent → Verify phones/URLs and score quality
5. Return ValidatedRecords for human QA review

## Decision Rules

**When to retry:**
- Extraction fails due to timeout → Retry once
- URL returns 5xx error → Retry once
- Parser fails → Try different extraction strategy

**When to skip:**
- Source returns 404 (not found)
- Domain is blocklisted
- After 2 failed retries
- Quality score < 30 (very low quality)

**When to escalate:**
- Entire discovery phase fails (no sources found)
- >50% of extractions fail
- Validation detects systematic issues

## Output Format

Return structured workflow summary:
- Total sources discovered
- Extraction success rate
- Average quality score
- Records ready for QA review
- Errors requiring human attention
`;

/**
 * Orchestrator Agent definition
 */
export const orchestratorAgent = new Agent({
  name: 'Orchestrator',
  model: 'gpt-5', // Complex reasoning, workflow planning
  instructions: ORCHESTRATOR_INSTRUCTIONS,
  tools: [
    {
      type: 'function',
      function: {
        name: 'handoff_to_discovery',
        description: 'Hand off to Discovery Agent to find resource sources',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for resource discovery'
            },
            state: {
              type: 'string',
              description: 'US state code (e.g., "NY"), optional'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of sources to discover'
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_extraction',
        description: 'Hand off to Extraction Agent to scrape a URL',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to scrape'
            },
            sourceType: {
              type: 'string',
              description: 'Type of source (government, nonprofit, etc.)'
            }
          },
          required: ['url', 'sourceType']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_categorizer',
        description: 'Hand off to Categorizer Agent to map zones',
        parameters: {
          type: 'object',
          properties: {
            record: {
              type: 'object',
              description: 'IntermediateRecord to categorize'
            }
          },
          required: ['record']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'handoff_to_validator',
        description: 'Hand off to Validator Agent to verify quality',
        parameters: {
          type: 'object',
          properties: {
            record: {
              type: 'object',
              description: 'CategorizedRecord to validate'
            }
          },
          required: ['record']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'log_workflow_progress',
        description: 'Log workflow progress for monitoring',
        parameters: {
          type: 'object',
          properties: {
            step: {
              type: 'string',
              description: 'Current workflow step'
            },
            status: {
              type: 'string',
              description: 'Status (in_progress, completed, failed)'
            },
            details: {
              type: 'object',
              description: 'Additional details'
            }
          },
          required: ['step', 'status']
        }
      }
    }
  ]
});

/**
 * Execute orchestrator workflow
 *
 * @param task - Task description (e.g., "discover_eldercare_resources")
 * @param context - Initial context
 * @returns Final context with results
 */
export async function executeOrchestratorWorkflow(
  task: string,
  context: Partial<OrchestratorContext>
): Promise<OrchestratorContext> {
  const sessionId = context.sessionId || `orch-${Date.now()}`;

  logger.info('Starting orchestrator workflow', { sessionId, task });

  const initialContext: OrchestratorContext = {
    sessionId,
    task,
    state: context.state,
    limit: context.limit || 10,
    sources: [],
    extractedRecords: [],
    categorizedRecords: [],
    validatedRecords: [],
    errors: [],
    currentStep: 'discovery',
    startedAt: new Date().toISOString()
  };

  try {
    // TODO: Implement agent execution using OpenAI Agents SDK
    // This will involve:
    // 1. Creating agent session
    // 2. Sending initial message with task
    // 3. Processing tool calls and handoffs
    // 4. Extracting final results from context

    logger.info('Orchestrator workflow completed', { sessionId });

    return {
      ...initialContext,
      currentStep: 'complete',
      completedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Orchestrator workflow failed', error, { sessionId });

    return {
      ...initialContext,
      currentStep: 'complete',
      errors: [error instanceof Error ? error.message : String(error)],
      completedAt: new Date().toISOString()
    };
  }
}
