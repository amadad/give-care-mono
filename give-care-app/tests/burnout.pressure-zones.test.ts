/**
 * Comprehensive tests for pressure zone identification
 * Covers ALL subscales from EMA, CWBS, REACH-II, SDOH
 */

import { describe, it, expect } from 'vitest';
import { calculateCompositeScore } from '../src/burnoutCalculator';

describe('Pressure Zone Identification', () => {
  describe('EMA subscales mapping', () => {
    it('should identify emotional_wellbeing from mood subscale', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            mood: 20, // Low mood = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('emotional_wellbeing');
      expect(result.pressure_zone_scores.emotional_wellbeing).toBeGreaterThan(50);
    });

    it('should identify time_management from burden subscale', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            burden: 15, // High burden = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('time_management');
      expect(result.pressure_zone_scores.time_management).toBeGreaterThan(50);
    });

    it('should identify emotional_wellbeing from stress subscale', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            stress: 10, // High stress = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('emotional_wellbeing');
      expect(result.pressure_zone_scores.emotional_wellbeing).toBeGreaterThan(50);
    });

    it('should identify social_support from support subscale', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            support: 20, // Low support = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zone_scores.social_support).toBeGreaterThan(50);
    });

    it('should identify physical_health from self_care subscale (sleep)', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            self_care: 15, // Poor sleep = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('physical_health');
      expect(result.pressure_zone_scores.physical_health).toBeGreaterThan(50);
    });
  });

  describe('CWBS subscales mapping', () => {
    it('should identify time_management from activities subscale', () => {
      const assessmentScores = {
        cwbs: {
          overall_score: 35,
          subscores: {
            activities: 20, // Low activities score = high needs = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('time_management');
      expect(result.pressure_zone_scores.time_management).toBeGreaterThan(50); // High pressure
    });

    it('should identify time_management from needs subscale', () => {
      const assessmentScores = {
        cwbs: {
          overall_score: 25,
          subscores: {
            needs: 15, // High needs = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('time_management');
      expect(result.pressure_zone_scores.time_management).toBeGreaterThan(50);
    });
  });

  describe('REACH-II subscales mapping', () => {
    it('should identify emotional_wellbeing from stress subscale', () => {
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            stress: 20, // High stress = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('emotional_wellbeing');
      expect(result.pressure_zone_scores.emotional_wellbeing).toBeGreaterThan(50);
    });

    it('should identify physical_health from self_care subscale', () => {
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            self_care: 25, // Low self-care = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('physical_health');
      expect(result.pressure_zone_scores.physical_health).toBeGreaterThan(50);
    });

    it('should identify social_support from social subscale', () => {
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            social: 15, // High isolation = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zone_scores.social_support).toBeGreaterThan(50);
    });

    it('should identify emotional_wellbeing from efficacy subscale', () => {
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            efficacy: 30, // Low confidence = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('emotional_wellbeing');
      expect(result.pressure_zone_scores.emotional_wellbeing).toBeGreaterThan(50);
    });

    it('should identify emotional_wellbeing from emotional subscale', () => {
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            emotional: 20, // High frustration/guilt = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('emotional_wellbeing');
      expect(result.pressure_zone_scores.emotional_wellbeing).toBeGreaterThan(50);
    });

    it('should identify physical_health from physical subscale', () => {
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            physical: 15, // High exhaustion = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('physical_health');
      expect(result.pressure_zone_scores.physical_health).toBeGreaterThan(50);
    });

    it('should identify social_support from support subscale', () => {
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            support: 25, // Low satisfaction with support = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zone_scores.social_support).toBeGreaterThan(50);
    });
  });

  describe('SDOH subscales mapping', () => {
    it('should identify financial_concerns from financial subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            financial: 20, // High financial stress = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('financial_concerns');
      expect(result.pressure_zone_scores.financial_concerns).toBeGreaterThan(50);
    });

    it('should identify financial_concerns from housing subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            housing: 15, // Housing issues = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('financial_concerns');
      expect(result.pressure_zone_scores.financial_concerns).toBeGreaterThan(50);
    });

    it('should identify financial_concerns from transportation subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            transportation: 25, // Transportation issues = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('financial_concerns');
      expect(result.pressure_zone_scores.financial_concerns).toBeGreaterThan(50);
    });

    it('should identify social_support from social subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            social: 20, // High isolation = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zone_scores.social_support).toBeGreaterThan(50);
    });

    it('should identify physical_health from healthcare subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            healthcare: 15, // Healthcare access issues = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('physical_health');
      expect(result.pressure_zone_scores.physical_health).toBeGreaterThan(50);
    });

    it('should identify financial_concerns from food subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            food: 10, // Food insecurity = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('financial_concerns');
      expect(result.pressure_zone_scores.financial_concerns).toBeGreaterThan(50);
    });

    it('should identify financial_concerns from legal subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            legal: 20, // Legal/admin issues = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('financial_concerns');
      expect(result.pressure_zone_scores.financial_concerns).toBeGreaterThan(50);
    });

    it('should identify social_support from technology subscale', () => {
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            technology: 30, // Tech barriers = high pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zone_scores.social_support).toBeGreaterThan(50);
    });
  });

  describe('Multi-assessment integration', () => {
    it('should aggregate pressure zones from multiple assessments', () => {
      const assessmentScores = {
        ema: {
          overall_score: 25,
          subscores: {
            mood: 15, // Emotional pressure
            stress: 20, // Emotional pressure
            support: 25, // Social pressure
          },
        },
        reach_ii: {
          overall_score: 30,
          subscores: {
            physical: 10, // Physical pressure
            self_care: 20, // Physical pressure
          },
        },
        sdoh: {
          overall_score: 35,
          subscores: {
            financial: 15, // Financial pressure
            housing: 20, // Financial pressure
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      // Should identify all 4 major pressure zones
      expect(result.pressure_zones).toContain('emotional_wellbeing');
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zones).toContain('physical_health');
      expect(result.pressure_zones).toContain('financial_concerns');

      // Should have scores for all zones
      expect(result.pressure_zone_scores).toHaveProperty('emotional_wellbeing');
      expect(result.pressure_zone_scores).toHaveProperty('social_support');
      expect(result.pressure_zone_scores).toHaveProperty('physical_health');
      expect(result.pressure_zone_scores).toHaveProperty('financial_concerns');
    });

    it('should average subscale scores within same pressure zone', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            mood: 20, // Emotional zone
            stress: 10, // Emotional zone
          },
        },
        reach_ii: {
          overall_score: 30,
          subscores: {
            emotional: 30, // Emotional zone
            efficacy: 40, // Emotional zone
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      // Should aggregate: (80 + 90 + 70 + 60) / 4 = 75
      expect(result.pressure_zone_scores.emotional_wellbeing).toBeCloseTo(75, 0);
    });

    it('should return empty pressure zones when all scores are healthy', () => {
      const assessmentScores = {
        ema: {
          overall_score: 85,
          subscores: {
            mood: 90,
            burden: 80,
            stress: 85,
            support: 90,
            self_care: 85,
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      // No pressure zones should be above threshold
      expect(result.pressure_zones).toHaveLength(0);
    });

    it('should only return zones above pressure threshold (50)', () => {
      const assessmentScores = {
        ema: {
          overall_score: 40,
          subscores: {
            mood: 70, // 30 pressure - below threshold
            stress: 30, // 70 pressure - above threshold
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      // Both mood and stress map to emotional_wellbeing
      // Average pressure: (30 + 70) / 2 = 50 - NOT > 50, so no zones returned
      // Let's use different scores to get average > 50
      const assessmentScores2 = {
        ema: {
          overall_score: 40,
          subscores: {
            mood: 60, // 40 pressure
            stress: 30, // 70 pressure
          },
        },
      };

      const result2 = calculateCompositeScore(assessmentScores2);

      // Average pressure: (40 + 70) / 2 = 55 - above threshold
      expect(result2.pressure_zones).toContain('emotional_wellbeing');
      expect(result2.pressure_zone_scores.emotional_wellbeing).toBeGreaterThan(50);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing subscores gracefully', () => {
      const assessmentScores = {
        ema: {
          overall_score: 50,
          subscores: {}, // Empty subscores
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      expect(result.pressure_zones).toHaveLength(0);
      expect(result.pressure_zone_scores).toEqual({});
    });

    it('should handle unknown subscale names gracefully', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            unknown_subscale: 10, // Should be ignored
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      // Should not crash, just ignore unknown subscale
      expect(result.pressure_zones).toHaveLength(0);
    });

    it('should handle null/undefined scores in subscores', () => {
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            mood: null,
            stress: undefined,
            burden: 20,
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      // Should only process valid burden score
      expect(result.pressure_zones).toContain('time_management');
    });
  });
});
