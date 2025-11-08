/**
 * Profile utilities for managing user profile data
 */

/**
 * Required profile fields for complete onboarding
 */
const REQUIRED_PROFILE_FIELDS = ['firstName', 'relationship', 'careRecipientName', 'zipCode'] as const;

/**
 * Human-readable labels for profile fields
 */
const FIELD_LABELS: Record<string, string> = {
  firstName: 'your first name',
  relationship: 'your relationship to care recipient',
  careRecipientName: 'care recipient\'s name',
  zipCode: 'your zip code',
};

/**
 * Calculate profile completeness and generate missing fields message
 *
 * @param profile - User profile object
 * @returns Profile completeness info
 */
export const getProfileCompleteness = (profile: Record<string, unknown>) => {
  const missingFields = REQUIRED_PROFILE_FIELDS.filter(field => !profile[field]);
  const profileComplete = missingFields.length === 0;

  let missingFieldsSection = '';
  if (missingFields.length > 0) {
    const missing = missingFields.map(f => FIELD_LABELS[f] || f).join(', ');
    missingFieldsSection = `Missing profile fields: ${missing}`;
  }

  return {
    profileComplete: profileComplete ? 'yes' : 'no',
    missingFieldsSection,
    missingFields,
  };
};

/**
 * Build wellness info section from metadata
 *
 * @param metadata - User metadata object
 * @returns Wellness info string for prompt
 */
export const buildWellnessInfo = (metadata: Record<string, unknown>): string => {
  const lastAssessment = metadata.lastAssessment as { score?: number; band?: string } | undefined;
  if (lastAssessment?.score) {
    return `Last burnout score: ${lastAssessment.score} (${lastAssessment.band ?? 'unknown'} risk)`;
  }
  return '';
};

/**
 * Extract profile variables for prompt rendering
 *
 * @param metadata - User metadata object
 * @returns Profile variables for template
 */
export const extractProfileVariables = (metadata: Record<string, unknown>) => {
  const profile = (metadata.profile as Record<string, unknown> | undefined) ?? {};

  return {
    userName: (profile.firstName as string) ?? 'caregiver',
    relationship: (profile.relationship as string) ?? 'caregiver',
    careRecipient: (profile.careRecipientName as string) ?? 'your loved one',
    zipCode: (profile.zipCode as string) ?? undefined,
  };
};
