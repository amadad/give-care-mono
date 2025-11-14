/**
 * Simulation Testing Framework - Type Definitions
 */

export type SimulationStep =
  | { action: 'sendMessage'; text: string; channel?: 'sms' | 'web' }
  | { action: 'completeAssessment'; answers: number[] }
  | { action: 'wait'; durationMs: number }
  | { action: 'triggerScheduled'; triggerId: string }
  | { expect: 'crisisDetected'; value: boolean }
  | { expect: 'response'; contains: string }
  | { expect: 'response'; notContains: string }
  | { expect: 'responseTime'; lessThan: number }
  | { expect: 'agentType'; equals: 'main' | 'crisis' | 'assessment' }
  | { expect: 'alertCreated'; severity: string }
  | { expect: 'messageCount'; equals: number };

export interface Scenario {
  name: string;
  description: string;
  tags: string[];
  setup?: {
    user?: Partial<UserFixture>;
    subscription?: 'free' | 'plus' | 'enterprise';
  };
  steps: SimulationStep[];
  cleanup?: boolean; // Auto-cleanup test data
}

export interface UserFixture {
  externalId: string;
  phone: string;
  locale: string;
  consent: {
    emergency: boolean;
    marketing: boolean;
  };
  metadata: {
    profile: {
      firstName: string;
      relationship: string;
      careRecipientName: string;
    };
    journeyPhase: string;
    [key: string]: unknown; // Allow additional metadata properties
  };
}

export interface SimulationResult {
  scenario: string;
  success: boolean;
  duration: number;
  steps: StepResult[];
  metrics: {
    p50: number;
    p95: number;
    p99: number;
    errorRate: number;
    totalTokens: number;
  };
  failures: string[];
  recommendations: string[];
}

export interface StepResult {
  step: number;
  action: string;
  success: boolean;
  duration: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationContext {
  userId: string;
  threadId?: string;
  variables: Map<string, unknown>;
  trace: {
    messages: Array<{ role: string; content: string; timestamp: number }>;
    agentCalls: Array<{ agent: string; duration: number; success: boolean }>;
    alerts: Array<{ type: string; severity: string; timestamp: number }>;
  };
}
