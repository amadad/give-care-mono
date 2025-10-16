/**
 * give-care-etl Main Entry Point
 *
 * Phase 1: Uses Orchestrator Durable Object + simple pipeline functions
 * Phase 2: Will add individual agent Durable Objects (discovery.do, extraction.do, etc)
 */

import { OrchestratorAgent } from "./agents/orchestrator.do";

// Export Durable Object classes (required by Cloudflare Workers)
// Phase 1: Only Orchestrator
export { OrchestratorAgent };

/**
 * Environment bindings
 */
export interface Env {
  // Durable Object bindings (Phase 1: Only Orchestrator)
  ORCHESTRATOR_AGENT: DurableObjectNamespace<OrchestratorAgent>;

  // API keys
  OPENAI_API_KEY: string;
  EXA_API_KEY?: string;

  // Convex deployment
  CONVEX_URL: string;
  CONVEX_ADMIN_KEY?: string;

  // Browser Rendering API (for llm-scraper-worker)
  BROWSER: Fetcher;

  // KV namespaces
  ETL_STATE: KVNamespace;
  RESOURCE_CACHE: KVNamespace;

  // Environment
  ENVIRONMENT: string;
}

/**
 * Main Worker handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route based on path
      switch (url.pathname) {
        case "/":
          return new Response(JSON.stringify({
            service: "give-care-etl",
            version: "0.2.0",
            status: "healthy",
            architecture: "durable-objects",
            agents: ["orchestrator", "discovery", "extraction", "categorizer", "validator"],
            message: "Resource discovery pipeline with OpenAI Agents SDK + Cloudflare Durable Objects"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        case "/health":
          return new Response(JSON.stringify({
            status: "ok",
            phase: "1",
            durableObjects: {
              orchestrator: typeof env.ORCHESTRATOR_AGENT !== "undefined"
            },
            kv: {
              etl_state: typeof env.ETL_STATE !== "undefined",
              resource_cache: typeof env.RESOURCE_CACHE !== "undefined"
            },
            features: {
              exaDiscovery: !!env.EXA_API_KEY,
              llmScraper: true
            }
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        // Route to Orchestrator Agent (Phase 1: Only agent)
        case "/orchestrate":
        case "/orchestrate/start":
        case "/orchestrate/status":
        case "/orchestrate/continue":
          return routeToAgent(
            env.ORCHESTRATOR_AGENT,
            "orchestrator",
            request,
            corsHeaders
          );

        default:
          return new Response("Not Found", { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  },

  /**
   * Scheduled handler for cron triggers
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Trigger orchestrator for weekly resource discovery
    const id = env.ORCHESTRATOR_AGENT.idFromName("weekly-discovery");
    const stub = env.ORCHESTRATOR_AGENT.get(id);

    await stub.fetch("https://etl.internal/start", {
      method: "POST",
      body: JSON.stringify({
        task: "discover_all_states",
        trigger: "cron",
        schedule: event.cron
      })
    });
  }
};

/**
 * Route request to a Durable Object agent
 *
 * Uses idFromName for stable, persistent agent instances.
 * This ensures the same agent ID is used across invocations,
 * preserving memory and state.
 */
function routeToAgent(
  namespace: DurableObjectNamespace,
  agentName: string,
  request: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Extract session/user ID from request (for multi-agent-per-user pattern)
  // For now, use a single agent instance per agent type
  const id = namespace.idFromName(agentName);

  // Get the Durable Object stub
  const stub = namespace.get(id);

  // Forward request to the agent
  // The agent's fetch() method will handle it
  return stub.fetch(request);
}
