/**
 * Scheduled Functions for Proactive Messaging (Task 1)
 *
 * This module handles all proactive messaging:
 * 1. Tiered wellness check-ins (by burnout level)
 * 2. Dormant user reactivation (escalating schedule)
 * 3. One-time scheduled messages (assessment reminders, crisis follow-ups, onboarding nudges)
 * 4. Global deduplication (max 1 proactive message/day per user)
 *
 * See docs/TASK_1_IMPLEMENTATION_PLAN.md for full specifications
 *
 * NOTE: This file does NOT use "use node" directive because it contains mutations
 * that use ctx.scheduler.runAfter() which requires Convex isolate runtime.
 * Only actions that call OpenAI SDK need "use node".
 */

import { internalAction, internalMutation } from '../_generated/server'
import { internal } from '../_generated/api'
import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { logScheduling } from '../utils/logger'

// Constants
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

/**
 * Helper: Check if user can receive proactive message (deduplication)
 *
 * Rules:
 * - Max 1 proactive message per day
 * - Don't send if user already contacted us today (reactive message)
 *
 * @returns true if message can be sent
 */
async function canSendProactiveMessage(ctx: any, userId: Id<'users'>): Promise<boolean> {
  const user = await ctx.runQuery(internal.functions.users.getUser, { userId })
  if (!user) return false

  const now = Date.now()
  const oneDayAgo = now - DAY_MS

  // Check if we already sent a proactive message today
  if (user.lastProactiveMessageAt && user.lastProactiveMessageAt > oneDayAgo) {
    logScheduling('dedup_skip_proactive', { userId, reason: 'already_sent_today' })
    return false
  }

  // Check if user contacted us today (reactive message)
  if (user.lastContactAt && user.lastContactAt > oneDayAgo) {
    logScheduling('dedup_skip_active', { userId, reason: 'user_active_today' })
    return false
  }

  return true
}

/**
 * Helper: Send outbound SMS and update proactive message timestamp
 */
async function sendProactiveMessage(
  ctx: any,
  userId: Id<'users'>,
  phoneNumber: string,
  message: string,
  type: string
): Promise<void> {
  // Send SMS via Twilio
  await ctx.runMutation(internal.twilio.sendOutboundSMS, {
    to: phoneNumber,
    body: message,
  })

  // Log conversation
  // Note: agentName captures the message type (e.g., 'scheduled', 'crisis_daily_checkin')
  await ctx.runMutation(internal.functions.conversations.logMessage, {
    userId,
    role: 'assistant',
    text: message,
    mode: 'sms',
    agentName: type, // Store message type in agentName field
    timestamp: Date.now(),
  })

  // Update last proactive message timestamp (for deduplication)
  await ctx.runMutation(internal.functions.users.updateUser, {
    userId,
    lastProactiveMessageAt: Date.now(),
  })

  logScheduling('proactive_message_sent', {
    userId,
    phone: phoneNumber,
    messageType: type,
    sent: true,
  })
}

// =============================================================================
// TIERED WELLNESS CHECK-INS (Cron Job)
// =============================================================================

/**
 * Send tiered wellness check-ins based on burnout level
 *
 * Runs daily at 9am PT (17:00 UTC)
 *
 * Cadence:
 * - Crisis (first 7 days post-crisis): Daily
 * - Crisis (after day 7): Weekly
 * - High burnout: Every 3 days
 * - Moderate: Weekly
 * - Mild/Thriving: Never (opt-in only)
 */
