/**
 * Regression test for empty string scoring bug
 * 
 * Bug: Empty string '' coerces to 0 via Number(''), causing scores >100
 * for reverse-scored Likert items.
 * 
 * Example: For a 1-5 scale reverse-scored question:
 * - User sends empty string ''
 * - Number('') = 0
 * - Reverse score: (5+1-0) = 6
 * - Normalize: (6-1)/(5-1)*100 = 125 (INVALID - exceeds 0-100 range!)
 * 
 * Fix: Treat empty/whitespace strings the same as SKIPPED (return null)
 */

import { describe, it, expect } from 'vitest';
import { calculateQuestionScore } from '../src/assessmentTools';
import type { AssessmentQuestion } from '../src/assessmentTools';

describe('Empty String Regression Test', () => {
  const reverseScored5Point: AssessmentQuestion = {
    id: 'test_reverse',
    text: 'How stressed do you feel? (1=not at all, 5=extremely)',
    type: 'likert',
    scale: 5,
    subscale: 'stress',
    reverse_score: true, // Higher response = more stress, but we want lower score
  };

  it('should return null for empty string (not 0)', () => {
    const score = calculateQuestionScore(reverseScored5Point, '');
    expect(score).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    const score = calculateQuestionScore(reverseScored5Point, '   ');
    expect(score).toBeNull();
  });

  it('should return null for tab/newline strings', () => {
    expect(calculateQuestionScore(reverseScored5Point, '\t')).toBeNull();
    expect(calculateQuestionScore(reverseScored5Point, '\n')).toBeNull();
    expect(calculateQuestionScore(reverseScored5Point, '  \t\n  ')).toBeNull();
  });

  it('should handle valid numeric strings correctly (not affected by fix)', () => {
    // Valid response "1" should still work
    const score1 = calculateQuestionScore(reverseScored5Point, '1');
    expect(score1).toBe(100); // Reverse: (5+1-1)/(5-1)*100 = 100
    
    // Valid response "5" should still work
    const score5 = calculateQuestionScore(reverseScored5Point, '5');
    expect(score5).toBe(0); // Reverse: (5+1-5)/(5-1)*100 = 0
  });

  it('should prevent scores >100 for reverse-scored items', () => {
    // The bug would have produced 125 for empty string
    // Now it should return null
    const score = calculateQuestionScore(reverseScored5Point, '');
    expect(score).toBeNull();
    
    // Verify no score can exceed 100
    const validResponses = ['1', '2', '3', '4', '5'];
    for (const response of validResponses) {
      const s = calculateQuestionScore(reverseScored5Point, response);
      expect(s).not.toBeNull();
      expect(s).toBeLessThanOrEqual(100);
      expect(s).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle normal (non-reverse-scored) items with empty string', () => {
    const normalScored: AssessmentQuestion = {
      id: 'test_normal',
      text: 'How are you feeling? (1=very low, 5=great)',
      type: 'likert',
      scale: 5,
      subscale: 'mood',
      reverse_score: false,
    };

    // Empty string should also return null for normal scoring
    expect(calculateQuestionScore(normalScored, '')).toBeNull();
    expect(calculateQuestionScore(normalScored, '  ')).toBeNull();
  });
});
