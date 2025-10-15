import { z } from "zod";

/**
 * Typed context for GiveCare agent.
 * PRD §5: User Profile Management
 * PRD §3: Clinical Assessments
 * PRD §6.2: Multi-Agent Orchestration
 */

export const giveCareContextSchema = z.object({
  // User Identity
  userId: z.string(),
  phoneNumber: z.string(),
  userName: z.string().nullable().default(null),
  firstName: z.string().nullable().default(null),

  // Profile Fields (Onboarding)
  relationship: z.string().nullable().default(null),
  careRecipientName: z.string().nullable().default(null),
  zipCode: z.string().regex(/^\d{5}$/).nullable().default(null),

  // Journey State
  journeyPhase: z.enum(['onboarding', 'active', 'crisis', 'recovery', 'maintenance', 'churned']).default('onboarding'),

  // Assessment State
  assessmentInProgress: z.boolean().default(false),
  assessmentType: z.enum(['ema', 'cwbs', 'reach_ii', 'sdoh']).nullable().default(null),
  assessmentCurrentQuestion: z.number().default(0),
  assessmentSessionId: z.string().nullable().default(null), // Convex ID for current session
  assessmentResponses: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  assessmentRateLimited: z.boolean().default(false), // Task 3: Rate limit check (3/day)

  // Burnout Metrics
  burnoutScore: z.number().min(0).max(100).nullable().default(null),
  burnoutConfidence: z.number().min(0).max(1).nullable().default(null),
  burnoutBand: z.enum(['crisis', 'high', 'moderate', 'mild', 'thriving']).nullable().default(null),
  pressureZones: z.array(z.string()).default([]),
  pressureZoneScores: z.record(z.string(), z.number()).default({}),

  // Trauma-Informed Tracking (P2/P3 compliance)
  onboardingAttempts: z.record(z.string(), z.number()).default({}),
  onboardingCooldownUntil: z.string().nullable().default(null),

  // Device Capabilities
  rcsCapable: z.boolean().default(false),
  deviceType: z.string().nullable().default(null),

  // Compliance
  consentAt: z.string().nullable().default(null),
  languagePreference: z.string().default('en'),

  // Conversation Summarization (Task 9)
  recentMessages: z.array(z.object({
    role: z.string(),
    content: z.string(),
    timestamp: z.number(),
  })).default([]),
  historicalSummary: z.string().default(''),
  conversationStartDate: z.number().nullable().default(null),
  totalInteractionCount: z.number().nullable().default(null),
});

export type GiveCareContext = z.infer<typeof giveCareContextSchema>;

/**
 * Helper functions for context state management
 * (mirrors Python methods on GiveCareContext class)
 */
export const contextHelpers = {
  /**
   * Check if all required profile fields are collected
   */
  profileComplete(ctx: GiveCareContext): boolean {
    return !!(
      ctx.firstName &&
      ctx.relationship &&
      ctx.careRecipientName &&
      ctx.zipCode
    );
  },

  /**
   * Return list of missing profile fields
   */
  missingProfileFields(ctx: GiveCareContext): string[] {
    const missing: string[] = [];
    if (!ctx.firstName) missing.push('first_name');
    if (!ctx.relationship) missing.push('relationship');
    if (!ctx.careRecipientName) missing.push('care_recipient_name');
    if (!ctx.zipCode) missing.push('zip_code');
    return missing;
  },

  /**
   * Check if we can ask for a profile field per P2/P3 (trauma-informed)
   *
   * P2: Never ask same field twice in session
   * P3: Two attempts max, then cooldown
   */
  canAskForField(ctx: GiveCareContext, field: string): boolean {
    const attempts = ctx.onboardingAttempts[field] || 0;
    return attempts < 2;
  },

  /**
   * Record an attempt to collect a profile field
   */
  recordFieldAttempt(ctx: GiveCareContext, field: string): void {
    ctx.onboardingAttempts[field] = (ctx.onboardingAttempts[field] || 0) + 1;
  }
};

/**
 * Create a new context instance with defaults
 */
export function createGiveCareContext(
  userId: string,
  phoneNumber: string,
  overrides: Partial<GiveCareContext> = {}
): GiveCareContext {
  return giveCareContextSchema.parse({
    userId,
    phoneNumber,
    ...overrides
  });
}
