/**
 * Agent Runs Helper
 * Normalizes agent_runs records from legacy format to preferred format
 */

import { Id } from "../_generated/dataModel";

export interface AgentRun {
  _id: Id<"agent_runs">;
  _creationTime: number;
  userId: Id<"users">;
  // Preferred fields
  agentName?: "main" | "assessment";
  threadId?: string; // Thread ID from Agent Component (managed separately)
  toolCalls?: Array<any>;
  createdAt?: number;
  // Legacy fields
  agent?: string;
  budgetResult?: any;
  latencyMs?: number;
  policyBundle?: string;
  traceId?: string;
}

/**
 * Normalize agent run record
 * Converts legacy fields to preferred format
 */
export function normalizeAgentRun(run: AgentRun): {
  agentName: "main" | "assessment";
  threadId?: string;
  toolCalls?: Array<any>;
  createdAt: number;
} {
  // Use agentName if available, otherwise convert agent to agentName
  const agentName: "main" | "assessment" =
    run.agentName ||
    (run.agent === "main" || run.agent === "assessment"
      ? (run.agent as "main" | "assessment")
      : "main"); // Default to "main" if unknown

  // Extract toolCalls from budgetResult if available
  const toolCalls =
    run.toolCalls ||
    (run.budgetResult?.toolCalls
      ? [{ count: run.budgetResult.toolCalls }]
      : undefined);

  // Use createdAt if available, otherwise use _creationTime
  const createdAt = run.createdAt || run._creationTime;

  return {
    agentName,
    threadId: run.threadId,
    toolCalls,
    createdAt,
  };
}

