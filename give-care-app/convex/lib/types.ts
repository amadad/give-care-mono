/**
 * Shared types for Convex-native agents and functions
 */

// Channel type (migrated from src/shared/types.ts)
export type Channel = 'sms' | 'web';

// Budget type (migrated from src/shared/types.ts)
export type Budget = {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTools: number;
};

// HydratedContext type (migrated from src/shared/types.ts)
export type HydratedContext = {
  userId: string;
  sessionId: string;
  locale: string;
  budget: Budget;
  policyBundle: string;
  promptHistory: Array<{ fieldId: string; text: string }>;
  consent: { emergency: boolean; marketing: boolean };
  lastAssessment?: { definitionId: string; score: number };
  crisisFlags?: { active: boolean; terms: string[] };
  metadata: Record<string, unknown>;
};

// Agent types
export type AgentInput = {
  channel: 'sms' | 'email' | 'web';
  text: string;
  userId: string;
};

export type AgentContext = {
  userId: string;
  sessionId?: string;
  locale: string;
  consent: {
    emergency: boolean;
    marketing: boolean;
  };
  crisisFlags?: {
    active: boolean;
    terms: string[];
  };
  metadata?: {
    profile?: {
      firstName?: string;
      relationship?: string;
      careRecipientName?: string;
    };
    journeyPhase?: string;
    totalInteractionCount?: number;
    [key: string]: unknown;
  };
};

export type StreamChunk = {
  type: 'text' | 'tool_call' | 'error';
  content: string;
  meta?: Record<string, unknown>;
};
