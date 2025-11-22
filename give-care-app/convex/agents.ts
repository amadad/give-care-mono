/**
 * Unified Agent Definition - Mira
 * Single agent handles all conversation, assessment, and support
 * Uses Gemini 2.5 Flash-Lite for cost-efficiency and low latency
 */

"use node";

import { Agent, type UsageHandler } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import { MAIN_MODEL, EMBEDDING_MODEL } from "./lib/models";
import { UNIFIED_PROMPT } from "./lib/prompts";
import {
  getResources,
  recordObservation,
  trackInterventionHelpfulness,
  findInterventions,
  checkAssessmentStatus,
  recordMemory,
  updateProfile,
  startAssessmentTool,
  recordAssessmentAnswerTool,
  getCrisisResources,
} from "./tools";

/**
 * Usage tracking handler
 * Tracks token usage, costs, and execution metadata for Gemini 2.5 Flash-Lite
 */
const trackUsage: UsageHandler = async (ctx, usage) => {
  await ctx.runMutation(internal.internal.agentRuns.track, {
    userId: usage.userId,
    threadId: usage.threadId,
    agentName: usage.agentName,
    model: usage.model,
    provider: usage.provider,
    promptTokens: usage.usage.inputTokens ?? 0,
    completionTokens: usage.usage.outputTokens ?? 0,
    totalTokens: usage.usage.totalTokens ?? 0,
    providerMetadata: usage.providerMetadata,
  });
};

/**
 * Mira - Unified Care Agent
 * Handles all interactions: conversation, assessments, crisis support, resources
 */
export const miraAgent = new Agent(components.agent, {
  name: "Mira",
  languageModel: MAIN_MODEL, // Gemini 2.5 Flash-Lite
  textEmbeddingModel: EMBEDDING_MODEL,
  instructions: UNIFIED_PROMPT,
  tools: {
    // Core tools
    recordMemory,
    updateProfile,
    getResources,

    // Assessment tools
    checkAssessmentStatus,
    startAssessmentTool,
    recordAssessmentAnswerTool,

    // Intervention tools
    recordObservation,
    findInterventions,
    trackInterventionHelpfulness,

    // Crisis tool
    getCrisisResources,
  },
  maxSteps: 10, // Allow multi-turn conversations and tool use
  usageHandler: trackUsage,
});
