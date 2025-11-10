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

// ✅ Fix: Removed unused getProfileCompleteness function

export const buildWellnessInfo = (metadata: any): string => {
  // ✅ Fix: Placeholder - can be expanded based on assessment scores, etc.
  // Currently returns empty string as wellness info is handled elsewhere
  return '';
};

