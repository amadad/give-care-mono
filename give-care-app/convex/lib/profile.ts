/**
 * Profile utilities
 */

export const extractProfileVariables = (profile: any) => {
  return {
    userName: profile?.firstName || 'there',
    relationship: profile?.relationship || 'caregiver',
    careRecipient: profile?.careRecipientName || 'loved one',
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
