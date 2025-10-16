"use node";

/**
 * Orchestrator Agent - Durable Object Implementation
 *
 * Uses OpenAI Agents SDK with persistent state in Durable Object storage.
 * Based on Cloudflare's pattern: https://blog.cloudflare.com/building-agents-openai-cloudflare
 */

import { DurableObject } from "cloudflare:workers";
import { createLogger } from "../utils/logger";
import { Agent, run, type RunState } from "@openai/agents";
import { ETLConvexClient } from "../utils/convex";
import { executePipeline } from "./pipeline";

const logger = createLogger({ agentName: "orchestrator" });

// Environment bindings type
interface Env {
  OPENAI_API_KEY: string;
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

1. **Discovery Agent** - Find authoritative sources of resources
2. **Extraction Agent** - Scrape structured data from web pages
3. **Categorizer Agent** - Map service types to pressure zones
4. **Validator Agent** - Verify contact info and quality

## Your Responsibilities

1. **Planning**: Break down tasks into sequential steps
2. **Coordination**: Hand off to specialist agents with clear instructions
3. **Error Handling**: Detect failures and determine retry strategy
4. **Quality Control**: Evaluate quality of discovered sources

## Typical Workflow

1. Receive task (e.g., "discover caregiver support resources in NY")
2. Hand off to Discovery Agent → Get 10-20 authoritative sources
3. Hand off to Extraction Agent for each source (parallel)
4. Hand off to Categorizer Agent to map to 11 service types + 5 pressure zones
5. Hand off to Validator Agent for final quality check (phone/URL validation)
6. Return summary of validated resources ready for QA review

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
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Agent initialization will be added in Phase 1
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Handle both /start and /orchestrate/start patterns
      const pathname = url.pathname.replace(/^\/orchestrate/, '') || '/';

      switch (pathname) {
        case "/start":
        case "/":
          return this.handleStart(request);

        case "/status":
          return this.handleStatus();

        case "/continue":
          return this.handleContinue(request);

        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      logger.error("Orchestrator error", error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  /**
   * Start a new orchestration workflow
   */
  private async handleStart(request: Request): Promise<Response> {
    const body = await request.json() as { task: string; state?: string; limit?: number; trigger?: string };

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

    // Execute the complete ETL pipeline (Phase 1 implementation)
    this.ctx.waitUntil(
      executePipeline({
        sessionId,
        task: body.task,
        state: body.state,
        limit: body.limit || 10,
        openaiApiKey: this.env.OPENAI_API_KEY,
        convexUrl: this.env.CONVEX_URL
      }).catch((error) => {
        logger.error("Pipeline execution failed", { sessionId, error });
      })
    );

    // Return immediately (pipeline runs in background)
    return new Response(JSON.stringify({
      sessionId,
      status: "started",
      message: "Pipeline executing. Check /status for progress."
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Get current status of workflow
   */
  private async handleStatus(): Promise<Response> {
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
   * Continue workflow after human intervention
   */
  private async handleContinue(request: Request): Promise<Response> {
    const state = await this.ctx.storage.get<OrchestratorState>("state");

    if (!state) {
      return new Response(JSON.stringify({
        error: "No active workflow to continue"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Implementation will be added in Phase 1
    return new Response(JSON.stringify({
      message: "Continue workflow - Implementation pending in Phase 1"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
