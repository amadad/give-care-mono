/**
 * Core Model Helpers
 *
 * Consolidates all model logic from model/* into a single file.
 * Pure helpers for users, sessions, context, messages, subscriptions, logs, and triggers.
 *
 * This file contains NO public exports - all public functions go through public.ts or internal.ts.
 */

import { internalQuery, internalMutation } from './_generated/server';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { Doc } from './_generated/dataModel';
import type { HydratedContext, Budget, Channel } from './lib/types';
import { v } from 'convex/values';
import { rrulestr } from 'rrule';

// ============================================================================
// USERS
// ============================================================================

const DEFAULT_LOCALE = 'en-US';

export const getByExternalId = async (ctx: QueryCtx | MutationCtx, externalId: string) => {
  return ctx.db
    .query('users')
    .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
    .unique();
};

/**
 * Get user by ID (internal query wrapper)
 */
export const getUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});

/**
 * Ensure user exists (internal mutation wrapper)
 */
export const ensureUserMutation = internalMutation({
  args: {
    externalId: v.string(),
    channel: v.union(v.literal('sms'), v.literal('web')),
    phone: v.optional(v.string()),
    locale: v.optional(v.string()),
    consent: v.optional(v.object({ emergency: v.boolean(), marketing: v.boolean() })),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, params) => {
    return ensureUser(ctx, params as EnsureUserParams);
  },
});

type EnsureUserParams = {
  externalId: string;
  channel: Channel;
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
    metadata: params.metadata,
  });
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error('Failed to load user after insert');
  }
  return user;
};

type EnsureSessionParams = {
  userId: Id<'users'>;
  channel: Channel;
  locale?: string;
};

export const ensureSession = async (ctx: MutationCtx, params: EnsureSessionParams) => {
  const existing = await ctx.db
    .query('sessions')
    .withIndex('by_user_channel', (q) => q.eq('userId', params.userId).eq('channel', params.channel))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, {
      lastSeen: Date.now(),
      locale: params.locale ?? existing.locale,
    });
    const updated = await ctx.db.get(existing._id);
    if (!updated) throw new Error('Session disappeared after patch');
    return updated;
  }
  const sessionId = await ctx.db.insert('sessions', {
    userId: params.userId,
    channel: params.channel,
    locale: params.locale ?? DEFAULT_LOCALE,
    policyBundle: 'trauma_informed_v1',
    budget: { maxInputTokens: 2000, maxOutputTokens: 1000, maxTools: 2 },
    promptHistory: [],
    consent: { emergency: false, marketing: false },
    metadata: {},
    lastSeen: Date.now(),
  });
  const session = await ctx.db.get(sessionId);
  if (!session) throw new Error('Failed to load session after insert');
  return session;
};

/**
 * Update user metadata blob (used for storing agent-specific state like component threads).
 */
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

export const getSessionByExternalId = async (
  ctx: QueryCtx | MutationCtx,
  params: { externalId: string; channel: Channel }
) => {
  const user = await getByExternalId(ctx, params.externalId);
  if (!user) return null;
  return ctx.db
    .query('sessions')
    .withIndex('by_user_channel', (q) => q.eq('userId', user._id).eq('channel', params.channel))
    .unique();
};

// ============================================================================
// CONTEXT
// ============================================================================

const DEFAULT_BUDGET: Budget = { maxInputTokens: 2000, maxOutputTokens: 1000, maxTools: 2 };

const attachConvexMetadata = (
  metadata: Record<string, unknown> | undefined,
  ids: { userId: Id<'users'>; sessionId: Id<'sessions'> }
) => ({
  ...(metadata ?? {}),
  convex: {
    ...(metadata?.convex as Record<string, unknown> | undefined),
    userId: ids.userId,
    sessionId: ids.sessionId,
  },
});

const fetchRecentPromptHistory = async (ctx: MutationCtx, userId: Id<'users'>) => {
  const recent = await ctx.db
    .query('messages')
    .withIndex('by_user_direction', (q) => q.eq('userId', userId).eq('direction', 'outbound'))
    .order('desc')
    .take(5);
  return recent.map((message) => ({ fieldId: 'message', text: message.text.slice(0, 500) }));
};

type HydrateParams = {
  externalId: string;
  channel: Channel;
  locale?: string;
  phone?: string;
};

export const hydrate = async (ctx: MutationCtx, params: HydrateParams): Promise<HydratedContext> => {
  const user = await ensureUser(ctx, params);
  const session = await ensureSession(ctx, { userId: user._id, channel: params.channel, locale: params.locale });

  const promptHistory = session.promptHistory.length
    ? session.promptHistory
    : await fetchRecentPromptHistory(ctx, user._id);

  return {
    userId: params.externalId,
    sessionId: session._id,
    locale: session.locale,
    policyBundle: session.policyBundle,
    budget: session.budget ?? DEFAULT_BUDGET,
    promptHistory,
    consent: session.consent,
    lastAssessment: session.lastAssessment ?? undefined,
    crisisFlags: session.crisisFlags ?? undefined,
    metadata: attachConvexMetadata(session.metadata as Record<string, unknown> | undefined, {
      userId: user._id,
      sessionId: session._id,
    }),
  };
};

