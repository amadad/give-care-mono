/**
 * Internal Agent Runs Functions
 * Migration and normalization utilities
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

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

