/**
 * Internal API - Server-side only functions
 */

import { internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { logAgentRun, logGuardrail, getByExternalId, ensureUser } from './lib/utils';
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

export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Limit to reasonable number - use take() instead of collect() for large datasets
    return await ctx.db.query('users').take(1000);
  },
});

export const getAssessmentById = internalQuery({
  args: { assessmentId: v.id('assessments') },
  handler: async (ctx, { assessmentId }) => {
    return await ctx.db.get(assessmentId);
  },
});

export const getActiveSessionInternal = internalQuery({
  args: {
    userId: v.id('users'),
    definition: v.union(v.literal('ema'), v.literal('bsfc'), v.literal('reach2'), v.literal('sdoh')),
  },
  handler: async (ctx, { userId, definition }) => {
    const sessions = await ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', userId).eq('definitionId', definition))
      .order('desc')
      .collect();
    
    return sessions.find(s => s.status === 'active') ?? null;
  },
});

export const startAssessmentInternal = internalMutation({
  args: {
    userId: v.id('users'),
    definition: v.union(v.literal('ema'), v.literal('bsfc'), v.literal('reach2'), v.literal('sdoh')),
    channel: v.optional(v.union(v.literal('sms'), v.literal('web'))),
  },
  handler: async (ctx, { userId, definition, channel }) => {
    // Close existing active sessions - filter in code instead of .filter()
    const sessions = await ctx.db
      .query('assessment_sessions')
      .withIndex('by_user_definition', (q) => q.eq('userId', userId).eq('definitionId', definition))
      .take(10);
    
    const existingSessions = sessions.filter(s => s.status === 'active');

    for (const session of existingSessions) {
      await ctx.db.patch(session._id, { status: 'completed' });
    }

    // Create new assessment session
    const sessionId = await ctx.db.insert('assessment_sessions', {
      userId,
      definitionId: definition,
      channel: channel ?? 'sms',
      questionIndex: 0,
      answers: [],
      status: 'active',
    });

    return sessionId;
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
// RESOURCE CACHE CLEANUP (for sweep jobs)
// ============================================================================

export const listExpiredResourceCache = internalQuery({
  args: { 
    now: v.number(), 
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, { now, limit = 200 }) => {
    // Find expired cache entries using the by_expiresAt index
    const expired = await ctx.db
      .query('resource_cache')
      .withIndex('by_expiresAt', (q) => q.lte('expiresAt', now))
      .take(limit);
    
    return { ids: expired.map((r) => r._id) };
  },
});

export const deleteResourceCacheBatch = internalMutation({
  args: { 
    ids: v.array(v.id('resource_cache')) 
  },
  handler: async (ctx, { ids }) => {
    for (const id of ids) {
      await ctx.db.delete(id);
    }
    return { deleted: ids.length };
  },
});

// ============================================================================
// INBOUND IDEMPOTENCY HELPERS
// ============================================================================

/**
 * Check if a message has already been processed
 */
export const _seenMessage = internalQuery({
  args: { sid: v.string() },
  handler: async (ctx, { sid }) => {
    const existing = await ctx.db
      .query('inbound_receipts')
      .withIndex('by_sid', (q) => q.eq('messageSid', sid))
      .unique();
    return !!existing;
  },
});

/**
 * Mark a message as processed
 */
export const _markMessage = internalMutation({
  args: { sid: v.string() },
  handler: async (ctx, { sid }) => {
    await ctx.db.insert('inbound_receipts', { messageSid: sid });
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

// ============================================================================
// STRIPE WEBHOOK PROCESSING
// ============================================================================

/**
 * Record Stripe webhook event (idempotent)
 * Called from HTTP handler to persist event, then schedule async processing
 */
export const recordStripeEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    type: v.string(),
    data: v.any(),
  },
  handler: async (ctx, { stripeEventId, type, data }) => {
    // Check if already processed (idempotency)
    const existing = await ctx.db
      .query('billing_events')
      .withIndex('by_event', (q) => q.eq('stripeEventId', stripeEventId))
      .first();

    if (existing) {
      console.log(`[stripe] Event ${stripeEventId} already recorded`);
      return { eventId: existing._id, duplicate: true };
    }

    // Insert new event
    const eventId = await ctx.db.insert('billing_events', {
      stripeEventId,
      type,
      data,
      userId: undefined, // Will be populated during processing if applicable
    });

    console.log(`[stripe] Recorded event ${stripeEventId} (type: ${type})`);
    return { eventId, duplicate: false };
  },
});

/**
 * Process Stripe webhook event asynchronously
 * Handles different event types (subscriptions, payments, etc.)
 */
export const processStripeEvent = internalMutation({
  args: {
    eventId: v.id('billing_events'),
  },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId);
    if (!event) {
      console.error(`[stripe] Event ${eventId} not found`);
      return;
    }

    console.log(`[stripe] Processing event ${event.stripeEventId} (type: ${event.type})`);

    // TODO: Implement event-specific handling based on event.type
    // Examples:
    // - customer.subscription.created
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    // - checkout.session.completed

    // For now, just log that processing would happen here
    console.log(`[stripe] Event processing not yet implemented for type: ${event.type}`);
  },
});

