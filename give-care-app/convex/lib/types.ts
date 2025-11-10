export type ConnectionStatus = 'pending' | 'active' | 'failed' | 'revoked';

export type InsightPayload = {
  title: string;
  source: string;
  payload?: Record<string, unknown>;
};

export type ResearchTaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed';

export type Channel = 'sms' | 'email' | 'web';

export type Budget = {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTools: number;
};

export type HydratedContext = {
  userId: string;
  sessionId?: string;
  locale: string;
  consent: {
    emergency: boolean;
    marketing: boolean;
  };
  metadata?: any;
};
