# Convex Idiomatic Solutions for Code Quality Issues

**Date:** 2025-01-11  
**Purpose:** Convex-specific patterns and best practices for addressing type safety, error handling, testing, and code duplication

---

## 1. Type Safety: Replacing `v.any()` with Typed Validators

### Problem
- 15 instances of `v.any()` in schema (metadata, preferences, demographics)
- 611 total uses of `any`/`unknown` across codebase
- No compile-time safety for metadata access

### Convex Idiomatic Solution

**Pattern:** Create typed validators that mirror TypeScript interfaces, then use them in schema and function args.

#### Step 1: Create Validators in `lib/validators.ts`

```typescript
import { v } from 'convex/values';

// User Profile Validator
export const userProfileValidator = v.object({
  firstName: v.optional(v.string()),
  relationship: v.optional(v.string()),
  careRecipientName: v.optional(v.string()),
  zipCode: v.optional(v.string()),
  financialStatus: v.optional(v.union(
    v.literal('struggling'),
    v.literal('stable'),
    v.literal('comfortable')
  )),
  transportationReliability: v.optional(v.union(
    v.literal('reliable'),
    v.literal('unreliable')
  )),
  housingStability: v.optional(v.union(
    v.literal('stable'),
    v.literal('at_risk')
  )),
  communityAccess: v.optional(v.union(
    v.literal('good'),
    v.literal('poor')
  )),
  clinicalCoordination: v.optional(v.union(
    v.literal('good'),
    v.literal('poor')
  )),
  preferredCheckInHour: v.optional(v.number()),
  // Allow additional fields for extensibility
  // Use v.any() only for truly dynamic fields
});

// Agent Metadata Validator
export const agentMetadataValidator = v.object({
  profile: v.optional(userProfileValidator),
  journeyPhase: v.optional(v.string()),
  totalInteractionCount: v.optional(v.number()),
  enrichedContext: v.optional(v.string()),
  contextUpdatedAt: v.optional(v.number()),
  timezone: v.optional(v.string()),
  convex: v.optional(v.object({
    userId: v.optional(v.id('users')),
    threadId: v.optional(v.string()),
  })),
});

// Update agentContextValidator
export const agentContextValidator = v.object({
  userId: v.string(),
  sessionId: v.optional(v.string()),
  locale: v.string(),
  consent: v.object({
    emergency: v.boolean(),
    marketing: v.boolean(),
  }),
  crisisFlags: v.optional(
    v.object({
      active: v.boolean(),
      terms: v.array(v.string()),
    })
  ),
  metadata: v.optional(agentMetadataValidator), // ✅ Typed instead of v.any()
});
```

#### Step 2: Update Schema

```typescript
// schema.ts
import { userProfileValidator, agentMetadataValidator } from './lib/validators';

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    channel: v.union(v.literal('sms'), v.literal('email'), v.literal('web')),
    locale: v.string(),
    consent: v.optional(consentValidator),
    address: v.optional(addressValidator),
    metadata: v.optional(agentMetadataValidator), // ✅ Typed instead of v.any()
  })
    .index('by_externalId', ['externalId'])
    .index('by_phone', ['phone']),

  profiles: defineTable({
    userId: v.id('users'),
    demographics: v.optional(v.object({
      age: v.optional(v.number()),
      gender: v.optional(v.string()),
      // Add specific fields instead of v.any()
    })),
    preferences: v.optional(v.object({
      notificationFrequency: v.optional(v.string()),
      preferredContactTime: v.optional(v.string()),
      // Add specific fields instead of v.any()
    })),
  }).index('by_user', ['userId']),
});
```

#### Step 3: Use Validators in Function Args

```typescript
// Instead of:
handler: async (ctx, { metadata }: { metadata?: Record<string, unknown> }) => {
  const profile = (metadata?.profile as UserProfile | undefined);
}

// Use:
import { agentMetadataValidator } from './lib/validators';

export const myFunction = query({
  args: {
    metadata: v.optional(agentMetadataValidator), // ✅ Typed validation
  },
  handler: async (ctx, { metadata }) => {
    // TypeScript knows metadata.profile is UserProfile | undefined
    const profile = metadata?.profile; // ✅ No type assertion needed
  },
});
```

#### Step 4: Type Guards for Runtime Validation

