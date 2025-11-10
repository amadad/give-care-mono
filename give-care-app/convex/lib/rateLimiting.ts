import { RateLimiter, MINUTE, HOUR } from '@convex-dev/rate-limiter';
import { components } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

const DAY = 24 * 60 * 60 * 1000;

const rateLimiter = new RateLimiter(components.rateLimiter, {
  smsInboundDaily: {
    kind: 'token bucket',
    period: DAY,
    rate: 10,
    capacity: 10,
  },
  smsOutboundDaily: {
    kind: 'token bucket',
    period: DAY,
    rate: 10,
    capacity: 10,
  },
  smsGlobalPerMinute: {
    kind: 'token bucket',
    period: MINUTE,
    rate: 600,
    capacity: 600,
  },
  tokensPerUserHourly: {
    kind: 'token bucket',
    period: HOUR,
    rate: 50_000,
    capacity: 50_000,
  },
  tokensGlobalPerMinute: {
    kind: 'token bucket',
    period: MINUTE,
    rate: 500_000,
    capacity: 500_000,
  },
});

export const estimateTokens = (text: string, multiplier = 3) => {
  const promptTokens = Math.ceil(text.length / 4);
  return promptTokens + promptTokens * multiplier;
};

export async function enforceInboundSmsLimit(ctx: any, userId: Id<'users'>) {
  await rateLimiter.limit(ctx, 'smsInboundDaily', { key: userId });
  await rateLimiter.limit(ctx, 'smsGlobalPerMinute', {});
}

export async function enforceOutboundSmsLimit(ctx: any, userId: Id<'users'>) {
  await rateLimiter.limit(ctx, 'smsOutboundDaily', { key: userId });
  await rateLimiter.limit(ctx, 'smsGlobalPerMinute', {});
}

export type RateLimitStatus = { ok: boolean; retryAfter?: number; name?: string };

export async function checkTokenBudget(ctx: any, userId: Id<'users'>, tokens: number): Promise<RateLimitStatus> {
  const userCheck = await rateLimiter.check(ctx, 'tokensPerUserHourly', {
    key: userId,
    count: tokens,
    throws: false,
  });
  if (!userCheck.ok) return userCheck;
  const globalCheck = await rateLimiter.check(ctx, 'tokensGlobalPerMinute', {
    count: tokens,
    throws: false,
  });
  if (!globalCheck.ok) return globalCheck;
  return { ok: true };
}

export async function consumeTokenBudget(ctx: any, userId: Id<'users'>, tokens: number) {
  await rateLimiter.limit(ctx, 'tokensPerUserHourly', {
    key: userId,
    count: tokens,
  });
  await rateLimiter.limit(ctx, 'tokensGlobalPerMinute', {
    count: tokens,
  });
}
