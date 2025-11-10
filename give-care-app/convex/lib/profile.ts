/**
 * Profile utilities
 */

export const extractProfileVariables = (metadata: any) => {
  return {
    userName: metadata?.name || 'there',
    relationship: metadata?.caregiverRole || 'caregiver',
    careRecipient: metadata?.careRecipient || 'loved one',
  };
};

export const getProfileCompleteness = (profile: any) => {
  return {
    profileComplete: true,
    missingFieldsSection: '',
  };
};

export const buildWellnessInfo = (metadata: any) => {
  return '';
};
