/**
 * Progressive Onboarding E2E Scenarios
 *
 * Tests P2-compliant profile field collection:
 * - Priority order: careRecipientName → firstName → relationship → zipCode
 * - Contextual questions (ZIP when resources requested)
 * - Never repeat questions user ignored (P2 trauma-informed)
 */

import type { Scenario } from '../types';

export const zipCodePersistence: Scenario = {
  name: 'ZIP Code - Persistence Across Sessions',
  description: 'ZIP code saved on first ask, never requested again',
  tags: ['progressive', 'zipCode', 'persistence'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    // First resource search - should ask for ZIP
    {
      action: 'sendMessage',
      text: 'I need respite care',
    },
    {
      expect: 'response',
      contains: 'ZIP',
    },
    {
      action: 'sendMessage',
      text: '11576',
    },
    {
      expect: 'profileUpdated',
      field: 'zipCode',
      value: '11576',
    },
    // Second resource search - should NOT ask for ZIP
    {
      action: 'sendMessage',
      text: 'Find support groups',
    },
    {
      expect: 'response',
      notContains: 'ZIP',
    },
    {
      expect: 'response',
      contains: 'support group',
    },
  ],
  cleanup: true,
};

export const zipCodeExtraction: Scenario = {
  name: 'ZIP Code - Extract from Query',
  description: 'System extracts ZIP from user message without asking',
  tags: ['progressive', 'zipCode', 'extraction'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'I need respite care in 90210',
    },
    {
      expect: 'profileUpdated',
      field: 'zipCode',
      value: '90210',
    },
    {
      expect: 'response',
      contains: 'respite',
    },
    {
      expect: 'response',
      notContains: 'ZIP', // Should not ask since extracted
    },
  ],
  cleanup: true,
};

export const progressiveFieldPriority: Scenario = {
  name: 'Progressive - Field Collection Priority',
  description: 'Collects fields in priority order: careRecipient → firstName',
  tags: ['progressive', 'profile', 'priority'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi',
    },
    {
      expect: 'response',
      contains: 'Who are you caring for',
    },
    {
      action: 'sendMessage',
      text: 'My mom',
    },
    {
      expect: 'profileUpdated',
      field: 'careRecipientName',
      value: 'mom',
    },
    {
      expect: 'response',
      contains: 'What should I call you',
    },
    {
      action: 'sendMessage',
      text: 'Sarah',
    },
    {
      expect: 'profileUpdated',
      field: 'firstName',
      value: 'Sarah',
    },
  ],
  cleanup: true,
};

export const p2ComplianceNoRepeat: Scenario = {
  name: 'P2 Compliance - Never Repeat Ignored Question',
  description: 'System does not repeat question when user ignores it',
  tags: ['progressive', 'P2', 'trauma-informed'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi',
    },
    {
      expect: 'response',
      contains: 'Who are you caring for',
    },
    // User ignores question
    {
      action: 'sendMessage',
      text: "I'm feeling stressed",
    },
    {
      expect: 'response',
      contains: 'stressed',
    },
    // Next message should NOT repeat the ignored question
    {
      action: 'sendMessage',
      text: 'What can you help with?',
    },
    {
      expect: 'response',
      notContains: 'Who are you caring for',
    },
  ],
  cleanup: true,
};

export const contextualZipCode: Scenario = {
  name: 'Contextual ZIP - Only When Resources Needed',
  description: 'ZIP code only requested when user asks for local resources',
  tags: ['progressive', 'zipCode', 'contextual'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    // General conversation - no ZIP request
    {
      action: 'sendMessage',
      text: "I'm feeling overwhelmed",
    },
    {
      expect: 'response',
      notContains: 'ZIP',
    },
    // Request resources - ZIP requested
    {
      action: 'sendMessage',
      text: 'I need local resources',
    },
    {
      expect: 'response',
      contains: 'ZIP',
    },
  ],
  cleanup: true,
};

export const skipAllFields: Scenario = {
  name: 'Skip All - System Uses Defaults',
  description: 'User skips all profile questions, system uses defaults',
  tags: ['progressive', 'skip', 'defaults'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi',
    },
    {
      expect: 'response',
      contains: 'Who are you caring for',
    },
    {
      action: 'sendMessage',
      text: 'skip',
    },
    {
      expect: 'response',
      contains: 'skip',
    },
    // System should continue with defaults
    {
      action: 'sendMessage',
      text: 'I need help',
    },
    {
      expect: 'response',
      contains: 'there', // Default greeting instead of name
    },
  ],
  cleanup: true,
};

export const progressiveOnboardingScenarios = [
  zipCodePersistence,
  zipCodeExtraction,
  progressiveFieldPriority,
  p2ComplianceNoRepeat,
  contextualZipCode,
  skipAllFields,
];
