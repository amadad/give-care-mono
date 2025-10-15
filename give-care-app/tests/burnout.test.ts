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
    /**
     * Test: Crisis band (score < 20)
     * A caregiver scoring 10 is highly distressed → should be 'crisis'
     */
    it('should classify score 10 as CRISIS (not thriving)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 10,
        subscores: {},
        band: 'crisis',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(10);
      expect(result.band).toBe('crisis');
    });

    it('should classify score 15 as CRISIS', () => {
      const mockScore: AssessmentScore = {
        overall_score: 15,
        subscores: {},
        band: 'crisis',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(15);
      expect(result.band).toBe('crisis');
    });

    /**
     * Test: High band (20 <= score < 40)
     * Significant burnout but not crisis level
     */
    it('should classify score 20 as HIGH (boundary)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 20,
        subscores: {},
        band: 'high',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(20);
      expect(result.band).toBe('high');
    });

    it('should classify score 30 as HIGH', () => {
      const mockScore: AssessmentScore = {
        overall_score: 30,
        subscores: {},
        band: 'high',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(30);
      expect(result.band).toBe('high');
    });

    /**
     * Test: Moderate band (40 <= score < 60)
     * Mid-range burnout - common for caregivers
     */
    it('should classify score 40 as MODERATE (boundary)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 40,
        subscores: {},
        band: 'moderate',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(40);
      expect(result.band).toBe('moderate');
    });

    it('should classify score 50 as MODERATE', () => {
      const mockScore: AssessmentScore = {
        overall_score: 50,
        subscores: {},
        band: 'moderate',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(50);
      expect(result.band).toBe('moderate');
    });

    /**
     * Test: Mild band (60 <= score < 80)
     * Low burnout - managing well
     */
    it('should classify score 60 as MILD (boundary)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 60,
        subscores: {},
        band: 'mild',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(60);
      expect(result.band).toBe('mild');
    });

    it('should classify score 70 as MILD', () => {
      const mockScore: AssessmentScore = {
        overall_score: 70,
        subscores: {},
        band: 'mild',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(70);
      expect(result.band).toBe('mild');
    });

    /**
     * Test: Thriving band (score >= 80)
     * A caregiver scoring 90 is doing well → should be 'thriving'
     */
    it('should classify score 80 as THRIVING (boundary, not crisis)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 80,
        subscores: {},
        band: 'thriving',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(80);
      expect(result.band).toBe('thriving');
    });

    it('should classify score 90 as THRIVING (not crisis)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 90,
        subscores: {},
        band: 'thriving',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(90);
      expect(result.band).toBe('thriving');
    });

    it('should classify score 100 as THRIVING (perfect score, not crisis)', () => {
      const mockScore: AssessmentScore = {
        overall_score: 100,
        subscores: {},
        band: 'thriving',
        calculated_at: new Date(),
      };

      const result = calculateCompositeScore({ ema: mockScore }, []);

      expect(result.overall_score).toBe(100);
      expect(result.band).toBe('thriving');
    });
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