export const sendTieredWellnessCheckins = internalAction({
  handler: async ctx => {
    logScheduling('cron_start', { job: 'sendTieredWellnessCheckins' })

    const now = Date.now()
    let sentCount = 0

    // Crisis users (first 7 days) - Daily check-ins
    const crisisRecentUsers = await ctx.runQuery(internal.functions.users.getEligibleForCrisisDaily)

    for (const user of crisisRecentUsers) {
      if (!(await canSendProactiveMessage(ctx, user._id))) continue
      if (!user.phoneNumber) continue // Skip users without phone numbers

      const message = user.firstName
        ? `Hi ${user.firstName}, how are you doing today? 💙`
        : 'Hi, how are you doing today? 💙'

      await sendProactiveMessage(ctx, user._id, user.phoneNumber, message, 'crisis_daily_checkin')
      sentCount++
    }

    // Crisis users (after day 7) - Weekly check-ins
    const crisisLongerUsers = await ctx.runQuery(
      internal.functions.users.getEligibleForCrisisWeekly
    )

    for (const user of crisisLongerUsers) {
      if (!(await canSendProactiveMessage(ctx, user._id))) continue
      if (!user.phoneNumber) continue

      const message = user.firstName
        ? `Hi ${user.firstName}, checking in this week - how are things going? 💙`
        : 'Checking in this week - how are things going? 💙'

      await sendProactiveMessage(ctx, user._id, user.phoneNumber, message, 'crisis_weekly_checkin')
      sentCount++
    }

    // High burnout users - Every 3 days
    const highBurnoutUsers = await ctx.runQuery(
      internal.functions.users.getEligibleForHighBurnoutCheckin
    )

    for (const user of highBurnoutUsers) {
      if (!(await canSendProactiveMessage(ctx, user._id))) continue
      if (!user.phoneNumber) continue

      const message = user.firstName
        ? `Hi ${user.firstName}, how are you holding up? 💙`
        : 'Hi, how are you holding up? 💙'

      await sendProactiveMessage(ctx, user._id, user.phoneNumber, message, 'high_burnout_checkin')
      sentCount++
    }

    // Moderate burnout users - Weekly
    const moderateUsers = await ctx.runQuery(internal.functions.users.getEligibleForModerateCheckin)

    for (const user of moderateUsers) {
      if (!(await canSendProactiveMessage(ctx, user._id))) continue
      if (!user.phoneNumber) continue

      const message = user.firstName
        ? `Hey ${user.firstName}, how's your week going?`
        : "Hey, how's your week going?"

      await sendProactiveMessage(ctx, user._id, user.phoneNumber, message, 'moderate_checkin')
      sentCount++
    }

    logScheduling('cron_complete', { job: 'sendTieredWellnessCheckins', sent: sentCount })
    return { sent: sentCount }
  },
})

// =============================================================================
// DORMANT USER REACTIVATION (Cron Job)
// =============================================================================

/**
 * Reactivate dormant users with escalating schedule
 *
 * Runs daily at 11am PT (19:00 UTC)
 *
 * Schedule:
 * - Day 7: First reactivation
 * - Day 14: Second reactivation
 * - Day 30: Final reactivation
 * - Day 31+: Mark as churned, stop messaging
 */
export const reactivateDormantUsers = internalAction({
  handler: async ctx => {
    logScheduling('cron_start', { job: 'reactivateDormantUsers' })

    const now = Date.now()
    let sentCount = 0
    let churnedCount = 0

    // Get users at specific dormancy milestones
    const dormantUsers = await ctx.runQuery(internal.functions.users.getDormantAtMilestones)

    for (const user of dormantUsers) {
      const daysSinceContact = (now - (user.lastContactAt || user.createdAt || now)) / DAY_MS
      const reactivationCount = user.reactivationMessageCount || 0

      // Day 7: First reactivation (if count = 0)
      if (daysSinceContact >= 7 && daysSinceContact < 8 && reactivationCount === 0) {
        if (!(await canSendProactiveMessage(ctx, user._id))) continue
        if (!user.phoneNumber) continue

        const message = user.firstName
          ? `Hey ${user.firstName}, it's been a while - how are things?`
          : "Hey, it's been a while - how are things?"

        await sendProactiveMessage(ctx, user._id, user.phoneNumber, message, 'reactivation_day7')

        await ctx.runMutation(internal.functions.users.updateUser, {
          userId: user._id,
          reactivationMessageCount: 1,
        })

        sentCount++
      }

      // Day 14: Second reactivation (if count = 1)
      else if (daysSinceContact >= 14 && daysSinceContact < 15 && reactivationCount === 1) {
        if (!(await canSendProactiveMessage(ctx, user._id))) continue
        if (!user.phoneNumber) continue

        const message = user.firstName
          ? `Just checking in, ${user.firstName} - we're here when you need us 💙`
          : "Just checking in - we're here when you need us 💙"

        await sendProactiveMessage(ctx, user._id, user.phoneNumber, message, 'reactivation_day14')

        await ctx.runMutation(internal.functions.users.updateUser, {
          userId: user._id,
          reactivationMessageCount: 2,
        })

        sentCount++
      }

      // Day 30: Final reactivation (if count = 2)
      else if (daysSinceContact >= 30 && daysSinceContact < 31 && reactivationCount === 2) {
        if (!(await canSendProactiveMessage(ctx, user._id))) continue
        if (!user.phoneNumber) continue

        const message = user.firstName
          ? `We miss you, ${user.firstName}! Reply anytime 💙`
          : 'We miss you! Reply anytime 💙'

        await sendProactiveMessage(ctx, user._id, user.phoneNumber, message, 'reactivation_day30')

        await ctx.runMutation(internal.functions.users.updateUser, {
          userId: user._id,
          reactivationMessageCount: 3,
        })

        sentCount++
      }

      // Day 31+: Mark as churned (stop messaging)
      else if (daysSinceContact >= 31 && user.journeyPhase === 'active') {
        await ctx.runMutation(internal.functions.users.updateUser, {
          userId: user._id,
          journeyPhase: 'churned',
        })

        logScheduling('user_churned', { userId: user._id, daysInactive: Math.floor(daysSinceContact) })
        churnedCount++
      }
    }

    logScheduling('cron_complete', { job: 'reactivateDormantUsers', sent: sentCount, churned: churnedCount })
    return { sent: sentCount, churned: churnedCount }
  },
})

