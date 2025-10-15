/**
 * Zone Formatting Tests
 *
 * REQUIREMENT: Zone identifiers must be converted to human-readable labels
 * in all user-facing and agent-facing outputs.
 *
 * Problem: Tools and instructions expose raw snake_case identifiers
 * (e.g., "emotional_wellbeing") instead of formatted labels
 * (e.g., "Emotional Well-being")
 */

import { describe, test, expect } from 'vitest';
import { getZoneDescription, formatZoneName } from '../src/burnoutCalculator';
import type { GiveCareContext } from '../src/context';
import { mainInstructions } from '../src/instructions';

describe('Zone Formatting - formatZoneName (new function)', () => {
  test('formats emotional_wellbeing to Emotional Well-being', () => {
    expect(formatZoneName('emotional_wellbeing')).toBe('Emotional Well-being');
  });

  test('formats physical_health to Physical Health', () => {
    expect(formatZoneName('physical_health')).toBe('Physical Health');
  });

  test('formats social_support to Social Support', () => {
    expect(formatZoneName('social_support')).toBe('Social Support');
  });

  test('formats financial_concerns to Financial Concerns', () => {
    expect(formatZoneName('financial_concerns')).toBe('Financial Concerns');
  });

  test('formats time_management to Time Management', () => {
    expect(formatZoneName('time_management')).toBe('Time Management');
  });

  test('handles unknown zones gracefully with fallback', () => {
    const result = formatZoneName('unknown_zone');
    expect(result).toBe('Unknown Zone'); // Title case fallback
  });

  test('handles empty string', () => {
    const result = formatZoneName('');
    expect(result).toBe('');
  });

  test('formats all 5 core zone types correctly', () => {
    const zones = [
      'emotional_wellbeing',
      'physical_health',
      'social_support',
      'financial_concerns',
      'time_management'
    ];
    const expected = [
      'Emotional Well-being',
      'Physical Health',
      'Social Support',
      'Financial Concerns',
      'Time Management'
    ];

    zones.forEach((zone, idx) => {
      expect(formatZoneName(zone)).toBe(expected[idx]);
    });
  });
});

describe('Zone Formatting - getZoneDescription (existing function)', () => {
  test('provides human-readable descriptions for all 5 core zones', () => {
    expect(getZoneDescription('emotional_wellbeing')).toBe('Emotional Burden');
    expect(getZoneDescription('physical_health')).toBe('Physical Exhaustion');
    expect(getZoneDescription('social_support')).toBe('Feeling Isolated');
    expect(getZoneDescription('financial_concerns')).toBe('Financial Stress');
    expect(getZoneDescription('time_management')).toBe('Caregiving Demands');
  });

  test('provides fallback for unknown zones', () => {
    const result = getZoneDescription('unknown_zone');
    expect(result).toBe('unknown zone'); // Current fallback behavior
  });
});

// Note: Tool tests removed as they require Node.js runtime ("use node")
// The formatZoneName utility is tested above and used in tools.ts
// Integration testing of tools should be done through the agent execution layer

describe('Agent Instructions - Zone Formatting', () => {
  test('mainInstructions should NOT expose raw zone identifiers in wellness info', () => {
    const mockContext: GiveCareContext = {
      userId: 'test-user',
      phoneNumber: '+15555551234',
      firstName: 'Robert',
      relationship: 'husband',
      careRecipientName: 'Susan',
      zipCode: '98101',
      burnoutScore: 42,
      burnoutBand: 'moderate',
      pressureZones: ['emotional_wellbeing', 'social_support'],
      pressureZoneScores: {
        emotional_wellbeing: 73,
        social_support: 68
      },
      assessmentInProgress: false,
      assessmentType: null,
      assessmentCurrentQuestion: 0,
      assessmentResponses: {},
      journeyPhase: 'active',
      onboardingAttempts: {},
      sessionThreadId: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const runContext = { context: mockContext };
    const instructions = mainInstructions(runContext);

    // Instructions currently show raw zone identifiers in line 217:
    // "Pressure zones: emotional_wellbeing, social_support"
    //
    // Expected: Should show formatted names like:
    // "Pressure zones: Emotional Well-being, Social Support"
    // OR descriptions like:
    // "Pressure zones: Emotional Burden, Feeling Isolated"

    const wellnessSection = instructions.split('# Current Context')[1];

    if (wellnessSection && wellnessSection.includes('Pressure zones:')) {
      // This is the MAIN TEST that will fail initially
      // Raw identifiers should NOT appear in instructions
      expect(wellnessSection).not.toMatch(/emotional_wellbeing/);
      expect(wellnessSection).not.toMatch(/social_support/);
      expect(wellnessSection).not.toMatch(/physical_health/);
      expect(wellnessSection).not.toMatch(/financial_concerns/);
      expect(wellnessSection).not.toMatch(/time_management/);
    }
  });

  test('mainInstructions formats empty pressure zones correctly', () => {
    const mockContext: GiveCareContext = {
      userId: 'test-user',
      phoneNumber: '+15555551234',
      firstName: 'Alice',
      relationship: 'daughter',
      careRecipientName: 'Dad',
      zipCode: '75201',
      burnoutScore: 80,
      burnoutBand: 'thriving',
      pressureZones: [],
      pressureZoneScores: {},
      assessmentInProgress: false,
      assessmentType: null,
      assessmentCurrentQuestion: 0,
      assessmentResponses: {},
      journeyPhase: 'active',
      onboardingAttempts: {},
      sessionThreadId: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const runContext = { context: mockContext };
    const instructions = mainInstructions(runContext);

    // Should say "none identified yet"
    expect(instructions).toMatch(/none identified yet/);
  });
});

describe('Integration: Consistent Zone Formatting', () => {
  test('getZoneDescription returns human-readable labels for all 5 zones', () => {
    const zones = [
      'emotional_wellbeing',
      'physical_health',
      'social_support',
      'financial_concerns',
      'time_management'
    ];

    const expectedDescriptions = [
      'Emotional Burden',
      'Physical Exhaustion',
      'Feeling Isolated',
      'Financial Stress',
      'Caregiving Demands'
    ];

    zones.forEach((zone, idx) => {
      const description = getZoneDescription(zone);

      // Should return the expected description
      expect(description).toBe(expectedDescriptions[idx]);

      // Should not be the raw identifier
      expect(description).not.toBe(zone);

      // Should not contain underscores
      expect(description).not.toMatch(/_/);
    });
  });

  test('legacy zone names still work for backward compatibility', () => {
    // getZoneDescription has legacy mappings (lines 258-264 in burnoutCalculator.ts)
    expect(getZoneDescription('emotional')).toBe('Emotional Burden');
    expect(getZoneDescription('physical')).toBe('Physical Exhaustion');
    expect(getZoneDescription('financial_strain')).toBe('Financial Stress');
    expect(getZoneDescription('social_isolation')).toBe('Feeling Isolated');
    expect(getZoneDescription('caregiving_tasks')).toBe('Caregiving Demands');
  });
});
