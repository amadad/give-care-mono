# Remediation Plan - GiveCare Convex Backend
**Date:** 2025-01-10  
**Status:** Ready for Execution  
**Priority:** Fix critical issues before new features

---

## 📋 Executive Summary

**Current State:** 60/100 (C) - Production-ready for core SMS flow, but critical features broken

**Critical Blockers:** 5 issues preventing full functionality  
**High Priority:** 5 issues causing security/cost risks  
**Medium Priority:** 5 issues affecting maintainability  
**Low Priority:** 5 issues for code quality

**Total Estimated Time:** 47-69 hours (6-9 weeks at 8h/week)  
**Recommended Timeline:** 8-12 weeks (allowing for testing and iteration)

---

## 🎯 Remediation Strategy

### Approach
1. **Fix Critical Features First** - Restore core functionality
2. **Add Security** - Protect against abuse and vulnerabilities
3. **Improve Type Safety** - Reduce runtime errors
4. **Enhance Observability** - Better debugging and monitoring
5. **Polish & Optimize** - Code quality improvements

### Principles
- ✅ **Test as you go** - Don't break working features
- ✅ **Deploy incrementally** - Small, safe changes
- ✅ **Monitor impact** - Track performance improvements
- ✅ **Document changes** - Update ARCHITECTURE.md

---

## 🔴 PHASE 1: CRITICAL FIXES (Weeks 1-2)
**Goal:** Restore core functionality, enable billing, prevent abuse  
**Time:** 20-28 hours  
**Priority:** MUST FIX before production launch

### 1.1 Fix Assessment Completion Flow
**Severity:** 🔴 CRITICAL  
**Time:** 6-8 hours  
**Dependencies:** None  
**Blocks:** Core clinical feature

**Current Problem:**
- Users can start assessments ✅
- Cannot complete via SMS ❌
- No question-by-question handler ❌

**Steps:**

1. **Create Answer Extraction Helper** (1h)
   ```typescript
   // lib/assessmentHelpers.ts
   export function extractAnswerFromText(text: string): number | null {
     // Extract number 1-5 from text like "4", "I'd say 3", "maybe 2"
     const match = text.match(/\b([1-5])\b/);
     return match ? parseInt(match[1], 10) : null;
   }
   ```

2. **Add Assessment Session Detection** (1h)
   ```typescript
   // assessments.ts
   export const getActiveSession = query({
     args: { userId: v.string() },
     handler: async (ctx, { userId }) => {
       const user = await getByExternalId(ctx, userId);
       if (!user) return null;
       
       return ctx.db
         .query('assessment_sessions')
         .withIndex('by_user_status', (q) => 
           q.eq('userId', user._id).eq('status', 'active')
         )
         .first();
     },
   });
   ```

3. **Create Record Answer Mutation** (2h)
   ```typescript
   // assessments.ts
   export const recordAnswer = mutation({
     args: {
       userId: v.string(),
       answer: v.number(),
     },
     handler: async (ctx, { userId, answer }) => {
       const user = await getByExternalId(ctx, userId);
       if (!user) throw new Error('User not found');
       
       const session = await ctx.db
         .query('assessment_sessions')
         .withIndex('by_user_status', (q) => 
           q.eq('userId', user._id).eq('status', 'active')
         )
         .first();
       
       if (!session) throw new Error('No active assessment session');
       
       const catalog = CATALOG[session.definitionId as AssessmentSlug];
       const questionIndex = session.questionIndex;
       
       // Validate answer range
       if (answer < 1 || answer > 5) {
         throw new Error('Answer must be between 1 and 5');
       }
       
       const answers = [...session.answers, {
         questionId: String(questionIndex),
         value: answer,
       }];
       
       // Check if complete
       if (answers.length >= catalog.length) {
         await completeAssessment(ctx, session, answers);
       } else {
         await ctx.db.patch(session._id, {
           questionIndex: questionIndex + 1,
           answers,
         });
       }
       
       return { questionIndex: questionIndex + 1, totalQuestions: catalog.length };
     },
   });
   ```

4. **Create Complete Assessment Mutation** (2h)
   ```typescript
   // assessments.ts
   async function completeAssessment(
     ctx: MutationCtx,
     session: Doc<'assessment_sessions'>,
     answers: Array<{ questionId: string; value: number }>
   ) {
     const catalog = CATALOG[session.definitionId as AssessmentSlug];
     const scoreResult = catalog.score(
       answers.map((a, idx) => ({
         questionIndex: Number.parseInt(a.questionId, 10) || idx,
         value: a.value,
       }))
     );
     
     // Create assessment record
     const assessmentId = await ctx.db.insert('assessments', {
       userId: session.userId,
       definitionId: session.definitionId,
       version: '1.0',
       answers,
       completedAt: Date.now(),
     });
     
     // Create score record
     await ctx.db.insert('scores', {
       userId: session.userId,
       assessmentId,
       composite: scoreResult.score,
       band: scoreResult.band,
       zones: computeZones(session.definitionId, answers),
       confidence: 0.9,
     });
     
     // Mark session complete
     await ctx.db.patch(session._id, { status: 'completed' });
     
     return { assessmentId, score: scoreResult };
   }
   ```

