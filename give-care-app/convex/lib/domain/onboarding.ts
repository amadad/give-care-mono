/**
 * Onboarding Policy Domain Logic
 * Pure functions for determining required fields and next onboarding steps
 * No Convex dependencies
 */

export type InteractionType =
  | "resource_search"
  | "assessment"
  | "intervention"
  | "check_in";

export type OnboardingStage =
  | "new"
  | "care_recipient"
  | "zip_code"
  | "assessment_offer"
  | "complete";

export interface UserProfile {
  careRecipient?: string;
  zipCode?: string;
  [key: string]: any;
}

/**
 * Required fields for each interaction type
 * Policy definition - centralized logic
 */
const REQUIRED: Record<InteractionType, (keyof UserProfile)[]> = {
  resource_search: ["zipCode"],
  assessment: ["careRecipient"],
  intervention: ["careRecipient"],
  check_in: [], // No required fields
};

/**
 * Get missing required fields for an interaction
 * Pure function - CONVEX_01.md helper pattern
 */
export function missing(
  profile: Partial<UserProfile>,
  interactionType: InteractionType
): string[] {
  const requiredFields = REQUIRED[interactionType] || [];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!profile[field]) {
      missingFields.push(field);
    }
  }

  return missingFields;
}

/**
 * Get next onboarding step based on current stage and profile
 * Pure function
 */
export function getNextOnboardingStep(
  stage: OnboardingStage,
  profile: Partial<UserProfile>
): { nextField: string | null; nextStage: OnboardingStage } {
  // State machine: new → care_recipient → zip_code → assessment_offer → complete
  if (stage === "new" && !profile.careRecipient) {
    return { nextField: "careRecipient", nextStage: "care_recipient" };
  }

  if (stage === "care_recipient" && !profile.zipCode) {
    return { nextField: "zipCode", nextStage: "zip_code" };
  }

  if (stage === "zip_code" && !profile.careRecipient) {
    // Still need care recipient
    return { nextField: "careRecipient", nextStage: "care_recipient" };
  }

  if (
    (stage === "care_recipient" || stage === "zip_code") &&
    profile.careRecipient &&
    profile.zipCode
  ) {
    return { nextField: null, nextStage: "assessment_offer" };
  }

  if (stage === "assessment_offer") {
    return { nextField: null, nextStage: "complete" };
  }

  // Already complete or no next step
  return { nextField: null, nextStage: stage };
}

/**
 * Get user-friendly prompt for a missing field
 * Pure function
 */
export function getUserFriendlyPrompt(field: string): string {
  const prompts: Record<string, string> = {
    careRecipient:
      "Who are you caring for? (e.g., 'my mom', 'my spouse', 'my dad')",
    zipCode: "What's your zip code? (I'll use it to find local resources)",
  };

  return prompts[field] || `Please provide your ${field}.`;
}

