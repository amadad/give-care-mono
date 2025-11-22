/**
 * Internal Agent Runs Functions
 * Usage tracking and migration utilities
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Track agent execution
 * Called by usageHandler in agents.ts
 */
export const track = internalMutation({
  args: {
    userId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    providerMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Only track if we have a userId
    if (!args.userId) {
      return;
    }

    // Map agent name to schema enum
    const agentName =
      args.agentName === "Main Agent" ? "main" :
      args.agentName === "Assessment Agent" ? "assessment" :
      undefined;

    await ctx.db.insert("agent_runs", {
      userId: args.userId as Id<"users">,
      agentName,
      threadId: args.threadId,
      createdAt: Date.now(),
      // Store token usage in budgetResult for backward compatibility
      budgetResult: {
        model: args.model,
        provider: args.provider,
        usage: {
          promptTokens: args.promptTokens,
          completionTokens: args.completionTokens,
          totalTokens: args.totalTokens,
        },
        providerMetadata: args.providerMetadata,
      },
    });

    // Token accounting (llm_usage)
    await ctx.db.insert("llm_usage", {
      userId: args.userId as Id<"users">,
      agentName,
      model: args.model,
      provider: args.provider,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      totalTokens: args.totalTokens,
      createdAt: Date.now(),
    });
  },
});

/**
 * Agent Run type (for normalization)
 */
interface AgentRun {
  _id: Id<"agent_runs">;
  _creationTime: number;
  userId: Id<"users">;
  // Preferred fields
  agentName?: "main" | "assessment";
  threadId?: string;
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
function normalizeAgentRun(run: AgentRun): {
  agentName: "main" | "assessment";
  threadId?: string;
  toolCalls?: Array<any>;
  createdAt: number;
} {
  // Use agentName if available, otherwise convert agent to agentName
  const agentName: "main" | "assessment" =
    run.agentName ||
    (run.agent === "main" || run.agent === "assessment"
      ? (run.agent)
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

/**
 * Migrate agent_runs records from legacy format to preferred format
 * This is a one-time migration function
 */
export const migrateAgentRuns = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all agent_runs and filter in code for records needing migration
    // (records with legacy fields but missing preferred fields)
    // Order by _creationTime for consistent results (Convex handles this efficiently)
    const allRuns = await ctx.db
      .query("agent_runs")
      .order("desc")
      .collect();
    const runs = allRuns.filter(
      (run) =>
        // Has legacy fields
        (run.agent !== undefined ||
          run.budgetResult !== undefined ||
          run.latencyMs !== undefined) &&
        // Missing preferred fields
        (!run.agentName || !run.createdAt)
    );

    let migrated = 0;
    let skipped = 0;

    for (const run of runs) {
      // Skip if already migrated (has agentName and createdAt)
      if (run.agentName && run.createdAt) {
        skipped++;
        continue;
      }

      // Convert legacy fields to preferred format
      const updates: any = {};

      // Convert agent to agentName
      if (!run.agentName && run.agent) {
        if (run.agent === "main" || run.agent === "assessment") {
          updates.agentName = run.agent;
        } else {
          // Default to "main" if unknown
          updates.agentName = "main";
        }
      }

      // Convert budgetResult.toolCalls to toolCalls array
      if (!run.toolCalls && run.budgetResult?.toolCalls) {
        updates.toolCalls = [{ count: run.budgetResult.toolCalls }];
      }

      // Set createdAt from _creationTime if not set
      if (!run.createdAt) {
        updates.createdAt = run._creationTime;
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(run._id, updates);
        migrated++;
      } else {
        skipped++;
      }
    }

    return { migrated, skipped, total: runs.length };
  },
});
