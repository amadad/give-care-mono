/**
 * Logging domain for agent runs, guardrails, and crisis tracking.
 */

import { internalMutation, mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Core from '../core';

const budgetResultValidator = v.object({
  usedInputTokens: v.number(),
  usedOutputTokens: v.number(),
  toolCalls: v.number(),
});

export const agentRun = mutation({
  args: {
    payload: v.object({
      externalId: v.string(),
      agent: v.string(),
      policyBundle: v.string(),
      budgetResult: budgetResultValidator,
      latencyMs: v.number(),
      traceId: v.string(),
    }),
  },
  handler: async (ctx, { payload }) => {
    await Core.logAgentRun(ctx, payload);
  },
});

export const guardrail = mutation({
  args: {
    payload: v.object({
      externalId: v.optional(v.string()),
      ruleId: v.string(),
      action: v.string(),
      context: v.optional(v.any()),
      traceId: v.string(),
    }),
  },
  handler: async (ctx, { payload }) => {
    await Core.logGuardrail(ctx, payload);
  },
});

export const logCrisisInteraction = internalMutation({
  args: {
    userId: v.string(),
    input: v.string(),
    chunks: v.array(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, { userId, input, chunks, timestamp }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      console.warn('Crisis interaction logged for unknown user:', userId);
      return;
    }

    await ctx.db.insert('agent_runs', {
      userId: user._id,
      agent: 'crisis',
      policyBundle: 'crisis_v1',
      budgetResult: {
        usedInputTokens: input.length,
        usedOutputTokens: chunks.join('').length,
        toolCalls: 0,
      },
      latencyMs: Date.now() - timestamp,
      traceId: `crisis-${timestamp}`,
    });
  },
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
  handler: async (ctx, { userId, agent, policyBundle, budgetResult, latencyMs, traceId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      console.warn('Agent run logged for unknown user:', userId);
      return;
    }

    await ctx.db.insert('agent_runs', {
      userId: user._id,
      agent,
      policyBundle,
      budgetResult,
      latencyMs,
      traceId,
    });
  },
});
