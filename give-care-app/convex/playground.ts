/**
 * Agent Playground API
 * Enables the Convex Agent Component playground UI
 *
 * Setup:
 * 1. Generate API key: npx convex run --component agent apiKeys:issue '{name:"playground"}'
 * 2. Access playground: https://get-convex.github.io/agent/
 * 3. Or locally: npx @convex-dev/agent-playground
 */

import { definePlaygroundAPI } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { miraAgent } from "./agents";

export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, { agents: [miraAgent] });
