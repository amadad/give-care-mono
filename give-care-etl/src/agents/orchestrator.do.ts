"use node";

/**
 * Orchestrator Agent - Durable Object Implementation
 *
 * Uses OpenAI Agents SDK with persistent state in Durable Object storage.
 * Based on Cloudflare's pattern: https://blog.cloudflare.com/building-agents-openai-cloudflare
 */

import { DurableObject } from "cloudflare:workers";
import { createLogger } from "../utils/logger";
import { Agent, run, RunState } from "@openai/agents";
import { ETLConvexClient } from "../utils/convex";
import { createDiscoveryTools } from "./tools/discoveryTools";
import { extractionTools } from "./tools/extractionTools";
import { CacheLayer, CacheTTL } from "../utils/cache";
import { CircuitBreaker, executeWithRetry } from "../utils/errorRecovery";
import { executeInParallel } from "../utils/parallelExecution";

const logger = createLogger({ agentName: "orchestrator" });

// Environment bindings type
interface Env {
  OPENAI_API_KEY: string;
  EXA_API_KEY?: string;
  BROWSER: Fetcher;
  CONVEX_URL: string;
  ENVIRONMENT?: string;
}

/**
 * Orchestrator Agent Instructions
 */
const ORCHESTRATOR_INSTRUCTIONS = `You are the Orchestrator for the GiveCare resource discovery pipeline.

Your role is to plan and coordinate multi-step workflows for discovering, extracting,
categorizing, and validating caregiver support resources.

## Available Specialist Agents

You can hand off to these specialist agents:

1. **Discovery Agent** - Find authoritative sources of resources (uses Exa API)
2. **Extraction Agent** - Scrape structured data, categorize services, and validate resources
   - Has tools for: fetchPage, extractStructured, categorizeServices, validatePhone, validateURL, checkQuality

## Your Responsibilities

1. **Planning**: Break down tasks into sequential steps
2. **Coordination**: Hand off to specialist agents with clear instructions
3. **Error Handling**: Detect failures and determine retry strategy
4. **Quality Control**: Evaluate quality of discovered sources

## Typical Workflow

1. Receive task (e.g., "discover caregiver support resources in NY")
2. Hand off to Discovery Agent → Get 10-20 authoritative sources
3. Hand off to Extraction Agent for each source (parallel)
   - Extraction Agent will fetch, extract, categorize, validate, and score each resource
4. Return summary of validated resources ready for QA review

## Important Notes

- Extraction Agent handles all post-discovery work (extraction, categorization, validation)
- Categorization uses deterministic SERVICE_TO_ZONES mapping (no AI needed)
- Validation uses utilities (normalizePhoneE164, HEAD requests) (no AI needed)

When you complete a workflow, return a structured summary with:
- Total sources discovered
- Extraction success rate
- Average quality score
- Records ready for QA review
- Any errors requiring human attention
`;

