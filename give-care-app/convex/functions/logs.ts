import { mutation, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Logs from '../model/logs';

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
    await Logs.logAgentRun(ctx, payload);
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
    await Logs.logGuardrail(ctx, payload);
  },
});

/**
 * Log crisis interaction for safety monitoring
 *
 * This is an internal mutation called by the crisis agent.
 */
export const logCrisisInteraction = internalMutation({
  args: {
    userId: v.string(),
    input: v.string(),
    chunks: v.array(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, { userId, input, chunks, timestamp }) => {
    // Get user ID from string (userId is externalId from agent context)
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      console.warn('Crisis interaction logged for unknown user:', userId);
      return;
    }

    // Log to agent_runs for monitoring
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

/**
 * Log agent run for analytics
 *
 * This is an internal mutation called by Convex-native agents.
 */
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
    // Get user ID from string (userId is externalId from agent context)
    const user = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', userId))
      .unique();

    if (!user) {
      console.warn('Agent run logged for unknown user:', userId);
      return;
    }

    // Log to agent_runs table
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
