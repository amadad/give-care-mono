/**
 * Tests for Code Review Fixes (Phase 1: Type Safety & Dead Code)
 *
 * These tests verify fixes for HIGH priority issues identified in code review:
 * 1. Unsafe type assertions (tools.ts:373,455,522 and agents.ts:116)
 * 2. Missing input validation (assessmentTools.ts:526 - NaN bugs)
 * 3. Dead deprecated function (safety.ts:338-354 - detectCrisis)
 * 4. Unused intervention data (interventionData.ts - 75% unused array items)
 * 5. Dead exports (index.ts - unused agent/tool exports)
 */

import { describe, it, expect } from 'vitest';
import { getConvexClient } from '../src/tools';
import { calculateAssessmentScore } from '../src/assessmentTools';
import * as safety from '../src/safety';
import { ZONE_INTERVENTIONS } from '../src/interventionData';
import * as index from '../index';

describe('Code Review Fixes - Phase 1', () => {
  describe('1. Type-safe getConvexClient helper', () => {
    /**
     * Test: getConvexClient should return null for invalid context
     * This replaces unsafe (runContext as any)?.convexClient pattern
     */
    it('should return null when runContext is undefined', () => {
      const result = getConvexClient(undefined);
      expect(result).toBeNull();
    });

    it('should return null when runContext.convexClient is undefined', () => {
      const mockContext = {};
      const result = getConvexClient(mockContext);
      expect(result).toBeNull();
    });

    it('should return convexClient when present', () => {
      const mockClient = { query: async () => {}, mutation: async () => {} };
      const mockContext = { convexClient: mockClient };
      const result = getConvexClient(mockContext);
      expect(result).toBe(mockClient);
    });
  });

  describe('2. Input validation for likert scores', () => {
    /**
     * Test: calculateAssessmentScore should reject invalid likert responses
     * Prevents NaN bugs from Number("abc") returning NaN
     */
    it('should reject non-numeric likert response "abc"', () => {
      const responses = {
        'ema_1': 'abc', // Invalid string that Number() converts to NaN
      };

      const result = calculateAssessmentScore('ema', responses);

      // Should detect validation error - score should be 0 or handle gracefully
      expect(Number.isNaN(result.overall_score)).toBe(false);
    });

    it('should reject empty string likert response', () => {
      const responses = {
        'cwbs_1': '', // Empty string
      };

      const result = calculateAssessmentScore('cwbs', responses);
      expect(Number.isNaN(result.overall_score)).toBe(false);
    });

    it('should accept valid numeric string "5"', () => {
      const responses = {
        'ema_1': '5', // Valid
        'ema_2': '4',
        'ema_3': '3',
        'ema_4': '4',
        'ema_5': '5',
      };

      const result = calculateAssessmentScore('ema', responses);
      expect(result.overall_score).toBeGreaterThan(0);
      expect(Number.isNaN(result.overall_score)).toBe(false);
    });
  });

  describe('3. Deprecated detectCrisis removed', () => {
    /**
     * Test: detectCrisis should no longer be exported
     * The deprecated function at safety.ts:338-354 should be removed
     */
    it('should not export detectCrisis from safety module', () => {
      expect((safety as any).detectCrisis).toBeUndefined();
    });

    it('should not export detectCrisis from main index', () => {
      expect((index as any).detectCrisis).toBeUndefined();
    });
  });

  describe('4. ZONE_INTERVENTIONS returns single Intervention', () => {
    /**
     * Test: ZONE_INTERVENTIONS should map to single object, not array
     * Currently 75% of array items (indices 1-3) are never accessed
     */
    it('should return single Intervention object for emotional_wellbeing', () => {
      const intervention = ZONE_INTERVENTIONS.emotional_wellbeing;

      // Should be single object
      expect(intervention).toBeDefined();
      expect(Array.isArray(intervention)).toBe(false);
      expect(intervention).toHaveProperty('title');
      expect(intervention).toHaveProperty('desc');
      expect(intervention).toHaveProperty('helpful');
    });

    it('should return single Intervention for all 5 zones', () => {
      const zones = ['emotional_wellbeing', 'physical_health', 'financial_concerns', 'time_management', 'social_support'];

      zones.forEach(zone => {
        const intervention = ZONE_INTERVENTIONS[zone as keyof typeof ZONE_INTERVENTIONS];
        expect(intervention).toBeDefined();
        expect(Array.isArray(intervention)).toBe(false);
        expect(typeof intervention).toBe('object');
      });
    });

    it('should have valid structure for each zone intervention', () => {
      const zones = Object.keys(ZONE_INTERVENTIONS);

      zones.forEach(zone => {
        const intervention = ZONE_INTERVENTIONS[zone as keyof typeof ZONE_INTERVENTIONS];
        expect(intervention.title).toBeTruthy();
        expect(intervention.desc).toBeTruthy();
        expect(intervention.helpful).toBeGreaterThan(0);
        expect(intervention.helpful).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('5. Dead exports removed from index.ts', () => {
    /**
     * Test: Unused agent and tool exports should be removed
     * These are never imported by other modules in the codebase
     */
    it('should not export crisisAgent (unused)', () => {
      expect((index as any).crisisAgent).toBeUndefined();
    });

    it('should not export assessmentAgent (unused)', () => {
      expect((index as any).assessmentAgent).toBeUndefined();
    });

    it('should not export allTools (unused)', () => {
      expect((index as any).allTools).toBeUndefined();
    });

    it('should still export runAgentTurn (used by Convex)', () => {
      expect(index.runAgentTurn).toBeDefined();
      expect(typeof index.runAgentTurn).toBe('function');
    });

    it('should still export giveCareAgent (used by Convex)', () => {
      expect(index.giveCareAgent).toBeDefined();
    });
  });
});
