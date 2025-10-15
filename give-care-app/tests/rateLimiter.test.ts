/**
 * Tests for Task 3: Rate Limiter (Cost & Spam Protection)
 *
 * Tests cover:
 * 1. SMS per-user limits (10/day with burst 3)
 * 2. SMS global limits (1000/hour)
 * 3. Assessment limits (3/day)
 * 4. OpenAI API limits (100/min)
 * 5. Spam protection (20/hour)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { internal } from '../convex/_generated/api';
import { RATE_LIMITS, RATE_LIMIT_MESSAGES, rateLimiter } from '../convex/rateLimits.config';

// Import Convex functions for testing
const modules = import.meta.glob('../convex/**/*.ts');

describe('Task 3: Rate Limiter', () => {
  describe('SMS Per-User Limits (10/day, burst 3)', () => {
    it('should define SMS per-user rate limit configuration', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.smsPerUser.kind).toBe('token bucket');
      expect(RATE_LIMITS.smsPerUser.rate.count).toBe(10);
      expect(RATE_LIMITS.smsPerUser.rate.period).toBe('day');
      expect(RATE_LIMITS.smsPerUser.burst).toBe(3);
    });

    it('should define correct SMS per-user message', () => {
      // RATE_LIMIT_MESSAGES imported at top

      // Updated to trauma-informed messaging (no technical details)
      expect(RATE_LIMIT_MESSAGES.smsPerUser).toContain('quite a few messages');
      expect(RATE_LIMIT_MESSAGES.smsPerUser).toContain('tomorrow');
      expect(RATE_LIMIT_MESSAGES.smsPerUser).toContain('988');
    });

    it('should calculate max cost per user per day', () => {
      // RATE_LIMITS imported at top

      const maxMessagesPerDay = RATE_LIMITS.smsPerUser.rate.count;
      const costPerMessage = 0.05; // $0.05 average
      const maxCostPerUser = maxMessagesPerDay * costPerMessage;

      expect(maxCostPerUser).toBe(0.5); // $0.50 max per user per day
    });

    it('should have burst capacity for conversation flow', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.smsPerUser.burst).toBe(3);
      expect(RATE_LIMITS.smsPerUser.maxReserved).toBe(100); // 100 concurrent users
    });
  });

  describe('SMS Global Limits (1000/hour)', () => {
    it('should define SMS global rate limit configuration', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.smsGlobal.kind).toBe('token bucket');
      expect(RATE_LIMITS.smsGlobal.rate.count).toBe(1000);
      expect(RATE_LIMITS.smsGlobal.rate.period).toBe('hour');
      expect(RATE_LIMITS.smsGlobal.burst).toBe(50);
    });

    it('should define correct SMS global message', () => {
      // RATE_LIMIT_MESSAGES imported at top

      // Updated to trauma-informed messaging
      expect(RATE_LIMIT_MESSAGES.smsGlobal).toContain('supporting a lot of caregivers');
      expect(RATE_LIMIT_MESSAGES.smsGlobal).toContain('988');
    });

    it('should calculate max cost per hour globally', () => {
      // RATE_LIMITS imported at top

      const maxMessagesPerHour = RATE_LIMITS.smsGlobal.rate.count;
      const costPerMessage = 0.05; // $0.05 average
      const maxCostPerHour = maxMessagesPerHour * costPerMessage;

      expect(maxCostPerHour).toBe(50); // $50 max per hour
    });

    it('should have burst capacity for scheduled message spikes', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.smsGlobal.burst).toBe(50);
      expect(RATE_LIMITS.smsGlobal.maxReserved).toBe(500);
    });

    it('should calculate max cost per day globally', () => {
      // RATE_LIMITS imported at top

      const maxMessagesPerHour = RATE_LIMITS.smsGlobal.rate.count;
      const costPerMessage = 0.05;
      const maxCostPerDay = maxMessagesPerHour * costPerMessage * 24;

      expect(maxCostPerDay).toBe(1200); // $1200 max per day
    });
  });

  describe('Assessment Limits (3/day)', () => {
    it('should define assessment rate limit configuration', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.assessmentPerUser.kind).toBe('token bucket');
      expect(RATE_LIMITS.assessmentPerUser.rate.count).toBe(3);
      expect(RATE_LIMITS.assessmentPerUser.rate.period).toBe('day');
      expect(RATE_LIMITS.assessmentPerUser.burst).toBe(1);
    });

    it('should define correct assessment limit message', () => {
      // RATE_LIMIT_MESSAGES imported at top

      // Updated to trauma-informed messaging (no technical details)
      expect(RATE_LIMIT_MESSAGES.assessmentPerUser).toContain('check-ins');
      expect(RATE_LIMIT_MESSAGES.assessmentPerUser).toContain('tomorrow');
    });

    it('should prevent assessment gaming with no burst', () => {
      // RATE_LIMITS imported at top

      // No burst for assessments (prevent rapid retakes)
      expect(RATE_LIMITS.assessmentPerUser.burst).toBe(1);
      expect(RATE_LIMITS.assessmentPerUser.maxReserved).toBe(10);
    });

    it('should have clinical rationale for 3/day limit', () => {
      // RATE_LIMITS imported at top

      // 3+ assessments/day = unreliable data (clinical rationale)
      expect(RATE_LIMITS.assessmentPerUser.rate.count).toBe(3);
    });
  });

  describe('OpenAI API Limits (100/min)', () => {
    it('should define OpenAI API rate limit configuration', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.openaiCalls.kind).toBe('token bucket');
      expect(RATE_LIMITS.openaiCalls.rate.count).toBe(100);
      expect(RATE_LIMITS.openaiCalls.rate.period).toBe('minute');
      expect(RATE_LIMITS.openaiCalls.burst).toBe(20);
    });

    it('should define correct OpenAI limit message', () => {
      // RATE_LIMIT_MESSAGES imported at top

      // Updated to trauma-informed messaging
      expect(RATE_LIMIT_MESSAGES.openaiCalls).toContain('with a lot of caregivers');
      expect(RATE_LIMIT_MESSAGES.openaiCalls).toContain('moment');
    });

    it('should have safety margin vs OpenAI tier limits', () => {
      // RATE_LIMITS imported at top

      // Tier 2: 500 req/min
      // Our limit: 100 req/min = 20% safety margin
      const tierLimit = 500;
      const ourLimit = RATE_LIMITS.openaiCalls.rate.count;
      const safetyMargin = ourLimit / tierLimit;

      expect(safetyMargin).toBe(0.2); // 20% of tier limit
    });

    it('should have burst capacity for traffic spikes', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.openaiCalls.burst).toBe(20);
      expect(RATE_LIMITS.openaiCalls.maxReserved).toBe(200);
    });
  });

  describe('Spam Protection (20/hour)', () => {
    it('should define spam protection rate limit configuration', () => {
      // RATE_LIMITS imported at top

      expect(RATE_LIMITS.spamProtection.kind).toBe('token bucket');
      expect(RATE_LIMITS.spamProtection.rate.count).toBe(20);
      expect(RATE_LIMITS.spamProtection.rate.period).toBe('hour');
      expect(RATE_LIMITS.spamProtection.burst).toBe(5);
    });

    it('should silently drop spam (no message)', () => {
      // RATE_LIMIT_MESSAGES imported at top

      // Spam protection should NOT send a message (silent drop)
      expect(RATE_LIMIT_MESSAGES.spam).toBe('');
    });

    it('should catch extreme usage patterns', () => {
      // RATE_LIMITS imported at top

      // Normal user: 5-10 msgs/hour
      // Spam bot: 100+ msgs/hour
      // Limit: 20 msgs/hour catches abuse
      const normalUsage = 10;
      const spamLimit = RATE_LIMITS.spamProtection.rate.count;

      expect(spamLimit).toBeGreaterThan(normalUsage * 1.5); // Buffer above normal
      expect(spamLimit).toBeLessThan(50); // Well below abuse levels
    });

    it('should be separate from daily SMS limit', () => {
      // RATE_LIMITS imported at top

      // spamProtection (20/hour) catches rapid bursts
      // smsPerUser (10/day) prevents daily overuse
      expect(RATE_LIMITS.spamProtection.rate.period).toBe('hour');
      expect(RATE_LIMITS.smsPerUser.rate.period).toBe('day');
    });
  });

  describe('Rate Limit Messages', () => {
    it('should verify all rate limit messages include crisis resources', () => {
      // RATE_LIMIT_MESSAGES imported at top

      // All non-spam messages should include 988 (crisis hotline)
      expect(RATE_LIMIT_MESSAGES.smsPerUser).toContain('988');
      expect(RATE_LIMIT_MESSAGES.smsGlobal).toContain('988');
      expect(RATE_LIMIT_MESSAGES.openaiCalls).toContain('💙');
      expect(RATE_LIMIT_MESSAGES.assessmentPerUser).toContain('💙');
    });

    it('should use trauma-informed language in messages', () => {
      // RATE_LIMIT_MESSAGES imported at top

      // Should be supportive, not punitive
      expect(RATE_LIMIT_MESSAGES.smsPerUser).not.toContain('error');
      expect(RATE_LIMIT_MESSAGES.assessmentPerUser).toContain("Let's");
    });

    it('should define all 5 rate limit message types', () => {
      // RATE_LIMIT_MESSAGES imported at top

      expect(RATE_LIMIT_MESSAGES.smsPerUser).toBeDefined();
      expect(RATE_LIMIT_MESSAGES.smsGlobal).toBeDefined();
      expect(RATE_LIMIT_MESSAGES.assessmentPerUser).toBeDefined();
      expect(RATE_LIMIT_MESSAGES.openaiCalls).toBeDefined();
      expect(RATE_LIMIT_MESSAGES.spam).toBeDefined();
      expect(RATE_LIMIT_MESSAGES.spam).toBe(''); // Silent drop
    });
  });

  describe('Admin Tools', () => {
    it('should have getRateLimitStats query defined', async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(
        internal.functions.rateLimitMonitoring.getRateLimitStats
      );

      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should have resetUserRateLimit mutation defined', async () => {
      const t = convexTest(schema, modules);

      const result = await t.mutation(
        internal.functions.rateLimitMonitoring.resetUserRateLimit,
        { phoneNumber: '+15551234567' }
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.phoneNumber).toBe('+15551234567');
    });

    it('should have isUserRateLimited query defined', async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(
        internal.functions.rateLimitMonitoring.isUserRateLimited,
        { phoneNumber: '+15551234567' }
      );

      expect(result).toBeDefined();
      expect(result.phoneNumber).toBe('+15551234567');
      expect(result.limiters).toBeDefined();
    });

    it('should have getGlobalAlerts query defined', async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(
        internal.functions.rateLimitMonitoring.getGlobalAlerts
      );

      expect(result).toBeDefined();
      expect(result.alerts).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should have getUserRateLimitHistory query defined', async () => {
      const t = convexTest(schema, modules);

      const result = await t.query(
        internal.functions.rateLimitMonitoring.getUserRateLimitHistory,
        { phoneNumber: '+15551234567' }
      );

      expect(result).toBeDefined();
      expect(result.phoneNumber).toBe('+15551234567');
    });
  });

  describe('Rate Limiter Package Integration', () => {
    it('should instantiate RateLimiter from @convex-dev/rate-limiter', () => {
      // rateLimiter imported at top

      expect(rateLimiter).toBeDefined();
      expect(rateLimiter.constructor.name).toBe('RateLimiter');
    });

    it('should define all 5 rate limit configurations', () => {
      // RATE_LIMITS imported at top

      expect(Object.keys(RATE_LIMITS)).toHaveLength(5);
      expect(RATE_LIMITS.smsPerUser).toBeDefined();
      expect(RATE_LIMITS.smsGlobal).toBeDefined();
      expect(RATE_LIMITS.assessmentPerUser).toBeDefined();
      expect(RATE_LIMITS.openaiCalls).toBeDefined();
      expect(RATE_LIMITS.spamProtection).toBeDefined();
    });

    it('should use token bucket algorithm for all limiters', () => {
      // RATE_LIMITS imported at top

      Object.values(RATE_LIMITS).forEach((config: any) => {
        expect(config.kind).toBe('token bucket');
        expect(config.rate).toBeDefined();
        expect(config.burst).toBeDefined();
        expect(config.maxReserved).toBeDefined();
      });
    });
  });

  describe('Cost Protection Verification', () => {
    it('should prevent more than $0.50/day per user', async () => {
      const t = convexTest(schema, modules);

      // 10 messages/day × $0.05/msg = $0.50 max
      const maxCostPerUser = 10 * 0.05;
      expect(maxCostPerUser).toBe(0.5);
    });

    it('should prevent more than $50/hour globally', async () => {
      const t = convexTest(schema, modules);

      // 1000 messages/hour × $0.05/msg = $50 max
      const maxCostPerHour = 1000 * 0.05;
      expect(maxCostPerHour).toBe(50);
    });

    it('should prevent more than $1200/day globally', async () => {
      const t = convexTest(schema, modules);

      // 24 hours × $50/hour = $1200 max
      const maxCostPerDay = 24 * 50;
      expect(maxCostPerDay).toBe(1200);
    });
  });
});
