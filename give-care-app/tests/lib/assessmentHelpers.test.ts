import { describe, it, expect } from 'vitest';
import {
  toAssessmentAnswers,
  assessmentAnswersToArray,
  isValidAnswerValue,
  normalizeAnswerValue,
} from '../../convex/lib/assessmentHelpers';

describe('Assessment Helpers', () => {
  describe('toAssessmentAnswers', () => {
    it('converts session answers correctly', () => {
      const sessionAnswers = [
        { questionId: '0', value: 3 },
        { questionId: '1', value: 4 },
        { questionId: '2', value: 2 },
      ];
      
      const result = toAssessmentAnswers(sessionAnswers as any);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ questionIndex: 0, value: 3 });
      expect(result[1]).toEqual({ questionIndex: 1, value: 4 });
      expect(result[2]).toEqual({ questionIndex: 2, value: 2 });
    });

    it('handles non-numeric questionIds', () => {
      const sessionAnswers = [
        { questionId: 'invalid', value: 3 },
        { questionId: 'also-invalid', value: 4 },
      ];
      
      const result = toAssessmentAnswers(sessionAnswers as any);
      
      expect(result[0].questionIndex).toBe(0);
      expect(result[1].questionIndex).toBe(1);
    });
  });

  describe('assessmentAnswersToArray', () => {
    it('converts assessment answers correctly', () => {
      const assessmentAnswers = [
        { questionId: '0', value: 3 },
        { questionId: '1', value: 4 },
      ];
      
      const result = assessmentAnswersToArray(assessmentAnswers as any);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ questionIndex: 0, value: 3 });
      expect(result[1]).toEqual({ questionIndex: 1, value: 4 });
    });
  });

  describe('isValidAnswerValue', () => {
    it('returns true for valid values (1-5)', () => {
      expect(isValidAnswerValue(1)).toBe(true);
      expect(isValidAnswerValue(3)).toBe(true);
      expect(isValidAnswerValue(5)).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isValidAnswerValue(0)).toBe(false);
      expect(isValidAnswerValue(6)).toBe(false);
      expect(isValidAnswerValue(-1)).toBe(false);
      expect(isValidAnswerValue(NaN)).toBe(false);
      expect(isValidAnswerValue(Infinity)).toBe(false);
    });
  });

  describe('normalizeAnswerValue', () => {
    it('clamps values to 1-5 range', () => {
      expect(normalizeAnswerValue(0)).toBe(1);
      expect(normalizeAnswerValue(6)).toBe(5);
      expect(normalizeAnswerValue(10)).toBe(5);
      expect(normalizeAnswerValue(-5)).toBe(1);
    });

    it('rounds decimal values', () => {
      expect(normalizeAnswerValue(2.3)).toBe(2);
      expect(normalizeAnswerValue(2.7)).toBe(3);
      expect(normalizeAnswerValue(4.5)).toBe(5);
    });

    it('preserves valid values', () => {
      expect(normalizeAnswerValue(1)).toBe(1);
      expect(normalizeAnswerValue(3)).toBe(3);
      expect(normalizeAnswerValue(5)).toBe(5);
    });
  });
});

