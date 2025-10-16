/**
 * Minimal Orchestrator Worker - For initial deployment
 *
 * This is a simplified version that deploys successfully.
 * Full agent implementation will be added in Phase 1.
 */

import { createLogger } from '../utils/logger';

const logger = createLogger({ worker: 'orchestrator' });

interface Env {
  OPENAI_API_KEY: string;
  CONVEX_URL: string;
  CONVEX_ADMIN_KEY: string;
  BROWSER: Fetcher;
  ETL_STATE: KVNamespace;
  RESOURCE_CACHE: KVNamespace;
  DB?: D1Database;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      switch (url.pathname) {
        case '/':
          return new Response(JSON.stringify({
            service: 'give-care-etl',
            version: '0.1.0',
            status: 'healthy',
            environment: env.ENVIRONMENT,
            message: 'Resource discovery pipeline - Phase 1 implementation pending'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case '/health':
          return new Response(JSON.stringify({
            status: 'ok',
            kv: {
              etl_state: typeof env.ETL_STATE !== 'undefined',
              resource_cache: typeof env.RESOURCE_CACHE !== 'undefined'
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case '/orchestrate':
          return new Response(JSON.stringify({
            error: 'Phase 1 implementation pending',
            message: 'Agent execution not yet implemented. See docs/IMPLEMENTATION_STATUS.md',
            status: 'scaffold_complete'
          }), {
            status: 501, // Not Implemented
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

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

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    logger.info('Cron triggered (not yet implemented)', { cron: event.cron });
  }
};
