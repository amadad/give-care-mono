/**
 * Profile utilities
 */

import { UserProfile, AgentMetadata } from './types';
import { type AssessmentAnswer, CATALOG } from './assessmentCatalog';

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

/**
 * Progressive Onboarding Helper
 * 
 * Returns the next missing profile field to collect, in priority order.
 * Only returns the FIRST missing field to enforce "one thing at a time" (P2 principle).
 * 
 * Priority order:
 * 1. careRecipientName - Core need, asked first
 * 2. zipCode - ONLY when contextually relevant (they ask for resources)
 * 3. firstName - Personalization, asked after care context known
 * 4. relationship - Enrichment, only after careRecipientName known
 * 
 * P2 enforcement: Agent Component's conversation history prevents re-asking.
 * P5 enforcement: Every prompt includes "(Reply 'skip' to move on)".
 */
export function getNextMissingField(
  profile: UserProfile | undefined,
  context: { needsLocalResources?: boolean }
): { field: string; prompt: string } | null {
  // Priority 1: careRecipientName - Core need, asked first
  if (!profile?.careRecipientName) {
    return {
      field: 'careRecipientName',
      prompt: "If you haven't asked recently, weave in: 'Who are you caring for?' (Reply 'skip' to move on)",
    };
  }

  // Priority 2: zipCode - Contextual: Only ask when they need resources
  if (!profile?.zipCode && context.needsLocalResources) {
    return {
      field: 'zipCode',
      prompt: "Ask: 'What's your ZIP code so I can find resources near you?' (Reply 'skip' to move on)",
    };
  }

  // Priority 3: firstName - Personalization, asked after care context known
  if (!profile?.firstName) {
    return {
      field: 'firstName',
      prompt: "If you haven't asked recently, weave in: 'What should I call you?' (Reply 'skip' to move on)",
    };
  }

  // Priority 4: relationship - Enrichment, only after careRecipientName known
  if (!profile?.relationship && profile?.careRecipientName) {
    return {
      field: 'relationship',
      prompt: `Ask: 'What's your relationship to ${profile.careRecipientName}?' (Reply 'skip' to move on)`,
    };
  }

  return null; // All fields collected or skipped
}

/**
 * Extract SDOH profile data from assessment answers
 * Maps SDOH zone buckets to profile fields for better personalization
 */
export function extractSDOHProfile(answers: AssessmentAnswer[]): Partial<UserProfile & {
  financialStatus?: 'struggling' | 'stable' | 'comfortable';
  transportationReliability?: 'reliable' | 'unreliable';
  housingStability?: 'stable' | 'at_risk';
  communityAccess?: 'good' | 'poor';
  clinicalCoordination?: 'good' | 'poor';
}> {
  // SDOH zone buckets from catalog
  const catalog = CATALOG['sdoh'];
  const buckets = catalog.zoneBuckets || {};

  // Compute averages per bucket (reuse sumScores logic)
  const totals: Record<string, number> = {};
  const count: Record<string, number> = {};

  for (const [zone, indexes] of Object.entries(buckets)) {
    totals[zone] = 0;
    count[zone] = 0;
    for (const idx of indexes) {
      const answer = answers.find((a) => a.questionIndex === idx);
      if (!answer) continue;
      const value = Math.min(5, Math.max(1, answer.value)); // Clamp 1-5
      totals[zone] += value;
      count[zone] += 1;
    }
  }

  const averages: Record<string, number> = {};
  for (const zone of Object.keys(buckets)) {
    averages[zone] = count[zone] ? totals[zone] / count[zone] : 0;
  }

  // Map to profile fields (simple thresholds)
  const result: any = {};

  // Financial (Q0, Q5, Q20, Q21) - Lower score = worse
  const financialAvg = averages.financial || 0;
  if (financialAvg >= 4) result.financialStatus = 'comfortable';
  else if (financialAvg >= 2.5) result.financialStatus = 'stable';
  else result.financialStatus = 'struggling';

  // Transportation (Q1, Q6, Q12) - Lower score = worse
  const transportAvg = averages.transportation || 0;
  result.transportationReliability = transportAvg >= 3 ? 'reliable' : 'unreliable';

  // Housing (Q3, Q4, Q7, Q22) - Lower score = worse
  const housingAvg = averages.housing || 0;
  result.housingStability = housingAvg >= 3 ? 'stable' : 'at_risk';

  // Community (Q10, Q11, Q15, Q23, Q27) - Lower score = worse
  const communityAvg = averages.community || 0;
  result.communityAccess = communityAvg >= 3 ? 'good' : 'poor';

  // Clinical (Q8, Q13, Q18, Q25, Q28) - Lower score = worse
  const clinicalAvg = averages.clinical || 0;
  result.clinicalCoordination = clinicalAvg >= 3 ? 'good' : 'poor';

  return result;
}

