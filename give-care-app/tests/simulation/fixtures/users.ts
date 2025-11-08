/**
 * User Fixture Generators
 *
 * Creates realistic test users for simulations
 */

import type { UserFixture } from '../types';

let userCounter = 0;

export function generateUser(overrides?: Partial<UserFixture>): UserFixture {
  userCounter++;
  const id = `sim-user-${Date.now()}-${userCounter}`;

  return {
    externalId: id,
    phone: `+1555${String(userCounter).padStart(7, '0')}`,
    locale: 'en-US',
    consent: {
      emergency: true,
      marketing: false,
    },
    metadata: {
      profile: {
        firstName: 'Alex',
        relationship: 'adult-child',
        careRecipientName: 'Mom',
      },
      journeyPhase: 'active',
    },
    ...overrides,
  };
}

export function generateCrisisUser(): UserFixture {
  return generateUser({
    metadata: {
      profile: {
        firstName: 'Jamie',
        relationship: 'spouse',
        careRecipientName: 'Partner',
      },
      journeyPhase: 'crisis',
    },
  });
}

export function generateOnboardingUser(): UserFixture {
  return generateUser({
    metadata: {
      profile: {
        firstName: 'Sam',
        relationship: 'adult-child',
        careRecipientName: 'Dad',
      },
      journeyPhase: 'onboarding',
    },
    consent: {
      emergency: false,
      marketing: false,
    },
  });
}

export function generatePowerUser(): UserFixture {
  return generateUser({
    metadata: {
      profile: {
        firstName: 'Morgan',
        relationship: 'adult-child',
        careRecipientName: 'Mom',
      },
      journeyPhase: 'active',
      totalInteractionCount: 47,
      lastAssessmentScore: 3.2,
    },
    consent: {
      emergency: true,
      marketing: true,
    },
  });
}

/**
 * Property-based user generator
 * Generates random but valid users for fuzzing
 */
export function randomUser(seed?: number): UserFixture {
  const rng = seed ? seededRandom(seed) : Math.random;
  const relationships = ['spouse', 'adult-child', 'sibling', 'friend', 'professional'];
  const phases = ['onboarding', 'active', 'maintenance', 'crisis'];
  const names = ['Alex', 'Jamie', 'Sam', 'Morgan', 'Casey', 'Riley'];
  const recipientNames = ['Mom', 'Dad', 'Parent', 'Partner', 'Friend'];

  return generateUser({
    metadata: {
      profile: {
        firstName: names[Math.floor(rng() * names.length)],
        relationship: relationships[Math.floor(rng() * relationships.length)],
        careRecipientName: recipientNames[Math.floor(rng() * recipientNames.length)],
      },
      journeyPhase: phases[Math.floor(rng() * phases.length)],
      totalInteractionCount: Math.floor(rng() * 100),
    },
  });
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}
