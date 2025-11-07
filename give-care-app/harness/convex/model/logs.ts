import type { MutationCtx } from '../_generated/server';
import * as Users from './users';

export const logAgentRun = async (
  ctx: MutationCtx,
  payload: {
    externalId: string;
    agent: string;
    policyBundle: string;
    budgetResult: { usedInputTokens: number; usedOutputTokens: number; toolCalls: number };
    latencyMs: number;
    traceId: string;
  }
) => {
  const user = await Users.getByExternalId(ctx, payload.externalId);
  if (!user) return;
  await ctx.db.insert('agent_runs', {
    userId: user._id,
    agent: payload.agent,
    policyBundle: payload.policyBundle,
    budgetResult: payload.budgetResult,
    latencyMs: payload.latencyMs,
    traceId: payload.traceId,
  });
};

export const logGuardrail = async (
  ctx: MutationCtx,
  payload: { externalId?: string; ruleId: string; action: string; context?: Record<string, unknown>; traceId: string }
) => {
  const user = payload.externalId ? await Users.getByExternalId(ctx, payload.externalId) : null;
  await ctx.db.insert('guardrail_events', {
    userId: user?._id,
    ruleId: payload.ruleId,
    action: payload.action,
    context: payload.context,
    traceId: payload.traceId,
  });
};
