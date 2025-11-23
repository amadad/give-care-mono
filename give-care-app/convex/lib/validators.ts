import { v } from "convex/values";

// Event payloads for learning/telemetry
export const eventPayloadValidator = v.union(
  v.object({
    resourceId: v.string(),
    helpful: v.boolean(),
    timestamp: v.number(),
  }),
  v.object({
    query: v.optional(v.string()),
    zip: v.optional(v.string()),
    zone: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  }),
  v.object({
    definitionId: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    score: v.optional(v.number()),
    band: v.optional(v.string()),
  }),
  v.object({
    fields: v.optional(v.array(v.string())),
    timestamp: v.optional(v.number()),
  }),
  v.object({
    memoryId: v.optional(v.id("memories")),
    category: v.optional(v.string()),
    importance: v.optional(v.number()),
    timestamp: v.optional(v.number()),
  }),
  v.object({
    assessmentId: v.optional(v.id("assessments")),
    gcBurnout: v.optional(v.number()),
    band: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  }),
  v.object({
    reason: v.literal("missing_phone"),
    context: v.optional(v.string()),
    timestamp: v.number(),
  })
);

// User metadata validator (for onboarding, preferences, etc.)
export const agentMetadataValidator = v.object({
  // Profile object (personal info)
  profile: v.optional(
    v.object({
      firstName: v.optional(v.string()), // User's first name
      careRecipientName: v.optional(v.string()), // Name/relationship of care recipient (mom, dad, etc.)
      relationship: v.optional(v.string()), // Relationship type (spouse, adult-child, etc.)
    })
  ),
  // Top-level metadata fields
  careRecipient: v.optional(v.string()),
  careRecipientName: v.optional(v.string()), // DEPRECATED: Use profile.careRecipientName
  firstName: v.optional(v.string()), // DEPRECATED: Use profile.firstName
  zipCode: v.optional(v.string()),
  timezone: v.optional(v.string()),
  checkInTime: v.optional(v.string()), // e.g., "19:00" for 7pm
  primaryStressor: v.optional(v.string()),
  journeyPhase: v.optional(v.string()), // Lifecycle phase (onboarding, active, crisis, etc.)
  onboardingStage: v.optional(v.string()),
  onboardingMilestones: v.optional(
    v.array(
      v.object({
        milestone: v.string(),
        completedAt: v.number(),
      })
    )
  ),
  onboardingCompletedAt: v.optional(v.number()),
  firstAssessmentCompletedAt: v.optional(v.number()),
  firstScore: v.optional(v.number()),
  firstBand: v.optional(v.string()),
  firstResourceSearchedAt: v.optional(v.number()),
  totalInteractionCount: v.optional(v.number()),
  lastAssessmentScore: v.optional(v.number()),
  // Wellness fields
  gcBurnout: v.optional(v.number()), // Composite burnout score (0-100)
  checkInFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
  lastEMA: v.optional(v.number()),
  lastSDOH: v.optional(v.number()),
  gcSdohScore: v.optional(v.number()),
  riskLevel: v.optional(v.union(v.literal("low"), v.literal("moderate"), v.literal("high"), v.literal("crisis"))),
  zones: v.optional(
    v.object({
      P1: v.optional(v.number()),
      P2: v.optional(v.number()),
      P3: v.optional(v.number()),
      P4: v.optional(v.number()),
      P5: v.optional(v.number()),
      P6: v.optional(v.number()),
    })
  ),
  proactiveOk: v.optional(v.boolean()),
  lastSpikeFollowUpAt: v.optional(v.number()),
  reassuranceLoopFlag: v.optional(v.boolean()),
  awaitingCrisisFollowUp: v.optional(
    v.object({
      alertId: v.id("alerts"),
      timestamp: v.number(),
    })
  ),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  // Legacy fields (for migration)
  contextUpdatedAt: v.optional(v.number()),
  convex: v.optional(v.any()),
  enrichedContext: v.optional(v.string()),
  threadId: v.optional(v.string()),
  // Snooze functionality
  snoozeUntil: v.optional(v.number()),
});
