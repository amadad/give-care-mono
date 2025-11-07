/**
 * Tests for Division-by-Zero Fix in calculateAssessmentScore
 *
 * ISSUE: When all questions are skipped/omitted, calculateAssessmentScore
 * divides by zero (values.length === 0), producing NaN.
 *
 * This test suite verifies the fix handles edge cases correctly:
 * 1. All questions skipped → return explicit status (not NaN)
 * 2. Partial responses → calculate score from available data
 * 3. Single response → valid score
 * 4. Test for each assessment type (EMA, CWBS, REACH-II, SDOH)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAssessmentScore,
  getAssessmentDefinition,
  EMA_DEFINITION,
  CWBS_DEFINITION,
  REACH_II_DEFINITION,
  SDOH_DEFINITION,
  type AssessmentScore
} from '../src/assessmentTools';
import { calculateCompositeScore } from '../src/burnoutCalculator';

describe('Division-by-Zero Fix: calculateAssessmentScore', () => {
  describe('Edge Case: All Questions Skipped', () => {
    it('EMA: should NOT return NaN when all questions are SKIPPED', () => {
      const allSkippedResponses: Record<string, string> = {};
      EMA_DEFINITION.questions.forEach((q) => {
        allSkippedResponses[q.id] = 'SKIPPED';
      });

      const result = calculateAssessmentScore('ema', allSkippedResponses);

      // Primary assertion: Must not be NaN
      expect(result.overall_score).not.toBeNaN();

      // Should return null to indicate insufficient data
      expect(result.overall_score).toBeNull();

      // Subscores should be empty object
      expect(result.subscores).toEqual({});

      // Band should be null (cannot determine band without data)
      expect(result.band).toBeUndefined();
    });

    it('CWBS: should NOT return NaN when all questions are SKIPPED', () => {
      const allSkippedResponses: Record<string, string> = {};
      CWBS_DEFINITION.questions.forEach((q) => {
        allSkippedResponses[q.id] = 'SKIPPED';
      });

      const result = calculateAssessmentScore('cwbs', allSkippedResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeNull();
      expect(result.subscores).toEqual({});
      expect(result.band).toBeUndefined();
    });

    it('REACH-II: should NOT return NaN when all questions are SKIPPED', () => {
      const allSkippedResponses: Record<string, string> = {};
      REACH_II_DEFINITION.questions.forEach((q) => {
        allSkippedResponses[q.id] = 'SKIPPED';
      });

      const result = calculateAssessmentScore('reach_ii', allSkippedResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeNull();
      expect(result.subscores).toEqual({});
      expect(result.band).toBeUndefined();
    });

    it('SDOH: should NOT return NaN when all questions are SKIPPED', () => {
      const allSkippedResponses: Record<string, string> = {};
      SDOH_DEFINITION.questions.forEach((q) => {
        allSkippedResponses[q.id] = 'SKIPPED';
      });

      const result = calculateAssessmentScore('sdoh', allSkippedResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeNull();
      expect(result.subscores).toEqual({});
      expect(result.band).toBeUndefined();
    });
  });

  describe('Edge Case: Completely Empty Responses Object', () => {
    it('EMA: should NOT return NaN when responses object is empty', () => {
      const emptyResponses: Record<string, string | number> = {};

      const result = calculateAssessmentScore('ema', emptyResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeNull();
      expect(result.subscores).toEqual({});
      expect(result.band).toBeUndefined();
    });

    it('CWBS: should NOT return NaN when responses object is empty', () => {
      const emptyResponses: Record<string, string | number> = {};

      const result = calculateAssessmentScore('cwbs', emptyResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeNull();
      expect(result.subscores).toEqual({});
      expect(result.band).toBeUndefined();
    });

    it('REACH-II: should NOT return NaN when responses object is empty', () => {
      const emptyResponses: Record<string, string | number> = {};

      const result = calculateAssessmentScore('reach_ii', emptyResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeNull();
      expect(result.subscores).toEqual({});
      expect(result.band).toBeUndefined();
    });

    it('SDOH: should NOT return NaN when responses object is empty', () => {
      const emptyResponses: Record<string, string | number> = {};

      const result = calculateAssessmentScore('sdoh', emptyResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeNull();
      expect(result.subscores).toEqual({});
      expect(result.band).toBeUndefined();
    });
  });

  describe('Edge Case: Single Valid Response', () => {
    it('EMA: should calculate valid score from single response', () => {
      const singleResponse: Record<string, number> = {
        ema_1: 3  // Only answer first question
      };

      const result = calculateAssessmentScore('ema', singleResponse);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });

    it('CWBS: should calculate valid score from single response', () => {
      const singleResponse: Record<string, number> = {
        cwbs_1: 3
      };

      const result = calculateAssessmentScore('cwbs', singleResponse);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });

    it('REACH-II: should calculate valid score from single response', () => {
      const singleResponse: Record<string, number> = {
        reach_1: 4
      };

      const result = calculateAssessmentScore('reach_ii', singleResponse);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });

    it('SDOH: should calculate valid score from single boolean response', () => {
      const singleResponse: Record<string, string> = {
        sdoh_1: 'true'
      };

      const result = calculateAssessmentScore('sdoh', singleResponse);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });
  });

  describe('Edge Case: Partial Responses (Mix of Valid and Skipped)', () => {
    it('EMA: should calculate valid score from partial responses', () => {
      const partialResponses: Record<string, string | number> = {};
      EMA_DEFINITION.questions.forEach((q, idx) => {
        // First 2 questions valid, rest skipped
        partialResponses[q.id] = idx < 2 ? 3 : 'SKIPPED';
      });

      const result = calculateAssessmentScore('ema', partialResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });

    it('CWBS: should calculate valid score from partial responses', () => {
      const partialResponses: Record<string, string | number> = {};
      CWBS_DEFINITION.questions.forEach((q, idx) => {
        partialResponses[q.id] = idx < 3 ? 2 : 'SKIPPED';
      });

      const result = calculateAssessmentScore('cwbs', partialResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });

    it('REACH-II: should calculate valid score from partial responses', () => {
      const partialResponses: Record<string, string | number> = {};
      REACH_II_DEFINITION.questions.forEach((q, idx) => {
        partialResponses[q.id] = idx < 4 ? 3 : 'SKIPPED';
      });

      const result = calculateAssessmentScore('reach_ii', partialResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });

    it('SDOH: should calculate valid score from partial boolean responses', () => {
      const partialResponses: Record<string, string> = {};
      SDOH_DEFINITION.questions.forEach((q, idx) => {
        partialResponses[q.id] = idx < 5 ? 'false' : 'SKIPPED';
      });

      const result = calculateAssessmentScore('sdoh', partialResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(Object.keys(result.subscores).length).toBeGreaterThan(0);
      expect(result.band).toBeDefined();
    });
  });

  describe('Integration: Burnout Calculator with Null Scores', () => {
    it('should handle null overall_score from empty EMA responses', () => {
      const emptyResponses: Record<string, string> = {};
      const emptyScore = calculateAssessmentScore('ema', emptyResponses);

      // Verify empty score has null
      expect(emptyScore.overall_score).toBeNull();

      // Should not crash when passed to burnout calculator
      const assessmentScores = {
        ema: emptyScore
      };

      const result = calculateCompositeScore(assessmentScores, []);

      // Should handle gracefully - return default/neutral score
      expect(result).toBeDefined();
      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);

      // Confidence should be 0 or very low (no valid data)
      expect(result.confidence).toBeDefined();
      expect(result.confidence).not.toBeNaN();
      expect(result.confidence).toBeLessThanOrEqual(0.1); // Nearly zero confidence
    });

    it('should handle mix of null and valid assessment scores', () => {
      // Valid EMA
      const validEmaResponses: Record<string, number> = {};
      EMA_DEFINITION.questions.forEach((q) => {
        validEmaResponses[q.id] = 3;
      });
      const validEmaScore = calculateAssessmentScore('ema', validEmaResponses);

      // Empty CWBS
      const emptyCwbsResponses: Record<string, string> = {};
      const emptyCwbsScore = calculateAssessmentScore('cwbs', emptyCwbsResponses);

      expect(validEmaScore.overall_score).not.toBeNull();
      expect(emptyCwbsScore.overall_score).toBeNull();

      const assessmentScores = {
        ema: validEmaScore,
        cwbs: emptyCwbsScore
      };

      const result = calculateCompositeScore(assessmentScores, []);

      // Should calculate based on valid EMA only, ignore null CWBS
      expect(result).toBeDefined();
      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);

      // Confidence should be less than 1.0 (only EMA contributed)
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.confidence).toBeGreaterThan(0.0);
    });

    it('should return default score when ALL assessments have null scores', () => {
      const emptyEma = calculateAssessmentScore('ema', {});
      const emptyCwbs = calculateAssessmentScore('cwbs', {});
      const emptyReach = calculateAssessmentScore('reach_ii', {});

      expect(emptyEma.overall_score).toBeNull();
      expect(emptyCwbs.overall_score).toBeNull();
      expect(emptyReach.overall_score).toBeNull();

      const assessmentScores = {
        ema: emptyEma,
        cwbs: emptyCwbs,
        reach_ii: emptyReach
      };

      const result = calculateCompositeScore(assessmentScores, []);

      // Should return default/neutral score (50.0 per burnoutCalculator.ts line 83)
      expect(result).toBeDefined();
      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).toBe(50.0);

      // Confidence should be 0 (no data)
      expect(result.confidence).toBe(0);
    });
  });

  describe('Type Safety: AssessmentScore Return Type', () => {
    it('should allow null for overall_score in AssessmentScore type', () => {
      const emptyResult = calculateAssessmentScore('ema', {});

      // TypeScript should allow this assignment
      const score: number | null = emptyResult.overall_score;

      expect(score).toBeNull();
    });

    it('should allow undefined for band when no data', () => {
      const emptyResult = calculateAssessmentScore('ema', {});

      // TypeScript should allow undefined band
      const band: AssessmentScore['band'] = emptyResult.band;

      expect(band).toBeUndefined();
    });
  });

  describe('Regression: Ensure Valid Responses Still Work', () => {
    it('EMA: full valid responses should calculate correctly', () => {
      const fullResponses: Record<string, number> = {};
      EMA_DEFINITION.questions.forEach((q) => {
        fullResponses[q.id] = 3;
      });

      const result = calculateAssessmentScore('ema', fullResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).not.toBeNull();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(result.band).toBeDefined();
      expect(['crisis', 'high', 'moderate', 'mild', 'thriving']).toContain(result.band);
    });

    it('CWBS: full valid responses should calculate correctly', () => {
      const fullResponses: Record<string, number> = {};
      CWBS_DEFINITION.questions.forEach((q) => {
        fullResponses[q.id] = 4;
      });

      const result = calculateAssessmentScore('cwbs', fullResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).not.toBeNull();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(result.band).toBeDefined();
    });

    it('REACH-II: full valid responses should calculate correctly', () => {
      const fullResponses: Record<string, number> = {};
      REACH_II_DEFINITION.questions.forEach((q) => {
        fullResponses[q.id] = 2;
      });

      const result = calculateAssessmentScore('reach_ii', fullResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).not.toBeNull();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(result.band).toBeDefined();
    });

    it('SDOH: full valid boolean responses should calculate correctly', () => {
      const fullResponses: Record<string, string> = {};
      SDOH_DEFINITION.questions.forEach((q) => {
        fullResponses[q.id] = 'false';
      });

      const result = calculateAssessmentScore('sdoh', fullResponses);

      expect(result.overall_score).not.toBeNaN();
      expect(result.overall_score).not.toBeNull();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
      expect(result.band).toBeDefined();
    });
  });
});
