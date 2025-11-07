# RPC Consolidation Strategy

**Date**: 2025-01-06
**Scope**: MessageHandler.ts RPC call explosion
**Impact**: 15+ RPC calls per message → Target: 2-3 calls

---

## Executive Summary

**Current State**: MessageHandler makes **15+ ctx.runMutation/ctx.runQuery calls** per incoming SMS
**Target State**: **2-3 calls** (1 action for agent, 1 mutation for DB, 1 optional background task)
**Performance Improvement**: **80% RPC reduction**, transactional consistency, simpler code

---

## Current RPC Call Chain (15+ calls)

### Message Processing Flow

```
onIncomingMessage (action)
  ↓
MessageHandler.handle()
  ├─ RPC 1: getOrCreate ByPhone (mutation)                  [line 235]
  ├─ RPC 2: logMessage (user message, subscription wall)    [line 285]
  ├─ RPC 3: logMessage (system message, subscription wall)  [line 293]
  ├─ RPC 4: getSessionResponses (query, if assessment)      [line 336]
  ├─ RPC 5: insertAssessmentSession (mutation, if new)      [line 474]
  ├─ RPC 6-N: insertAssessmentResponse (mutation, per Q)    [line 507, in loop!]
  ├─ RPC N+1: completeAssessmentSession (mutation)          [line 523]
  ├─ RPC N+2: logMessages (mutation, batch 2 messages)      [line 545]
  ├─ RPC N+3: updateContextState (mutation, async)          [line 602]
  ├─ RPC N+4: saveWellnessScore (mutation, async)           [line 642]
  ├─ RPC N+5: getLastAgentMessage (query, for feedback)     [line 673]
  ├─ RPC N+6-M: recordImplicitFeedback (mutation, per signal) [line 723, in loop!]
  ├─ RPC M+1: updateUser (mutation, crisis event)           [line 770]
  ├─ RPC M+2: scheduleCrisisFollowups (mutation)            [line 776]
  └─ RPC M+3: checkOnboardingAndNudge (action)              [line 788]
```

### Worst Case Analysis

