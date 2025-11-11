/**
 * Profile utilities
 */

import { UserProfile, AgentMetadata } from './types';

export const extractProfileVariables = (profile: UserProfile | undefined) => {
  return {
    userName: profile?.firstName || 'there',
    relationship: profile?.relationship || 'caregiver',
    careRecipient: profile?.careRecipientName || 'loved one',
  };
};

// Fix: Removed unused getProfileCompleteness function

export const buildWellnessInfo = (metadata: AgentMetadata | undefined): string => {
  // Fix: Placeholder - can be expanded based on assessment scores, etc.
  // Currently returns empty string as wellness info is handled elsewhere
  return '';
};

