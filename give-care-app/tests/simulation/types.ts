/**
 * Simulation Testing Framework - Type Definitions
 */

export type SimulationStep =
  // Actions
  | { action: 'sendMessage'; text: string; channel?: 'sms' | 'web' }
  | { action: 'completeAssessment'; answers: number[] }
  | { action: 'wait'; durationMs: number }
  | { action: 'triggerScheduled'; triggerId: string }
  | { action: 'callMutation'; function: string; args: Record<string, any>; expectError?: boolean }
  | { action: 'callQuery'; function: string; args: Record<string, any> }
  | { action: 'callMutationParallel'; mutations: Array<{ function: string; args: Record<string, any> }> }
  | { action: 'submitAssessmentAnswers'; answers: number[] }
  // Expectations
  | { expect: 'crisisDetected'; value: boolean }
  | { expect: 'response'; contains: string }
  | { expect: 'response'; notContains: string }
  | { expect: 'responseTime'; lessThan: number }
  | { expect: 'agentType'; equals: 'main' | 'crisis' | 'assessment' }
  | { expect: 'alertCreated'; severity: string }
  | { expect: 'messageCount'; equals: number }
  | { expect: 'profileUpdated'; field: string; value: string }
  | { expect: 'memoryCreated'; category: string; importance: number }
  | { expect: 'memoriesReturned'; count: number; firstMemory?: { category: string; content: string; importance: number }; allMatchCategory?: string }
  | { expect: 'memoriesOrdered'; order: number[] }
  | { expect: 'assessmentCreated'; definitionId: string; status: string }
  | { expect: 'assessmentFinalized'; status: string; compositeScore: number; zoneScores: Record<string, string | number> }
  | { expect: 'assessmentStatus'; status: string; questionIndex: number }
  | { expect: 'assessmentScores'; compositeScore: number; zoneScores: Record<string, number> }
  | { expect: 'activeSessionExists'; questionIndex: number; definitionId: string }
  | { expect: 'cooldownError'; message: string; daysRemaining: number }
  | { expect: 'errorThrown'; message: string };

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
  userId: string; // Phone number / external ID
  convexUserId?: any; // Actual Convex database ID (Id<"users">)
  threadId?: string;
  assessmentId?: any; // Latest assessment ID for submitAssessmentAnswers
  lastMutationResult?: any; // Result from last mutation call
  lastQueryResult?: any; // Result from last query call
  lastError?: Error; // Last error thrown (for expectError tests)
  variables: Map<string, unknown>;
  trace: {
    messages: Array<{ role: string; content: string; timestamp: number }>;
    agentCalls: Array<{ agent: string; duration: number; success: boolean }>;
    alerts: Array<{ type: string; severity: string; timestamp: number }>;
  };
}