5. **Wire Assessment Handler in inbound.ts** (2h)
   ```typescript
   // inbound.ts:56 - Add before agent routing
   const activeSession = await ctx.runQuery(internal.assessments.getActiveSession, {
     userId: user.externalId,
   });
   
   if (activeSession) {
     // Extract answer from text
     const answer = extractAnswerFromText(args.text);
     if (!answer) {
       // Invalid answer - ask again
       const catalog = CATALOG[activeSession.definitionId as AssessmentSlug];
       const question = catalog.items[activeSession.questionIndex];
       return {
         success: true,
         response: {
           text: `Please answer with a number 1-5. ${question.text}`,
           threadId: undefined,
         },
       };
     }
     
     // Record answer
     const result = await ctx.runMutation(internal.assessments.recordAnswer, {
       userId: user.externalId,
       answer,
     });
     
     if (result.completed) {
       // Assessment complete - route to assessment agent for results
       response = await ctx.runAction(api.agents.assessment.runAssessmentAgent, {
         input: { channel: 'sms', text: 'Show results', userId: user.externalId },
         context,
         threadId: undefined,
       });
     } else {
       // Send next question
       const catalog = CATALOG[activeSession.definitionId as AssessmentSlug];
       const nextQuestion = catalog.items[result.questionIndex];
       response = {
         text: `(${result.questionIndex + 1} of ${result.totalQuestions}) ${nextQuestion.text}`,
         threadId: undefined,
       };
     }
   } else {
     // Normal message flow (existing code)
   }
   ```

6. **Test End-to-End** (1h)
   - Start assessment
   - Answer questions 1-5
   - Verify answers stored
   - Verify completion triggers scoring
   - Verify results returned

**Acceptance Criteria:**
- ✅ User can complete EMA (3 questions) via SMS
- ✅ User can complete BSFC (10 questions) via SMS
- ✅ Answers validated (1-5 range)
- ✅ Scores calculated correctly
- ✅ Results returned to user

**Files to Modify:**
- `convex/assessments.ts` - Add mutations
- `convex/inbound.ts` - Add session detection
- `convex/lib/assessmentHelpers.ts` - NEW (helper functions)

---

### 1.2 Wire Resource Search to Google Maps
**Severity:** 🔴 CRITICAL  
**Time:** 2-3 hours  
**Dependencies:** Google Maps API key configured  
**Blocks:** User-facing feature

**Current Problem:**
- `resources.ts:146` returns `buildStubResults()` (fake data)

**Steps:**

1. **Check if Google Maps Action Exists** (30min)
   ```bash
   # Check for maps.actions.ts
   ls convex/actions/maps.actions.ts
   ```

2. **Create/Update Google Maps Action** (1-2h)
   ```typescript
   // actions/maps.actions.ts (or create if doesn't exist)
   export const searchGoogleMaps = internalAction({
     args: {
       query: v.string(),
       zip: v.string(),
       category: v.string(),
     },
     handler: async (ctx, args) => {
       // Call Google Maps Places API or Grounding API
       // Return structured results
       // See: https://developers.google.com/maps/documentation/places/web-service
     },
   });
   ```

3. **Wire in resources.ts** (30min)
   ```typescript
   // resources.ts:146 - Replace stub
   const mapResults = await ctx.runAction(internal.actions.maps.searchGoogleMaps, {
     query: args.query,
     zip: resolvedZip,
     category,
   });
   
   const results = mapResults.results || buildStubResults(category, resolvedZip); // Fallback
   ```

4. **Test with Real Zip Codes** (30min)
   - Test with 90210 (Beverly Hills)
   - Test with 10001 (NYC)
   - Verify cache works
   - Verify TTL logic

**Acceptance Criteria:**
- ✅ Real Google Maps results returned
- ✅ Cache TTL works correctly
- ✅ Fallback to stub if API fails
- ✅ Results formatted for SMS

**Files to Modify:**
- `convex/resources.ts` - Wire Google Maps
- `convex/actions/maps.actions.ts` - Create/update action

---

### 1.3 Implement Cron Jobs
**Severity:** 🔴 CRITICAL  
**Time:** 3-4 hours  
**Dependencies:** Workflow implementations  
**Blocks:** Scheduled features

