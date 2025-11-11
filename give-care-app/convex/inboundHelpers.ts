/**
 * Inbound Helpers (Query Functions)
 *
 * Batched queries for inbound message processing
 * Separate from inbound.ts because queries can't be in "use node" files
 */

import { internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { internal, components } from './_generated/api';

/**
 * Batches all inbound context queries into a single query
 * Replaces 5 sequential queries with 1, saving ~200-400ms
 */
export const getInboundContext = internalQuery({
  args: {
    messageSid: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { messageSid, phone }) => {
    // Batch all queries in parallel using Promise.all
    const [seen, rateLimitCheck, userResult, activeSession] = await Promise.all([
      // Idempotency check
      ctx.runQuery(internal.internal._seenMessage, { sid: messageSid }),
      // Rate limiting
      ctx.runQuery(components.rateLimiter.lib.checkRateLimit, {
        name: 'llmRequests',
        key: phone,
        config: {
          kind: 'fixed window',
          rate: 20,
          period: 60_000,
          capacity: 20,
        },
        count: 1,
        throws: false, // Don't throw, return result
      }),
      // Ensure user exists (mutation, but we'll handle it separately)
      ctx.runQuery(internal.internal.getByExternalIdQuery, { externalId: phone }),
      // Active assessment session - use internal version
      ctx.runQuery(internal.assessments.getAnyActiveSessionInternal, { userId: phone }),
    ]);

    // Ensure user exists (mutation must be separate)
    let user = userResult;
    if (!user) {
      // User doesn't exist, but we can't create in query - return flag
      return {
        seen: !!seen,
        rateLimitOk: rateLimitCheck.ok ?? false,
        rateLimitRetryAfter: rateLimitCheck.retryAfter,
        user: null,
        activeSession: activeSession ?? null,
        needsUserCreation: true,
      };
    }

    // Re-check active session with correct userId - use internal version
    const activeSessionCorrected = await ctx.runQuery(internal.assessments.getAnyActiveSessionInternal, {
      userId: user.externalId,
    });

    return {
      seen: !!seen,
      rateLimitOk: rateLimitCheck.ok ?? false,
      rateLimitRetryAfter: rateLimitCheck.retryAfter,
      user,
      activeSession: activeSessionCorrected ?? null,
      needsUserCreation: false,
    };
  },
});

