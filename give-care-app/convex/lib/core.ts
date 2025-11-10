/**
 * Core Model Helpers
 *
 * Simplified version - only GiveCare-specific helpers.
 * Agent Component handles threads/messages automatically.
 */

import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { v } from 'convex/values';

const DEFAULT_LOCALE = 'en-US';

// ============================================================================
// USERS
// ============================================================================

export const getByExternalId = async (ctx: QueryCtx | MutationCtx, externalId: string) => {
  return ctx.db
    .query('users')
    .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
    .unique();
};

type EnsureUserParams = {
  externalId: string;
  channel: 'sms' | 'email' | 'web';
  phone?: string;
  locale?: string;
  consent?: { emergency: boolean; marketing: boolean };
  metadata?: Record<string, unknown>;
};

export const ensureUser = async (ctx: MutationCtx, params: EnsureUserParams) => {
  const existing = await getByExternalId(ctx, params.externalId);
  if (existing) {
    // Update phone if provided and not set
    if (params.phone && !existing.phone) {
      await ctx.db.patch(existing._id, { phone: params.phone });
      const updated = await ctx.db.get(existing._id);
      return updated!;
    }
    return existing;
  }
  
  const userId = await ctx.db.insert('users', {
    externalId: params.externalId,
    phone: params.phone,
    channel: params.channel,
    locale: params.locale ?? DEFAULT_LOCALE,
    consent: params.consent,
    metadata: params.metadata ?? {},
  });
  
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error('Failed to load user after insert');
  }
  return user;
};

// ============================================================================
// LOGS
// ============================================================================

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
  const user = await getByExternalId(ctx, payload.externalId);
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
  payload: {
    externalId?: string;
    ruleId: string;
    action: string;
    context?: Record<string, unknown>;
    traceId: string;
  }
) => {
  const user = payload.externalId ? await getByExternalId(ctx, payload.externalId) : null;
  await ctx.db.insert('guardrail_events', {
    userId: user?._id,
    ruleId: payload.ruleId,
    action: payload.action,
    context: payload.context,
    traceId: payload.traceId,
  });
};