**Current Problem:**
- `crons.ts` is empty
- No scheduled check-ins
- No resource cache cleanup
- No engagement monitoring

**Steps:**

1. **Create Check-In Sweep Workflow** (1h)
   ```typescript
   // workflows/checkInSweep.ts - NEW
   export const checkInSweep = internalAction({
     args: {},
     handler: async (ctx) => {
       const now = Date.now();
       
       // Find triggers due for execution
       const dueTriggers = await ctx.runQuery(internal.internal.getDueTriggers, {
         beforeTime: now,
       });
       
       for (const trigger of dueTriggers) {
         // Send check-in SMS
         await ctx.runAction(internal.workflows.checkIn.sendCheckIn, {
           userId: trigger.userId,
           triggerId: trigger._id,
         });
         
         // Update nextRun
         await ctx.runMutation(internal.internal.updateTriggerNextRun, {
           triggerId: trigger._id,
         });
       }
     },
   });
   ```

2. **Create Resource Cache Cleanup** (30min)
   ```typescript
   // internal.ts or resources.ts
   export const cleanupResourceCache = internalMutation({
     args: { limit: v.optional(v.number()) },
     handler: async (ctx, { limit = 200 }) => {
       const now = Date.now();
       const expired = await ctx.db
         .query('resource_cache')
         .filter((q) => q.lt(q.field('expiresAt'), now))
         .take(limit);
       
       for (const entry of expired) {
         await ctx.db.delete(entry._id);
       }
       
       return { deleted: expired.length };
     },
   });
   ```

3. **Create Engagement Sweep** (1h)
   ```typescript
   // workflows/engagementSweep.ts - NEW
   export const engagementSweep = internalAction({
     args: {},
     handler: async (ctx) => {
       // Find users with 5+ days silence
       const silentUsers = await ctx.runQuery(internal.internal.getSilentUsers, {
         daysAgo: 5,
       });
       
       for (const user of silentUsers) {
         await ctx.runAction(internal.workflows.engagement.sendNudge, {
           userId: user._id,
           daysSilent: user.daysSilent,
         });
       }
     },
   });
   ```

4. **Wire Cron Jobs** (30min)
   ```typescript
   // crons.ts
   import { cronJobs } from "convex/server";
   import { internal } from "./_generated/api";
   
   const crons = cronJobs();
   
   // Check-in sweep (every 5 minutes)
   crons.interval(
     "check-in-sweep",
     { minutes: 5 },
     internal.workflows.checkInSweep.checkInSweep
   );
   
   // Resource cache cleanup (hourly)
   crons.hourly(
     "resource-cache-cleanup",
     { minuteUTC: 0 },
     internal.internal.cleanupResourceCache
   );
   
   // Engagement monitoring (every 6 hours)
   crons.interval(
     "engagement-nudge",
     { hours: 6 },
     internal.workflows.engagementSweep.engagementSweep
   );
   
   export default crons;
   ```

5. **Test Cron Execution** (30min)
   - Verify crons register
   - Test with Convex dashboard
   - Monitor execution logs

**Acceptance Criteria:**
- ✅ Check-in sweep runs every 5 minutes
- ✅ Resource cache cleaned hourly
- ✅ Engagement sweep runs every 6 hours
- ✅ All workflows execute successfully

**Files to Create/Modify:**
- `convex/crons.ts` - Add cron jobs
- `convex/workflows/checkInSweep.ts` - NEW
- `convex/workflows/engagementSweep.ts` - NEW
- `convex/internal.ts` - Add helper queries/mutations

---

### 1.4 Wire Stripe Webhook Handler
**Severity:** 🔴 CRITICAL  
**Time:** 4-6 hours  
**Dependencies:** Stripe account configured  
**Blocks:** Billing, revenue

**Current Problem:**
- Webhook handler exists but processing commented out
- Subscriptions don't activate

**Steps:**

