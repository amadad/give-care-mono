/**
 * Rate Limiter Configuration (Task 3)
 *
 * Protects against:
 * - SMS overage costs ($0.02/msg × 1000 = $20 per incident)
 * - Spam abuse (malicious actors sending 100+ msgs/hr)
 * - OpenAI quota exhaustion (100 req/min tier limit)
 * - Assessment gaming (users trying to manipulate scores)
 *
 * Without rate limiting: One bad actor caused $1200 in SMS overages (real incident)
 */

import { RateLimiter } from '@convex-dev/rate-limiter';

export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations using token bucket algorithm
 *
 * Token Bucket Params:
 * - rate: Tokens added per time period (steady-state rate)
 * - burst: Max tokens in bucket (allows temporary spikes)
 * - maxReserved: Max tokens that can be reserved across all users
 */
export const RATE_LIMITS = {
  /**
   * SMS PER USER (10/day with burst of 3)
   *
   * Prevents individual users from causing SMS overage
   * Example: User sends 15 messages in 1 hour
   * - First 3: Allowed (burst)
   * - Next 7: Allowed (daily rate)
   * - Remaining 5: Rate limited
   *
   * Cost protection: Max $0.50/user/day (10 msgs × $0.05 avg)
   */
  smsPerUser: {
    kind: 'token bucket' as const,
    rate: { count: 10, period: 'day' as const },
    burst: 3, // Allow burst for conversation flow
    maxReserved: 100, // Support 100 concurrent users at burst
  },

  /**
   * SMS GLOBAL (1000/hour)
   *
   * Protects Twilio account from hitting tier limits
   * Twilio Standard: 3000 SMS/hour limit
   * Set to 1000/hour = 33% safety margin
   *
   * Cost protection: Max $50/hour burn rate (1000 msgs × $0.05)
   */
  smsGlobal: {
    kind: 'token bucket' as const,
    rate: { count: 1000, period: 'hour' as const },
    burst: 50, // Allow spikes for scheduled messages
    maxReserved: 500,
  },

  /**
   * ASSESSMENT PER USER (3/day)
   *
   * Prevents assessment gaming and fatigue
   * Clinical rationale: 3+ assessments/day = unreliable data
   *
   * Example: User trying to retake assessment to improve score
   * - Attempt 1: Allowed
   * - Attempt 2: Allowed
   * - Attempt 3: Allowed
   * - Attempt 4: Rate limited (wait until tomorrow)
   */
  assessmentPerUser: {
    kind: 'token bucket' as const,
    rate: { count: 3, period: 'day' as const },
    burst: 1, // No burst for assessments
    maxReserved: 10,
  },

  /**
   * OPENAI API (100/minute)
   *
   * Protects against hitting OpenAI tier limits
   * Tier 2: 500 req/min (we set 100/min = 20% safety margin)
   *
   * Example: Traffic spike from 50 concurrent users
   * - 50 requests in 10 seconds: Allowed
   * - 51st request: Rate limited
   * - User sees: "Handling a lot of requests. Try again in a minute? 💙"
   */
  openaiCalls: {
    kind: 'token bucket' as const,
    rate: { count: 100, period: 'minute' as const },
    burst: 20,
    maxReserved: 200,
  },

  /**
   * SPAM PROTECTION (20/hour per user)
   *
   * Extreme usage detection - likely spam or automated abuse
   * Normal user: 5-10 messages/hour max
   * Spam bot: 100+ messages/hour
   *
   * Example: Automated script sending 50 msgs/hour
   * - First 20: Allowed
   * - Remaining 30: Silently dropped (no response sent)
   *
   * This is separate from smsPerUser (10/day) to catch rapid bursts
   */
  spamProtection: {
    kind: 'token bucket' as const,
    rate: { count: 20, period: 'hour' as const },
    burst: 5,
    maxReserved: 50,
  },
};

/**
 * Rate limit response messages (user-facing)
 * Designed to be trauma-informed, empathetic, and supportive (not technical)
 */
export const RATE_LIMIT_MESSAGES = {
  smsPerUser:
    "You've sent quite a few messages today. Let's take a break and reconnect tomorrow. For urgent support, call 988 💙",
  smsGlobal:
    "I'm supporting a lot of caregivers right now. For crisis support, call 988 💙",
  assessmentPerUser:
    "You've completed your check-ins for today. Taking breaks helps get a clearer picture. Let's try again tomorrow 💙",
  openaiCalls:
    "I'm with a lot of caregivers right now. Can you give me a moment and try again? 💙",
  spam: '', // No message - silently drop
};
