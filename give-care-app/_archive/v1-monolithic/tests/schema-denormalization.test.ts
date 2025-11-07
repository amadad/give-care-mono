/**
 * TDD Tests for Schema Denormalization
 *
 * These tests define the EXPECTED behavior of a denormalized users table
 * that merges: users + caregiverProfiles + subscriptions + conversationState
 *
 * Write tests FIRST, then refactor schema to make them pass
 */

import { convexTest } from 'convex-test'
import { beforeEach, describe, expect, test } from 'vitest'
import schema from '../convex/schema'

const convexModules = (() => {
  const glob = (import.meta as any)?.glob
  let modules: Record<string, () => Promise<unknown>> = {}

  if (typeof glob === 'function') {
    modules = glob('../convex/**/*.{ts,js}') as Record<string, () => Promise<unknown>>
  }

  const hasGenerated = Object.keys(modules).some((path) => path.includes('_generated'))
  if (!hasGenerated) {
    modules = {
      ...modules,
      '../convex/_generated/api.js': () => import('../convex/_generated/api.js'),
      '../convex/_generated/server.js': () => import('../convex/_generated/server.js'),
    }
  }

  return modules
})()

const buildDenormalizedUser = (overrides: Record<string, unknown> = {}) => {
  const now = Date.now()

  return {
    // Auth + identity
    phoneNumber: '+15555550123',
    email: 'casey@example.com',

    // Caregiver profile & burnout data
    firstName: 'Casey',
    relationship: 'daughter',
    careRecipientName: 'Mom',
    zipCode: '94102',
    languagePreference: 'en',
    journeyPhase: 'active',
    burnoutScore: 72,
    burnoutBand: 'moderate',
    burnoutConfidence: 0.87,
    pressureZones: ['emotional_wellbeing', 'time_management'],
    pressureZoneScores: {
      physical_health: 40,
      emotional_wellbeing: 75,
      financial_concerns: 55,
      time_management: 82,
      social_support: 38,
    },
    onboardingAttempts: { cwbs: 2 },
    onboardingCooldownUntil: now + 3_600_000,
    assessmentInProgress: true,
    assessmentType: 'cwbs',
    assessmentCurrentQuestion: 4,
    assessmentSessionId: 'session_123',
    rcsCapable: true,
    deviceType: 'android',
    consentAt: now - 86_400_000,
    lastContactAt: now - 60_000,
    lastProactiveMessageAt: now - 120_000,
    lastCrisisEventAt: now - 3_600_000,
    crisisFollowupCount: 1,
    reactivationMessageCount: 3,
    appState: {
      lastActivity: now - 30_000,
      sessionCount: 5,
      metadata: 'beta_user',
    },

    // Subscription data
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_456',
    subscriptionStatus: 'active',
    canceledAt: now + 86_400_000,
    trialEndsAt: now + 604_800_000,

    // Conversation data
    recentMessages: [
      { role: 'user', content: 'Hello', timestamp: now - 5_000 },
      { role: 'assistant', content: 'Hi there!', timestamp: now - 4_000 },
    ],
    historicalSummary: 'Casey has been engaging with the coach.',
    historicalSummaryVersion: 'v1',
    conversationStartDate: now - 604_800_000,
    totalInteractionCount: 47,
    historicalSummaryTokenUsage: {
      promptTokens: 120,
      completionTokens: 80,
      totalTokens: 200,
      costUsd: 0.32,
      recordedAt: now - 1_000,
    },

    // Timestamps
    createdAt: now,
    updatedAt: now,

    ...overrides,
  }
}

const insertDenormalizedUser = (
  t: ReturnType<typeof convexTest>,
  overrides: Record<string, unknown> = {}
) =>
  t.run(async (ctx) => {
    return await ctx.db.insert('users', buildDenormalizedUser(overrides))
  })

const getUserByPhone = (
  t: ReturnType<typeof convexTest>,
  phoneNumber: string
) =>
  t.run(async (ctx) => {
    return await ctx.db
      .query('users')
      .withIndex('by_phone', (q) => q.eq('phoneNumber', phoneNumber))
      .unique()
  })