// =============================================================================
// WEEKLY ADMIN REPORT (Cron Job)
// =============================================================================

/**
 * Generate weekly admin report
 *
 * Runs Monday at 8am PT (16:00 UTC)
 *
 * TODO: Send via email/Slack instead of just console logging
 */
export const generateWeeklyReport = internalAction({
  handler: async ctx => {
    logScheduling('cron_start', { job: 'generateWeeklyReport' })

    // Get weekly stats (placeholder - implement in analytics module)
    const stats = {
      timestamp: Date.now(),
      weekStart: Date.now() - 7 * DAY_MS,
      weekEnd: Date.now(),
      // TODO: Implement actual stats queries
      totalUsers: 0,
      activeUsers: 0,
      crisisUsers: 0,
      assessmentsCompleted: 0,
      proactiveMessagesSent: 0,
      churnedUsers: 0,
    }

    logScheduling('weekly_report', stats)

    // TODO: Send email or post to Slack
    // await sendAdminEmail(stats);
    // await postToSlack(stats);

    logScheduling('cron_complete', { job: 'generateWeeklyReport' })
    return stats
  },
})

// =============================================================================
// ONE-TIME SCHEDULED MESSAGES
// =============================================================================

/**
 * Schedule a one-time message for future delivery
 *
 * Used by:
 * - Assessment reminders (7 days after completion)
 * - Crisis follow-ups (24hr, 72hr, 7d, weekly)
 * - Onboarding nudges (48hr, day 5)
 */
export const scheduleMessage = internalMutation({
  args: {
    userId: v.id('users'),
    message: v.string(),
    delayMs: v.number(), // Milliseconds from now
    type: v.string(), // assessment_reminder | crisis_followup_1 | onboarding_nudge_1 | etc
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(args.delayMs, internal.functions.scheduling.sendScheduledMessage, {
      userId: args.userId,
      message: args.message,
      type: args.type,
    })

    logScheduling('message_queued', { userId: args.userId, type: args.type, delayMs: args.delayMs })

    return {
      success: true,
      scheduledAt: Date.now() + args.delayMs,
    }
  },
})

/**
 * Send a scheduled message (called by scheduler)
 *
 * This is the actual message delivery function called after the delay
 */
export const sendScheduledMessage = internalAction({
  args: {
    userId: v.id('users'),
    message: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    logScheduling('message_executing', { userId: args.userId, type: args.type })

    // Get user
    const user = await ctx.runQuery(internal.functions.users.getUser, { userId: args.userId })
    if (!user) {
      logScheduling('message_error', { userId: args.userId, error: 'user_not_found' })
      return { success: false, error: 'User not found' }
    }

    // Check deduplication (don't send if already sent a proactive message today)
    if (!(await canSendProactiveMessage(ctx, args.userId))) {
      logScheduling('message_skipped', { userId: args.userId, type: args.type, reason: 'deduplication' })
      return { success: false, error: 'Deduplication blocked' }
    }

    // Check phone number exists
    if (!user.phoneNumber) {
      return { success: false, error: 'User has no phone number' }
    }

    // Send message
    await sendProactiveMessage(ctx, args.userId, user.phoneNumber, args.message, args.type)

    return { success: true }
  },
})

// =============================================================================
// CRISIS FOLLOW-UP CASCADE
// =============================================================================

/**
 * Schedule multi-stage crisis follow-ups
 *
 * Called when crisis agent executes
 *
 * Schedule:
 * - Day 1 (+24hr): "Checking in after yesterday"
 * - Day 3 (+72hr): "How have the past few days been?"
 * - Day 7: "It's been a week. How are you feeling?"
 * - Weeks 2-5: Weekly check-ins (days 14, 21, 28, 35)
 */
