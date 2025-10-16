/**
 * Orchestrator Worker - Main entry point for give-care-etl
 *
 * Handles HTTP requests and coordinates the 5-agent workflow:
 * Orchestrator → Discovery → Extraction → Categorizer → Validator
 */

import { executeOrchestratorWorkflow } from '../agents/orchestrator';
import type { OrchestratorContext, ValidatedRecord } from '../shared/types';
import { createLogger } from '../utils/logger';

const logger = createLogger({ worker: 'orchestrator' });

/**
 * Cloudflare Worker environment bindings
 */
interface Env {
  // OpenAI API key
  OPENAI_API_KEY: string;

  // Convex deployment URL
  CONVEX_URL: string;
  CONVEX_ADMIN_KEY: string;

  // Browser Rendering API
  BROWSER: Fetcher;

  // KV namespaces
  ETL_STATE: KVNamespace;
  RESOURCE_CACHE: KVNamespace;

  // D1 Database (optional)
  DB?: D1Database;

  // Environment
  ENVIRONMENT: string;
}

/**
 * Request body for /orchestrate endpoint
 */
interface OrchestrateRequest {
  task: string;
  state?: string; // US state code
  limit?: number;
}

/**
 * Main worker handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handlers
      switch (url.pathname) {
        case '/':
          return new Response(JSON.stringify({
            service: 'give-care-etl',
            version: '0.1.0',
            status: 'healthy',
            environment: env.ENVIRONMENT
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case '/health':
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case '/orchestrate':
          return handleOrchestrate(request, env, ctx, corsHeaders);

        default:
          return new Response('Not Found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      logger.error('Worker error', error);

      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Scheduled handler for cron triggers
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    logger.info('Cron triggered', { cron: event.cron });

    // TODO: Implement scheduled workflow
    // - Run weekly resource discovery for all states
    // - Update existing resources
    // - Check for broken URLs
  }
};

/**
 * Handle /orchestrate POST request
 */
async function handleOrchestrate(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json() as OrchestrateRequest;

    if (!body.task) {
      return new Response(JSON.stringify({
        error: 'Missing required field: task'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logger.info('Orchestrate request received', {
      task: body.task,
      state: body.state,
      limit: body.limit
    });

    // Execute orchestrator workflow
    const result = await executeOrchestratorWorkflow(body.task, {
      state: body.state,
      limit: body.limit
    });

    // Store result in KV for retrieval
    const sessionId = result.sessionId;
    await env.ETL_STATE.put(
      `session:${sessionId}`,
      JSON.stringify(result),
      { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
    );

    // Return summary
    return new Response(JSON.stringify({
      sessionId: result.sessionId,
      status: result.currentStep === 'complete' ? 'completed' : 'in_progress',
      sources: result.sources.length,
      extracted: result.extractedRecords.length,
      categorized: result.categorizedRecords.length,
      validated: result.validatedRecords.length,
      errors: result.errors.length,
      startedAt: result.startedAt,
      completedAt: result.completedAt
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Orchestrate handler error', error);

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