describe('Denormalized Users Schema', () => {
  let t: ReturnType<typeof convexTest>

  beforeEach(() => {
    t = convexTest(schema, convexModules)
  })

  test('loads complete user in a single query (no 301 lookup chain)', async () => {
    const userId = await insertDenormalizedUser(t)

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId)
    })

    expect(user).toBeDefined()
    expect(user).toMatchObject({
      firstName: 'Casey',
      burnoutScore: 72,
      stripeCustomerId: 'cus_123',
      historicalSummary: expect.stringContaining('Casey'),
    })
    expect(user?.recentMessages).toEqual([
      expect.objectContaining({ role: 'user', content: 'Hello' }),
      expect.objectContaining({ role: 'assistant', content: 'Hi there!' }),
    ])
  })

  test('persists all caregiver profile fields directly on users table', async () => {
    const phoneNumber = '+15555550999'
    await insertDenormalizedUser(t, {
      phoneNumber,
      firstName: 'Jordan',
      relationship: 'son',
      careRecipientName: 'Dad',
      zipCode: '10001',
      languagePreference: 'es',
      journeyPhase: 'maintenance',
      burnoutScore: 63,
      burnoutBand: 'high',
      burnoutConfidence: 0.91,
      pressureZones: ['social_support'],
      pressureZoneScores: {
        physical_health: 52,
        emotional_wellbeing: 88,
        financial_concerns: 30,
        time_management: 40,
        social_support: 92,
      },
      onboardingAttempts: { reach: 1 },
      onboardingCooldownUntil: 1_700_000_000_000,
      assessmentInProgress: false,
      assessmentType: 'reach_ii',
      assessmentCurrentQuestion: 0,
      assessmentSessionId: 'session_reach',
      rcsCapable: false,
      deviceType: 'ios',
      consentAt: 1_690_000_000_000,
      lastContactAt: 1_700_000_100_000,
      lastProactiveMessageAt: 1_700_000_200_000,
      lastCrisisEventAt: 1_700_000_300_000,
      crisisFollowupCount: 4,
      reactivationMessageCount: 2,
      appState: {
        lastActivity: 1_700_000_050_000,
        sessionCount: 7,
        metadata: 'reengaged',
      },
    })

    const user = await getUserByPhone(t, phoneNumber)

    expect(user).toMatchObject({
      firstName: 'Jordan',
      relationship: 'son',
      careRecipientName: 'Dad',
      zipCode: '10001',
      languagePreference: 'es',
      journeyPhase: 'maintenance',
      burnoutScore: 63,
      burnoutBand: 'high',
      burnoutConfidence: 0.91,
      onboardingAttempts: { reach: 1 },
      assessmentInProgress: false,
      assessmentType: 'reach_ii',
      assessmentCurrentQuestion: 0,
      assessmentSessionId: 'session_reach',
      rcsCapable: false,
      deviceType: 'ios',
      consentAt: 1_690_000_000_000,
      lastContactAt: 1_700_000_100_000,
      lastProactiveMessageAt: 1_700_000_200_000,
      lastCrisisEventAt: 1_700_000_300_000,
      crisisFollowupCount: 4,
      reactivationMessageCount: 2,
      appState: {
        lastActivity: 1_700_000_050_000,
        sessionCount: 7,
        metadata: 'reengaged',
      },
    })
    expect(user?.pressureZones).toEqual(['social_support'])
    expect(user?.pressureZoneScores).toMatchObject({
      physical_health: 52,
      emotional_wellbeing: 88,
      financial_concerns: 30,
      time_management: 40,
      social_support: 92,
    })
  })

  test('persists all subscription fields on users table', async () => {
    const stripeCustomerId = 'cus_profile_789'
    await insertDenormalizedUser(t, {
      phoneNumber: '+15555550888',
      stripeCustomerId,
      stripeSubscriptionId: 'sub_profile_789',
      subscriptionStatus: 'trialing',
      canceledAt: 1_800_000_000_000,
      trialEndsAt: 1_700_500_000_000,
    })

    const user = await t.run(async (ctx) => {
      return await ctx.db
        .query('users')
        .withIndex('by_stripe_customer', (q) => q.eq('stripeCustomerId', stripeCustomerId))
        .unique()
    })

    expect(user).toMatchObject({
      stripeCustomerId,
      stripeSubscriptionId: 'sub_profile_789',
      subscriptionStatus: 'trialing',
      canceledAt: 1_800_000_000_000,
      trialEndsAt: 1_700_500_000_000,
    })
  })

  test('persists all conversation fields on users table', async () => {
    const userId = await insertDenormalizedUser(t, {
      phoneNumber: '+15555550777',
      recentMessages: [
        { role: 'user', content: 'Need help', timestamp: 1_700_000_400_000 },
        { role: 'assistant', content: 'I can help', timestamp: 1_700_000_500_000 },
      ],
      historicalSummary: 'Engaged for several weeks.',
      historicalSummaryVersion: 'v2',
      conversationStartDate: 1_699_000_000_000,
      totalInteractionCount: 108,
      historicalSummaryTokenUsage: {
        promptTokens: 220,
        completionTokens: 140,
        totalTokens: 360,
        costUsd: 0.72,
        recordedAt: 1_700_000_450_000,
      },
    })

    const user = await t.run(async (ctx) => {
      return await ctx.db.get(userId)
    })

    expect(user?.recentMessages).toEqual([
      expect.objectContaining({ role: 'user', content: 'Need help', timestamp: 1_700_000_400_000 }),
      expect.objectContaining({ role: 'assistant', content: 'I can help', timestamp: 1_700_000_500_000 }),
    ])
    expect(user).toMatchObject({
      historicalSummary: 'Engaged for several weeks.',
      historicalSummaryVersion: 'v2',
      conversationStartDate: 1_699_000_000_000,
      totalInteractionCount: 108,
      historicalSummaryTokenUsage: {
        promptTokens: 220,
        completionTokens: 140,
        totalTokens: 360,
        costUsd: 0.72,
        recordedAt: 1_700_000_450_000,
      },
    })
  })

  test('new composite indexes return hydrated users', async () => {
    await insertDenormalizedUser(t, {
      phoneNumber: '+15555550661',
      journeyPhase: 'active',
      lastContactAt: 1_700_000_600_000,
      burnoutBand: 'crisis',
      lastCrisisEventAt: 1_700_000_610_000,
      firstName: 'Crisis Active',
    })
    await insertDenormalizedUser(t, {
      phoneNumber: '+15555550662',
      journeyPhase: 'active',
      lastContactAt: 1_700_000_620_000,
      burnoutBand: 'moderate',
      lastCrisisEventAt: 1_700_000_500_000,
      firstName: 'Moderate Active',
    })
    await insertDenormalizedUser(t, {
      phoneNumber: '+15555550663',
      journeyPhase: 'maintenance',
      lastContactAt: 1_700_000_630_000,
      burnoutBand: 'crisis',
      lastCrisisEventAt: 1_700_000_640_000,
      firstName: 'Crisis Maintenance',
    })

    const activeUsers = await t.run(async (ctx) => {
      return await ctx.db
        .query('users')
        .withIndex('by_journey_contact', (q) => q.eq('journeyPhase', 'active'))
        .collect()
    })

    expect(activeUsers).toHaveLength(2)
    activeUsers.forEach((user) => {
      expect(user).toMatchObject({
        journeyPhase: 'active',
        lastContactAt: expect.any(Number),
        firstName: expect.any(String),
      })
    })

    const crisisUsers = await t.run(async (ctx) => {
      return await ctx.db
        .query('users')
        .withIndex('by_band_crisis', (q) => q.eq('burnoutBand', 'crisis'))
        .collect()
    })

    expect(crisisUsers).toHaveLength(2)
    crisisUsers.forEach((user) => {
      expect(user).toMatchObject({
        burnoutBand: 'crisis',
        lastCrisisEventAt: expect.any(Number),
        firstName: expect.any(String),
      })
    })
  })
})
