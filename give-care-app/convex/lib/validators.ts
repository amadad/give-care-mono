/**
 * Shared Validators
 *
 * Common validator definitions used across agents and actions
 * Typed validators replace v.any() for better type safety
 */

import { v } from 'convex/values';

// User Profile Validator
export const userProfileValidator = v.object({
  firstName: v.optional(v.string()),
  relationship: v.optional(v.string()),
  careRecipientName: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  financialStatus: v.optional(v.union(
    v.literal('struggling'),
    v.literal('stable'),
    v.literal('comfortable')
  )),
  transportationReliability: v.optional(v.union(
    v.literal('reliable'),
    v.literal('unreliable')
  )),
  housingStability: v.optional(v.union(
    v.literal('stable'),
    v.literal('at_risk')
  )),
  communityAccess: v.optional(v.union(
    v.literal('good'),
    v.literal('poor')
  )),
  clinicalCoordination: v.optional(v.union(
    v.literal('good'),
    v.literal('poor')
  )),
  preferredCheckInHour: v.optional(v.number()),
});

// Agent Metadata Validator
// Note: Backward compatible - allows threadId at top level (old data) or under convex (new data)
export const agentMetadataValidator = v.union(
  // New structure: threadId under convex
  v.object({
    profile: v.optional(userProfileValidator),
    journeyPhase: v.optional(v.string()),
    totalInteractionCount: v.optional(v.number()),
    enrichedContext: v.optional(v.string()),
    contextUpdatedAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    wellnessScore: v.optional(v.number()),
    pressureZones: v.optional(v.array(v.string())),
    convex: v.optional(v.object({
      userId: v.optional(v.id('users')),
      threadId: v.optional(v.string()),
    })),
  }),
  // Old structure: threadId at top level (for backward compatibility)
  v.object({
    profile: v.optional(userProfileValidator),
    journeyPhase: v.optional(v.string()),
    totalInteractionCount: v.optional(v.number()),
    enrichedContext: v.optional(v.string()),
    contextUpdatedAt: v.optional(v.number()),
    timezone: v.optional(v.string()),
    wellnessScore: v.optional(v.number()),
    pressureZones: v.optional(v.array(v.string())),
    threadId: v.optional(v.string()), // Old location
    convex: v.optional(v.object({
      userId: v.optional(v.id('users')),
      threadId: v.optional(v.string()),
    })),
  })
);

// Agent Context Validator (updated with typed metadata)
export const agentContextValidator = v.object({
  userId: v.string(),
  sessionId: v.optional(v.string()),
  locale: v.string(),
  consent: v.object({
    emergency: v.boolean(),
    marketing: v.boolean(),
  }),
  crisisFlags: v.optional(
    v.object({
      active: v.boolean(),
      terms: v.array(v.string()),
    })
  ),
  metadata: v.optional(agentMetadataValidator), // ✅ Typed instead of v.any()
});

export const channelValidator = v.union(
  v.literal('sms'),
  v.literal('email'),
  v.literal('web')
);

// Demographics Validator
export const demographicsValidator = v.object({
  age: v.optional(v.number()),
  gender: v.optional(v.string()),
  ethnicity: v.optional(v.string()),
  education: v.optional(v.string()),
});

// Preferences Validator
export const preferencesValidator = v.object({
  notificationFrequency: v.optional(v.string()),
  preferredContactTime: v.optional(v.string()),
  preferredCheckInHour: v.optional(v.number()),
  timezone: v.optional(v.string()),
});
