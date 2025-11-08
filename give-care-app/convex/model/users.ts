import { internalQuery, internalMutation } from '../_generated/server';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import type { Channel } from '../lib/types';
import { v } from 'convex/values';

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
