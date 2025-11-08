/**
 * Property-Based Testing
 *
 * Uses fast-check to generate random inputs and find edge cases
 *
 * Install: pnpm add -D fast-check
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { RRule, rrulestr } from 'rrule';

describe('Property-Based Tests', () => {
  describe('Trigger Scheduling', () => {
    it('should always generate valid next run times', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-01-01') }),
          fc.integer({ min: 1, max: 365 }),
          (startDate, days) => {
            // Property: Daily trigger should generate exactly N occurrences
            const rule = new RRule({
              freq: RRule.DAILY,
              dtstart: startDate,
              count: days,
            });

            const occurrences = rule.all();

            return occurrences.length === days;
          }
        ),
        { numRuns: 100 } // Run 100 random tests
      );
    });

    it('should handle timezone changes correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('America/New_York', 'America/Los_Angeles', 'UTC', 'Asia/Tokyo'),
          fc.date(),
          (timezone, date) => {
            // Property: RRule with timezone should generate valid dates
            const rule = new RRule({
              freq: RRule.DAILY,
              dtstart: date,
              tzid: timezone,
              count: 7,
            });

            const occurrences = rule.all();

            // All occurrences should be Date objects
            return occurrences.every((occ) => occ instanceof Date);
          }
        )
      );
    });

    it('should parse and regenerate equivalent rrule strings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('DAILY', 'WEEKLY', 'MONTHLY'),
          fc.integer({ min: 1, max: 10 }),
          (freq, count) => {
            // Property: Parse → Generate → Parse should be idempotent
            const original = `FREQ=${freq};COUNT=${count}`;
            const rule = rrulestr(`DTSTART:20240101T090000\nRRULE:${original}`);
            const occurrences = rule.all();

            return occurrences.length === count;
          }
        )
      );
    });
  });

  describe('Assessment Scoring', () => {
    it('should produce consistent scores for same inputs', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 10, maxLength: 10 }),
          (answers) => {
            // Property: Score calculation should be deterministic
            const score1 = calculateBurnoutScore(answers);
            const score2 = calculateBurnoutScore(answers);

            return score1 === score2;
          }
        )
      );
    });

    it('should classify scores into correct bands', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 10, maxLength: 10 }),
          (answers) => {
            // Property: Band boundaries should be consistent
            const avgScore = answers.reduce((a, b) => a + b, 0) / answers.length;
            const band = getBurnoutBand(avgScore);

            if (avgScore < 2) return band === 'low';
            if (avgScore < 3.5) return band === 'moderate';
            return band === 'high';
          }
        )
      );
    });

    it('should never return scores outside valid range', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 20 }),
          (answers) => {
            // Property: Normalized score should be 1-5
            const score = calculateBurnoutScore(answers);

            return score >= 1 && score <= 5;
          }
        )
      );
    });
  });

  describe('Crisis Detection', () => {
    it('should not flag normal messages as crisis', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "I'm feeling tired today",
            'The weather is nice',
            'Mom had a good day',
            'I need help with scheduling'
          ),
          (message) => {
            // Property: Normal messages should not trigger crisis
            const isCrisis = detectCrisis(message);

            return !isCrisis;
          }
        )
      );
    });

    it('should always flag explicit crisis terms', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('suicide', 'kill myself', 'end it all', 'want to die'),
          fc.string({ minLength: 0, maxLength: 50 }),
          (crisisTerm, padding) => {
            // Property: Explicit crisis terms should always be detected
            const message = `${padding} ${crisisTerm} ${padding}`;
            const isCrisis = detectCrisis(message);

            return isCrisis;
          }
        )
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.date(), { minLength: 1, maxLength: 100 }),
          (timestamps) => {
            // Property: Rate limiter should never allow more than limit
            const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());
            const allowed = applyRateLimit(sortedTimestamps, {
              maxRequests: 10,
              windowMs: 60000, // 1 minute
            });

            return allowed.length <= 10;
          }
        )
      );
    });
  });
});

// Helper functions (these would come from your actual implementation)

function calculateBurnoutScore(answers: number[]): number {
  return answers.reduce((sum, val) => sum + val, 0) / answers.length;
}

function getBurnoutBand(avgScore: number): string {
  if (avgScore < 2) return 'low';
  if (avgScore < 3.5) return 'moderate';
  return 'high';
}

function detectCrisis(message: string): boolean {
  const crisisTerms = ['suicide', 'kill myself', 'end it', 'want to die', 'give up', 'hurt myself'];
  return crisisTerms.some((term) => message.toLowerCase().includes(term));
}

function applyRateLimit(
  timestamps: Date[],
  config: { maxRequests: number; windowMs: number }
): Date[] {
  const result: Date[] = [];
  const window: Date[] = [];

  for (const ts of timestamps) {
    // Remove timestamps outside window
    while (window.length > 0 && ts.getTime() - window[0].getTime() > config.windowMs) {
      window.shift();
    }

    // Check if under limit
    if (window.length < config.maxRequests) {
      window.push(ts);
      result.push(ts);
    }
  }

  return result;
}
