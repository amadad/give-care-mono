import { ConvexHttpClient } from 'convex/browser';
import { Store } from './store.driver';
import { HydratedContext, Inbound, AgentRunBudgetResult } from '../../shared/types';

const convexUrl = process.env.HARNESS_CONVEX_URL;
const convexToken = process.env.HARNESS_CONVEX_TOKEN;
const client = convexUrl ? new ConvexHttpClient(convexUrl) : null;

const createDefaultContext = (input: Inbound): HydratedContext => ({
  userId: input.userId,
  sessionId: `session-${input.userId}`,
  locale: (input.meta?.locale as string) ?? 'en-US',
  budget: { maxInputTokens: 2000, maxOutputTokens: 1000, maxTools: 2 },
  policyBundle: 'trauma_informed_v1',
  promptHistory: [],
  consent: { emergency: false, marketing: false },
  metadata: { fallback: true, channel: input.channel, traceable: false },
});

const isConfigured = () => Boolean(client && convexToken);

const mutate = async <T>(name: string, args: Record<string, unknown>): Promise<T> => {
  if (!client || !convexToken) {
    throw new Error('HARNESS_CONVEX_URL and HARNESS_CONVEX_TOKEN must be set to use ConvexStore');
  }
  return client.mutation(name as any, { token: convexToken, ...args });
};

const query = async <T>(name: string, args: Record<string, unknown> = {}): Promise<T> => {
  if (!client || !convexToken) {
    throw new Error('HARNESS_CONVEX_URL and HARNESS_CONVEX_TOKEN must be set to use ConvexStore');
  }
  return client.query(name as any, { token: convexToken, ...args });
};

export const ConvexStore: Store = {
  async hydrateContext(input: Inbound): Promise<HydratedContext> {
    if (!isConfigured()) {
      return createDefaultContext(input);
    }
    try {
      return await mutate<HydratedContext>('context:hydrate', {
        user: {
          externalId: input.userId,
          channel: input.channel,
          locale: (input.meta?.locale as string) ?? 'en-US',
          phone: (input.meta?.phone as string) ?? undefined,
        },
      });
    } catch (error) {
      console.error('Convex hydrateContext failed', error);
      return createDefaultContext(input);
    }
  },
  async persistContext(ctx: HydratedContext): Promise<void> {
    if (!isConfigured()) return;
    await mutate('context:persist', { context: ctx });
  },
  async saveInbound({ input, traceId }: { input: Inbound; traceId: string }): Promise<void> {
    if (!isConfigured()) return;
    await mutate('messages:recordInbound', {
      message: {
        externalId: input.userId,
        channel: input.channel,
        text: input.text,
        meta: input.meta,
        traceId,
      },
    });
  },
  async saveOutbound({ userId, channel, text, traceId }: { userId: string; channel: Inbound['channel']; text: string; traceId: string }): Promise<void> {
    if (!isConfigured()) return;
    await mutate('messages:recordOutbound', {
      message: {
        externalId: userId,
        channel,
        text,
        meta: { channel },
        traceId,
      },
    });
  },
  async logAgentRun(run: {
    agent: string;
    userId: string;
    policyBundle: string;
    result: AgentRunBudgetResult;
    traceId: string;
    latencyMs: number;
  }): Promise<void> {
    if (!isConfigured()) return;
    await mutate('logs:agentRun', {
      payload: {
        externalId: run.userId,
        agent: run.agent,
        policyBundle: run.policyBundle,
        budgetResult: run.result,
        latencyMs: run.latencyMs,
        traceId: run.traceId,
      },
    });
  },
  async logGuardrail(event: {
    ruleId: string;
    action: string;
    context: Record<string, unknown>;
    traceId: string;
    userId?: string;
  }): Promise<void> {
    if (!isConfigured()) return;
    await mutate('logs:guardrail', {
      payload: {
        externalId: event.userId ?? 'unknown',
        ruleId: event.ruleId,
        action: event.action,
        context: event.context,
        traceId: event.traceId,
      },
    });
  },
  async startAssessmentSession({ userId, definitionId }) {
    if (!isConfigured()) {
      return {
        sessionId: `local-${Date.now()}`,
        question: {
          id: 'energy',
          prompt: 'How much energy do you have?',
          type: 'scale',
          min: 0,
          max: 4,
        },
      };
    }
    return mutate('assessments:start', { userId, definitionId });
  },
  async recordAssessmentAnswer(input) {
    if (!isConfigured()) {
      return { completed: true };
    }
    return mutate('assessments:recordAnswer', input);
  },
  async getWellnessStatus(userId) {
    if (!isConfigured()) {
      return {
        summary: 'Wellness status unavailable (offline mode).',
        pressureZones: [],
        trend: [],
      };
    }
    return query('wellness:getStatus', { userId });
  },
  async saveMemoryEntry(entry) {
    if (!isConfigured()) return;
    await mutate('memory:record', entry);
  },
  async fetchPendingAlerts(limit) {
    if (!isConfigured()) return [];
    return query('alerts:listPending', { limit });
  },
  async markAlertProcessed(alertId, result) {
    if (!isConfigured()) return;
    await mutate('alerts:markProcessed', { alertId, result });
  },
  async applyStripeEvent(event) {
    if (!isConfigured()) return;
    await mutate('billing:applyStripeEvent', event);
  },
  async refreshEntitlements(userId) {
    if (!isConfigured()) {
      return { plan: 'free', entitlements: ['assessments'], validUntil: undefined };
    }
    return mutate('billing:refreshEntitlements', { userId });
  },
  async logEmailDelivery(event) {
    if (!isConfigured()) return;
    await mutate('email:logDelivery', event);
  },
  async getAdminMetrics() {
    if (!isConfigured()) {
      return { totalUsers: 0, activeSubscriptions: 0, alertsLast24h: 0, avgLatencyMs: 0 };
    }
    return query('admin:getMetrics');
  },
};
