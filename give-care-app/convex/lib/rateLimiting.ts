import { RateLimiter, MINUTE, HOUR } from '@convex-dev/rate-limiter';
import { components } from '../_generated/api';

// DAY constant not exported from rate-limiter, calculate it
const DAY = 24 * HOUR;

/**
 * Rate limiter configuration for GiveCare
 *
 * Prevents abuse and manages costs for SMS and LLM usage
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // SMS Message frequency limits
  sendMessage: {
    kind: 'fixed window',
    period: 5 * MINUTE,
    rate: 5, // Max 5 messages per 5 minutes per user
    capacity: 7, // Allow burst of 7 if user has credits from previous window
  },

  // Daily SMS limit per user
  dailyMessages: {
    kind: 'token bucket',
    period: DAY,
    rate: 50, // 50 messages per day per user
    capacity: 60, // Allow burst up to 60
  },

  // Global SMS limit (Twilio rate limits)
  globalMessages: {
    kind: 'token bucket',
    period: MINUTE,
    rate: 100, // 100 messages per minute globally
    capacity: 150,
  },

  // Token usage per user (prevents single user from consuming all tokens)
  userTokenUsage: {
    kind: 'token bucket',
    period: HOUR,
    rate: 50000, // 50k tokens per hour per user
    capacity: 100000, // Allow burst up to 100k
  },

  // Global token usage (OpenAI rate limits)
  globalTokenUsage: {
    kind: 'token bucket',
    period: MINUTE,
    rate: 500000, // 500k tokens per minute globally
    capacity: 1000000, // Allow burst up to 1M
  },

  // Crisis intervention rate (no limits, just tracking)
  crisisMessages: {
    kind: 'token bucket',
    period: DAY,
    rate: 10000, // Effectively unlimited for crisis
    capacity: 10000,
  },
});

/**
 * Estimate tokens for a message using simple heuristics
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string, multiplier: number = 3): number {
  const promptTokens = Math.ceil(text.length / 4);
  // Assume response is ~3x the input by default
  const estimatedOutputTokens = promptTokens * multiplier;
  return promptTokens + estimatedOutputTokens;
}

/**
 * Helper to check if rate limit would be exceeded
 */
export async function checkMessageRateLimit(
  ctx: any,
  userId: string,
  isCrisis: boolean = false
): Promise<{ ok: boolean; retryAfter?: number; name?: string }> {
  if (isCrisis) {
    // Don't rate limit crisis messages, but track them
    await rateLimiter.limit(ctx, 'crisisMessages', { key: userId });
    return { ok: true };
  }

  // Check user-specific rate limit
  const userCheck = await rateLimiter.check(ctx, 'sendMessage', {
    key: userId,
    throws: false,
  });

  if (!userCheck.ok) {
    return userCheck;
  }

  // Check daily limit
  const dailyCheck = await rateLimiter.check(ctx, 'dailyMessages', {
    key: userId,
    throws: false,
  });

  if (!dailyCheck.ok) {
    return dailyCheck;
  }

  // Check global limit
  const globalCheck = await rateLimiter.check(ctx, 'globalMessages', {
    throws: false,
  });

  if (!globalCheck.ok) {
    return globalCheck;
  }

  return { ok: true };
}

/**
 * Consume rate limit tokens after successful message send
 */
export async function consumeMessageRateLimit(
  ctx: any,
  userId: string,
  isCrisis: boolean = false
): Promise<void> {
  if (isCrisis) {
    await rateLimiter.limit(ctx, 'crisisMessages', { key: userId });
    return;
  }

  await rateLimiter.limit(ctx, 'sendMessage', { key: userId });
  await rateLimiter.limit(ctx, 'dailyMessages', { key: userId });
  await rateLimiter.limit(ctx, 'globalMessages', {});
}

/**
 * Check if token usage would exceed limits
 */
export async function checkTokenRateLimit(
  ctx: any,
  userId: string,
  estimatedTokens: number
): Promise<{ ok: boolean; retryAfter?: number; name?: string }> {
  // Check user-specific token limit
  const userCheck = await rateLimiter.check(ctx, 'userTokenUsage', {
    key: userId,
    count: estimatedTokens,
    throws: false,
  });

  if (!userCheck.ok) {
    return userCheck;
  }

  // Check global token limit
  const globalCheck = await rateLimiter.check(ctx, 'globalTokenUsage', {
    count: estimatedTokens,
    throws: false,
  });

  if (!globalCheck.ok) {
    return globalCheck;
  }

  return { ok: true };
}

/**
 * Consume token usage after LLM call
 * Use reserve: true to allow temporary negative balance
 */
export async function consumeTokenUsage(
  ctx: any,
  userId: string,
  actualTokens: number
): Promise<void> {
  await rateLimiter.limit(ctx, 'userTokenUsage', {
    key: userId,
    count: actualTokens,
    reserve: true, // Allow going negative temporarily
  });

  await rateLimiter.limit(ctx, 'globalTokenUsage', {
    count: actualTokens,
    reserve: true,
  });
}