```typescript
// lib/typeGuards.ts
import type { UserProfile } from './types';
import { userProfileValidator } from './validators';

/**
 * Type guard to validate profile at runtime
 * Use when reading from database (which may have old data)
 */
export function isValidProfile(data: unknown): data is UserProfile {
  if (!data || typeof data !== 'object') return false;
  
  const profile = data as Record<string, unknown>;
  
  // Check required structure (adjust based on your needs)
  return (
    (profile.firstName === undefined || typeof profile.firstName === 'string') &&
    (profile.relationship === undefined || typeof profile.relationship === 'string') &&
    (profile.careRecipientName === undefined || typeof profile.careRecipientName === 'string')
  );
}

// Usage:
const metadata = user.metadata as Record<string, unknown> | undefined;
if (metadata?.profile && isValidProfile(metadata.profile)) {
  // TypeScript knows metadata.profile is UserProfile
  const firstName = metadata.profile.firstName; // ✅ Type-safe
}
```

### Migration Strategy

1. **Start with high-traffic paths** (agents, inbound processing)
2. **Create validators incrementally** (one interface at a time)
3. **Use type guards for backward compatibility** (old data in DB)
4. **Update schema gradually** (add new fields with validators, keep old ones optional)

### Benefits

- ✅ Compile-time type checking
- ✅ Runtime validation at function boundaries
- ✅ Better IDE autocomplete
- ✅ Easier refactoring
- ✅ Self-documenting code

---

## 2. Error Handling: Consistent Patterns

### Problem
- Inconsistent error handling (some try/catch, some console.error, some silent)
- No structured error logging
- Missing error tracking

### Convex Idiomatic Solution

**Pattern:** Use `ConvexError` for application errors, structured logging for all errors, and consistent fallback patterns.

#### Step 1: Create Error Utilities

```typescript
// lib/errors.ts
import { ConvexError } from 'convex/values';
import { logger } from './logger';

/**
 * Application Error Types
 */
export class RateLimitError extends ConvexError {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`);
    this.name = 'RateLimitError';
  }
}

export class UserNotFoundError extends ConvexError {
  constructor(externalId: string) {
    super(`User not found: ${externalId}`);
    this.name = 'UserNotFoundError';
  }
}