1. **Create Billing Mutation** (2h)
   ```typescript
   // billing.ts - NEW
   import { internalMutation } from './_generated/server';
   import { v } from 'convex/values';
   import { getByExternalId } from './lib/core';
   import { internal } from './_generated/api';
   
   export const applyStripeEvent = internalMutation({
     args: {
       id: v.string(),
       type: v.string(),
       payload: v.any(),
     },
     handler: async (ctx, { id, type, payload }) => {
       // Check if event already processed
       const existing = await ctx.db
         .query('billing_events')
         .withIndex('by_event', (q) => q.eq('stripeEventId', id))
         .first();
       
       if (existing) {
         console.log(`[billing] Event ${id} already processed`);
         return { processed: false, reason: 'duplicate' };
       }
       
       // Process event
       if (type === 'checkout.session.completed') {
         await handleCheckoutCompleted(ctx, payload);
       } else if (type === 'customer.subscription.updated') {
         await handleSubscriptionUpdated(ctx, payload);
       } else if (type === 'customer.subscription.deleted') {
         await handleSubscriptionDeleted(ctx, payload);
       }
       
       // Record event
       await ctx.db.insert('billing_events', {
         stripeEventId: id,
         type,
         data: payload,
       });
       
       return { processed: true };
     },
   });
   
   async function handleCheckoutCompleted(ctx: MutationCtx, session: any) {
     const metadata = session.metadata || {};
     const phoneNumber = metadata.phoneNumber;
     const fullName = metadata.fullName;
     
     if (!phoneNumber) {
       console.error('[billing] Missing phoneNumber in checkout session');
       return;
     }
     
     // Find or create user
     const user = await getByExternalId(ctx, phoneNumber);
     if (!user) {
       console.error('[billing] User not found for phone:', phoneNumber);
       return;
     }
     
     // Create subscription
     await ctx.db.insert('subscriptions', {
       userId: user._id,
       stripeCustomerId: session.customer,
       planId: metadata.planId || 'plus',
       status: 'active',
       currentPeriodEnd: session.subscription_details?.current_period_end * 1000 || Date.now() + 30 * 24 * 60 * 60 * 1000,
     });
     
     // Send welcome SMS (if not already sent)
     if (fullName) {
       await ctx.scheduler.runAfter(
         5000,
         internal.inbound.sendSmsResponse,
         {
           to: phoneNumber,
           text: `Hi ${fullName.split(' ')[0]}! Welcome to GiveCare. I'm here 24/7. How can I help you today?`,
           userId: phoneNumber,
         }
       );
     }
   }
   ```

2. **Wire Webhook Handler** (1h)
   ```typescript
   // http.ts:49 - Uncomment and fix
   await ctx.runMutation(internal.billing.applyStripeEvent, {
     id: event.id,
     type: event.type,
     payload: event as unknown as Record<string, unknown>,
   });
   ```

3. **Add Subscription Queries** (1h)
   ```typescript
   // billing.ts
   export const getSubscription = query({
     args: { userId: v.string() },
     handler: async (ctx, { userId }) => {
       const user = await getByExternalId(ctx, userId);
       if (!user) return null;
       
       return ctx.db
         .query('subscriptions')
         .withIndex('by_user', (q) => q.eq('userId', user._id))
         .filter((q) => q.eq(q.field('status'), 'active'))
         .first();
     },
   });
   ```

4. **Test with Stripe Test Webhooks** (1h)
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks/stripe`
   - Trigger test events
   - Verify subscription created
   - Verify welcome SMS sent

**Acceptance Criteria:**
- ✅ `checkout.session.completed` activates subscription
- ✅ `subscription.updated` updates status
- ✅ `subscription.deleted` cancels subscription
- ✅ Welcome SMS sent after checkout
- ✅ Duplicate events ignored

**Files to Create/Modify:**
- `convex/billing.ts` - NEW (webhook handler)
- `convex/http.ts` - Wire webhook
- `convex/public.ts` - Add subscription queries

---

### 1.5 Add Input Validation
**Severity:** 🟠 HIGH (Security)  
**Time:** 3-4 hours  
**Dependencies:** None  
**Blocks:** Security hardening

**Steps:**

1. **Create Validators File** (1h)
   ```typescript
   // lib/validators.ts - NEW
   import { v } from 'convex/values';
   
   export const phoneValidator = v.string().refine(
     (val) => /^\+1\d{10}$/.test(val),
     "Phone must be E.164 format (+1XXXXXXXXXX)"
   );
   
   export const zipValidator = v.string().refine(
     (val) => /^\d{5}$/.test(val.replace(/\D/g, '')),
     "Zip code must be 5 digits"
   );
   
   export const answerValidator = v.number().refine(
     (val) => val >= 1 && val <= 5,
     "Answer must be between 1 and 5"
   );
   
   export const sanitizeText = (text: string): string => {
     // Remove HTML tags, scripts
     return text.replace(/<[^>]*>/g, '').trim();
   };
   ```

2. **Apply to inbound.ts** (1h)
   ```typescript
   // inbound.ts:19
   export const processInbound = internalAction({
     args: {
       phone: phoneValidator, // Changed from v.string()
       text: v.string(), // Will sanitize in handler
       messageSid: v.string(),
     },
     handler: async (ctx, args) => {
       const sanitizedText = sanitizeText(args.text);
       // ... rest of handler
     },
   });
   ```

