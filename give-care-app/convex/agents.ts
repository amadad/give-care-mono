/**
 * Agent Definitions
 * Main Agent (95% of traffic) and Assessment Agent (5% of traffic)
 * Crisis Router is deterministic (no LLM) - handled in inbound.ts
 */

"use node";

import { Agent, type UsageHandler } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import { MAIN_MODEL, ASSESSMENT_MODEL, EMBEDDING_MODEL } from "./lib/models";
import { MAIN_PROMPT, ASSESSMENT_PROMPT } from "./lib/prompts";
import {
  getResources,
  startAssessment,
  recordObservation,
  trackInterventionHelpfulness,
  findInterventions,
  checkAssessmentStatus,
  recordMemory,
  updateProfile,
} from "./tools";

/**
 * Usage tracking handler for both agents
 * Tracks token usage, costs, and execution metadata
 */
const trackUsage: UsageHandler = async (ctx, usage) => {
  await ctx.runMutation(internal.internal.agentRuns.track, {
    userId: usage.userId,
    threadId: usage.threadId,
    agentName: usage.agentName,
    model: usage.model,
    provider: usage.provider,
    // AI SDK 5.0: inputTokens/outputTokens instead of promptTokens/completionTokens
    promptTokens: usage.usage.inputTokens ?? 0,
    completionTokens: usage.usage.outputTokens ?? 0,
    totalTokens: usage.usage.totalTokens ?? 0,
    providerMetadata: usage.providerMetadata,
  });
};

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
    findInterventions,
    checkAssessmentStatus,
    recordMemory,
    updateProfile,
  },
  maxSteps: 5, // Allows tool chaining
  usageHandler: trackUsage,
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
    findInterventions, // Assessment agent can suggest interventions after scoring
  },
  maxSteps: 2, // Scoring + interpretation
  usageHandler: trackUsage,
});
