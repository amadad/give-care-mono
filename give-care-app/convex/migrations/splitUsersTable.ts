/**
 * Migration: Split Hot Users Table
 *
 * Backfills new tables from existing users table:
 * - userProfiles: Static profile data (burnout, journey, demographics)
 * - conversationState: High-churn conversation data
 * - billingAccounts: Subscription data
 *
 * Run with: npx convex run migrations/splitUsersTable:migrate --prod
 */

import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

export const migrate = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, only count without making changes
  },
  handler: async (ctx, { dryRun = false }) => {
    const users = await ctx.db.query('users').collect()

    let profilesCreated = 0
    let conversationStatesCreated = 0
    let billingAccountsCreated = 0
    const errors: string[] = []

    for (const user of users) {
      try {
        // Check if already migrated
        const existingProfile = await ctx.db
          .query('userProfiles')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .first()

        if (existingProfile && !dryRun) {
          console.log(`User ${user._id} already migrated, skipping`)
          continue
        }

        if (dryRun) {
          if (!existingProfile) {
            profilesCreated++
          }
          continue
        }

        // Create userProfile
        const now = Date.now()
        await ctx.db.insert('userProfiles', {
          userId: user._id,
          firstName: (user as any).firstName,
          relationship: (user as any).relationship,
          careRecipientName: (user as any).careRecipientName,
          zipCode: (user as any).zipCode,
          languagePreference: (user as any).languagePreference || 'en',
          journeyPhase: (user as any).journeyPhase || 'onboarding',
          burnoutScore: (user as any).burnoutScore,
          burnoutBand: (user as any).burnoutBand,
          burnoutConfidence: (user as any).burnoutConfidence,
          pressureZones: (user as any).pressureZones || [],
          pressureZoneScores: (user as any).pressureZoneScores,
          lastContactAt: (user as any).lastContactAt,
          lastProactiveMessageAt: (user as any).lastProactiveMessageAt,
          lastCrisisEventAt: (user as any).lastCrisisEventAt,
          crisisFollowupCount: (user as any).crisisFollowupCount || 0,
          reactivationMessageCount: (user as any).reactivationMessageCount || 0,
          onboardingAttempts: (user as any).onboardingAttempts || {},
          onboardingCooldownUntil: (user as any).onboardingCooldownUntil,
          assessmentInProgress: (user as any).assessmentInProgress || false,
          assessmentType: (user as any).assessmentType,
          assessmentCurrentQuestion: (user as any).assessmentCurrentQuestion || 0,
          assessmentSessionId: (user as any).assessmentSessionId,
          rcsCapable: (user as any).rcsCapable,
          deviceType: (user as any).deviceType,
          consentAt: (user as any).consentAt,
          appState: (user as any).appState,
          createdAt: user.createdAt || now,
          updatedAt: user.updatedAt || now,
        })
        profilesCreated++

        // Create conversationState
        await ctx.db.insert('conversationState', {
          userId: user._id,
          recentMessages: (user as any).recentMessages || [],
          historicalSummary: (user as any).historicalSummary,
          historicalSummaryVersion: (user as any).historicalSummaryVersion,
          conversationStartDate: (user as any).conversationStartDate,
          totalInteractionCount: (user as any).totalInteractionCount || 0,
          historicalSummaryTokenUsage: (user as any).historicalSummaryTokenUsage,
          updatedAt: now,
        })
        conversationStatesCreated++

        // Create billingAccounts
        await ctx.db.insert('billingAccounts', {
          userId: user._id,
          stripeCustomerId: (user as any).stripeCustomerId,
          stripeSubscriptionId: (user as any).stripeSubscriptionId,
          subscriptionStatus: (user as any).subscriptionStatus,
          canceledAt: (user as any).canceledAt,
          trialEndsAt: (user as any).trialEndsAt,
          createdAt: user.createdAt || now,
          updatedAt: user.updatedAt || now,
        })
        billingAccountsCreated++
      } catch (error: any) {
        errors.push(`Failed to migrate user ${user._id}: ${error.message}`)
      }
    }

    return {
      mode: dryRun ? 'DRY RUN' : 'LIVE',
      totalUsers: users.length,
      profilesCreated,
      conversationStatesCreated,
      billingAccountsCreated,
      errors,
    }
  },
})

/**
 * Verify migration completed successfully
 *
 * Run with: npx convex run migrations/splitUsersTable:verify --prod
 */
export const verify = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    const profiles = await ctx.db.query('userProfiles').collect()
    const conversationStates = await ctx.db.query('conversationState').collect()
    const billingAccounts = await ctx.db.query('billingAccounts').collect()

    const orphanedProfiles = profiles.filter(
      (p) => !users.some((u) => u._id === p.userId)
    )
    const orphanedConversations = conversationStates.filter(
      (c) => !users.some((u) => u._id === c.userId)
    )
    const orphanedBilling = billingAccounts.filter(
      (b) => !users.some((u) => u._id === b.userId)
    )

    const missingProfiles = users.filter(
      (u) => !profiles.some((p) => p.userId === u._id)
    )
    const missingConversations = users.filter(
      (u) => !conversationStates.some((c) => c.userId === u._id)
    )
    const missingBilling = users.filter(
      (u) => !billingAccounts.some((b) => b.userId === u._id)
    )

    return {
      totalUsers: users.length,
      totalProfiles: profiles.length,
      totalConversationStates: conversationStates.length,
      totalBillingAccounts: billingAccounts.length,
      orphanedProfiles: orphanedProfiles.length,
      orphanedConversations: orphanedConversations.length,
      orphanedBilling: orphanedBilling.length,
      missingProfiles: missingProfiles.length,
      missingConversations: missingConversations.length,
      missingBilling: missingBilling.length,
      status:
        missingProfiles.length === 0 &&
        missingConversations.length === 0 &&
        missingBilling.length === 0
          ? 'COMPLETE'
          : 'INCOMPLETE',
    }
  },
})