3. **Apply to assessments.ts** (1h)
   ```typescript
   // assessments.ts:14
   export const startAssessment = mutation({
     args: {
       userId: v.string(), // Keep as-is (externalId)
       definition: assessmentDefinitionValidator,
       channel: v.optional(channelValidator),
     },
     // ...
   });
   
   export const recordAnswer = mutation({
     args: {
       userId: v.string(),
       answer: answerValidator, // Changed from v.number()
     },
     // ...
   });
   ```

4. **Apply to public.ts** (1h)
   ```typescript
   // public.ts:32
   export const recordMemory = mutation({
     args: {
       userId: v.string(),
       category: v.string(), // Could add enum validator
       content: v.string(), // Sanitize in handler
       importance: v.number().refine((n) => n >= 1 && n <= 10),
     },
     handler: async (ctx, args) => {
       const sanitizedContent = sanitizeText(args.content);
       // ...
     },
   });
   ```

**Acceptance Criteria:**
- ✅ Phone numbers validated (E.164 format)
- ✅ Zip codes validated (5 digits)
- ✅ Assessment answers validated (1-5 range)
- ✅ User text sanitized (no HTML/scripts)

**Files to Create/Modify:**
- `convex/lib/validators.ts` - NEW
- `convex/inbound.ts` - Apply validators
- `convex/assessments.ts` - Apply validators
- `convex/public.ts` - Apply validators

---

### 1.6 Enforce Rate Limiting
**Severity:** 🟠 HIGH (Cost)  
**Time:** 2-3 hours  
**Dependencies:** Rate Limiter Component  
**Blocks:** Cost control

**Steps:**

1. **Check Rate Limiter Component** (30min)
   ```typescript
   // Verify component is registered in convex.config.ts
   // Check API: internal.rateLimiter.*
   ```

2. **Add Rate Limit Check in inbound.ts** (1h)
   ```typescript
   // inbound.ts:25
   handler: async (ctx, args) => {
     // Check SMS rate limit (10 per day)
     const smsLimit = await ctx.runQuery(
       internal.rateLimiter.check,
       {
         key: `sms:${args.phone}`,
         limit: 10,
         window: 24 * 60 * 60 * 1000, // 24 hours
       }
     );
     
     if (!smsLimit.allowed) {
       return {
         success: false,
         error: 'RATE_LIMIT_EXCEEDED',
         message: 'You\'ve reached your daily message limit. Please try again tomorrow.',
         retryAfter: smsLimit.retryAfter,
       };
     }
     
     // Consume rate limit
     await ctx.runMutation(internal.rateLimiter.consume, {
       key: `sms:${args.phone}`,
     });
     
     // ... rest of handler
   }
   ```

3. **Add Token Budget Check** (1h)
   ```typescript
   // agents/main.ts:89 - Before agent call
   const tokenLimit = await ctx.runQuery(
     internal.rateLimiter.check,
     {
       key: `tokens:${context.userId}`,
       limit: 50000, // 50K tokens per hour
       window: 60 * 60 * 1000, // 1 hour
     }
   );
   
   if (!tokenLimit.allowed) {
     return {
       text: 'I\'m experiencing high demand right now. Please try again in a few minutes.',
       threadId: undefined,
       latencyMs: Date.now() - startTime,
     };
   }
   ```

4. **Test Rate Limiting** (30min)
   - Send 11 SMS in 24 hours
   - Verify 11th is rejected
   - Verify error message sent

**Acceptance Criteria:**
- ✅ SMS limit enforced (10/day)
- ✅ Token limit enforced (50K/hour)
- ✅ Clear error messages
- ✅ Limits reset correctly

**Files to Modify:**
- `convex/inbound.ts` - Add rate limit checks
- `convex/agents/main.ts` - Add token budget check

---

## 🟠 PHASE 2: HIGH PRIORITY (Weeks 3-4)
**Goal:** Improve type safety, observability, error handling  
**Time:** 17-26 hours  
**Priority:** Important for maintainability

### 2.1 Reduce `any` Types
**Severity:** 🟠 HIGH  
**Time:** 8-12 hours  
**Dependencies:** None

**Steps:**

1. **Create Metadata Types** (2h)
   ```typescript
   // lib/types.ts
   export type UserMetadata = {
     profile?: {
       firstName?: string;
       relationship?: string;
       careRecipientName?: string;
       zipCode?: string;
     };
     journeyPhase?: 'onboarding' | 'active' | 'maintenance' | 'crisis' | 'churned';
     totalInteractionCount?: number;
     enrichedContext?: string;
     contextUpdatedAt?: number;
     threadId?: string;
     assessmentAnswers?: number[];
     assessmentDefinitionId?: string;
     emergencyContact?: {
       email?: string;
       phone?: string;
       name?: string;
     };
     convex?: {
       userId: string;
     };
   };
   ```

