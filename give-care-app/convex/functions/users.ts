/**
 * User management functions
 * CRUD operations for users table
 */

import { mutation, query, internalMutation, internalQuery } from '../_generated/server';
import { v } from 'convex/values';

// QUERIES 

export const getUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByPhone = internalQuery({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_phone', (q: any) => q.eq('phoneNumber', args.phoneNumber))
      .unique();
  },
});

// MUTATIONS

export const createUser = internalMutation({
  args: {
    phoneNumber: v.string(),
    rcsCapable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const userId = await ctx.db.insert('users', {
      phoneNumber: args.phoneNumber,
      journeyPhase: 'onboarding',
      assessmentInProgress: false,
      assessmentCurrentQuestion: 0,
      pressureZones: [],
      onboardingAttempts: {},
      rcsCapable: args.rcsCapable,
      subscriptionStatus: 'inactive',
      languagePreference: 'en',
      appState: {},
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

export const updateProfile = internalMutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    careRecipientName: v.optional(v.string()),
    zipCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = { updatedAt: Date.now() };
    if (updates.firstName !== undefined) cleanUpdates.firstName = updates.firstName;
    if (updates.relationship !== undefined) cleanUpdates.relationship = updates.relationship;
    if (updates.careRecipientName !== undefined)
      cleanUpdates.careRecipientName = updates.careRecipientName;
    if (updates.zipCode !== undefined) cleanUpdates.zipCode = updates.zipCode;

    await ctx.db.patch(userId, cleanUpdates);

    return { success: true };
  },
});

export const updateWellness = internalMutation({
  args: {
    userId: v.id('users'),
    burnoutScore: v.number(),
    pressureZones: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      burnoutScore: args.burnoutScore,
      pressureZones: args.pressureZones,
      updatedAt: Date.now(),
    });
  },
});

export const updateAssessmentState = internalMutation({
  args: {
    userId: v.id('users'),
    assessmentInProgress: v.boolean(),
    assessmentType: v.optional(v.string()),
    assessmentCurrentQuestion: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateLastContact = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastContactAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateJourneyPhase = internalMutation({
  args: {
    userId: v.id('users'),
    journeyPhase: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      journeyPhase: args.journeyPhase,
      updatedAt: Date.now(),
    });
  },
});

export const updateContextState = internalMutation({
  args: {
    userId: v.id('users'),
    firstName: v.optional(v.string()),
    relationship: v.optional(v.string()),
    careRecipientName: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    journeyPhase: v.optional(v.string()),
    onboardingAttempts: v.optional(v.any()),
    onboardingCooldownUntil: v.optional(v.string()), // FIX #4: Add cooldown field
    assessmentInProgress: v.optional(v.boolean()),
    assessmentType: v.optional(v.string()),
    assessmentCurrentQuestion: v.optional(v.number()),
    assessmentSessionId: v.optional(v.string()),
    burnoutScore: v.optional(v.number()),
    burnoutBand: v.optional(v.string()),
    burnoutConfidence: v.optional(v.number()),
    pressureZones: v.optional(v.array(v.string())),
    pressureZoneScores: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = { updatedAt: Date.now() };

    if (updates.firstName !== undefined) cleanUpdates.firstName = updates.firstName;
    if (updates.relationship !== undefined) cleanUpdates.relationship = updates.relationship;
    if (updates.careRecipientName !== undefined) cleanUpdates.careRecipientName = updates.careRecipientName;
    if (updates.zipCode !== undefined) cleanUpdates.zipCode = updates.zipCode;
    if (updates.journeyPhase !== undefined) cleanUpdates.journeyPhase = updates.journeyPhase;
    if (updates.onboardingAttempts !== undefined) cleanUpdates.onboardingAttempts = updates.onboardingAttempts;
    // FIX #4: Persist cooldown timestamp
    if (updates.onboardingCooldownUntil !== undefined) {
      cleanUpdates.onboardingCooldownUntil = updates.onboardingCooldownUntil
        ? Date.parse(updates.onboardingCooldownUntil)
        : undefined;
    }
    if (updates.assessmentInProgress !== undefined) cleanUpdates.assessmentInProgress = updates.assessmentInProgress;
    if (updates.assessmentType !== undefined) cleanUpdates.assessmentType = updates.assessmentType;
    if (updates.assessmentCurrentQuestion !== undefined) cleanUpdates.assessmentCurrentQuestion = updates.assessmentCurrentQuestion;
    if (updates.assessmentSessionId !== undefined) cleanUpdates.assessmentSessionId = updates.assessmentSessionId;
    if (updates.burnoutScore !== undefined) cleanUpdates.burnoutScore = updates.burnoutScore;
    if (updates.burnoutBand !== undefined) cleanUpdates.burnoutBand = updates.burnoutBand;
    if (updates.burnoutConfidence !== undefined) cleanUpdates.burnoutConfidence = updates.burnoutConfidence;
    if (updates.pressureZones !== undefined) cleanUpdates.pressureZones = updates.pressureZones;
    if (updates.pressureZoneScores !== undefined) cleanUpdates.pressureZoneScores = updates.pressureZoneScores;

    await ctx.db.patch(userId, cleanUpdates);

    return { success: true };
  },
});

// PUBLIC MUTATIONS (for external use)

export const getOrCreateByPhone = internalMutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_phone', (q: any) => q.eq('phoneNumber', args.phoneNumber))
      .unique();

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const id = await ctx.db.insert('users', {
      phoneNumber: args.phoneNumber,
      journeyPhase: 'onboarding',
      assessmentInProgress: false,
      assessmentCurrentQuestion: 0,
      pressureZones: [],
      onboardingAttempts: {},
      rcsCapable: false,
      subscriptionStatus: 'inactive',
      languagePreference: 'en',
      appState: {},
      createdAt: now,
      updatedAt: now,
    });

    // Fetch the newly created user - use a small delay to ensure commit
    // This is a workaround for Convex transaction timing
    const newUser = await ctx.db.get(id);

    if (!newUser) {
      // Fallback: If get() returns null, query by phone
      console.warn('[getOrCreateByPhone] ctx.db.get() returned null, falling back to query');
      const fallback = await ctx.db
        .query('users')
        .withIndex('by_phone', (q: any) => q.eq('phoneNumber', args.phoneNumber))
        .unique();

      if (!fallback) {
        throw new Error('Failed to retrieve newly created user');
      }

      return fallback;
    }

    return newUser;
  },
});

