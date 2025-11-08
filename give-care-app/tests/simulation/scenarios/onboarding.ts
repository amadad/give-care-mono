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

export const onboardingScenarios = [
  onboardingHappyPath,
  onboardingWithoutSubscription,
];
