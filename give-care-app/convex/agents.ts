/**
 * Agent Definitions
 * Main Agent (95% of traffic) and Assessment Agent (5% of traffic)
 * Crisis Router is deterministic (no LLM) - handled in inbound.ts
 */

"use node";

import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { MAIN_MODEL, ASSESSMENT_MODEL, EMBEDDING_MODEL } from "./lib/models";
import { MAIN_PROMPT, ASSESSMENT_PROMPT } from "./lib/prompts";
import {
  getResources,
  startAssessment,
  recordObservation,
  trackInterventionHelpfulness,
} from "./tools";

/**
 * Main Agent (95% of traffic)
 * General support, resource discovery, daily check-ins, memory building
 * Note: Temperature configuration handled by model defaults
 */
export const mainAgent = new Agent(components.agent, {
  name: "Main Agent",
  languageModel: MAIN_MODEL,
  textEmbeddingModel: EMBEDDING_MODEL,
  instructions: MAIN_PROMPT,
  tools: {
    getResources,
    startAssessment,
    recordObservation,
    trackInterventionHelpfulness,
  },
  maxSteps: 5, // Allows tool chaining
});

/**
 * Assessment Agent (5% of traffic)
 * Clinical scoring and intervention matching
 * Note: Temperature configuration handled by model defaults
 */
export const assessmentAgent = new Agent(components.agent, {
  name: "Assessment Agent",
  languageModel: ASSESSMENT_MODEL,
  textEmbeddingModel: EMBEDDING_MODEL,
  instructions: ASSESSMENT_PROMPT,
  tools: {
    getResources, // Assessment agent can suggest resources after scoring
  },
  maxSteps: 2, // Scoring + interpretation
});