export const patchProfile = mutation({
  args: {
    userId: v.id('users'),
    updates: v.object({
      firstName: v.optional(v.string()),
      relationship: v.optional(v.string()),
      careRecipientName: v.optional(v.string()),
      zipCode: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('user not found');

    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Generic update function for scheduling module
export const updateUser = internalMutation({
  args: {
    userId: v.id('users'),
    journeyPhase: v.optional(v.string()),
    lastProactiveMessageAt: v.optional(v.number()),
    lastCrisisEventAt: v.optional(v.number()),
    crisisFollowupCount: v.optional(v.number()),
    reactivationMessageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = { updatedAt: Date.now() };
    if (updates.journeyPhase !== undefined) cleanUpdates.journeyPhase = updates.journeyPhase;
    if (updates.lastProactiveMessageAt !== undefined) cleanUpdates.lastProactiveMessageAt = updates.lastProactiveMessageAt;
    if (updates.lastCrisisEventAt !== undefined) cleanUpdates.lastCrisisEventAt = updates.lastCrisisEventAt;
    if (updates.crisisFollowupCount !== undefined) cleanUpdates.crisisFollowupCount = updates.crisisFollowupCount;
    if (updates.reactivationMessageCount !== undefined) cleanUpdates.reactivationMessageCount = updates.reactivationMessageCount;

    await ctx.db.patch(userId, cleanUpdates);

    return { success: true };
  },
});

// =============================================================================
// ELIGIBILITY QUERIES FOR SCHEDULED FUNCTIONS (Task 1)
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Get crisis users eligible for DAILY check-ins (first 7 days post-crisis)
 */
export const getEligibleForCrisisDaily = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * DAY_MS;
    const sevenDaysAgo = now - 7 * DAY_MS;

    const users = await ctx.db
      .query('users')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'crisis'))
      .collect();

    // Filter: crisis within last 7 days, not contacted in 2+ days
    return users.filter(user =>
      user.journeyPhase === 'active' &&
      user.lastCrisisEventAt &&
      user.lastCrisisEventAt > sevenDaysAgo &&
      (!user.lastContactAt || user.lastContactAt < twoDaysAgo)
    );
  },
});

/**
 * Get crisis users eligible for WEEKLY check-ins (after day 7)
 */
export const getEligibleForCrisisWeekly = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * DAY_MS;
    const sevenDaysAgo = now - 7 * DAY_MS;
    const oneWeekAgo = now - 7 * DAY_MS;

    const users = await ctx.db
      .query('users')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'crisis'))
      .collect();

    // Filter: crisis >7 days ago, not proactively messaged in 7+ days, not contacted in 3+ days
    return users.filter(user =>
      user.journeyPhase === 'active' &&
      user.lastCrisisEventAt &&
      user.lastCrisisEventAt <= sevenDaysAgo &&
      (!user.lastProactiveMessageAt || user.lastProactiveMessageAt < oneWeekAgo) &&
      (!user.lastContactAt || user.lastContactAt < threeDaysAgo)
    );
  },
});

/**
 * Get high burnout users eligible for check-ins (every 3 days)
 */
export const getEligibleForHighBurnoutCheckin = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * DAY_MS;
    const threeDaysAgo = now - 3 * DAY_MS;

    const users = await ctx.db
      .query('users')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'high'))
      .collect();

    // Filter: active, not proactively messaged in 3+ days, not contacted in 2+ days
    return users.filter(user =>
      user.journeyPhase === 'active' &&
      (!user.lastProactiveMessageAt || user.lastProactiveMessageAt < threeDaysAgo) &&
      (!user.lastContactAt || user.lastContactAt < twoDaysAgo)
    );
  },
});

/**
 * Get moderate burnout users eligible for check-ins (weekly)
 */
export const getEligibleForModerateCheckin = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const threeDaysAgo = now - 3 * DAY_MS;
    const oneWeekAgo = now - 7 * DAY_MS;

    const users = await ctx.db
      .query('users')
      .withIndex('by_burnout_band', (q: any) => q.eq('burnoutBand', 'moderate'))
      .collect();

    // Filter: active, not proactively messaged in 7+ days, not contacted in 3+ days
    return users.filter(user =>
      user.journeyPhase === 'active' &&
      (!user.lastProactiveMessageAt || user.lastProactiveMessageAt < oneWeekAgo) &&
      (!user.lastContactAt || user.lastContactAt < threeDaysAgo)
    );
  },
});

/**
 * Get dormant users at specific milestones (day 7, 14, 30, 31+)
 */
export const getDormantAtMilestones = internalQuery({
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * DAY_MS;

    const users = await ctx.db
      .query('users')
      .withIndex('by_last_contact')
      .filter((q) =>
        q.and(
          q.lte(q.field('lastContactAt'), sevenDaysAgo),
          q.eq(q.field('journeyPhase'), 'active') // Only active users
        )
      )
      .collect();

    // Filter out users who already received 3 reactivation messages (in memory)
    return users.filter(user => (user.reactivationMessageCount || 0) < 3);
  },
});
