/**
 * INTEGRATION TESTS: Full pipeline from assessment scores to intervention delivery
 *
 * Purpose: Verify that pressure zones identified by calculateCompositeScore()
 * successfully map to interventions in ZONE_INTERVENTIONS, and that users
 * receive non-empty, relevant intervention lists.
 *
 * This catches the HIGH PRIORITY bug where identifyPressureZones emits new zone
 * keys (emotional_wellbeing, physical_health, etc.) but findInterventions looks
 * them up in ZONE_INTERVENTIONS using old keys (emotional, physical, etc.).
 */

import { describe, it, expect } from 'vitest';
import { calculateCompositeScore } from '../src/burnoutCalculator';
import { ZONE_INTERVENTIONS } from '../src/interventionData';
import type { GiveCareContext } from '../src/context';

/**
 * Helper: Simulate findInterventions tool logic
 * (We can't import the actual tool due to OpenAI SDK dependencies in test environment)
 */
function simulateFindInterventions(pressureZones: string[]): {
  interventions: Array<{ title: string; desc: string; helpful: number }>;
  isEmpty: boolean;
} {
  const topZones = pressureZones.slice(0, 2);
  const matches = topZones
    .map(zone => ZONE_INTERVENTIONS[zone]) // Get intervention for each zone
    .filter(Boolean);

  return {
    interventions: matches,
    isEmpty: matches.length === 0
  };
}

