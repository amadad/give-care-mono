/**
 * Email context builder for LLM agents
 * Loads subscriber data and constructs context for email generation
 */

export interface EmailContext {
  subscriber: {
    email: string;
    tags: string[];
    preferences: {
      newsletter: boolean;
      assessmentFollowup: boolean;
      productUpdates: boolean;
    };
    latestAssessmentScore?: number;
    latestAssessmentBand?: string;
    pressureZones?: string[];
  };
  trigger: {
    type: 'assessment_followup' | 'weekly_summary' | 'campaign';
    day?: number; // For sequences (3, 7, 14)
    metadata?: any;
  };
  history: {
    lastEmailSentAt?: number;
    emailsSentCount: number;
    lastEmailOpenedAt?: number;
  };
}

export function buildEmailContext(
  contact: any,
  trigger: EmailContext['trigger']
): EmailContext {
  return {
    subscriber: {
      email: contact.email,
      tags: contact.tags,
      preferences: contact.preferences,
      latestAssessmentScore: contact.latestAssessmentScore,
      latestAssessmentBand: contact.latestAssessmentBand,
      pressureZones: contact.pressureZones,
    },
    trigger,
    history: {
      lastEmailSentAt: contact.lastEmailSentAt,
      emailsSentCount: contact.emailsSentCount,
      lastEmailOpenedAt: contact.lastEmailOpenedAt,
    },
  };
}