**Single message with assessment (3 new Q's answered) + crisis transition:**
- Base: 5 RPCs (getUser, getSessionResponses, logMessages, updateContext, updateUser)
- Assessment: 1 (insertSession) + 3 (insertResponse × 3) + 1 (completeSession) = 5 RPCs
- Feedback: 1 (getLastMessage) + 2 (recordFeedback × 2 signals) = 3 RPCs
- Crisis: 2 (updateUser, scheduleCrisisFollowups)
- **Total**: 5 + 5 + 3 + 2 = **15 RPCs**

---

## Root Cause Analysis

### Why So Many RPCs?

1. **Action in Action Anti-Pattern**
   - MessageHandler is a service class called from action
   - Every DB operation requires ctx.runMutation/runQuery
   - No direct database access in actions

2. **Granular Mutations**
   - Each tiny operation is separate mutation (logMessage, updateContext, etc.)
   - Originally designed for "reusability" but causes RPC explosion
   - No transactional batching

3. **Synchronous Dependencies**
   - Must create session before inserting responses
   - Must get user before updating context
   - Forces sequential RPC chains

4. **Fire-and-Forget Async** (Lesser Issue)
   - updateContextAsync, saveWellnessScoreAsync run in background
   - These don't block response, but still consume resources
   - Could be batched into main mutation

---

## Target Architecture

### Principle: Actions for Node Runtime, Mutations for ALL DB Work

```
┌─────────────────────────────────────────────────────────────┐
│ Action Layer (Node.js runtime)                              │
│ - Twilio signature validation                               │
│ - Rate limit checks (uses Convex DB for counters)           │
│ - OpenAI agent execution (requires Node SDK)                │
│ - Twilio SMS sending                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
              ┌─────────────────────────┐
              │   RPC Call (ctx.runMutation)  │
              └─────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Mutation Layer (V8 Isolate - Database Access)              │
│ - ALL database reads/writes in ONE transaction             │
│ - Get/create user                                           │
│ - Save assessment responses                                 │
│ - Log conversations                                          │
│ - Update user context                                        │
│ - Save wellness scores                                       │
│ - Record feedback                                            │
│ - Schedule follow-ups                                        │
└─────────────────────────────────────────────────────────────┘
```

### Flow

```
1. onIncomingMessage (action)
   - Validate Twilio signature
   - Check rate limits
   - Get user (NEW: inline query in action is OK for read-only)
   - Execute agent (returns: message, context updates, tool calls)

2. processIncomingMessage (mutation) - SINGLE RPC
   - Get or create user
   - Log user + assistant messages
   - Create/update assessment session
   - Save assessment responses (batch)
   - Complete assessment if finished
   - Update user context (all fields)
   - Save wellness score
   - Record implicit feedback signals
   - Create crisis triggers if needed
   - Return success

3. Optional: scheduleFollowups (action) - ASYNC, non-blocking
   - Complex scheduling logic with rrule
   - Can run after response sent
```

---

## Proposed Implementation

### convex/messages.ts (NEW FILE)

```typescript
import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Process incoming message - ALL database operations in ONE transaction
 * Replaces 15+ RPC calls with single mutation
 */
export const processIncomingMessage = internalMutation({
  args: {
    // Input data
    from: v.string(),
    userMessage: v.string(),
    agentResponse: v.string(),
    messageSid: v.string(),

    // Agent result data
    agentName: v.string(),
    toolCalls: v.optional(v.any()),
    tokenUsage: v.optional(v.any()),
    sessionId: v.optional(v.string()),
    serviceTier: v.optional(v.string()),

    // Context updates (from agent)
    contextUpdates: v.object({
      firstName: v.optional(v.string()),
      relationship: v.optional(v.string()),
      careRecipientName: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      journeyPhase: v.string(),
      onboardingAttempts: v.any(),
      onboardingCooldownUntil: v.optional(v.string()),
      assessmentInProgress: v.boolean(),
      assessmentType: v.optional(v.string()),
      assessmentCurrentQuestion: v.number(),
      assessmentSessionId: v.optional(v.string()),
      assessmentResponses: v.any(), // Record<string, string | number>
      burnoutScore: v.optional(v.number()),
      burnoutBand: v.optional(v.string()),
      burnoutConfidence: v.optional(v.number()),
      pressureZones: v.array(v.string()),
      pressureZoneScores: v.any(),
    }),

    // Metadata
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    // ===================================================================
    // 1. Get or create user (REPLACES RPC 1)
    // ===================================================================
    let user = await ctx.db
      .query('users')
      .withIndex('by_phone', q => q.eq('phoneNumber', args.from))
      .first()

    if (!user) {
      const userId = await ctx.db.insert('users', {
        phoneNumber: args.from,
        createdAt: now,
        updatedAt: now,
      })
      user = (await ctx.db.get(userId))!
    }

    // ===================================================================
    // 2. Log conversation (REPLACES RPC 2-3, 8)
    // ===================================================================
    await ctx.db.insert('conversations', {
      userId: user._id,
      role: 'user',
      text: args.userMessage,
      mode: 'sms',
      messageSid: args.messageSid,
      timestamp: args.startTime,
    })

    await ctx.db.insert('conversations', {
      userId: user._id,
      role: 'assistant',
      text: args.agentResponse,
      mode: 'sms',
      latency: now - args.startTime,
      agentName: args.agentName,
      toolCalls: args.toolCalls,
      tokenUsage: args.tokenUsage,
      sessionId: args.sessionId,
      serviceTier: args.serviceTier || 'priority',
      timestamp: now,
    })

    // ===================================================================
    // 3. Handle assessment session (REPLACES RPC 4, 5, 6-N, N+1)
    // ===================================================================
    const ctx_updates = args.contextUpdates
    let sessionId = ctx_updates.assessmentSessionId

    // Create session if starting new assessment
    if (ctx_updates.assessmentInProgress && !sessionId && ctx_updates.assessmentType) {
      const definition = getAssessmentDefinition(ctx_updates.assessmentType)
      sessionId = await ctx.db.insert('assessmentSessions', {
        userId: user._id,
        type: ctx_updates.assessmentType,
        completed: false,
        currentQuestion: 0,
        totalQuestions: definition?.questions.length ?? 0,
        responses: {},
        startedAt: now,
      })
    }

    // Save new assessment responses (find diff between old and new)
    if (sessionId) {
      const previousResponses = user.assessmentResponses || {}
      const currentResponses = ctx_updates.assessmentResponses
      const newQuestionIds = Object.keys(currentResponses).filter(
        qId => !(qId in previousResponses)
      )

      for (const questionId of newQuestionIds) {
        const definition = getAssessmentDefinition(ctx_updates.assessmentType!)
        const question = definition?.questions.find(q => q.id === questionId)
        const score = question
          ? calculateQuestionScore(question, currentResponses[questionId])
          : null

        await ctx.db.insert('assessmentResponses', {
          sessionId,
          userId: user._id,
          questionId,
          questionText: question?.text ?? '',
          responseValue: String(currentResponses[questionId]),
          score: score ?? undefined,
          respondedAt: now,
          createdAt: now,
        })
      }

      // Complete assessment if finished
      if (!ctx_updates.assessmentInProgress && user.assessmentInProgress) {
        const scoreData = calculateAssessmentScore(
          ctx_updates.assessmentType!,
          ctx_updates.assessmentResponses
        )

        await ctx.db.patch(sessionId, {
          completed: true,
          overallScore: scoreData.overall_score,
          domainScores: scoreData.subscores,
          completedAt: now,
        })
      }
    }

    // ===================================================================
    // 4. Update user context (REPLACES RPC 9)
    // ===================================================================
    await ctx.db.patch(user._id, {
      firstName: ctx_updates.firstName,
      relationship: ctx_updates.relationship,
      careRecipientName: ctx_updates.careRecipientName,
      zipCode: ctx_updates.zipCode,
      journeyPhase: ctx_updates.journeyPhase,
      onboardingAttempts: ctx_updates.onboardingAttempts,
      onboardingCooldownUntil: ctx_updates.onboardingCooldownUntil
        ? Number(ctx_updates.onboardingCooldownUntil)
        : undefined,
      assessmentInProgress: ctx_updates.assessmentInProgress,
      assessmentType: ctx_updates.assessmentType,
      assessmentCurrentQuestion: ctx_updates.assessmentCurrentQuestion,
      assessmentSessionId: sessionId,
      burnoutScore: ctx_updates.burnoutScore,
      burnoutBand: ctx_updates.burnoutBand,
      burnoutConfidence: ctx_updates.burnoutConfidence,
      pressureZones: ctx_updates.pressureZones,
      pressureZoneScores: ctx_updates.pressureZoneScores,
      lastContactAt: now,
      updatedAt: now,
    })

    // ===================================================================
    // 5. Save wellness score if changed (REPLACES RPC 10)
    // ===================================================================
    if (ctx_updates.burnoutScore !== null && ctx_updates.burnoutScore !== user.burnoutScore) {
      await ctx.db.insert('wellnessScores', {
        userId: user._id,
        overallScore: ctx_updates.burnoutScore,
        band: ctx_updates.burnoutBand,
        confidence: ctx_updates.burnoutConfidence,
        pressureZones: ctx_updates.pressureZones,
        pressureZoneScores: ctx_updates.pressureZoneScores,
        assessmentType: ctx_updates.assessmentType,
        assessmentSource: 'conversation',
        assessmentSessionId: sessionId,
        recordedAt: now,
      })
    }

    // ===================================================================
    // 6. Record implicit feedback (REPLACES RPC 11, 12-M)
    // ===================================================================
    // Simplified - detect basic signals without extra query
    if (containsGratitude(args.userMessage)) {
      await ctx.db.insert('feedback', {
        userId: user._id,
        signal: 'gratitude',
        value: 1.0,
        context: {
          agentResponse: args.agentResponse,
          userMessage: args.userMessage,
        },
        timestamp: now,
      })
    }

    if (containsFrustration(args.userMessage)) {
      await ctx.db.insert('feedback', {
        userId: user._id,
        signal: 'frustration',
        value: 0.0,
        context: {
          agentResponse: args.agentResponse,
          userMessage: args.userMessage,
        },
        timestamp: now,
      })
    }

    // ===================================================================
    // 7. Handle crisis transitions (REPLACES RPC M+1, M+2)
    // ===================================================================
    const wasCrisis = user.burnoutBand === 'crisis'
    const nowCrisis = ctx_updates.burnoutBand === 'crisis'

    if (!wasCrisis && nowCrisis) {
      await ctx.db.patch(user._id, {
        lastCrisisEventAt: now,
        crisisFollowupCount: 0,
      })

      // Note: scheduleCrisisFollowups would run as separate action
      // (complex rrule logic + Twilio scheduling - can't run in mutation)
    }

    return {
      success: true,
      userId: user._id,
      sessionId,
      needsCrisisScheduling: !wasCrisis && nowCrisis,
      needsOnboardingNudge: user.journeyPhase === 'onboarding' && ctx_updates.journeyPhase === 'active',
    }
  },
})
```

---

## Migration Strategy

### Phase 1: Create New Mutation (1 hour)
1. Create `convex/messages.ts`
2. Implement `processIncomingMessage` mutation
3. Add helper imports (getAssessmentDefinition, calculateScore, sentiment utils)
4. Write tests

### Phase 2: Update MessageHandler (2 hours)
1. Keep existing methods for now (safety)
2. Add new `persistChangesBatched()` method that calls single mutation
3. Add feature flag to switch between old/new paths
4. Test thoroughly with dev data

### Phase 3: Remove Old Code (1 hour)
1. Delete MessageHandler service class
2. Move logic directly into `convex/twilio.ts` action
3. Remove granular mutations from `functions/` if no longer used
4. Update imports

### Phase 4: Optimize Further
1. Move sentiment detection into mutation (pure JS, no network)
2. Batch crisis/onboarding scheduling checks
3. Consider moving rate limit state to mutation layer

---

## Testing Strategy

```typescript
test('processIncomingMessage batches all DB operations', async () => {
  const t = convexTest(schema)

  // Count database operations
  const spyInsert = vi.spyOn(t.db, 'insert')
  const spyPatch = vi.spyOn(t.db, 'patch')

  await t.mutation(internal.messages.processIncomingMessage, {
    from: '+15551234567',
    userMessage: 'I feel overwhelmed',
    agentResponse: 'I hear you...',
    messageSid: 'SM123',
    agentName: 'main_agent',
    contextUpdates: {
      journeyPhase: 'active',
      assessmentInProgress: false,
      assessmentCurrentQuestion: 0,
      pressureZones: ['emotional_wellbeing'],
      pressureZoneScores: {},
      burnoutScore: 75,
      burnoutBand: 'high',
      assessmentResponses: {},
      onboardingAttempts: {},
    },
    startTime: Date.now(),
  })

  // Verify single transaction
  expect(spyInsert).toHaveBeenCalledTimes(4) // user, 2 conversations, wellness score
  expect(spyPatch).toHaveBeenCalledTimes(1) // user context update
})
```

---

## Success Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| RPCs per message (basic) | 8-10 | 1 | 80-90% |
| RPCs per message (assessment) | 12-15 | 1 | 92-93% |
| Transactional consistency | ❌ Partial | ✅ Full | 100% |
| Code complexity | 795 lines | ~200 lines | 75% reduction |
| Testability | Hard (mocking 15 RPCs) | Easy (single mutation) | Much better |

---

## Benefits

### 1. Performance
- **80% fewer network calls** (15 → 2-3)
- **Faster response times** (no sequential RPC chains)
- **Lower Convex costs** (fewer function invocations)

### 2. Reliability
- **Atomic transactions** - all DB writes succeed or fail together
- **No partial states** - can't have conversation logged but user not updated
- **Automatic conflict handling** - Convex handles concurrent updates

### 3. Maintainability
- **Simpler code** - one place to understand message processing
- **Easier testing** - test single mutation vs. complex orchestration
- **Better error handling** - transaction rollback on any failure

### 4. Correctness
- **No race conditions** - assessment responses always match session
- **Consistent user state** - all context fields updated atomically
- **Audit trail** - single transaction timestamp for all changes

---

## References
- REFACTORING_PLAN.md Issue #2 (lines 134-240)
- MessageHandler.ts current implementation
- Convex docs: https://docs.convex.dev/functions/actions-and-mutations
