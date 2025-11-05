/**
 * User Helper Functions - Multi-table Join Utilities
 *
 * After schema normalization, user data is split across:
 * - users: Auth & identity
 * - caregiverProfiles: Profile, journey, burnout
 * - subscriptions: Stripe billing
 * - conversationState: Message summarization
 *
 * These helpers abstract the join logic for cleaner code.
 */

import type { QueryCtx, MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

/**
 * Enriched user with all related data
 */
export type EnrichedUser = {
  _id: Id<'users'>
  _creationTime: number
  phoneNumber?: string
  email?: string
  name?: string
  createdAt?: number
  updatedAt?: number
  // From caregiverProfiles
  firstName?: string
  relationship?: string
  careRecipientName?: string
  zipCode?: string
  journeyPhase?: string
  burnoutScore?: number
  burnoutBand?: string
  burnoutConfidence?: number
  pressureZones?: string[]
  pressureZoneScores?: any
  lastContactAt?: number
  lastProactiveMessageAt?: number
  lastCrisisEventAt?: number
  crisisFollowupCount?: number
  reactivationMessageCount?: number
  onboardingAttempts?: Record<string, number>
  onboardingCooldownUntil?: number
  // Assessment state
  assessmentInProgress?: boolean
  assessmentType?: string
  assessmentCurrentQuestion?: number
  assessmentSessionId?: string
  // From subscriptions
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionStatus?: string
  // From conversationState
  recentMessages?: any[]
  historicalSummary?: string
  historicalSummaryVersion?: string
  historicalSummaryTokenUsage?: any
}

/**
 * Get enriched user by ID (with all joined tables)
 */
export async function getEnrichedUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<EnrichedUser | null> {
  const user = await ctx.db.get(userId)
  if (!user) return null

  const [profile, subscription, conversationState] = await Promise.all([
    ctx.db
      .query('caregiverProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first(),
    ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first(),
    ctx.db
      .query('conversationState')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first(),
  ])

  return {
    _id: user._id,
    _creationTime: user._creationTime,
    phoneNumber: user.phoneNumber,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // From caregiverProfiles
    firstName: profile?.firstName,
    relationship: profile?.relationship,
    careRecipientName: profile?.careRecipientName,
    zipCode: profile?.zipCode,
    journeyPhase: profile?.journeyPhase,
    burnoutScore: profile?.burnoutScore,
    burnoutBand: profile?.burnoutBand,
    burnoutConfidence: profile?.burnoutConfidence,
    pressureZones: profile?.pressureZones,
    pressureZoneScores: profile?.pressureZoneScores,
    lastContactAt: profile?.lastContactAt,
    lastProactiveMessageAt: profile?.lastProactiveMessageAt,
    lastCrisisEventAt: profile?.lastCrisisEventAt,
    crisisFollowupCount: profile?.crisisFollowupCount,
    reactivationMessageCount: profile?.reactivationMessageCount,
    onboardingAttempts: profile?.onboardingAttempts,
    onboardingCooldownUntil: profile?.onboardingCooldownUntil,
    assessmentInProgress: profile?.assessmentInProgress,
    assessmentType: profile?.assessmentType,
    assessmentCurrentQuestion: profile?.assessmentCurrentQuestion,
    assessmentSessionId: profile?.assessmentSessionId,
    // From subscriptions
    stripeCustomerId: subscription?.stripeCustomerId,
    stripeSubscriptionId: subscription?.stripeSubscriptionId,
    subscriptionStatus: subscription?.subscriptionStatus,
    // From conversationState
    recentMessages: conversationState?.recentMessages,
    historicalSummary: conversationState?.historicalSummary,
    historicalSummaryVersion: conversationState?.historicalSummaryVersion,
    historicalSummaryTokenUsage: conversationState?.historicalSummaryTokenUsage,
  }
}

/**
 * Get enriched user by phone number
 */
export async function getEnrichedUserByPhone(
  ctx: QueryCtx | MutationCtx,
  phoneNumber: string
): Promise<EnrichedUser | null> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_phone', (q) => q.eq('phoneNumber', phoneNumber))
    .first()

  if (!user) return null
  return getEnrichedUser(ctx, user._id)
}

/**
 * Batch get enriched users (efficient parallel loading)
 */
export async function batchGetEnrichedUsers(
  ctx: QueryCtx | MutationCtx,
  userIds: Id<'users'>[]
): Promise<EnrichedUser[]> {
  if (userIds.length === 0) return []

  // Fetch all users in parallel
  const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))

  // Filter out nulls
  const validUsers = users.filter((u) => u !== null) as any[]

  // Batch fetch all related data
  const [profiles, subscriptions, conversationStates] = await Promise.all([
    Promise.all(
      validUsers.map((u) =>
        ctx.db
          .query('caregiverProfiles')
          .withIndex('by_user', (q) => q.eq('userId', u._id))
          .first()
      )
    ),
    Promise.all(
      validUsers.map((u) =>
        ctx.db
          .query('subscriptions')
          .withIndex('by_user', (q) => q.eq('userId', u._id))
          .first()
      )
    ),
    Promise.all(
      validUsers.map((u) =>
        ctx.db
          .query('conversationState')
          .withIndex('by_user', (q) => q.eq('userId', u._id))
          .first()
      )
    ),
  ])

  // Join results
  return validUsers.map((user, i) => {
    const profile = profiles[i]
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      phoneNumber: user.phoneNumber,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      firstName: profile?.firstName,
      relationship: profile?.relationship,
      careRecipientName: profile?.careRecipientName,
      zipCode: profile?.zipCode,
      journeyPhase: profile?.journeyPhase,
      burnoutScore: profile?.burnoutScore,
      burnoutBand: profile?.burnoutBand,
      burnoutConfidence: profile?.burnoutConfidence,
      pressureZones: profile?.pressureZones,
      pressureZoneScores: profile?.pressureZoneScores,
      lastContactAt: profile?.lastContactAt,
      lastProactiveMessageAt: profile?.lastProactiveMessageAt,
      lastCrisisEventAt: profile?.lastCrisisEventAt,
      crisisFollowupCount: profile?.crisisFollowupCount,
      reactivationMessageCount: profile?.reactivationMessageCount,
      onboardingAttempts: profile?.onboardingAttempts,
      onboardingCooldownUntil: profile?.onboardingCooldownUntil,
      assessmentInProgress: profile?.assessmentInProgress,
      assessmentType: profile?.assessmentType,
      assessmentCurrentQuestion: profile?.assessmentCurrentQuestion,
      assessmentSessionId: profile?.assessmentSessionId,
      stripeCustomerId: subscriptions[i]?.stripeCustomerId,
      stripeSubscriptionId: subscriptions[i]?.stripeSubscriptionId,
      subscriptionStatus: subscriptions[i]?.subscriptionStatus,
      recentMessages: conversationStates[i]?.recentMessages,
      historicalSummary: conversationStates[i]?.historicalSummary,
      historicalSummaryVersion: conversationStates[i]?.historicalSummaryVersion,
      historicalSummaryTokenUsage: conversationStates[i]?.historicalSummaryTokenUsage,
    }
  })
}

