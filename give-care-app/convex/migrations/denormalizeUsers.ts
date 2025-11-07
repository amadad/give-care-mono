import { internalMutation } from '../_generated/server'

const profileFields = [
  'firstName',
  'relationship',
  'careRecipientName',
  'zipCode',
  'languagePreference',
  'journeyPhase',
  'burnoutScore',
  'burnoutBand',
  'burnoutConfidence',
  'pressureZones',
  'pressureZoneScores',
  'onboardingAttempts',
  'onboardingCooldownUntil',
  'assessmentInProgress',
  'assessmentType',
  'assessmentCurrentQuestion',
  'assessmentSessionId',
  'rcsCapable',
  'deviceType',
  'consentAt',
  'lastContactAt',
  'lastProactiveMessageAt',
  'lastCrisisEventAt',
  'crisisFollowupCount',
  'reactivationMessageCount',
  'appState',
] as const

const subscriptionFields = [
  'stripeCustomerId',
  'stripeSubscriptionId',
  'subscriptionStatus',
  'canceledAt',
  'trialEndsAt',
] as const

const conversationFields = [
  'recentMessages',
  'historicalSummary',
  'historicalSummaryVersion',
  'conversationStartDate',
  'totalInteractionCount',
  'historicalSummaryTokenUsage',
] as const

const pickDefined = (source: Record<string, any>, keys: readonly string[]) => {
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key]
    }
  }
  return result
}

export const denormalizeUsers = internalMutation({
  args: {},
  handler: async ctx => {
    const users = await ctx.db.query('users').collect()

    for (const user of users) {
      const updates: Record<string, unknown> = {}

      const profile = await ctx.db
        .query('caregiverProfiles')
        .withIndex('by_user', (q: any) => q.eq('userId', user._id))
        .unique()
      if (profile) {
        Object.assign(updates, pickDefined(profile as Record<string, any>, profileFields))
      }

      const subscription = await ctx.db
        .query('subscriptions')
        .withIndex('by_user', (q: any) => q.eq('userId', user._id))
        .unique()
      if (subscription) {
        Object.assign(updates, pickDefined(subscription as Record<string, any>, subscriptionFields))
      }

      const conversation = await ctx.db
        .query('conversationState')
        .withIndex('by_user', (q: any) => q.eq('userId', user._id))
        .unique()
      if (conversation) {
        Object.assign(updates, pickDefined(conversation as Record<string, any>, conversationFields))
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates)
      }
    }

    return { processed: users.length }
  },
})