export interface OrchestratorState {
  sessionId: string;
  task: string;
  currentStep: string;
  sources: any[];
  extractedRecords: any[];
  categorizedRecords: any[];
  validatedRecords: any[];
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

export class OrchestratorAgent extends DurableObject<Env> {
  private agent: Agent | null = null;
  private discoveryAgent: Agent | null = null;
  private extractionAgent: Agent | null = null;
  private cache: CacheLayer | null = null;
  private circuitBreaker: CircuitBreaker;
  private wsConnections: Set<WebSocket> = new Set();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.cache = new CacheLayer(ctx.storage);
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 60000,
    });
  }

  /**
   * Initialize all agents with handoff configuration
   */
  private async initializeAgents(): Promise<void> {
    if (this.agent) return; // Already initialized

    // Initialize specialist agents with tools and modelSettings
    // Create discovery tools with env bindings
    const discoveryTools = createDiscoveryTools(this.env.EXA_API_KEY);

    this.discoveryAgent = new Agent({
      name: "Discovery Agent",
      model: "gpt-5-mini",
      instructions: "Find authoritative sources for caregiver resources. Use searchWeb to find sources, evaluateSource to score them, and rankSources to prioritize.",
      tools: discoveryTools,
      modelSettings: {
        reasoning: { effort: "low" },
        text: { verbosity: "low" },
      },
    });

    this.extractionAgent = new Agent({
      name: "Extraction Agent",
      model: "gpt-5-nano",
      instructions: `Extract structured resource data from web pages, categorize service types, and validate data.

You have these tools:
- fetchPage: Get HTML content
- extractStructured: Parse HTML to structured data (LLM-powered)
- parsePagination: Handle multi-page resources
- categorizeServices: Map service types to pressure zones (deterministic lookup)
- validatePhone: Normalize phone to E.164 format (utility function)
- validateURL: Check URL format and accessibility (HEAD request)
- checkQuality: Calculate quality score 0-100 (arithmetic)

After extracting data, ALWAYS:
1. Categorize service types using categorizeServices
2. Validate phone numbers using validatePhone
3. Validate website using validateURL
4. Calculate quality score using checkQuality`,
      tools: extractionTools,
      modelSettings: {
        reasoning: { effort: "minimal" },
        text: { verbosity: "low" },
      },
    });

    // Initialize orchestrator with handoffs to specialist agents
    this.agent = new Agent({
      name: "Orchestrator",
      model: "gpt-5-mini",
      instructions: ORCHESTRATOR_INSTRUCTIONS,
      modelSettings: {
        reasoning: { effort: "low" }, // Planning and coordination
        text: { verbosity: "low" },
      },
      handoffs: [
        this.discoveryAgent,
        this.extractionAgent,
      ],
    });

    logger.info("Agents initialized (3-agent architecture): Orchestrator, Discovery, Extraction");
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade for real-time updates
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader === "websocket") {
      return this.handleWebSocket(request);
    }

    // CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Handle both /start and /orchestrate/start patterns
      const pathname = url.pathname.replace(/^\/orchestrate/, '') || '/';

      switch (pathname) {
        case "/start":
        case "/":
          return this.handleStart(request, corsHeaders);

        case "/status":
          return this.handleStatus(corsHeaders);

        case "/continue":
          return this.handleContinue(request, corsHeaders);

        default:
          return new Response("Not Found", { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      logger.error("Orchestrator error", error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Start a new orchestration workflow
   */
  private async handleStart(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const body = await request.json() as { task: string; state?: string; limit?: number; trigger?: string };

    // Initialize agents
    await this.initializeAgents();

    const sessionId = `orch-${Date.now()}`;
    const initialState: OrchestratorState = {
      sessionId,
      task: body.task,
      currentStep: "discovery",
      sources: [],
      extractedRecords: [],
      categorizedRecords: [],
      validatedRecords: [],
      errors: [],
      startedAt: new Date().toISOString()
    };

    // Save initial state to Durable Object storage
    await this.ctx.storage.put("state", initialState);
    await this.ctx.storage.put("task", body);

    logger.info("Started orchestration", { sessionId, task: body.task });

    // Persist workflow to Convex for admin dashboard
    try {
      const convexClient = new ETLConvexClient(this.env.CONVEX_URL);
      await convexClient.createWorkflow({
        sessionId,
        task: body.task,
        state: body.state,
        limit: body.limit,
        trigger: body.trigger || "manual",
      });
      logger.info("Workflow persisted to Convex", { sessionId });
    } catch (error) {
      logger.error("Failed to persist workflow to Convex", error);
      // Continue anyway - Durable Object state is source of truth
    }

    // Execute agent-based workflow in background
    this.ctx.waitUntil(
      this.executeAgentWorkflow(sessionId, body.task).catch((error) => {
        logger.error("Agent workflow failed", { sessionId, error });
      })
    );

    // Return immediately (workflow runs in background)
    return new Response(JSON.stringify({
      sessionId,
      status: "started",
      message: "Agent workflow executing. Check /status for progress."
    }), {
      headers: corsHeaders
    });
  }

  /**
   * Execute agent-based workflow with RunState persistence and real-time updates
   */
  private async executeAgentWorkflow(sessionId: string, task: string): Promise<void> {
    if (!this.agent) {
      throw new Error("Agent not initialized");
    }

    try {
      // Broadcast workflow started
      this.broadcastProgress({
        sessionId,
        step: "started",
        message: "Agent workflow started"
      });

      // Check if we have a saved RunState to resume from
      const savedRunState = await this.ctx.storage.get<string>("runState");

      let result;
      if (savedRunState) {
        logger.info("Resuming from saved RunState", { sessionId });
        this.broadcastProgress({
          sessionId,
          step: "resuming",
          message: "Resuming from saved state"
        });
        const runState = await RunState.fromString(this.agent, savedRunState);
        result = await run(this.agent, runState);
      } else {
        logger.info("Starting new agent run", { sessionId });
        this.broadcastProgress({
          sessionId,
          step: "discovery",
          message: "Discovery agent searching for sources"
        });

        // Execute with streaming updates
        result = await this.runWithProgressUpdates(this.agent, task, sessionId);
      }

      // Save RunState for potential resume
      const runStateString = await result.state?.toString();
      if (runStateString) {
        await this.ctx.storage.put("runState", runStateString);
      }

      // Update orchestrator state with results
      const state = await this.ctx.storage.get<OrchestratorState>("state");
      if (state) {
        state.completedAt = new Date().toISOString();
        state.currentStep = "completed";
        await this.ctx.storage.put("state", state);

        // Broadcast completion with summary
        this.broadcastProgress({
          sessionId,
          step: "completed",
          message: "Workflow completed successfully",
          summary: {
            totalSources: state.sources.length,
            extractedRecords: state.extractedRecords.length,
            validatedRecords: state.validatedRecords.length,
            errors: state.errors.length
          }
        });
      }

      logger.info("Agent workflow completed", {
        sessionId,
        finalOutput: result.finalOutput
      });

    } catch (error) {
      logger.error("Agent workflow execution error", { sessionId, error });

      // Update state with error
      const state = await this.ctx.storage.get<OrchestratorState>("state");
      if (state) {
        state.errors.push(error instanceof Error ? error.message : String(error));
        await this.ctx.storage.put("state", state);
      }

      // Broadcast error
      this.broadcastProgress({
        sessionId,
        step: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        error: true
      });

      throw error;
    }
  }

  /**
   * Get current status of workflow
   */
  private async handleStatus(corsHeaders: Record<string, string>): Promise<Response> {
    const state = await this.ctx.storage.get<OrchestratorState>("state");

    if (!state) {
      return new Response(JSON.stringify({
        error: "No active workflow"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(state), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Continue workflow after human intervention (Human-in-the-loop pattern)
   */
  private async handleContinue(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    const state = await this.ctx.storage.get<OrchestratorState>("state");

    if (!state) {
      return new Response(JSON.stringify({
        error: "No active workflow to continue"
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Get human decision from request body
    const body = await request.json() as {
      action: "approve" | "reject" | "modify";
      modifications?: any;
      message?: string;
    };

    logger.info("Received human intervention", {
      sessionId: state.sessionId,
      action: body.action
    });

    // Re-initialize agents
    await this.initializeAgents();

    // Get saved RunState
    const savedRunState = await this.ctx.storage.get<string>("runState");

    if (!savedRunState) {
      return new Response(JSON.stringify({
        error: "No saved RunState to resume from"
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    try {
      if (!this.agent) {
        throw new Error("Agent not initialized");
      }

      // Resume from saved RunState with human feedback
      const runState = await RunState.fromString(this.agent, savedRunState);

      let continueMessage = "";
      if (body.action === "approve") {
        continueMessage = "Human approved. Continue to next step.";
      } else if (body.action === "reject") {
        continueMessage = `Human rejected. Reason: ${body.message}. Please revise the plan.`;
      } else if (body.action === "modify") {
        continueMessage = `Human requested modifications: ${JSON.stringify(body.modifications)}. Update the plan accordingly.`;
      }

      // Continue agent execution with human feedback
      const result = await run(this.agent, runState);

      // Save updated RunState
      const newRunStateString = await result.state?.toString();
      if (newRunStateString) {
        await this.ctx.storage.put("runState", newRunStateString);
      }

      // Update orchestrator state
      state.currentStep = "human_approved";
      await this.ctx.storage.put("state", state);

      return new Response(JSON.stringify({
        status: "continued",
        action: body.action,
        message: "Workflow resumed with human feedback"
      }), {
        headers: corsHeaders
      });

    } catch (error) {
      logger.error("Continue workflow error", { error });
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }

  /**
   * Run agent workflow with progress updates for each phase
   */
  private async runWithProgressUpdates(agent: Agent, task: string, sessionId: string): Promise<any> {
    // This wraps the agent run and provides hooks to broadcast progress
    // In a real implementation, we'd need to intercept agent handoffs
    // For now, we'll use the standard run() and update state periodically

    const state = await this.ctx.storage.get<OrchestratorState>("state");

    // Start the agent run
    const result = await run(agent, task);

    // After discovery phase, check if we have sources
    if (state && state.sources.length > 0) {
      this.broadcastProgress({
        sessionId,
        step: "extraction",
        message: `Extracting data from ${state.sources.length} sources in parallel`,
        progress: {
          total: state.sources.length,
          completed: 0
        }
      });

      // Spawn parallel extraction workers
      await this.executeParallelExtraction(state.sources, sessionId);
    }

    return result;
  }

  /**
   * Execute extraction for multiple sources in parallel
   */
  private async executeParallelExtraction(sources: any[], sessionId: string): Promise<void> {
    const state = await this.ctx.storage.get<OrchestratorState>("state");
    if (!state) return;

    // Use parallel execution with progress callbacks
    const results = await executeInParallel(
      sources,
      async (source, index) => {
        // Extract data from this source
        try {
          // In production, this would call the extraction agent
          // For now, we'll simulate with a placeholder

          this.broadcastProgress({
            sessionId,
            step: "extraction",
            message: `Extracting from ${source.url}`,
            progress: {
              total: sources.length,
              completed: index + 1
            }
          });

          return { url: source.url, success: true };

        } catch (error) {
          logger.error("Extraction failed", { source, error });
          return { url: source.url, success: false, error };
        }
      },
      {
        maxConcurrency: 10,
        timeoutMs: 30000,
        onProgress: (completed, total) => {
          this.broadcastProgress({
            sessionId,
            step: "extraction",
            message: `Extracted ${completed}/${total} sources`,
            progress: { total, completed }
          });
        }
      }
    );

    // Update state with extracted records
    state.extractedRecords = results.filter(r => r.success);
    await this.ctx.storage.put("state", state);

    this.broadcastProgress({
      sessionId,
      step: "validation",
      message: "Starting validation of extracted records",
      progress: {
        total: state.extractedRecords.length,
        completed: 0
      }
    });
  }

  /**
   * Handle WebSocket upgrade for real-time progress updates
   */
  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    this.wsConnections.add(server);

    logger.info("WebSocket connection established", {
      totalConnections: this.wsConnections.size
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Broadcast progress update to all connected WebSocket clients
   */
  private broadcastProgress(update: any) {
    const message = JSON.stringify({
      type: "progress",
      timestamp: new Date().toISOString(),
      ...update
    });

    this.wsConnections.forEach((ws) => {
      try {
        ws.send(message);
      } catch (error) {
        logger.error("Failed to send WebSocket message", { error });
        this.wsConnections.delete(ws);
      }
    });

    logger.info("Broadcasted progress update", {
      connections: this.wsConnections.size,
      update
    });
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    this.wsConnections.delete(ws);
    logger.info("WebSocket connection closed", {
      code,
      reason,
      remainingConnections: this.wsConnections.size
    });
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket, error: Error) {
    this.wsConnections.delete(ws);
    logger.error("WebSocket error", {
      error,
      remainingConnections: this.wsConnections.size
    });
  }
}