/**
 * Get all enriched users with filters
 */
export async function getAllEnrichedUsers(
  ctx: QueryCtx | MutationCtx,
  filters?: {
    journeyPhase?: string
    burnoutBand?: string
    subscriptionStatus?: string
  }
): Promise<EnrichedUser[]> {
  // Get all users first
  const users = await ctx.db.query('users').collect()
  const userIds = users.map((u) => u._id)

  // Batch fetch enriched data
  const enrichedUsers = await batchGetEnrichedUsers(ctx, userIds)

  // Apply filters
  if (!filters) return enrichedUsers

  return enrichedUsers.filter((user) => {
    if (filters.journeyPhase && user.journeyPhase !== filters.journeyPhase) {
      return false
    }
    if (filters.burnoutBand && user.burnoutBand !== filters.burnoutBand) {
      return false
    }
    if (filters.subscriptionStatus && user.subscriptionStatus !== filters.subscriptionStatus) {
      return false
    }
    return true
  })
}

/**
 * Update caregiver profile fields
 */
export async function updateCaregiverProfile(
  ctx: MutationCtx,
  userId: Id<'users'>,
  updates: {
    firstName?: string
    relationship?: string
    careRecipientName?: string
    zipCode?: string
    journeyPhase?: string
    burnoutScore?: number
    burnoutBand?: string
    burnoutConfidence?: number
    pressureZones?: string[]
    pressureZoneScores?: any
    lastContactAt?: number
    lastProactiveMessageAt?: number
    lastCrisisEventAt?: number
    crisisFollowupCount?: number
    reactivationMessageCount?: number
    assessmentInProgress?: boolean
    assessmentType?: string
    assessmentCurrentQuestion?: number
    assessmentSessionId?: string
    onboardingAttempts?: Record<string, number>
    onboardingCooldownUntil?: number
    rcsCapable?: boolean
  }
): Promise<void> {
  const profile = await ctx.db
    .query('caregiverProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()

  if (profile) {
    await ctx.db.patch(profile._id, {
      ...updates,
      updatedAt: Date.now(),
    })
  } else {
    // Create new profile if doesn't exist
    await ctx.db.insert('caregiverProfiles', {
      userId,
      ...updates,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
}

/**
 * Update subscription fields
 */
export async function updateSubscription(
  ctx: MutationCtx,
  userId: Id<'users'>,
  updates: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    subscriptionStatus?: string
  }
): Promise<void> {
  const subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()

  if (subscription) {
    await ctx.db.patch(subscription._id, {
      ...updates,
      updatedAt: Date.now(),
    })
  } else {
    // Create new subscription if doesn't exist
    await ctx.db.insert('subscriptions', {
      userId,
      ...updates,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
}

/**
 * Update conversation state fields
 */
export async function updateConversationState(
  ctx: MutationCtx,
  userId: Id<'users'>,
  updates: {
    recentMessages?: any[]
    historicalSummary?: string
    historicalSummaryVersion?: string
    historicalSummaryTokenUsage?: any
    conversationStartDate?: number
    totalInteractionCount?: number
  }
): Promise<void> {
  const state = await ctx.db
    .query('conversationState')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()

  if (state) {
    await ctx.db.patch(state._id, {
      ...updates,
      updatedAt: Date.now(),
    })
  } else {
    // Create new state if doesn't exist
    await ctx.db.insert('conversationState', {
      userId,
      ...updates,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
}

/**
 * Get or create enriched user by phone (for webhook entry)
 */
export async function getOrCreateEnrichedUserByPhone(
  ctx: MutationCtx,
  phoneNumber: string
): Promise<EnrichedUser> {
  let user = await ctx.db
    .query('users')
    .withIndex('by_phone', (q) => q.eq('phoneNumber', phoneNumber))
    .first()

  if (!user) {
    // Create new user
    const userId = await ctx.db.insert('users', {
      phoneNumber,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    user = (await ctx.db.get(userId))!
  }

  // Ensure profile exists
  let profile = await ctx.db
    .query('caregiverProfiles')
    .withIndex('by_user', (q) => q.eq('userId', user._id))
    .first()

  if (!profile) {
    await ctx.db.insert('caregiverProfiles', {
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    profile = await ctx.db
      .query('caregiverProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
  }

  // Ensure subscription exists
  let subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', user._id))
    .first()

  if (!subscription) {
    await ctx.db.insert('subscriptions', {
      userId: user._id,
      subscriptionStatus: 'inactive',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
  }

  return {
    _id: user._id,
    _creationTime: user._creationTime,
    phoneNumber: user.phoneNumber,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    firstName: profile?.firstName,
    relationship: profile?.relationship,
    careRecipientName: profile?.careRecipientName,
    zipCode: profile?.zipCode,
    journeyPhase: profile?.journeyPhase,
    burnoutScore: profile?.burnoutScore,
    burnoutBand: profile?.burnoutBand,
    burnoutConfidence: profile?.burnoutConfidence,
    pressureZones: profile?.pressureZones,
    pressureZoneScores: profile?.pressureZoneScores,
    lastContactAt: profile?.lastContactAt,
    lastProactiveMessageAt: profile?.lastProactiveMessageAt,
    lastCrisisEventAt: profile?.lastCrisisEventAt,
    crisisFollowupCount: profile?.crisisFollowupCount,
    reactivationMessageCount: profile?.reactivationMessageCount,
    onboardingAttempts: profile?.onboardingAttempts,
    onboardingCooldownUntil: profile?.onboardingCooldownUntil,
    assessmentInProgress: profile?.assessmentInProgress,
    assessmentType: profile?.assessmentType,
    assessmentCurrentQuestion: profile?.assessmentCurrentQuestion,
    assessmentSessionId: profile?.assessmentSessionId,
    stripeCustomerId: subscription?.stripeCustomerId,
    stripeSubscriptionId: subscription?.stripeSubscriptionId,
    subscriptionStatus: subscription?.subscriptionStatus,
  }
}
