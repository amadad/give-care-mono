import { z } from 'zod';

export type Channel = 'sms' | 'web';

export type Inbound = {
  channel: Channel;
  userId: string;
  text: string;
  meta: Record<string, unknown>;
};

export type StepLog = {
  t: number;
  event: string;
  data: Record<string, unknown>;
};

export type Budget = {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTools: number;
};

export type AgentRunBudgetResult = {
  usedInputTokens: number;
  usedOutputTokens: number;
  toolCalls: number;
};

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

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  type: 'scale' | 'text';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
};

export type WellnessStatus = {
  summary: string;
  latestScore?: number;
  trend: Array<{ label: string; value: number; recordedAt: number }>;
  pressureZones: string[];
};

export type AlertRecord = {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channel: 'sms' | 'email';
  message: string;
  payload: Record<string, unknown>;
};

export type EntitlementsSummary = {
  plan: string;
  entitlements: string[];
  validUntil?: string;
};

export type AdminMetrics = {
  totalUsers: number;
  activeSubscriptions: number;
  alertsLast24h: number;
  avgLatencyMs: number;
};

export type CapabilityIO = {
  input: z.ZodTypeAny;
  output?: z.ZodTypeAny;
};

export type CapabilityMetadata = {
  name: string;
  costHint: 'low' | 'medium' | 'high';
  latencyHint: 'low' | 'medium' | 'high';
  requiresConsent?: boolean;
  description?: string;
};

export type CapabilityDefinition<TInput, TOutput> = CapabilityMetadata & {
  io: CapabilityIO;
  run: (args: TInput, ctx: CapabilityContext) => Promise<TOutput>;
};

export type CapabilityContext = {
  userId: string;
  store: StorePort;
  services: ServiceLocator;
  trace: Trace;
  budget: Budget;
  context: HydratedContext;
  scheduler: SchedulerPort;
};

export type CapabilityRegistry = {
  get(name: string): CapabilityDefinition<any, any> | undefined;
  list(): CapabilityDefinition<any, any>[];
};

export type CapabilityRuntime = CapabilityRegistry & {
  invoke<TInput = unknown, TOutput = unknown>(name: string, args: TInput): Promise<TOutput>;
};

export type ServiceLocator = {
  assessment: Services['assessment'];
  scheduling: Services['scheduling'];
  interventions: Services['interventions'];
  billing: Services['billing'];
  memory: Services['memory'];
  resources: Services['resources'];
  email: Services['email'];
};

export type Services = {
  assessment: typeof import('../services/assessment');
  scheduling: typeof import('../services/scheduling');
  interventions: typeof import('../services/interventions');
  billing: typeof import('../services/billing');
  memory: typeof import('../services/memory');
  resources: typeof import('../services/resources');
  email: typeof import('../services/email');
};

export type ModelDriver = import('../drivers/model/model.driver').ModelDriver;
export type StorePort = import('../drivers/store/store.driver').Store;
export type SchedulerPort = import('../drivers/scheduler/scheduler.driver').Scheduler;

export type Trace = {
  id: string;
  steps: StepLog[];
  push(event: string, data?: Record<string, unknown>): void;
};
