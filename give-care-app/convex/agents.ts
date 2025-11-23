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
  findInterventions,
  recordMemory,
  updateProfile,
  startAssessmentTool,
  recordAssessmentAnswerTool,
  getCrisisResources,
  checkOnboardingStatus,
} from "./tools";
import type { Id } from "./_generated/dataModel";

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
    startAssessmentTool,
    recordAssessmentAnswerTool,

    // Intervention tools
    findInterventions,

    // Crisis tool
    getCrisisResources,

    // Onboarding tool
    checkOnboardingStatus,
  },
  maxSteps: 4, // Reduced from 10 for faster responses (most SMS replies need 1-2 tools)
  usageHandler: trackUsage,

  /**
   * Context Handler - Inject memories and SMS examples into context
   * Optimizes token usage while surfacing relevant past conversations
   */
  contextHandler: async (ctx, args) => {
    // Fetch relevant memories (importance >= 7, limit 3 for SMS brevity)
    const memories = await ctx.runQuery(
      internal.internal.memories.getRelevantMemoriesQuery,
      { userId: args.userId as Id<"users">, limit: 3 }
    );

    // Build memory context messages if any exist
    const memoryMessages = memories.length > 0
      ? [{
          role: "system" as const,
          content: `Relevant context from past conversations:\n${memories.map(m => `- ${m.content}`).join('\n')}`
        }]
      : [];

    // SMS example messages to guide tone/format (brief, warm, one idea per message)
    const smsExamples = [
      { role: "user" as const, content: "I'm so tired" },
      { role: "assistant" as const, content: "I hear you. Want a 5-min break idea?" },
      { role: "user" as const, content: "I need respite care" },
      { role: "assistant" as const, content: "Found 3 respite programs near you. Want details?" },
    ];

    return [
      ...memoryMessages,
      ...smsExamples,
      ...args.search,
      ...args.recent,
      ...args.inputMessages,
      ...args.inputPrompt,
      ...args.existingResponses,
    ];
  },
});