2. **Update Schema** (1h)
   ```typescript
   // schema.ts:41
   metadata: v.optional(v.any()), // Keep for now, add validation later
   // Document structure in comments
   ```

3. **Type Workflow Returns** (2h)
   ```typescript
   // workflows/crisis.ts
   handler: async (step, args): Promise<{
     success: boolean;
     alertId: Id<'alerts'>; // Changed from any
     emergencyContactNotified: boolean;
   }> => {
     const alertId = await step.runMutation(...); // Type is Id<'alerts'>
     // ...
   }
   ```

4. **Type Function Parameters** (3h)
   ```typescript
   // lib/policy.ts:38
   export const getTone = (context: {
     userId: string;
     metadata?: UserMetadata;
     crisisFlags?: { active: boolean; terms: string[] };
   }): string => {
     // ...
   }
   ```

5. **Replace `any` with `unknown`** (2h)
   - Find all `any` types
   - Replace with `unknown` where appropriate
   - Add type guards

**Acceptance Criteria:**
- ✅ Metadata structure typed
- ✅ Workflow returns typed
- ✅ Function parameters typed
- ✅ `any` count reduced from 174 to <50

**Files to Modify:**
- `convex/lib/types.ts` - Add types
- `convex/workflows/crisis.ts` - Type returns
- `convex/lib/policy.ts` - Type parameters
- All files with `any` - Replace with proper types

---

### 2.2 Structured Logging
**Severity:** 🟠 HIGH  
**Time:** 4-6 hours  
**Dependencies:** None

**Steps:**

1. **Create Logger Utility** (2h)
   ```typescript
   // lib/logger.ts - NEW
   type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
   
   export function log(
     level: LogLevel,
     message: string,
     context?: Record<string, unknown>
   ) {
     const entry = {
       timestamp: new Date().toISOString(),
       level,
       message,
       ...context,
     };
     
     // Use appropriate console method
     switch (level) {
       case 'DEBUG':
         console.debug(JSON.stringify(entry));
         break;
       case 'INFO':
         console.log(JSON.stringify(entry));
         break;
       case 'WARN':
         console.warn(JSON.stringify(entry));
         break;
       case 'ERROR':
         console.error(JSON.stringify(entry));
         break;
     }
   }
   
   export const logger = {
     debug: (msg: string, ctx?: Record<string, unknown>) => log('DEBUG', msg, ctx),
     info: (msg: string, ctx?: Record<string, unknown>) => log('INFO', msg, ctx),
     warn: (msg: string, ctx?: Record<string, unknown>) => log('WARN', msg, ctx),
     error: (msg: string, ctx?: Record<string, unknown>) => log('ERROR', msg, ctx),
   };
   ```

2. **Replace console.log in workflows** (1h)
   ```typescript
   // workflows/crisis.ts
   import { logger } from '../lib/logger';
   
   logger.info('Crisis event logged', { alertId, userId: args.userId });
   logger.warn('No emergency contact configured', { userId: args.userId });
   ```

3. **Replace console.log in agents** (1h)
   ```typescript
   // agents/main.ts
   import { logger } from '../lib/logger';
   
   logger.error('Memory enrichment workflow failed', {
     error: String(error),
     userId: context.userId,
     traceId: `main-${Date.now()}`,
   });
   ```

4. **Add Trace IDs** (1h)
   - Generate traceId at request start
   - Include in all logs
   - Pass through workflow steps

**Acceptance Criteria:**
- ✅ All logs structured (JSON)
- ✅ Trace IDs included
- ✅ Log levels used correctly
- ✅ Context included in all logs

**Files to Create/Modify:**
- `convex/lib/logger.ts` - NEW
- All files with console.log - Replace with logger

---

### 2.3 Error Types
**Severity:** 🟠 HIGH  
**Time:** 4-6 hours  
**Dependencies:** None

**Steps:**

1. **Create Error Classes** (2h)
   ```typescript
   // lib/errors.ts - NEW
   export class GiveCareError extends Error {
     constructor(
       public code: string,
       message: string,
       public statusCode: number = 500,
       public context?: Record<string, unknown>
     ) {
       super(message);
       this.name = 'GiveCareError';
     }
   }
   
   export const ERRORS = {
     USER_NOT_FOUND: 'USER_NOT_FOUND',
     RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
     ASSESSMENT_INCOMPLETE: 'ASSESSMENT_INCOMPLETE',
     INVALID_INPUT: 'INVALID_INPUT',
     SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
   } as const;
   
   export class UserNotFoundError extends GiveCareError {
     constructor(userId: string) {
       super(ERRORS.USER_NOT_FOUND, `User not found: ${userId}`, 404, { userId });
     }
   }
   
   export class RateLimitError extends GiveCareError {
     constructor(retryAfter?: number) {
       super(
         ERRORS.RATE_LIMIT_EXCEEDED,
         'Rate limit exceeded',
         429,
         { retryAfter }
       );
     }
   }
   ```

