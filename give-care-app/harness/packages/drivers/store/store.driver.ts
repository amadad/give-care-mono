import {
  HydratedContext,
  Inbound,
  AgentRunBudgetResult,
  Channel,
  AssessmentQuestion,
  WellnessStatus,
  AlertRecord,
  EntitlementsSummary,
  AdminMetrics,
} from '../../shared/types';

export interface Store {
  hydrateContext(input: Inbound): Promise<HydratedContext>;
  persistContext(ctx: HydratedContext): Promise<void>;
  saveInbound(message: { input: Inbound; traceId: string }): Promise<void>;
  saveOutbound(message: { userId: string; channel: Channel; text: string; traceId: string }): Promise<void>;
  logAgentRun(run: {
    agent: string;
    userId: string;
    policyBundle: string;
    result: AgentRunBudgetResult;
    traceId: string;
    latencyMs: number;
  }): Promise<void>;
  logGuardrail(event: {
    ruleId: string;
    action: string;
    context: Record<string, unknown>;
    traceId: string;
    userId?: string;
  }): Promise<void>;
  startAssessmentSession(input: {
    userId: string;
    definitionId: string;
  }): Promise<{ sessionId: string; question: AssessmentQuestion }>;
  recordAssessmentAnswer(input: {
    sessionId: string;
    definitionId: string;
    questionId: string;
    value: number;
  }): Promise<{ nextQuestion?: AssessmentQuestion | null; completed: boolean; score?: { total: number; band: string; explanation: string } }>;
  getWellnessStatus(userId: string): Promise<WellnessStatus>;
  saveMemoryEntry(entry: { userId: string; category: string; content: string; importance: number }): Promise<void>;
  fetchPendingAlerts(limit: number): Promise<AlertRecord[]>;
  markAlertProcessed(alertId: string, result: { deliveredVia: 'sms' | 'email'; metadata?: Record<string, unknown> }): Promise<void>;
  applyStripeEvent(event: { id: string; type: string; payload: Record<string, unknown> }): Promise<void>;
  refreshEntitlements(userId: string): Promise<EntitlementsSummary>;
  logEmailDelivery(event: { userId?: string; to: string; subject: string; status: string; traceId: string }): Promise<void>;
  getAdminMetrics(): Promise<AdminMetrics>;
}
