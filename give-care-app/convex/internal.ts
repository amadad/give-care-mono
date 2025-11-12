/**
 * Internal API - Server-side only functions
 */

import { internalMutation, internalQuery } from './_generated/server';
import { internal, api } from './_generated/api';
import { v } from 'convex/values';
import { logAgentRun, logGuardrail, getByExternalId, ensureUser } from './lib/utils';
import { assessmentDefinitionValidator } from './lib/validators';
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

/**
 * Log agent routing decision for observability
 */
export const logAgentDecision = internalMutation({
  args: {
    userId: v.id('users'),
    inputText: v.string(),
    routingDecision: v.string(),
    reasoning: v.optional(v.string()),
    confidence: v.optional(v.number()),
    alternatives: v.optional(v.array(v.string())),
    traceId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('agent_decisions', {
      userId: args.userId,
      inputText: args.inputText,
      routingDecision: args.routingDecision,
      reasoning: args.reasoning,
      confidence: args.confidence,
      alternatives: args.alternatives,
      traceId: args.traceId,
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
    definition: assessmentDefinitionValidator,
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
    definition: assessmentDefinitionValidator,
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

    const eventData = event.data as Record<string, unknown>;
    const eventType = event.type;

    try {
      switch (eventType) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          await handleSubscriptionChange(ctx, eventData);
          break;
        }
        case 'customer.subscription.deleted': {
          await handleSubscriptionDeleted(ctx, eventData);
          break;
        }
        case 'invoice.payment_succeeded': {
          await handleInvoicePaymentSucceeded(ctx, eventData);
          break;
        }
        case 'invoice.payment_failed': {
          await handleInvoicePaymentFailed(ctx, eventData);
          break;
        }
        case 'checkout.session.completed': {
          await handleCheckoutCompleted(ctx, eventData);
          break;
        }
        default:
          console.log(`[stripe] Unhandled event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`[stripe] Error processing event ${event.stripeEventId}:`, error);
      // Don't throw - we've already recorded the event, just log the error
    }
  },
});

/**
 * Helper: Handle subscription created/updated events
 */
async function handleSubscriptionChange(
  ctx: any,
  eventData: Record<string, unknown>
) {
  const subscription = eventData.object as Record<string, unknown>;
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id as string;
  const status = subscription.status as string;
  const currentPeriodEnd = (subscription.current_period_end as number) * 1000; // Convert to ms
  const items = subscription.items as { data: Array<{ price: Record<string, unknown> }> };
  const priceId = items?.data?.[0]?.price?.id as string | undefined;

  if (!customerId || !subscriptionId) {
    console.error('[stripe] Missing customerId or subscriptionId in subscription event');
    return;
  }

  // Find user by Stripe customer ID
  const existingSubscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_customer', (q: any) => q.eq('stripeCustomerId', customerId))
    .first();

  // Extract planId from priceId (e.g., "price_123" -> "plus" or use priceId directly)
  // For now, we'll store the priceId as planId - can be mapped later
  const planId = priceId || 'free';

  if (existingSubscription) {
    // Update existing subscription
    await ctx.db.patch(existingSubscription._id, {
      status,
      currentPeriodEnd,
      planId,
    });
    console.log(`[stripe] Updated subscription ${subscriptionId} for customer ${customerId}`);
  } else {
    // New subscription - need to find or create user
    // In a real system, customerId would be stored in user metadata during checkout
    // For now, we'll try to find user by checking metadata or allow subscription without userId
    // The subscription can be linked to a user later when they sign up
    
    // TODO: In a real implementation, you'd:
    // 1. Store customerId in user.metadata.stripeCustomerId during checkout
    // 2. Or use client_reference_id in checkout session to store userId/externalId
    // 3. Or query Stripe API to get customer email and match to user
    
    // For now, we'll log a warning and skip creating the subscription
    // The subscription will be created when the user signs up and links their account
    console.warn(`[stripe] Cannot create subscription - no user found for customer ${customerId}. Subscription will be created when user links account.`);
    
    // Alternative: Create subscription record with a placeholder or null userId
    // This requires making userId optional in schema, which we'll skip for now
  }
}

/**
 * Helper: Handle subscription deleted event
 */
async function handleSubscriptionDeleted(
  ctx: any,
  eventData: Record<string, unknown>
) {
  const subscription = eventData.object as Record<string, unknown>;
  const customerId = subscription.customer as string;

  if (!customerId) {
    console.error('[stripe] Missing customerId in subscription deleted event');
    return;
  }

  const existingSubscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_customer', (q: any) => q.eq('stripeCustomerId', customerId))
    .first();

  if (existingSubscription) {
    await ctx.db.patch(existingSubscription._id, {
      status: 'canceled',
    });
    console.log(`[stripe] Marked subscription as canceled for customer ${customerId}`);
  } else {
    console.warn(`[stripe] Subscription not found for customer ${customerId}`);
  }
}

/**
 * Helper: Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(
  ctx: any,
  eventData: Record<string, unknown>
) {
  const invoice = eventData.object as Record<string, unknown>;
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | undefined;

  if (!customerId) {
    console.error('[stripe] Missing customerId in invoice payment succeeded event');
    return;
  }

  // Update subscription's currentPeriodEnd if subscription exists
  if (subscriptionId) {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_customer', (q: any) => q.eq('stripeCustomerId', customerId))
      .first();

    if (subscription) {
      // Payment succeeded - extend subscription period
      const periodEnd = (invoice.period_end as number) * 1000; // Convert to ms
      await ctx.db.patch(subscription._id, {
        status: 'active',
        currentPeriodEnd: periodEnd,
      });
      console.log(`[stripe] Extended subscription period for customer ${customerId}`);
    }
  }
}

/**
 * Helper: Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(
  ctx: any,
  eventData: Record<string, unknown>
) {
  const invoice = eventData.object as Record<string, unknown>;
  const customerId = invoice.customer as string;

  if (!customerId) {
    console.error('[stripe] Missing customerId in invoice payment failed event');
    return;
  }

  const subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_customer', (q: any) => q.eq('stripeCustomerId', customerId))
    .first();

  if (subscription) {
    // Mark subscription as past_due or unpaid
    await ctx.db.patch(subscription._id, {
      status: 'past_due',
    });
    console.log(`[stripe] Marked subscription as past_due for customer ${customerId}`);
    // TODO: Send notification to user about failed payment
  }
}

/**
 * Helper: Handle checkout session completed
 */
async function handleCheckoutCompleted(
  ctx: any,
  eventData: Record<string, unknown>
) {
  const session = eventData.object as Record<string, unknown>;
  const customerId = session.customer as string | undefined;
  const subscriptionId = session.subscription as string | undefined;
  const clientReferenceId = session.client_reference_id as string | undefined;

  // client_reference_id can be used to store userId or externalId
  // For now, we'll rely on the subscription.created event to handle this
  // But we can use this to link the customer to a user if needed

  if (subscriptionId && customerId) {
    // The subscription.created event should handle this, but we can ensure it's processed
    console.log(`[stripe] Checkout completed for customer ${customerId}, subscription ${subscriptionId}`);
    // The subscription will be created/updated by the subscription.created event
  }
}

// ============================================================================
// INTERNAL QUERIES (for use within Convex only - not public API)
// ============================================================================

/**
 * Internal version of wellness.getStatus - for use within Convex only
 * Provides richer context validation and avoids public API rate limits
 * Calls the public query (queries can call public queries, but actions should use internal)
 */
export const getWellnessStatusInternal = internalQuery({
  args: {
    userId: v.string(),
    recentLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Internal queries can call public queries - this is fine
    // The key is that actions (like tools) use internal queries, not public ones
    return ctx.runQuery(api.wellness.getStatus, args);
  },
});

/**
 * Internal version of interventions.getByZones - for use within Convex only
 * Provides richer context validation and avoids public API rate limits
 * Calls the public query (queries can call public queries, but actions should use internal)
 */
export const getInterventionsByZonesInternal = internalQuery({
  args: {
    zones: v.array(v.string()),
    minEvidenceLevel: v.optional(v.union(v.literal('high'), v.literal('moderate'), v.literal('low'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Internal queries can call public queries - this is fine
    // The key is that actions (like tools) use internal queries, not public ones
    return ctx.runQuery(api.interventions.getByZones, args);
  },
});

