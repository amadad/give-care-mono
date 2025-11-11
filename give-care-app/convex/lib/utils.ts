/**
 * Consolidated Utilities
 *
 * Small utility functions consolidated from multiple files.
 * Keep separate: prompts.ts, assessmentCatalog.ts, types.ts, validators.ts, models.ts
 */

import { Agent } from '@convex-dev/agent';
import { ConvexError } from 'convex/values';
import { components } from '../_generated/api';
import type { ActionCtx, QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import type { Doc } from '../_generated/dataModel';
import type { UserProfile, AgentMetadata, AgentContext } from './types';
import { AssessmentSlug, CATALOG, type AssessmentAnswer } from './assessmentCatalog';

// ============================================================================
// AGENT HELPERS
// ============================================================================

export async function ensureAgentThread(
  ctx: ActionCtx,
  agent: Agent,
  userId: string,
  threadId?: string,
  userMetadata?: Record<string, unknown>
): Promise<{ thread: any; threadId: string }> {
  let finalThreadId = threadId;
  if (!finalThreadId && userMetadata) {
    const convexMetadata = userMetadata.convex as Record<string, unknown> | undefined;
    const cachedThreadId = convexMetadata?.threadId as string | undefined;
    if (cachedThreadId) {
      const thread = await ctx.runQuery(components.agent.threads.getThread, {
        threadId: cachedThreadId,
      });
      if (thread) {
        finalThreadId = cachedThreadId;
      }
    }
  }

  if (finalThreadId) {
    const threadResult = await agent.continueThread(ctx, {
      threadId: finalThreadId,
      userId,
    });
    return {
      thread: threadResult.thread,
      threadId: finalThreadId,
    };
  }

  const existingThreadsResult = await ctx.runQuery(
    components.agent.threads.listThreadsByUserId,
    {
      userId,
      paginationOpts: { cursor: null, numItems: 1 },
      order: 'desc',
    }
  );

  let foundThreadId: string;
  if (existingThreadsResult?.page?.length > 0) {
    foundThreadId = existingThreadsResult.page[0]._id;
  } else {
    const threadResult = await agent.createThread(ctx, { userId });
    foundThreadId = threadResult.threadId;
  }

  const threadResult = await agent.continueThread(ctx, {
    threadId: foundThreadId,
    userId,
  });
  return {
    thread: threadResult.thread,
    threadId: foundThreadId,
  };
}

// ============================================================================
// ASSESSMENT HELPERS
// ============================================================================

type SessionAnswer = Doc<'assessment_sessions'>['answers'][number];
type AssessmentAnswerDoc = Doc<'assessments'>['answers'][number];
type AnyAnswer = SessionAnswer | AssessmentAnswerDoc;

export function toAssessmentAnswers(answers: SessionAnswer[]): AssessmentAnswer[] {
  return convertAnswers(answers);
}

export function assessmentAnswersToArray(answers: AssessmentAnswerDoc[]): AssessmentAnswer[] {
  return convertAnswers(answers);
}

function convertAnswers(answers: AnyAnswer[]): AssessmentAnswer[] {
  return answers.map((answer, idx) => ({
    questionIndex: Number.isNaN(Number.parseInt(answer.questionId, 10))
      ? idx
      : Number.parseInt(answer.questionId, 10),
    value: answer.value,
  }));
}

export function isValidAnswerValue(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 5;
}

export function normalizeAnswerValue(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

// ============================================================================
// ZONE MAPPING
// ============================================================================

export function mapToInterventionZones(
  definition: AssessmentSlug,
  zones: string[]
): string[] {
  const mapped: string[] = [];

  for (const zone of zones) {
    if (definition === 'reach2') {
      if (zone === 'informational' || zone === 'spiritual') {
        mapped.push('social');
      } else {
        mapped.push(zone);
      }
    } else if (definition === 'sdoh') {
      if (zone === 'transportation') {
        mapped.push('time');
      } else if (zone === 'housing') {
        mapped.push('physical');
      } else if (zone === 'community' || zone === 'clinical') {
        mapped.push('social');
      } else {
        mapped.push(zone);
      }
    } else {
      mapped.push(zone);
    }
  }

  return [...new Set(mapped)];
}

// ============================================================================
// PROFILE HELPERS
// ============================================================================

export const extractProfileVariables = (profile: UserProfile | undefined) => {
  return {
    userName: profile?.firstName || 'there',
    relationship: profile?.relationship || 'caregiver',
    careRecipient: profile?.careRecipientName || 'loved one',
  };
};

export function buildWellnessInfo(metadata: AgentMetadata | undefined): string {
  if (!metadata) return '';

  const parts: string[] = [];

  if (metadata.wellnessScore !== undefined) {
    parts.push(`Current wellness score: ${metadata.wellnessScore}`);
  }

  if (metadata.pressureZones && Array.isArray(metadata.pressureZones) && metadata.pressureZones.length > 0) {
    parts.push(`Areas of concern: ${metadata.pressureZones.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('. ') + '.' : '';
}

export function getProfileFromMetadata(
  metadata: Record<string, unknown> | undefined
): UserProfile | undefined {
  if (!metadata?.profile) return undefined;
  const profile = metadata.profile;
  if (profile && typeof profile === 'object' && 'firstName' in profile) {
    return profile as UserProfile;
  }
  return undefined;
}

export function getNextMissingField(
  profile: UserProfile | undefined,
  context: { needsLocalResources?: boolean }
): { field: string; prompt: string } | null {
  if (!profile?.careRecipientName) {
    return {
      field: 'careRecipientName',
      prompt: "If you haven't asked recently, weave in: 'Who are you caring for?' (Reply 'skip' to move on)",
    };
  }

  if (!profile?.zipCode && context.needsLocalResources) {
    return {
      field: 'zipCode',
      prompt: "Ask: 'What's your ZIP code so I can find resources near you?' (Reply 'skip' to move on)",
    };
  }

  if (!profile?.firstName) {
    return {
      field: 'firstName',
      prompt: "If you haven't asked recently, weave in: 'What should I call you?' (Reply 'skip' to move on)",
    };
  }

  if (!profile?.relationship && profile?.careRecipientName) {
    return {
      field: 'relationship',
      prompt: `Ask: 'What's your relationship to ${profile.careRecipientName}?' (Reply 'skip' to move on)`,
    };
  }

  return null;
}

export function extractSDOHProfile(answers: AssessmentAnswer[]): Partial<UserProfile & {
  financialStatus?: 'struggling' | 'stable' | 'comfortable';
  transportationReliability?: 'reliable' | 'unreliable';
  housingStability?: 'stable' | 'at_risk';
  communityAccess?: 'good' | 'poor';
  clinicalCoordination?: 'good' | 'poor';
}> {
  const catalog = CATALOG['sdoh'];
  const buckets = catalog.zoneBuckets || {};

  const totals: Record<string, number> = {};
  const count: Record<string, number> = {};

  for (const [zone, indexes] of Object.entries(buckets)) {
    totals[zone] = 0;
    count[zone] = 0;
    for (const idx of indexes) {
      const answer = answers.find((a) => a.questionIndex === idx);
      if (!answer) continue;
      const value = Math.min(5, Math.max(1, answer.value));
      totals[zone] += value;
      count[zone] += 1;
    }
  }

  const averages: Record<string, number> = {};
  for (const zone of Object.keys(buckets)) {
    averages[zone] = count[zone] ? totals[zone] / count[zone] : 0;
  }

  const result: any = {};

  const financialAvg = averages.financial || 0;
  if (financialAvg >= 4) result.financialStatus = 'comfortable';
  else if (financialAvg >= 2.5) result.financialStatus = 'stable';
  else result.financialStatus = 'struggling';

  const transportAvg = averages.transportation || 0;
  result.transportationReliability = transportAvg >= 3 ? 'reliable' : 'unreliable';

  const housingAvg = averages.housing || 0;
  result.housingStability = housingAvg >= 3 ? 'stable' : 'at_risk';

  const communityAvg = averages.community || 0;
  result.communityAccess = communityAvg >= 3 ? 'good' : 'poor';

  const clinicalAvg = averages.clinical || 0;
  result.clinicalCoordination = clinicalAvg >= 3 ? 'good' : 'poor';

  return result;
}

// ============================================================================
// POLICY / CRISIS
// ============================================================================

export type CrisisSeverity = 'low' | 'medium' | 'high';

const crisisKeywordMap: Array<{ keyword: string; severity: CrisisSeverity }> = [
  { keyword: 'kill myself', severity: 'high' },
  { keyword: 'suicide', severity: 'high' },
  { keyword: 'i want to die', severity: 'high' },
  { keyword: 'end my life', severity: 'high' },
  { keyword: 'hurt myself', severity: 'medium' },
  { keyword: 'self harm', severity: 'medium' },
  { keyword: "can't go on", severity: 'medium' },
  { keyword: 'hopeless', severity: 'medium' },
  { keyword: 'done with life', severity: 'medium' },
  { keyword: 'make it stop', severity: 'medium' },
  { keyword: 'panic attack', severity: 'low' },
  { keyword: 'overdose', severity: 'high' },
  { keyword: 'lost control', severity: 'medium' },
];

export type CrisisDetection = {
  hit: boolean;
  severity?: CrisisSeverity;
  keyword?: string;
};

export const detectCrisis = (text: string): CrisisDetection => {
  const lower = text.toLowerCase();
  const match = crisisKeywordMap.find(({ keyword }) => lower.includes(keyword));
  if (!match) return { hit: false };
  return { hit: true, severity: match.severity, keyword: match.keyword };
};

export const crisisResponse = (userName?: string) =>
  `I hear how hard this is${userName ? `, ${userName}` : ''}. You are not alone.\n\n988 Suicide & Crisis Lifeline (call or text)\n741741 Crisis Text Line (text HOME)\n911 if you're in immediate danger.\n\nWant help contacting one?`;

export const getTone = (context: AgentContext): string => {
  return 'Be warm, empathetic, and concise. Validate feelings before offering solutions.';
};

// ============================================================================
// CORE DATABASE HELPERS
// ============================================================================

const DEFAULT_LOCALE = 'en-US';

export const getByExternalId = async (ctx: QueryCtx | MutationCtx, externalId: string) => {
  return ctx.db
    .query('users')
    .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
    .unique();
};

type EnsureUserParams = {
  externalId: string;
  channel: 'sms' | 'email' | 'web';
  phone?: string;
  locale?: string;
  consent?: { emergency: boolean; marketing: boolean };
  metadata?: Record<string, unknown>;
};

export const ensureUser = async (ctx: MutationCtx, params: EnsureUserParams) => {
  const existing = await getByExternalId(ctx, params.externalId);
  if (existing) {
    if (params.phone && !existing.phone) {
      await ctx.db.patch(existing._id, { phone: params.phone });
      const updated = await ctx.db.get(existing._id);
      return updated!;
    }
    return existing;
  }

  const userId = await ctx.db.insert('users', {
    externalId: params.externalId,
    phone: params.phone,
    channel: params.channel,
    locale: params.locale ?? DEFAULT_LOCALE,
    consent: params.consent,
    metadata: params.metadata ?? {},
  });

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error('Failed to load user after insert');
  }
  return user;
};

export const logAgentRun = async (
  ctx: MutationCtx,
  payload: {
    externalId: string;
    agent: string;
    policyBundle: string;
    budgetResult: { usedInputTokens: number; usedOutputTokens: number; toolCalls: number };
    latencyMs: number;
    traceId: string;
  }
) => {
  const user = await getByExternalId(ctx, payload.externalId);
  if (!user) return;

  await ctx.db.insert('agent_runs', {
    userId: user._id,
    agent: payload.agent,
    policyBundle: payload.policyBundle,
    budgetResult: payload.budgetResult,
    latencyMs: payload.latencyMs,
    traceId: payload.traceId,
  });
};

export const logGuardrail = async (
  ctx: MutationCtx,
  payload: {
    externalId?: string;
    ruleId: string;
    action: string;
    context?: Record<string, unknown>;
    traceId: string;
  }
) => {
  const user = payload.externalId ? await getByExternalId(ctx, payload.externalId) : null;
  await ctx.db.insert('guardrail_events', {
    userId: user?._id,
    ruleId: payload.ruleId,
    action: payload.action,
    context: payload.context ?? {},
    traceId: payload.traceId,
  });
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const MS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
export const RACE_TIMEOUT_MS = 1500;
export const FACT_EXTRACTION_TIMEOUT_MS = 2000;
export const CONTEXT_BUILDING_TIMEOUT_MS = 2000;
export const DEFAULT_MEMORY_LIMIT = 5;
export const DEFAULT_MEMORY_IMPORTANCE = 5;
export const MIN_PHONE_DIGITS = 10;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// ERROR CLASSES (Simplified - inline where possible)
// ============================================================================

export class RateLimitError extends ConvexError<string> {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`);
  }
}

export class UserNotFoundError extends ConvexError<string> {
  constructor(externalId: string) {
    super(`User not found: ${externalId}`);
  }
}