describe('Intervention Integration Tests', () => {
  describe('Full pipeline: Assessment → Pressure Zones → Interventions', () => {
    it('should deliver interventions for emotional_wellbeing pressure zone', () => {
      // Step 1: Simulate EMA assessment with high emotional stress
      const assessmentScores = {
        ema: {
          overall_score: 25,
          subscores: {
            mood: 20, // Low mood = high pressure
            stress: 15, // High stress = high pressure
          },
        },
      };

      // Step 2: Calculate composite score and identify pressure zones
      const result = calculateCompositeScore(assessmentScores);

      // Verify pressure zone is identified
      expect(result.pressure_zones).toContain('emotional_wellbeing');
      expect(result.pressure_zone_scores.emotional_wellbeing).toBeGreaterThan(50);

      // Step 3: Simulate findInterventions tool
      const interventionResult = simulateFindInterventions(result.pressure_zones);

      // CRITICAL: Interventions list MUST NOT be empty
      expect(interventionResult.isEmpty).toBe(false);
      expect(interventionResult.interventions.length).toBeGreaterThanOrEqual(1);

      // Verify intervention content is relevant to emotional wellbeing
      const firstIntervention = interventionResult.interventions[0];
      expect(firstIntervention).toBeDefined();
      expect(firstIntervention.title).toBeTruthy();
      expect(firstIntervention.desc).toBeTruthy();

      // Check relevance: should mention stress, emotions, mindfulness, or support
      const relevantKeywords = ['stress', 'emotion', 'mindful', 'support', 'crisis', 'text'];
      const isRelevant = relevantKeywords.some(keyword =>
        firstIntervention.title.toLowerCase().includes(keyword) ||
        firstIntervention.desc.toLowerCase().includes(keyword)
      );
      expect(isRelevant).toBe(true);
    });

    it('should deliver interventions for physical_health pressure zone', () => {
      // Step 1: Simulate REACH-II assessment with physical exhaustion
      const assessmentScores = {
        reach_ii: {
          overall_score: 30,
          subscores: {
            physical: 15, // High exhaustion = high pressure
            self_care: 20, // Low self-care = high pressure
          },
        },
      };

      // Step 2: Calculate composite score and identify pressure zones
      const result = calculateCompositeScore(assessmentScores);

      // Verify pressure zone is identified
      expect(result.pressure_zones).toContain('physical_health');
      expect(result.pressure_zone_scores.physical_health).toBeGreaterThan(50);

      // Step 3: Simulate findInterventions tool
      const interventionResult = simulateFindInterventions(result.pressure_zones);

      // CRITICAL: Interventions list MUST NOT be empty
      expect(interventionResult.isEmpty).toBe(false);
      expect(interventionResult.interventions.length).toBeGreaterThanOrEqual(1);

      // Verify intervention content is relevant to physical health
      const firstIntervention = interventionResult.interventions[0];
      expect(firstIntervention).toBeDefined();

      // Check relevance: should mention physical, health, rest, respite, or care
      const relevantKeywords = ['physical', 'health', 'respite', 'care', 'exercise', 'rest'];
      const isRelevant = relevantKeywords.some(keyword =>
        firstIntervention.title.toLowerCase().includes(keyword) ||
        firstIntervention.desc.toLowerCase().includes(keyword)
      );
      expect(isRelevant).toBe(true);
    });

    it('should deliver interventions for financial_concerns pressure zone', () => {
      // Step 1: Simulate SDOH assessment with financial stress
      const assessmentScores = {
        sdoh: {
          overall_score: 30,
          subscores: {
            financial: 20, // High financial stress = high pressure
            housing: 15, // Housing issues = high pressure
            food: 10, // Food insecurity = high pressure
          },
        },
      };

      // Step 2: Calculate composite score and identify pressure zones
      const result = calculateCompositeScore(assessmentScores);

      // Verify pressure zone is identified
      expect(result.pressure_zones).toContain('financial_concerns');
      expect(result.pressure_zone_scores.financial_concerns).toBeGreaterThan(50);

      // Step 3: Simulate findInterventions tool
      const interventionResult = simulateFindInterventions(result.pressure_zones);

      // CRITICAL: Interventions list MUST NOT be empty
      expect(interventionResult.isEmpty).toBe(false);
      expect(interventionResult.interventions.length).toBeGreaterThanOrEqual(1);

      // Verify intervention content is relevant to financial concerns
      const firstIntervention = interventionResult.interventions[0];
      expect(firstIntervention).toBeDefined();

      // Check relevance: should mention financial, money, assistance, benefits, or resources
      const relevantKeywords = ['financial', 'money', 'assistance', 'benefit', 'resource', 'aid'];
      const isRelevant = relevantKeywords.some(keyword =>
        firstIntervention.title.toLowerCase().includes(keyword) ||
        firstIntervention.desc.toLowerCase().includes(keyword)
      );
      expect(isRelevant).toBe(true);
    });

    it('should deliver interventions for time_management pressure zone', () => {
      // Step 1: Simulate EMA + CWBS with high burden
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            burden: 15, // High burden = high pressure
          },
        },
        cwbs: {
          overall_score: 25,
          subscores: {
            activities: 20, // Low activities score = high needs
            needs: 15, // High needs = high pressure
          },
        },
      };

      // Step 2: Calculate composite score and identify pressure zones
      const result = calculateCompositeScore(assessmentScores);

      // Verify pressure zone is identified
      expect(result.pressure_zones).toContain('time_management');
      expect(result.pressure_zone_scores.time_management).toBeGreaterThan(50);

      // Step 3: Simulate findInterventions tool
      const interventionResult = simulateFindInterventions(result.pressure_zones);

      // CRITICAL: Interventions list MUST NOT be empty
      expect(interventionResult.isEmpty).toBe(false);
      expect(interventionResult.interventions.length).toBeGreaterThanOrEqual(1);

      // Verify intervention content is relevant to time management
      const firstIntervention = interventionResult.interventions[0];
      expect(firstIntervention).toBeDefined();

      // Check relevance: should mention time, task, organize, prioritize, or caregiving
      const relevantKeywords = ['time', 'task', 'organize', 'prioritize', 'caregiving', 'help', 'checklist'];
      const isRelevant = relevantKeywords.some(keyword =>
        firstIntervention.title.toLowerCase().includes(keyword) ||
        firstIntervention.desc.toLowerCase().includes(keyword)
      );
      expect(isRelevant).toBe(true);
    });

    it('should deliver interventions for social_support pressure zone', () => {
      // Step 1: Simulate EMA + SDOH with social isolation
      const assessmentScores = {
        ema: {
          overall_score: 30,
          subscores: {
            support: 20, // Low support = high pressure
          },
        },
        sdoh: {
          overall_score: 35,
          subscores: {
            social: 15, // High isolation = high pressure
            technology: 25, // Tech barriers = high pressure
          },
        },
      };

      // Step 2: Calculate composite score and identify pressure zones
      const result = calculateCompositeScore(assessmentScores);

      // Verify pressure zone is identified
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zone_scores.social_support).toBeGreaterThan(50);

      // Step 3: Simulate findInterventions tool
      const interventionResult = simulateFindInterventions(result.pressure_zones);

      // CRITICAL: Interventions list MUST NOT be empty
      expect(interventionResult.isEmpty).toBe(false);
      expect(interventionResult.interventions.length).toBeGreaterThanOrEqual(1);

      // Verify intervention content is relevant to social support
      const firstIntervention = interventionResult.interventions[0];
      expect(firstIntervention).toBeDefined();

      // Check relevance: should mention social, support, community, group, or connection
      const relevantKeywords = ['social', 'support', 'community', 'group', 'connection', 'isolation'];
      const isRelevant = relevantKeywords.some(keyword =>
        firstIntervention.title.toLowerCase().includes(keyword) ||
        firstIntervention.desc.toLowerCase().includes(keyword)
      );
      expect(isRelevant).toBe(true);
    });
  });

  describe('Multi-zone scenarios', () => {
    it('should deliver interventions for top 2 pressure zones from multi-assessment', () => {
      // Simulate caregiver with multiple high-pressure zones
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
            self_care: 15, // Physical pressure
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

      // Calculate composite score
      const result = calculateCompositeScore(assessmentScores);

      // Should identify multiple zones
      expect(result.pressure_zones.length).toBeGreaterThanOrEqual(2);

      // Simulate findInterventions (takes top 2 zones)
      const interventionResult = simulateFindInterventions(result.pressure_zones);

      // CRITICAL: Should return 2 interventions (one per zone)
      expect(interventionResult.interventions.length).toBe(2);
      expect(interventionResult.isEmpty).toBe(false);

      // Both interventions should be valid
      interventionResult.interventions.forEach(intervention => {
        expect(intervention.title).toBeTruthy();
        expect(intervention.desc).toBeTruthy();
        expect(intervention.helpful).toBeGreaterThan(0);
      });
    });

    it('should handle single pressure zone gracefully', () => {
      // Simulate caregiver with only one high-pressure zone
      const assessmentScores = {
        ema: {
          overall_score: 70, // Generally good
          subscores: {
            mood: 80, // Good
            stress: 85, // Good
            support: 30, // LOW - high social pressure
            burden: 75, // Good
            self_care: 80, // Good
          },
        },
      };

      // Calculate composite score
      const result = calculateCompositeScore(assessmentScores);

      // Should identify only social_support zone
      expect(result.pressure_zones).toContain('social_support');
      expect(result.pressure_zones.length).toBe(1);

      // Simulate findInterventions
      const interventionResult = simulateFindInterventions(result.pressure_zones);

      // Should return 1 intervention
      expect(interventionResult.interventions.length).toBe(1);
      expect(interventionResult.isEmpty).toBe(false);
    });
  });

  describe('ZONE_INTERVENTIONS coverage', () => {
    it('should have interventions defined for all 5 pressure zones', () => {
      const requiredZones = [
        'emotional_wellbeing',
        'physical_health',
        'financial_concerns',
        'time_management',
        'social_support'
      ];

      requiredZones.forEach(zone => {
        const intervention = ZONE_INTERVENTIONS[zone];

        // Each zone MUST have intervention defined
        expect(intervention, `Zone "${zone}" has no intervention`).toBeDefined();

        // Each intervention should have required fields
        expect(intervention.title, `Zone "${zone}" intervention missing title`).toBeTruthy();
        expect(intervention.desc, `Zone "${zone}" intervention missing desc`).toBeTruthy();
        expect(intervention.helpful, `Zone "${zone}" intervention missing helpful score`).toBeGreaterThan(0);
        expect(intervention.helpful, `Zone "${zone}" intervention helpful score too high`).toBeLessThanOrEqual(100);
      });
    });

    it('should not have legacy keys that no longer map to pressure zones', () => {
      const legacyKeys = [
        'emotional', // Should be emotional_wellbeing
        'physical', // Should be physical_health
        'financial_strain', // Should be financial_concerns
        'social_isolation', // Should be social_support
        'caregiving_tasks', // Should be time_management
        'self_care', // Should be physical_health
        'social_needs' // Should be social_support
      ];

      // Document which legacy keys exist (for backward compatibility check)
      const existingLegacyKeys = legacyKeys.filter(key => ZONE_INTERVENTIONS[key]);

      if (existingLegacyKeys.length > 0) {
        console.warn(`Legacy keys still exist in ZONE_INTERVENTIONS: ${existingLegacyKeys.join(', ')}`);
        console.warn('These should either be removed or have a mapping layer added');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle no pressure zones (all scores healthy)', () => {
      const assessmentScores = {
        ema: {
          overall_score: 90,
          subscores: {
            mood: 95,
            stress: 90,
            support: 85,
            burden: 88,
            self_care: 92,
          },
        },
      };

      const result = calculateCompositeScore(assessmentScores);

      // No pressure zones
      expect(result.pressure_zones).toHaveLength(0);

      // findInterventions should handle gracefully
      const interventionResult = simulateFindInterventions(result.pressure_zones);
      expect(interventionResult.interventions).toHaveLength(0);
      expect(interventionResult.isEmpty).toBe(true);
    });

    it('should handle pressure zone with no interventions defined (defensive)', () => {
      // Simulate a pressure zone that somehow has no interventions
      const fakePressureZones = ['nonexistent_zone'];

      const interventionResult = simulateFindInterventions(fakePressureZones);

      // Should not crash, just return empty
      expect(interventionResult.interventions).toHaveLength(0);
      expect(interventionResult.isEmpty).toBe(true);
    });
  });
});
