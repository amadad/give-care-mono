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
  searchResources,
  startAssessment,
  checkWellnessStatus,
  findInterventions,
  recordMemory,
  updateProfile,
  trackInterventionPreference,
  getInterventions,
} from "./tools";

/**
 * Main Agent (95% of traffic)
 * General support, resource discovery, daily check-ins, memory building
 */
export const mainAgent = new Agent(components.agent, {
  name: "Main Agent",
  languageModel: MAIN_MODEL,
  textEmbeddingModel: EMBEDDING_MODEL,
  instructions: MAIN_PROMPT,
  tools: {
    searchResources,
    startAssessment,
    checkWellnessStatus,
    findInterventions,
    recordMemory,
    updateProfile,
    trackInterventionPreference,
  },
  maxSteps: 5, // Allows tool chaining
});

/**
 * Assessment Agent (5% of traffic)
 * Clinical scoring and intervention matching
 */
export const assessmentAgent = new Agent(components.agent, {
  name: "Assessment Agent",
  languageModel: ASSESSMENT_MODEL,
  textEmbeddingModel: EMBEDDING_MODEL,
  instructions: ASSESSMENT_PROMPT,
  tools: {
    getInterventions,
  },
  maxSteps: 2, // Scoring + interpretation
});
