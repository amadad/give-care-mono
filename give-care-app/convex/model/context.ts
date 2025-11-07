import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import type { HydratedContext, Budget, Channel } from '../../packages/shared/types';
import * as Users from './users';

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
  const user = await Users.ensureUser(ctx, params);
  const session = await Users.ensureSession(ctx, { userId: user._id, channel: params.channel, locale: params.locale });

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
