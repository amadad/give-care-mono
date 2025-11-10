/**
 * Internal API - Server-side only functions
 */

import { internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { logAgentRun, logGuardrail, getByExternalId, ensureUser } from './lib/core';
import { messageValidator } from '@convex-dev/twilio';

// ============================================================================
// CORE HELPERS
// ============================================================================

export const getByExternalIdQuery = internalQuery({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return getByExternalId(ctx, externalId);
  },
});

export const ensureUserMutation = internalMutation({
  args: {
    externalId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
    phone: v.optional(v.string()),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ensureUser(ctx, args);
  },
});

export const logAgentRunInternal = internalMutation({
  args: {
    externalId: v.string(),
    agent: v.string(),
    policyBundle: v.string(),
    budgetResult: v.object({
      usedInputTokens: v.number(),
      usedOutputTokens: v.number(),
      toolCalls: v.number(),
    }),
    latencyMs: v.number(),
    traceId: v.string(),
  },
  handler: async (ctx, args) => {
    return logAgentRun(ctx, args);
  },
});

export const logGuardrailInternal = internalMutation({
  args: {
    externalId: v.optional(v.string()),
    ruleId: v.string(),
    action: v.string(),
    context: v.optional(v.any()),
    traceId: v.string(),
  },
  handler: async (ctx, args) => {
    return logGuardrail(ctx, args);
  },
});

export const logCrisisInteraction = internalMutation({
  args: {
    externalId: v.string(),
    input: v.string(),
    response: v.string(),
    timestamp: v.number(),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await logGuardrail(ctx, {
      externalId: args.externalId,
      ruleId: 'crisis_interaction',
      action: 'log',
      context: {
        input: args.input,
        response: args.response,
        timestamp: args.timestamp,
      },
      traceId: args.traceId ?? `crisis-${Date.now()}`,
    });
  },
});

export const updateUserMetadata = internalMutation({
  args: {
    userId: v.id('users'),
    metadata: v.any(),
  },
  handler: async (ctx, { userId, metadata }) => {
    await ctx.db.patch(userId, { metadata });
    return ctx.db.get(userId);
  },
});

export const getUserById = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});

// ============================================================================
// RESOURCES
// ============================================================================

export const getResourceLookupCache = internalQuery({
  args: {
    category: v.string(),
    zip: v.string(),
  },
  handler: async (ctx, args) => {
    const [cached] = await ctx.db
      .query('resource_cache')
      .withIndex('by_category_zip', (q) => q.eq('category', args.category).eq('zip', args.zip))
      .order('desc')
      .take(1);
    return cached ?? null;
  },
});

export const recordResourceLookup = internalMutation({
  args: {
    userId: v.optional(v.id('users')),
    category: v.string(),
    zip: v.string(),
    results: v.any(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('resource_cache', {
      userId: args.userId,
      category: args.category,
      zip: args.zip,
      results: args.results,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

// ============================================================================
// TWILIO
// ============================================================================

export const handleIncomingMessage = internalMutation({
  args: { message: messageValidator },
  handler: async (ctx, { message }) => {
    // Component automatically saves message to its own table
    // This callback runs in the same transaction

    // Trigger agent response
    await ctx.scheduler.runAfter(0, internal.inbound.processInbound, {
      phone: message.from,
      text: message.body,
      messageSid: message.sid,
    });
  },
});

