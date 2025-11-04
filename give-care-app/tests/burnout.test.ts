/**
 * Tests for Burnout Band Calculation Bug Fix
 *
 * BUG: The burnout band calculation was inverted in src/burnoutCalculator.ts
 *
 * CORRECT interpretation (from src/assessmentTools.ts:575-581):
 * - Higher score (80-100) = less burnout = 'thriving'
 * - Lower score (0-20) = more burnout = 'crisis'
 *
 * INCORRECT implementation (src/burnoutCalculator.ts:142-148):
 * - score < 20 → 'thriving' ❌ (should be 'crisis')
 * - score >= 65 → 'crisis' ❌ (should be 'thriving')
 *
 * These tests verify the correct band thresholds after the fix.
 */

import { describe, it, expect } from 'vitest';
import { calculateCompositeScore } from '../src/burnoutCalculator';
import type { AssessmentScore } from '../src/assessmentTools';

describe('Burnout Band Calculation (Bug Fix)', () => {
  describe('Band Threshold Validation', () => {
    // Test data: [score, expected_band, description]
    const bandTestCases: Array<[number, string, string]> = [
      [10, 'crisis', 'highly distressed'],
      [15, 'crisis', 'crisis boundary'],
      [20, 'high', 'high boundary'],
      [30, 'high', 'significant burnout'],
      [40, 'moderate', 'moderate boundary'],
      [50, 'moderate', 'mid-range burnout'],
      [60, 'mild', 'mild boundary'],
      [70, 'mild', 'managing well'],
      [80, 'thriving', 'thriving boundary'],
      [90, 'thriving', 'doing well'],
      [100, 'thriving', 'perfect score']
    ]

    bandTestCases.forEach(([score, band, description]) => {
      it(`should classify score ${score} as ${band.toUpperCase()} (${description})`, () => {
        const mockScore: AssessmentScore = {
          overall_score: score,
          subscores: {},
          band: band as any,
          calculated_at: new Date(),
        }

        const result = calculateCompositeScore({ ema: mockScore }, [])

        expect(result.overall_score).toBe(score)
        expect(result.band).toBe(band)
      })
    })
  });

  describe('Scale Direction Validation', () => {
    /**
     * Verify that the scale works correctly:
     * Lower scores = more burnout/distress
     * Higher scores = less burnout/healthier
     */
    it('should show that lower scores indicate worse burnout', () => {
      const lowScore: AssessmentScore = {
        overall_score: 10,
        subscores: {},
        band: 'crisis',
        calculated_at: new Date(),
      };

      const highScore: AssessmentScore = {
        overall_score: 90,
        subscores: {},
        band: 'thriving',
        calculated_at: new Date(),
      };

      const lowResult = calculateCompositeScore({ ema: lowScore }, []);
      const highResult = calculateCompositeScore({ ema: highScore }, []);

      // Lower score should be WORSE (crisis)
      expect(lowResult.band).toBe('crisis');
      // Higher score should be BETTER (thriving)
      expect(highResult.band).toBe('thriving');
    });

    it('should maintain band order from worst to best', () => {
      const testCases = [
        { score: 10, expectedBand: 'crisis' },
        { score: 25, expectedBand: 'high' },
        { score: 45, expectedBand: 'moderate' },
        { score: 65, expectedBand: 'mild' },
        { score: 85, expectedBand: 'thriving' },
      ];

      testCases.forEach(({ score, expectedBand }) => {
        const mockScore: AssessmentScore = {
          overall_score: score,
          subscores: {},
          band: expectedBand as AssessmentScore['band'],
          calculated_at: new Date(),
        };

        const result = calculateCompositeScore({ ema: mockScore }, []);

        expect(result.band).toBe(expectedBand);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary score 19.9 as CRISIS', () => {
      const mockScore: AssessmentScore = {
        overall_score: 19.9,
        subscores: {},
        band: 'crisis',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(19.9);
      expect(result.band).toBe('crisis');
    });

    it('should handle boundary score 39.9 as HIGH', () => {
      const mockScore: AssessmentScore = {
        overall_score: 39.9,
        subscores: {},
        band: 'high',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(39.9);
      expect(result.band).toBe('high');
    });

    it('should handle boundary score 59.9 as MODERATE', () => {
      const mockScore: AssessmentScore = {
        overall_score: 59.9,
        subscores: {},
        band: 'moderate',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(59.9);
      expect(result.band).toBe('moderate');
    });

    it('should handle boundary score 79.9 as MILD', () => {
      const mockScore: AssessmentScore = {
        overall_score: 79.9,
        subscores: {},
        band: 'mild',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(79.9);
      expect(result.band).toBe('mild');
    });

    it('should handle score 0 as CRISIS', () => {
      const mockScore: AssessmentScore = {
        overall_score: 0,
        subscores: {},
        band: 'crisis',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(0);
      expect(result.band).toBe('crisis');
    });
  });

  describe('Regression Prevention', () => {
    /**
     * These tests would have FAILED with the old (buggy) implementation
     * They prevent regression to the inverted scale
     */
    it('REGRESSION: score 10 must be crisis (was incorrectly thriving)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 10,
        subscores: {},
        band: 'crisis',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      // OLD BUG: score < 20 returned 'thriving' ❌
      // NEW FIX: score < 20 returns 'crisis' ✅
      expect(result.band).not.toBe('thriving');
      expect(result.band).toBe('crisis');
    });

    it('REGRESSION: score 90 must be thriving (was incorrectly crisis)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 90,
        subscores: {},
        band: 'thriving',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      // OLD BUG: score >= 65 returned 'crisis' ❌
      // NEW FIX: score >= 80 returns 'thriving' ✅
      expect(result.band).not.toBe('crisis');
      expect(result.band).toBe('thriving');
    });

    it('REGRESSION: score 30 must be high (not mild or thriving)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 30,
        subscores: {},
        band: 'high',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      // OLD BUG: score < 35 returned 'mild' ❌
      // NEW FIX: score 20-39 returns 'high' ✅
      expect(result.band).not.toBe('mild');
      expect(result.band).not.toBe('thriving');
      expect(result.band).toBe('high');
    });
  });
});
