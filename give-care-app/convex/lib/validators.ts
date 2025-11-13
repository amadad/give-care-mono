import { v } from "convex/values";

// User metadata validator (for onboarding, preferences, etc.)
export const agentMetadataValidator = v.object({
  careRecipient: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  timezone: v.optional(v.string()),
  checkInTime: v.optional(v.string()), // e.g., "19:00" for 7pm
  primaryStressor: v.optional(v.string()),
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
  // Wellness fields
  gcBurnout: v.optional(v.number()), // Composite burnout score (0-100)
  checkInFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"))),
  // Legacy fields (for migration)
  contextUpdatedAt: v.optional(v.number()),
  convex: v.optional(v.any()),
  enrichedContext: v.optional(v.string()),
  threadId: v.optional(v.string()),
  // Snooze functionality
  snoozeUntil: v.optional(v.number()),
});

