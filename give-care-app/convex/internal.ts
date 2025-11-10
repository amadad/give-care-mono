"use server";

/**
 * Internal Convex API surface
 *
 * All server-only functions accessible via api.internal.*
 * Consolidates internal/ folder into single file.
 */

import { mutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { getByExternalId } from './core';
import { internal } from './_generated/api';

// ============================================================================
// EXPORTS FROM CORE.TS
// ============================================================================

export {
  getByExternalIdQuery as getByExternalId,
  recordInboundMutation as recordInbound,
  recordOutboundMutation as recordOutbound,
  logDelivery,
  createComponentThread,
  updateUserMetadata,
  logAgentRunInternal,
  logCrisisInteraction,
} from './core';

// ============================================================================
// ADDITIONAL INTERNAL MUTATIONS
// Moved from internal/core.ts
// ============================================================================

const resolveUser = async (ctx: MutationCtx, externalId?: string) => {
  if (!externalId) return null;
  return getByExternalId(ctx, externalId);
};

export const logAuditEntry = mutation({
  args: {
    actorId: v.optional(v.string()),
    resource: v.string(),
    action: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.actorId);

    await ctx.db.insert('guardrail_events', {
      userId: user?._id,
      ruleId: String((args.metadata as Record<string, unknown> | undefined)?.rule ?? args.resource),
      action: args.action,
      context: {
        ...(args.metadata ?? {}),
        resource: args.resource,
      },
      traceId: `audit-${Date.now()}`,
    });
  },
});

export const appendMessage = mutation({
  args: {
    sessionId: v.optional(v.id('sessions')),
    userId: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system'), v.literal('tool')),
    text: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error('User not found for appendMessage');
    }

    await ctx.db.insert('messages', {
      userId: user._id,
      channel: 'sms',
      direction: args.role === 'user' ? 'inbound' : 'outbound',
      text: args.text,
      meta: {
        ...(args.metadata ?? {}),
        role: args.role,
        sessionId: args.sessionId,
      },
      traceId: `guardrail-${Date.now()}`,
      redactionFlags: [],
    });
  },
});

export const logCrisisEvent = mutation({
  args: {
    userId: v.string(),
    severity: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getByExternalId(ctx, args.userId);
    if (!user) {
      throw new Error('User not found for crisis event');
    }

    await ctx.runMutation(internal.workflows.logCrisisEvent, {
      userId: user._id,
      severity: args.severity,
      terms: [],
      messageText: args.message,
    });
  },
});