export const scheduleCrisisFollowups = internalMutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, firstName } = args

    // Day 1 (+24hr)
    await ctx.scheduler.runAfter(DAY_MS, internal.functions.scheduling.sendScheduledMessage, {
      userId,
      message: firstName
        ? `Checking in after yesterday, ${firstName}. How are you doing today? I'm here if you need support 💙`
        : "Checking in after yesterday. How are you doing today? I'm here if you need support 💙",
      type: 'crisis_followup_1',
    })

    // Day 3 (+72hr)
    await ctx.scheduler.runAfter(3 * DAY_MS, internal.functions.scheduling.sendScheduledMessage, {
      userId,
      message: firstName
        ? `Hi ${firstName}, thinking of you. How have the past few days been?`
        : 'Hi, thinking of you. How have the past few days been?',
      type: 'crisis_followup_2',
    })

    // Day 7
    await ctx.scheduler.runAfter(7 * DAY_MS, internal.functions.scheduling.sendScheduledMessage, {
      userId,
      message: firstName
        ? `It's been a week, ${firstName}. How are you feeling? I'm here anytime 💙`
        : "It's been a week. How are you feeling? I'm here anytime 💙",
      type: 'crisis_followup_3',
    })

    // Week 2 (day 14)
    await ctx.scheduler.runAfter(14 * DAY_MS, internal.functions.scheduling.sendScheduledMessage, {
      userId,
      message: firstName
        ? `Checking in this week, ${firstName}. How are things?`
        : 'Checking in this week. How are things?',
      type: 'crisis_followup_4',
    })

    // Week 3 (day 21)
    await ctx.scheduler.runAfter(21 * DAY_MS, internal.functions.scheduling.sendScheduledMessage, {
      userId,
      message: firstName
        ? `Hi ${firstName}, how's this week treating you? 💙`
        : "Hi, how's this week treating you? 💙",
      type: 'crisis_followup_5',
    })

    // Week 4 (day 28)
    await ctx.scheduler.runAfter(28 * DAY_MS, internal.functions.scheduling.sendScheduledMessage, {
      userId,
      message: firstName
        ? `Checking in, ${firstName}. How are you doing?`
        : 'Checking in. How are you doing?',
      type: 'crisis_followup_6',
    })

    // Week 5 (day 35)
    await ctx.scheduler.runAfter(35 * DAY_MS, internal.functions.scheduling.sendScheduledMessage, {
      userId,
      message: firstName
        ? `Hi ${firstName}, how are things going this week?`
        : 'Hi, how are things going this week?',
      type: 'crisis_followup_7',
    })

    // Update crisis tracking
    await ctx.db.patch(userId, {
      lastCrisisEventAt: Date.now(),
      crisisFollowupCount: 0, // Reset counter
    })

    logScheduling('crisis_followup_scheduled', { userId, stages: 7 })

    return { success: true, stagesScheduled: 7 }
  },
})

// =============================================================================
// ONBOARDING NUDGE
// =============================================================================

/**
 * Check onboarding status and send nudge if incomplete
 *
 * Called 48 hours and day 5 after signup
 */
export const checkOnboardingAndNudge = internalAction({
  args: {
    userId: v.id('users'),
    nudgeStage: v.number(), // 1 = 48hr, 2 = day 5
  },
  handler: async (ctx, args) => {
    const { userId, nudgeStage } = args

    // Get user
    const user = await ctx.runQuery(internal.functions.users.getUser, { userId })
    if (!user) return { success: false, error: 'User not found' }

    // Check if profile is complete
    const isComplete = user.firstName && user.relationship && user.careRecipientName && user.zipCode

    if (isComplete) {
      logScheduling('onboarding_skip', { userId, nudgeStage, reason: 'profile_complete' })
      return { success: false, reason: 'Profile already complete' }
    }

    // Check deduplication
    if (!(await canSendProactiveMessage(ctx, userId))) {
      return { success: false, error: 'Deduplication blocked' }
    }

    // Check phone number exists
    if (!user.phoneNumber) {
      return { success: false, error: 'User has no phone number' }
    }

    // Send nudge
    let message: string
    if (nudgeStage === 1) {
      message =
        'Hey! Have a moment to finish setting up your profile? It helps me support you better 💙'
    } else {
      message =
        "Just checking in - we'd love to support you. Finishing your profile takes 2 minutes 💙"
    }

    await sendProactiveMessage(
      ctx,
      userId,
      user.phoneNumber,
      message,
      `onboarding_nudge_${nudgeStage}`
    )

    // Schedule next nudge if this was stage 1
    if (nudgeStage === 1) {
      await ctx.scheduler.runAfter(
        3 * DAY_MS, // 3 more days (day 5 total)
        internal.functions.scheduling.checkOnboardingAndNudge,
        {
          userId,
          nudgeStage: 2,
        }
      )
    }

    return { success: true }
  },
})