export class ValidationError extends ConvexError {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`);
    this.name = 'ValidationError';
  }
}

/**
 * Structured Error Logging
 */
export interface ErrorContext {
  userId?: string;
  agent?: string;
  function?: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

export function logError(
  error: unknown,
  context: ErrorContext,
  level: 'error' | 'warn' = 'error'
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  const logData = {
    message: errorMessage,
    stack: errorStack,
    ...context,
    timestamp: Date.now(),
  };

  if (level === 'error') {
    logger.error(`[${context.function || 'unknown'}] ${errorMessage}`, logData);
  } else {
    logger.warn(`[${context.function || 'unknown'}] ${errorMessage}`, logData);
  }
}

/**
 * Safe Error Handler Wrapper
 * Wraps async handlers with consistent error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      
      // Re-throw ConvexError (application errors)
      if (error instanceof ConvexError) {
        throw error;
      }
      
      // Wrap unexpected errors
      throw new ConvexError(`Internal error in ${context.function || 'unknown'}`);
    }
  }) as T;
}
```

#### Step 2: Standardize Agent Error Handling

```typescript
// agents/main.ts
import { logError, withErrorHandling } from '../lib/errors';
import { logger } from '../lib/logger';

export const runMainAgent = action({
  args: {
    input: v.object({
      channel: channelValidator,
      text: v.string(),
      userId: v.string(),
    }),
    context: agentContextValidator,
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { input, context, threadId }) => {
    const startTime = Date.now();
    const traceId = `main-${Date.now()}`;
    const errorContext: ErrorContext = {
      userId: context.userId,
      agent: 'main',
      function: 'runMainAgent',
      traceId,
    };

    try {
      // ... existing logic ...
      
      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      // ✅ Structured error logging
      logError(error, errorContext);
      
      // ✅ User-friendly fallback
      const metadata = (context.metadata ?? {}) as Record<string, unknown>;
      const profile = (metadata.profile as UserProfile | undefined);
      const userName = profile?.firstName ?? 'caregiver';
      const careRecipient = profile?.careRecipientName ?? 'your loved one';

      const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

      // ✅ Log error run (non-blocking)
      const errorLogPromise = ctx.runMutation(internal.internal.logAgentRunInternal, {
        externalId: context.userId,
        agent: 'main',
        policyBundle: 'default_v1',
        budgetResult: {
          usedInputTokens: input.text.length,
          usedOutputTokens: fallbackResponse.length,
          toolCalls: 0,
        },
        latencyMs: Date.now() - startTime,
        traceId: `main-error-${Date.now()}`,
      });
      errorLogPromise.catch((err) => {
        logError(err, { ...errorContext, function: 'logAgentRunInternal' }, 'warn');
      });

      return {
        text: fallbackResponse,
        latencyMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
```

#### Step 3: Use ConvexError for Application Errors

```typescript
// inbound.ts
import { RateLimitError, UserNotFoundError } from '../lib/errors';

export const processInbound = internalAction({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(internal.inboundHelpers.getInboundContext, {
      messageSid: args.messageSid,
      phone: args.phone,
    });

    // ✅ Use ConvexError for application errors
    if (!context.rateLimitOk) {
      throw new RateLimitError(context.rateLimitRetryAfter ?? 60000);
    }

    let user = context.user;
    if (!user || context.needsUserCreation) {
      user = await ctx.runMutation(internal.internal.ensureUserMutation, {
        externalId: args.phone,
        channel: 'sms' as const,
        phone: args.phone,
      });
      
      if (!user) {
        throw new UserNotFoundError(args.phone);
      }
    }

    // ... rest of logic ...
  },
});
```

#### Step 4: Consistent Promise Handling

```typescript
// lib/promiseHelpers.ts

/**
 * Safely handle fire-and-forget promises
 * Use for non-critical background operations
 */
export function handleBackgroundPromise<T>(
  promise: Promise<T>,
  context: ErrorContext,
  onError?: (error: unknown) => void
): void {
  promise.catch((error) => {
    logError(error, { ...context, function: 'background' }, 'warn');
    onError?.(error);
  });
}

// Usage:
import { handleBackgroundPromise } from '../lib/promiseHelpers';

const enrichPromise = workflow.start(ctx, internal.workflows.memory.enrichMemory, {
  userId: context.userId,
  threadId: newThreadId,
  recentMessages: recentMessages.slice(-3),
});

handleBackgroundPromise(enrichPromise, {
  userId: context.userId,
  agent: 'main',
  function: 'enrichMemory',
});
```

### Benefits

- ✅ Consistent error handling across codebase
- ✅ Structured logging for debugging
- ✅ User-friendly error messages
- ✅ Error tracking and analytics
- ✅ Better error recovery

---

## 3. Testing: Comprehensive Test Coverage

### Problem
- Only `setup.test.ts` exists (~1% coverage)
- No unit tests for utilities
- No integration tests for workflows
- No E2E tests for agent flows

### Convex Idiomatic Solution

**Pattern:** Use `convexTest()` for unit/integration tests, simulation tests for agent flows, and test utilities for common patterns.

#### Step 1: Enhance Test Setup

```typescript
// convex/test.setup.ts
import { convexTest } from "convex-test";
import schema from "./schema.js";
import agent from "@convex-dev/agent/test";
import workflow from "@convex-dev/workflow/test";
import rateLimiter from "@convex-dev/rate-limiter/test";

export const modules = import.meta.glob("./**/*.*s");

export function initConvexTest() {
  const t = convexTest(schema, modules);
  
  // Register components
  agent.register(t, "agent");
  t.registerComponent("workflow", workflow.schema, workflow.modules);
  rateLimiter.register(t, "rateLimiter");
  
  return t;
}

// Test utilities
export async function createTestUser(t: ReturnType<typeof initConvexTest>, overrides?: {
  externalId?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}) {
  const userId = await t.mutation(internal.internal.ensureUserMutation, {
    externalId: overrides?.externalId ?? '+15551234567',
    channel: 'sms' as const,
    phone: overrides?.phone ?? '+15551234567',
    metadata: overrides?.metadata,
  });
  return userId;
}

export async function createTestAssessment(
  t: ReturnType<typeof initConvexTest>,
  userId: string,
  definition: 'ema' | 'bsfc' | 'reach2' | 'sdoh' = 'ema'
) {
  const assessmentId = await t.mutation(api.assessments.startAssessment, {
    userId,
    definition,
    channel: 'sms' as const,
  });
  return assessmentId;
}
```

#### Step 2: Unit Tests for Utilities

```typescript
// tests/lib/profile.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { initConvexTest, createTestUser } from '../../convex/test.setup';
import { extractProfileVariables, getNextMissingField } from '../../convex/lib/profile';

describe('Profile Utilities', () => {
  let t: ReturnType<typeof initConvexTest>;

  beforeEach(() => {
    t = initConvexTest();
  });

  describe('extractProfileVariables', () => {
    it('extracts profile variables correctly', () => {
      const profile = {
        firstName: 'Sarah',
        relationship: 'daughter',
        careRecipientName: 'Mom',
      };
      
      const result = extractProfileVariables(profile);
      
      expect(result.userName).toBe('Sarah');
      expect(result.relationship).toBe('daughter');
      expect(result.careRecipient).toBe('Mom');
    });

    it('uses defaults when profile is undefined', () => {
      const result = extractProfileVariables(undefined);
      
      expect(result.userName).toBe('there');
      expect(result.relationship).toBe('caregiver');
      expect(result.careRecipient).toBe('loved one');
    });
  });

  describe('getNextMissingField', () => {
    it('returns careRecipientName first', () => {
      const result = getNextMissingField(undefined, {});
      
      expect(result?.field).toBe('careRecipientName');
      expect(result?.prompt).toContain("Who are you caring for");
    });

    it('returns zipCode when needsLocalResources is true', () => {
      const profile = { careRecipientName: 'Mom' };
      const result = getNextMissingField(profile, { needsLocalResources: true });
      
      expect(result?.field).toBe('zipCode');
      expect(result?.prompt).toContain("ZIP code");
    });

    it('returns null when all fields are present', () => {
      const profile = {
        firstName: 'Sarah',
        relationship: 'daughter',
        careRecipientName: 'Mom',
        zipCode: '94103',
      };
      const result = getNextMissingField(profile, {});
      
      expect(result).toBeNull();
    });
  });
});
```

#### Step 3: Integration Tests for Workflows

```typescript
// tests/workflows/memory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { initConvexTest, createTestUser } from '../../convex/test.setup';
import { internal } from '../../convex/_generated/api';

describe('Memory Enrichment Workflow', () => {
  let t: ReturnType<typeof initConvexTest>;

  beforeEach(() => {
    t = initConvexTest();
  });

  it('extracts facts from conversation', async () => {
    const userId = await createTestUser(t);
    
    const recentMessages = [
      { role: 'user' as const, content: 'My mom has Alzheimer\'s' },
      { role: 'assistant' as const, content: 'I understand. How can I help?' },
    ];

    const result = await t.action(
      internal.workflows.memoryActions.extractFacts,
      { userId, recentMessages }
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('fact');
    expect(result[0]).toHaveProperty('category');
    expect(result[0]).toHaveProperty('importance');
  });

  it('saves facts to memories table', async () => {
    const userId = await createTestUser(t);
    
    const facts = [
      {
        fact: 'Mom has Alzheimer\'s',
        category: 'family_health' as const,
        importance: 9,
      },
    ];

    await t.mutation(
      internal.workflows.memoryMutations.saveFacts,
      { convexUserId: userId, facts }
    );

    // Verify facts were saved
    const memories = await t.query(internal.public.listMemories, { userId });
    expect(memories.length).toBe(1);
    expect(memories[0].content).toBe('Mom has Alzheimer\'s');
    expect(memories[0].category).toBe('family_health');
  });
});
```

#### Step 4: Simulation Tests for Agent Flows

```typescript
// tests/simulation/onboarding.simulation.test.ts
import { describe, it, expect } from 'vitest';
import { initConvexTest, createTestUser } from '../../convex/test.setup';
import { api, internal } from '../../convex/_generated/api';

describe('Onboarding Flow Simulation', () => {
  it('progressive onboarding collects fields one at a time', async () => {
    const t = initConvexTest();
    const userId = await createTestUser(t, { externalId: '+15551234567' });

    // First message - should ask for careRecipientName
    const response1 = await t.action(api.agents.main.runMainAgent, {
      input: {
        channel: 'sms' as const,
        text: 'Hi',
        userId: '+15551234567',
      },
      context: {
        userId: '+15551234567',
        locale: 'en-US',
        consent: { emergency: false, marketing: false },
      },
    });

    expect(response1.text).toContain('caring for');
    expect(response1.text.toLowerCase()).toMatch(/who|what/);

    // Second message - provide careRecipientName
    const response2 = await t.action(api.agents.main.runMainAgent, {
      input: {
        channel: 'sms' as const,
        text: 'My mom',
        userId: '+15551234567',
      },
      context: {
        userId: '+15551234567',
        locale: 'en-US',
        consent: { emergency: false, marketing: false },
        metadata: {
          profile: { careRecipientName: 'Mom' },
        },
      },
      threadId: response1.threadId,
    });

    // Should now ask for firstName or relationship
    expect(response2.text).toMatch(/call you|name|relationship/i);
  });
});
```

#### Step 5: Test Coverage Reporting

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['convex/**/*.ts'],
      exclude: ['convex/_generated/**', 'convex/**/*.test.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
```

### Benefits

- ✅ Comprehensive test coverage
- ✅ Fast unit tests for utilities
- ✅ Integration tests for workflows
- ✅ Simulation tests for agent flows
- ✅ Confidence in refactoring

---

## 4. Code Duplication: Shared Utilities

### Problem
- Similar error handling patterns repeated across agents
- Profile extraction logic duplicated
- Assessment answer normalization duplicated

### Convex Idiomatic Solution

**Pattern:** Extract shared utilities into `lib/` files, use composition over duplication, and create helper functions for common patterns.

#### Step 1: Extract Error Handling Utilities

```typescript
// lib/agentErrorHandling.ts
import { logError, ErrorContext } from './errors';
import { logger } from './logger';
import type { ActionCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import type { UserProfile } from './types';

/**
 * Standard error handler for agent actions
 * Returns user-friendly fallback response
 */
export async function handleAgentError(
  ctx: ActionCtx,
  error: unknown,
  context: ErrorContext & {
    input: { text: string; userId: string };
    metadata?: Record<string, unknown>;
  }
): Promise<{
  text: string;
  latencyMs: number;
  error: string;
}> {
  const startTime = Date.now();
  
  // Log error
  logError(error, context);
  
  // Extract profile for fallback
  const metadata = (context.metadata ?? {}) as Record<string, unknown>;
  const profile = (metadata.profile as UserProfile | undefined);
  const userName = profile?.firstName ?? 'caregiver';
  const careRecipient = profile?.careRecipientName ?? 'your loved one';

  // Generate fallback response
  const fallbackResponse = `Hello ${userName}! I'm here to support you in caring for ${careRecipient}.

How can I help you today? I can:
- Answer questions about caregiving
- Help you manage stress and prevent burnout
- Provide resources and practical tips
- Connect you with assessments and interventions

What's on your mind?`;

  // Log error run (non-blocking)
  const errorLogPromise = ctx.runMutation(internal.internal.logAgentRunInternal, {
    externalId: context.input.userId,
    agent: context.agent || 'unknown',
    policyBundle: 'default_v1',
    budgetResult: {
      usedInputTokens: context.input.text.length,
      usedOutputTokens: fallbackResponse.length,
      toolCalls: 0,
    },
    latencyMs: Date.now() - startTime,
    traceId: context.traceId || `error-${Date.now()}`,
  });
  
  errorLogPromise.catch((err) => {
    logError(err, { ...context, function: 'logAgentRunInternal' }, 'warn');
  });

  return {
    text: fallbackResponse,
    latencyMs: Date.now() - startTime,
    error: error instanceof Error ? error.message : String(error),
  };
}
```

#### Step 2: Extract Profile Helpers

```typescript
// lib/profileHelpers.ts (consolidate existing profile.ts)
import type { UserProfile, AgentMetadata } from './types';

/**
 * Extract profile variables for prompt rendering
 * Used across all agents
 */
export function extractProfileVariables(profile: UserProfile | undefined) {
  return {
    userName: profile?.firstName || 'there',
    relationship: profile?.relationship || 'caregiver',
    careRecipient: profile?.careRecipientName || 'loved one',
  };
}

/**
 * Extract profile from metadata (type-safe)
 */
export function extractProfileFromMetadata(
  metadata: Record<string, unknown> | undefined
): UserProfile | undefined {
  if (!metadata?.profile) return undefined;
  const profile = metadata.profile;
  
  // Type guard
  if (
    typeof profile === 'object' &&
    profile !== null &&
    ('firstName' in profile || 'relationship' in profile || 'careRecipientName' in profile)
  ) {
    return profile as UserProfile;
  }
  
  return undefined;
}

/**
 * Build wellness info string from metadata
 * Centralized logic for all agents
 */
export function buildWellnessInfo(metadata: AgentMetadata | undefined): string {
  if (!metadata) return '';
  
  const parts: string[] = [];
  
  // Add wellness score if available
  if (metadata.wellnessScore !== undefined) {
    parts.push(`Current wellness score: ${metadata.wellnessScore}`);
  }
  
  // Add pressure zones if available
  if (metadata.pressureZones && Array.isArray(metadata.pressureZones) && metadata.pressureZones.length > 0) {
    parts.push(`Areas of concern: ${metadata.pressureZones.join(', ')}`);
  }
  
  return parts.length > 0 ? parts.join('. ') + '.' : '';
}
```

#### Step 3: Extract Assessment Helpers

```typescript
// lib/assessmentHelpers.ts
import type { Doc } from '../_generated/dataModel';
import type { AssessmentAnswer } from './assessmentCatalog';

type SessionAnswer = Doc<'assessment_sessions'>['answers'][number];

/**
 * Convert session answers to assessment answers
 * Used in multiple places (assessments.ts, workflows/trends.ts)
 */
export function toAssessmentAnswers(answers: SessionAnswer[]): AssessmentAnswer[] {
  return answers.map((answer, idx) => ({
    questionIndex: Number.isNaN(Number.parseInt(answer.questionId, 10))
      ? idx
      : Number.parseInt(answer.questionId, 10),
    value: answer.value,
  }));
}

/**
 * Validate assessment answer value
 */
export function isValidAnswerValue(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 5;
}

/**
 * Normalize answer value to 1-5 range
 */
export function normalizeAnswerValue(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}
```

#### Step 4: Extract Promise Helpers

```typescript
// lib/promiseHelpers.ts
import { logError, ErrorContext } from './errors';

/**
 * Handle background promises consistently
 * Use for fire-and-forget operations
 */
export function handleBackgroundPromise<T>(
  promise: Promise<T>,
  context: ErrorContext,
  onError?: (error: unknown) => void
): void {
  promise.catch((error) => {
    logError(error, { ...context, function: 'background' }, 'warn');
    onError?.(error);
  });
}

/**
 * Batch promises with error handling
 */
export async function batchPromises<T>(
  promises: Promise<T>[],
  context: ErrorContext
): Promise<(T | null)[]> {
  return Promise.all(
    promises.map((promise) =>
      promise.catch((error) => {
        logError(error, context, 'warn');
        return null;
      })
    )
  );
}
```

#### Step 5: Use Shared Utilities

```typescript
// agents/main.ts (simplified)
import { handleAgentError } from '../lib/agentErrorHandling';
import { extractProfileFromMetadata, buildWellnessInfo } from '../lib/profileHelpers';

export const runMainAgent = action({
  // ... args ...
  handler: async (ctx, { input, context, threadId }) => {
    const startTime = Date.now();
    const traceId = `main-${Date.now()}`;
    const errorContext: ErrorContext = {
      userId: context.userId,
      agent: 'main',
      function: 'runMainAgent',
      traceId,
      input,
      metadata: context.metadata as Record<string, unknown>,
    };

    try {
      // ... existing logic ...
      
      return {
        text: responseText,
        threadId: newThreadId,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      // ✅ Use shared error handler
      return await handleAgentError(ctx, error, errorContext);
    }
  },
});
```

### Benefits

- ✅ DRY (Don't Repeat Yourself)
- ✅ Consistent patterns across codebase
- ✅ Easier maintenance (fix once, works everywhere)
- ✅ Better testability (test utilities once)
- ✅ Clearer code (intent is obvious)

---

## Summary: Implementation Priority

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ Extract shared error handling utilities
2. ✅ Create `lib/promiseHelpers.ts` for consistent promise handling
3. ✅ Add unit tests for `lib/profile.ts` utilities

### Phase 2: Type Safety (2-3 weeks)
1. ✅ Create typed validators for metadata structures
2. ✅ Update schema to use validators (backward compatible)
3. ✅ Add type guards for runtime validation

### Phase 3: Testing (2-3 weeks)
1. ✅ Add unit tests for all `lib/` utilities
2. ✅ Add integration tests for workflows
3. ✅ Add simulation tests for agent flows

### Phase 4: Code Duplication (1-2 weeks)
1. ✅ Extract assessment helpers
2. ✅ Consolidate profile utilities
3. ✅ Refactor agents to use shared utilities

**Total Estimated Time:** 6-10 weeks (can be done incrementally)

---

## References

- [Convex Type Safety Best Practices](https://docs.convex.dev/understanding/best-practices/other-recommendations)
- [Convex Error Handling](https://docs.convex.dev/functions/error-handling/)
- [Convex Testing Guide](https://docs.convex.dev/testing)
- [Convex Validators Documentation](https://docs.convex.dev/functions/args-validation)

