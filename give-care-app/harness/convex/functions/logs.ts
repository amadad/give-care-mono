import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import * as Logs from '../model/logs';
import { requireHarnessToken } from '../model/security';

const budgetResultValidator = v.object({
  usedInputTokens: v.number(),
  usedOutputTokens: v.number(),
  toolCalls: v.number(),
});

export const agentRun = mutation({
  args: {
    token: v.string(),
    payload: v.object({
      externalId: v.string(),
      agent: v.string(),
      policyBundle: v.string(),
      budgetResult: budgetResultValidator,
      latencyMs: v.number(),
      traceId: v.string(),
    }),
  },
  handler: async (ctx, { token, payload }) => {
    requireHarnessToken(token);
    await Logs.logAgentRun(ctx, payload);
  },
});

export const guardrail = mutation({
  args: {
    token: v.string(),
    payload: v.object({
      externalId: v.optional(v.string()),
      ruleId: v.string(),
      action: v.string(),
      context: v.optional(v.any()),
      traceId: v.string(),
    }),
  },
  handler: async (ctx, { token, payload }) => {
    requireHarnessToken(token);
    await Logs.logGuardrail(ctx, payload);
  },
});
