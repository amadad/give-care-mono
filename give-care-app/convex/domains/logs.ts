"use server";

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { getByExternalId } from '../core';

const budgetResultValidator = v.object({
  usedInputTokens: v.number(),
  usedOutputTokens: v.number(),
  toolCalls: v.number(),
});

export const logAgentRunInternal = internalMutation({
  args: {
    userId: v.string(),
    agent: v.string(),
    policyBundle: v.string(),
    budgetResult: budgetResultValidator,
    latencyMs: v.number(),
    traceId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error(`[domains/logs] User not found for agent run ${args.userId}`);
    }

    await ctx.db.insert('agent_runs', {
      userId: user._id,
      agent: args.agent,
      policyBundle: args.policyBundle,
      budgetResult: args.budgetResult,
      latencyMs: args.latencyMs,
      traceId: args.traceId,
    });
  },
});

export const logCrisisInteraction = internalMutation({
  args: {
    userId: v.string(),
    input: v.string(),
    chunks: v.array(v.string()),
    timestamp: v.number(),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getByExternalId(ctx, args.userId);
    await ctx.db.insert('guardrail_events', {
      userId: user?._id,
      ruleId: 'crisis_interaction',
      action: 'log',
      context: {
        input: args.input,
        chunks: args.chunks,
        timestamp: args.timestamp,
      },
      traceId: args.traceId ?? `crisis-${Date.now()}`,
    });
  },
});