2. **Replace Generic Errors** (2h)
   ```typescript
   // assessments.ts:22
   if (!user) {
     throw new UserNotFoundError(userId);
   }
   
   // inbound.ts (rate limit)
   if (!smsLimit.allowed) {
     throw new RateLimitError(smsLimit.retryAfter);
   }
   ```

3. **Update Error Handling** (2h)
   ```typescript
   // agents/main.ts:203
   } catch (error) {
     if (error instanceof GiveCareError) {
       logger.error('Agent error', {
         code: error.code,
         message: error.message,
         context: error.context,
       });
     } else {
       logger.error('Unknown error', { error: String(error) });
     }
     // ...
   }
   ```

**Acceptance Criteria:**
- ✅ Error classes created
- ✅ All errors use error codes
- ✅ Context included in errors
- ✅ Frontend can handle errors gracefully

**Files to Create/Modify:**
- `convex/lib/errors.ts` - NEW
- All files with `throw new Error()` - Replace with error classes

---

### 2.4 Add Missing Indexes
**Severity:** 🟡 MEDIUM  
**Time:** 1-2 hours  
**Dependencies:** None

**Steps:**

1. **Add Composite Indexes** (1h)
   ```typescript
   // schema.ts
   memories: defineTable({...})
     .index('by_user_category', ['userId', 'category'])
     .index('by_user_importance', ['userId', 'importance', '_creationTime']), // NEW
   
   triggers: defineTable({...})
     .index('by_user', ['userId'])
     .index('by_nextRun', ['nextRun'])
     .index('by_status_nextRun', ['status', 'nextRun']), // NEW
   
   alerts: defineTable({...})
     .index('by_user', ['userId'])
     .index('by_type', ['type', 'severity'])
     .index('by_status_severity', ['status', 'severity']), // NEW
   ```

2. **Test Query Performance** (1h)
   - Run queries before/after
   - Measure latency improvement
   - Verify indexes used

**Acceptance Criteria:**
- ✅ Composite indexes added
- ✅ Query performance improved
- ✅ No full table scans

**Files to Modify:**
- `convex/schema.ts` - Add indexes

---

## 🟡 PHASE 3: MEDIUM PRIORITY (Weeks 5-6)
**Goal:** Code quality, maintainability  
**Time:** 10-15 hours  
**Priority:** Nice to have

### 3.1 Remove Type Suppressions
**Time:** 1-2 hours

**Steps:**
1. Fix tool context types
2. Remove `@ts-expect-error` comments
3. Verify typecheck passes

### 3.2 Fix Unsafe Casting
**Time:** 3-4 hours

**Steps:**
1. Add type guards
2. Validate before casting
3. Use `unknown` then narrow

### 3.3 Add JSDoc
**Time:** 4-6 hours

**Steps:**
1. Document all public functions
2. Document parameters
3. Document return types

### 3.4 Reduce Duplication
**Time:** 2-3 hours

**Steps:**
1. Extract metadata helpers
2. Extract thread helpers
3. Consolidate duplicate code

---

## 📅 EXECUTION TIMELINE

### Week 1-2: Critical Fixes
- **Week 1:** Assessment flow (6-8h) + Resource search (2-3h) = 8-11h
- **Week 2:** Cron jobs (3-4h) + Stripe webhook (4-6h) + Input validation (3-4h) = 10-14h
- **Week 2:** Rate limiting (2-3h)

**Total:** 20-28 hours

### Week 3-4: High Priority
- **Week 3:** Reduce `any` types (8-12h)
- **Week 4:** Structured logging (4-6h) + Error types (4-6h) + Indexes (1-2h) = 9-14h

**Total:** 17-26 hours

### Week 5-6: Medium Priority
- **Week 5:** Type suppressions (1-2h) + Unsafe casting (3-4h) = 4-6h
- **Week 6:** JSDoc (4-6h) + Reduce duplication (2-3h) = 6-9h

**Total:** 10-15 hours

---

## ✅ ACCEPTANCE CRITERIA

### Phase 1 Complete
- [ ] Assessment completion works end-to-end
- [ ] Resource search returns real Google Maps data
- [ ] Cron jobs execute successfully
- [ ] Stripe subscriptions activate
- [ ] Input validation prevents invalid data
- [ ] Rate limiting prevents abuse