export const persist = async (ctx: MutationCtx, context: HydratedContext) => {
  const metadata = (context.metadata ?? {}) as Record<string, unknown> & {
    convex?: { sessionId?: string };
  };
  const sessionId = (metadata.convex?.sessionId ?? context.sessionId) as Id<'sessions'> | undefined;
  if (!sessionId) return;
  await ctx.db.patch(sessionId, {
    promptHistory: context.promptHistory,
    consent: context.consent,
    budget: context.budget,
    policyBundle: context.policyBundle,
    metadata: context.metadata,
    lastAssessment: context.lastAssessment,
    crisisFlags: context.crisisFlags,
    lastSeen: Date.now(),
  });
};

// ============================================================================
// MESSAGES
// ============================================================================

type BaseMessage = {
  externalId: string;
  channel: Channel;
  text: string;
  meta?: Record<string, unknown>;
  traceId: string;
  redactionFlags?: string[];
};

const sanitizeText = (text: string) => text.slice(0, 2000);

const record = async (ctx: MutationCtx, payload: BaseMessage, direction: 'inbound' | 'outbound') => {
  const user = await ensureUser(ctx, {
    externalId: payload.externalId,
    channel: payload.channel,
    locale: (payload.meta?.locale as string | undefined) ?? undefined,
    phone: (payload.meta?.phone as string | undefined) ?? undefined,
  });
  const messageId = await ctx.db.insert('messages', {
    userId: user._id,
    channel: payload.channel,
    direction,
    text: sanitizeText(payload.text),
    meta: payload.meta,
    traceId: payload.traceId,
    redactionFlags: payload.redactionFlags ?? [],
  });
  return { messageId, userId: user._id };
};

export const recordInbound = (ctx: MutationCtx, payload: BaseMessage) => record(ctx, payload, 'inbound');
export const recordOutbound = (ctx: MutationCtx, payload: BaseMessage) => record(ctx, payload, 'outbound');

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<boolean> => {
  const subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('status'), 'active'))
    .first();

  if (!subscription) return false;

  // Check if subscription is not expired
  return subscription.currentPeriodEnd > Date.now();
};

/**
 * Check if user has active subscription (internal query wrapper)
 */
export const hasActiveSubscriptionQuery = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return hasActiveSubscription(ctx, userId);
  },
});

/**
 * Get signup URL for non-subscribers
 */
export const getSignupUrl = (phone?: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.givecareapp.com';
  const signupPath = '/signup';

  if (phone) {
    const encoded = encodeURIComponent(phone);
    return `${baseUrl}${signupPath}?phone=${encoded}`;
  }

  return `${baseUrl}${signupPath}`;
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
  payload: { externalId?: string; ruleId: string; action: string; context?: Record<string, unknown>; traceId: string }
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

// ============================================================================
// TRIGGERS
// ============================================================================

export type TriggerInput = {
  userExternalId: string;
  rrule: string;
  timezone: string;
  nextRun: string;
  payload: Record<string, unknown>;
  type: 'recurring' | 'one_off';
};

const nextRunFromRule = (rrule: string, from: Date) => {
  const rule = rrulestr(rrule);
  return rule.after(from, true)?.getTime() ?? null;
};

export const createTrigger = async (ctx: MutationCtx, input: TriggerInput) => {
  const user = await getByExternalId(ctx, input.userExternalId);
  if (!user) {
    throw new Error(`User ${input.userExternalId} not found`);
  }
  const triggerId = await ctx.db.insert('triggers', {
    userId: user._id,
    userExternalId: input.userExternalId,
    rrule: input.rrule,
    timezone: input.timezone,
    payload: input.payload,
    nextRun: new Date(input.nextRun).getTime(),
    type: input.type,
    status: 'active',
  });
  return triggerId;
};

export const cancelTrigger = async (ctx: MutationCtx, triggerId: Doc<'triggers'>['_id']) => {
  await ctx.db.patch(triggerId, { status: 'paused' });
};

export const dueTriggers = async (ctx: MutationCtx, now = Date.now(), limit = 50) => {
  return ctx.db
    .query('triggers')
    .withIndex('by_nextRun', (q) => q.lte('nextRun', now))
    .take(limit);
};

export const advanceTrigger = async (ctx: MutationCtx, trigger: Doc<'triggers'>) => {
  if (trigger.type === 'one_off') {
    await ctx.db.patch(trigger._id, { status: 'paused' });
    return null;
  }
  const next = nextRunFromRule(trigger.rrule, new Date(trigger.nextRun));
  if (!next) {
    await ctx.db.patch(trigger._id, { status: 'paused' });
    return null;
  }
  await ctx.db.patch(trigger._id, { nextRun: next });
  return next;
};
