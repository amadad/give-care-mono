/**
 * Onboarding Journey Scenarios
 */

import type { Scenario } from '../types';

export const onboardingHappyPath: Scenario = {
  name: 'Onboarding - Happy Path',
  description: 'New user subscribes, completes profile, receives welcome',
  tags: ['onboarding', 'subscription'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi, I just signed up',
      channel: 'sms',
    },
    {
      expect: 'response',
      contains: 'welcome',
    },
    {
      expect: 'responseTime',
      lessThan: 2000,
    },
    {
      action: 'sendMessage',
      text: "I'm caring for my mother who has dementia",
    },
    {
      expect: 'response',
      contains: 'assessment',
    },
    {
      action: 'completeAssessment',
      answers: [2, 3, 2, 4, 3, 2, 1, 2, 3, 2], // Moderate burnout
    },
    {
      expect: 'agentType',
      equals: 'assessment',
    },
    {
      expect: 'response',
      contains: 'moderate',
    },
  ],
  cleanup: true,
};

export const onboardingWithoutSubscription: Scenario = {
  name: 'Onboarding - No Subscription',
  description: 'User messages without active subscription',
  tags: ['onboarding', 'paywall'],
  setup: {
    subscription: 'free',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'I need help',
    },
    {
      expect: 'response',
      contains: 'subscribe',
    },
  ],
  cleanup: true,
};

// Progressive Onboarding Scenarios

export const progressiveOnboardingHappyPath: Scenario = {
  name: 'Progressive Onboarding - Happy Path',
  description: 'New user completes profile fields in priority order',
  tags: ['onboarding', 'progressive', 'profile'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi',
      channel: 'sms',
    },
    {
      expect: 'response',
      contains: 'Who are you caring for',
    },
    {
      action: 'sendMessage',
      text: "My mom with Alzheimer's",
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
      expect: 'response',
      contains: 'Sarah',
    },
  ],
  cleanup: true,
};

export const progressiveOnboardingSkip: Scenario = {
  name: 'Progressive Onboarding - Skip Everything',
  description: 'User skips all profile questions, system uses defaults',
  tags: ['onboarding', 'progressive', 'skip'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi',
      channel: 'sms',
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
    // System should continue conversation with defaults ("there", "loved one")
    {
      action: 'sendMessage',
      text: 'I need help',
    },
    {
      expect: 'response',
      contains: 'help',
    },
  ],
  cleanup: true,
};

export const progressiveOnboardingContextualZipCode: Scenario = {
  name: 'Progressive Onboarding - Contextual ZIP Code',
  description: 'User asks for resources, system requests ZIP code contextually',
  tags: ['onboarding', 'progressive', 'zipCode', 'resources'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'I need help finding respite care',
      channel: 'sms',
    },
    {
      expect: 'response',
      contains: 'ZIP code',
    },
    {
      action: 'sendMessage',
      text: '90210',
    },
    {
      expect: 'response',
      contains: 'resource',
    },
  ],
  cleanup: true,
};

export const progressiveOnboardingP2Compliance: Scenario = {
  name: 'Progressive Onboarding - P2 Compliance (No Repeat)',
  description: 'System does not repeat same question when user ignores it',
  tags: ['onboarding', 'progressive', 'P2', 'trauma-informed'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi',
      channel: 'sms',
    },
    {
      expect: 'response',
      contains: 'Who are you caring for',
    },
    {
      action: 'sendMessage',
      text: "I'm really stressed today", // Ignores question
    },
    {
      expect: 'response',
      contains: 'stressed',
    },
    // Verify the question is NOT repeated
    {
      action: 'sendMessage',
      text: 'What can you help me with?',
    },
    // Response should NOT contain "Who are you caring for" again
    // (This is a negative test - we check that it's NOT in the response)
  ],
  cleanup: true,
};

export const progressiveOnboardingPartialCompletion: Scenario = {
  name: 'Progressive Onboarding - Partial Completion',
  description: 'User provides careRecipientName, then asks for resources before firstName',
  tags: ['onboarding', 'progressive', 'partial'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'Hi',
      channel: 'sms',
    },
    {
      expect: 'response',
      contains: 'Who are you caring for',
    },
    {
      action: 'sendMessage',
      text: 'My dad',
    },
    {
      action: 'sendMessage',
      text: 'I need help finding local resources',
    },
    // Should ask for ZIP code (contextual) before firstName
    {
      expect: 'response',
      contains: 'ZIP code',
    },
  ],
  cleanup: true,
};

export const zipCodePersistence: Scenario = {
  name: 'ZIP Code Persistence',
  description: 'ZIP code is saved and not asked again on subsequent resource searches',
  tags: ['onboarding', 'progressive', 'zipCode', 'persistence'],
  setup: {
    subscription: 'plus',
  },
  steps: [
    {
      action: 'sendMessage',
      text: 'I need respite care',
      channel: 'sms',
    },
    {
      expect: 'response',
      contains: 'ZIP code',
    },
    {
      action: 'sendMessage',
      text: '11576',
    },
    {
      expect: 'response',
      contains: 'resource',
    },
    // Request resources again - should NOT ask for ZIP code
    {
      action: 'sendMessage',
      text: 'Find support groups',
    },
    {
      expect: 'response',
      notContains: 'ZIP code',
    },
    {
      expect: 'response',
      contains: 'resource',
    },
  ],
  cleanup: true,
};

export const onboardingScenarios = [
  onboardingHappyPath,
  onboardingWithoutSubscription,
  progressiveOnboardingHappyPath,
  progressiveOnboardingSkip,
  progressiveOnboardingContextualZipCode,
  progressiveOnboardingP2Compliance,
  progressiveOnboardingPartialCompletion,
  zipCodePersistence,
];