### Phase 2 Complete
- [ ] `any` types reduced to <50
- [ ] All logs structured with trace IDs
- [ ] Error types used throughout
- [ ] Composite indexes added

### Phase 3 Complete
- [ ] No type suppressions
- [ ] No unsafe casting
- [ ] All functions documented
- [ ] Code duplication reduced

---

## 🧪 TESTING STRATEGY

### For Each Fix

1. **Unit Tests** (if applicable)
   - Test helper functions
   - Test validators
   - Test error handling

2. **Integration Tests**
   - Test end-to-end flows
   - Test error cases
   - Test edge cases

3. **Manual Testing**
   - Test in dev environment
   - Verify user experience
   - Check logs/metrics

4. **Deployment**
   - Deploy to staging first
   - Monitor for errors
   - Deploy to production

---

## 📊 SUCCESS METRICS

### Phase 1
- Assessment completion rate: Target 60%
- Resource search accuracy: 100% real data
- Cron job execution: 100% success rate
- Subscription activation: 100% success rate
- Rate limit violations: 0 (all blocked)

### Phase 2
- Type safety: `any` count <50
- Log searchability: 100% structured
- Error handling: All errors have codes
- Query performance: 20% improvement

### Phase 3
- Code quality: All functions documented
- Maintainability: Reduced duplication
- Type safety: No suppressions

---

## 🚨 RISK MITIGATION

### Risks

1. **Breaking Changes**
   - **Mitigation:** Test thoroughly before deploy
   - **Mitigation:** Deploy to staging first
   - **Mitigation:** Feature flags for risky changes

2. **Performance Regression**
   - **Mitigation:** Monitor latency after each change
   - **Mitigation:** Load test critical paths
   - **Mitigation:** Rollback plan ready

3. **Data Loss**
   - **Mitigation:** Backup before schema changes
   - **Mitigation:** Test migrations in dev
   - **Mitigation:** Gradual rollout

---

## 📝 TRACKING

### Progress Tracking

Use this checklist to track progress:

**Phase 1: Critical (20-28h)**
- [ ] 1.1 Assessment completion flow (6-8h)
- [ ] 1.2 Resource search (2-3h)
- [ ] 1.3 Cron jobs (3-4h)
- [ ] 1.4 Stripe webhook (4-6h)
- [ ] 1.5 Input validation (3-4h)
- [ ] 1.6 Rate limiting (2-3h)

**Phase 2: High Priority (17-26h)**
- [ ] 2.1 Reduce `any` types (8-12h)
- [ ] 2.2 Structured logging (4-6h)
- [ ] 2.3 Error types (4-6h)
- [ ] 2.4 Missing indexes (1-2h)

**Phase 3: Medium Priority (10-15h)**
- [ ] 3.1 Type suppressions (1-2h)
- [ ] 3.2 Unsafe casting (3-4h)
- [ ] 3.3 JSDoc (4-6h)
- [ ] 3.4 Reduce duplication (2-3h)

---

## 🎯 RECOMMENDED ORDER

### Must Do First (Week 1)
1. **Assessment completion** - Core feature broken
2. **Resource search** - User-facing bug
3. **Input validation** - Security risk

### Must Do Second (Week 2)
4. **Cron jobs** - Scheduled features broken
5. **Stripe webhook** - Billing broken
6. **Rate limiting** - Cost risk

### Should Do Next (Week 3-4)
7. **Reduce `any` types** - Type safety
8. **Structured logging** - Observability
9. **Error types** - Better error handling
10. **Missing indexes** - Performance

### Nice to Have (Week 5-6)
11. **Type suppressions** - Code quality
12. **Unsafe casting** - Type safety
13. **JSDoc** - Documentation
14. **Reduce duplication** - Maintainability

---

## 📈 EXPECTED OUTCOMES

### After Phase 1
- ✅ All core features working
- ✅ Billing functional
- ✅ Security hardened
- ✅ Cost controls in place

**Quality Score:** 70/100 (C+)

### After Phase 2
- ✅ Type safety improved
- ✅ Observability enhanced
- ✅ Error handling standardized
- ✅ Performance optimized

**Quality Score:** 80/100 (B)

### After Phase 3
- ✅ Code quality improved
- ✅ Documentation complete
- ✅ Maintainability improved

**Quality Score:** 85/100 (B+)

---

## 🔄 ITERATION PLAN

### Weekly Review
- Review progress
- Adjust priorities
- Update estimates
- Deploy completed fixes

### After Each Phase
- Deploy to production
- Monitor for issues
- Gather feedback
- Adjust next phase

---

**Last Updated:** 2025-01-10  
**Next Review:** Weekly during execution  
**Status:** Ready to begin Phase 1

