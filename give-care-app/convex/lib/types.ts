/**
 * Shared types for Convex-native agents and functions
 */

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
