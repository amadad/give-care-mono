# Product Journeys & UX - Implementation Status

**Last Updated**: 2025-11-16
**Version**: v1.7.0

This document maps actual implementation against product documentation, distinguishing between live features, partial implementations, and documented-but-missing functionality.

---

## Live & Working Journeys

### First-Contact SMS Flow
**Files**: `convex/inbound.ts:82-236` + `convex/lib/utils.ts:239-300`
**Status**: ✅ Working

**Implemented**:
- Zero onboarding friction (auto-creates user from any message)
- Auto-extracts ZIP/name/care recipient before agent processing
- Main Agent delivers value prop by message three
- E.164 phone normalization
- Idempotent message handling via `inbound_receipts`

**Gaps**:
- "Single-question pacing" is agent prompt-driven, not enforced
- No structured onboarding sequence (fully conversational)

---

### Crisis Response Flow
**Files**: `convex/lib/utils.ts:6-93`
**Status**: ✅ Working (deterministic, <600ms)

**Implemented**:
- 19+ crisis keywords across 3 severity levels (high/medium/low)
- Immediate 988/741741/911 resources with empathetic validation
- False-positive filtering (subscription-related keywords)
- DV/abuse hint detection (separate pattern set)
- Logs to `alerts` + `guardrail_events` tables
- Rate limit bypass for crisis messages

**Crisis Keywords**:
- **High**: "kill myself", "suicide", "end my life", "overdose", "can't go on", "can't take it anymore"
- **Medium**: "hurt myself", "self harm", "hopeless", "done with life", "give up"
- **Low**: "panic attack"

**Response Template**:
```
"I'm hearing intense distress. You're not alone - support is available 24/7.
Call or text 988 or chat at 988lifeline.org.
Text HOME to 741741 (Crisis Text Line).
If in immediate danger, call 911."
```

**Gaps**:
- ❌ **NOT an agent** - Documentation incorrectly claims "Crisis Agent" exists; actual implementation is deterministic keyword matching
- ❌ No "offer to help connect" implementation
- ❌ Day-after follow-up removed (code comment `inbound.ts:420`)
- ❌ No escalation to human crisis counselor

---

### Assessment Journeys
**Files**: `convex/assessments.ts` + `convex/lib/assessmentCatalog.ts`
**Status**: ✅ Partially Working (2 of 4 documented assessments)

**Implemented**:

#### EMA (Daily Check-In)
- 3 questions, ~2 minutes
- Progress markers ("Question 2 of 3")
- 1-day cooldown period
- Zones covered: P6 (emotional), P1 (social)
- Score blending: 70% new, 30% existing

#### SDOH-28 (Comprehensive Assessment)
- 28 questions, ~15 minutes
- 30-day cooldown period
- Zones covered: P1, P3, P4, P5, P6
- Full zone replacement on completion

**Zone Mapping (SDOH-28)**:
- **P1** (Relationship & Social Support): Questions 1-8
- **P3** (Housing & Environment): Questions 9-12
- **P4** (Financial Resources): Questions 13-20
- **P5** (Legal & Navigation): Questions 21-26
- **P6** (Emotional Wellbeing): Questions 27-28
- **P2** (Physical Health): Inferred via `recordObservation` tool (no structured questions)

**Score System**:
- Composite GC-SDOH score (0-100)
- Zone-specific scores (P1-P6)
- Risk levels: low/moderate/high/crisis
- Score history tracking in `score_history` table
- Assessment Agent (GPT-4o mini) interprets results + suggests resources

**Gaps**:
- ❌ **Only 2 assessments exist** - Documentation claims EMA/BSFC/REACH-II/SDOH; only EMA and SDOH-28 implemented
- ❌ No "skip" affordance per turn (docs claim users can skip each question)
- ❌ No "escalate supportive follow-ups when stress scores spike" (no auto-trigger)
- ❌ No structured P2 (Physical Health) questions - inference-only via conversation
- ⚠️ Score band mismatch:
  - **Docs claim**: 0-40 (Very Low), 40-60 (Low), 60-80 (Moderate), 80-100 (High)
  - **Code implements**: 0-50 (Very Low), 50-75 (Low), 75-100 (Moderate), no High band

---

### Resource Discovery Journey
**Files**: `convex/resources.ts` + `convex/lib/maps.ts` + `convex/tools.ts:26-85`
**Status**: ✅ Working

**Implemented**:
- Progressive enhancement strategy:
  1. **No ZIP**: Return national resources (hardcoded fallback)
  2. **Has ZIP**: Google Maps local search
  3. **Has ZIP + score**: Zone-targeted enhancement (finds worst zone, enhances query)
- Google Maps Grounding API via Gemini 2.5 Flash-Lite
- 3-second timeout with graceful fallback
- ZIP code reuse from `user.zipCode`
- SMS-optimized formatting (top 3 results, <160 chars per item)
- Policy-compliant caching (only stores placeId, name, types)

**National Resources**:
- **Respite**: Family Caregiver Alliance, ARCH National Respite, National Respite Locator
- **Support**: FCA, AARP Caregiving, Caregiver Action Network
- **Default**: FCA, AARP, National Alliance for Caregiving

**Gaps**:
- ❌ **Only 3 categories working** (respite, support, default) vs 10 documented:
  - Missing: daycare, homecare, medical, community, meals, transport, hospice, memory
- ❌ **No hours/ratings/reviews** - Documentation claims "curated Google Maps hits with hours, ratings, and reviews in SMS-friendly cards"
  - Actual: Only returns placeId, name, address (policy-compliant storage)
- ❌ No persistent "My Resources" list
- ❌ No resource usage tracking (open/click events logged but not surfaced)

---

### Long-Term Memory UX
**Files**: `convex/internal/memories.ts` + `convex/tools.ts:120-161`
**Status**: ✅ Working

**Implemented**:
- 5 categories:
  - `care_routine`: Daily schedules, medication times, behavioral patterns
  - `preference`: Communication style, triggers to avoid, comfort measures
  - `intervention_result`: What worked/didn't work in past situations
  - `crisis_trigger`: Known escalation patterns, warning signs
  - `family_health`: Diagnoses, medications, medical history
- Importance scoring (1-10)
- Retrieval optimized by importance (≥7, limit 5)
- Vector search via Agent Component (automatic embedding generation)
- Agents reference naturally in conversation ("I remember you mentioned...")
- `recordObservation` tool for P2 (Physical Health) zone updates from conversation

**Storage**:
- `memories` table with embeddings (Agent Component manages)
- Indexed by `by_user_and_importance` and `by_user_category`

**Gaps**:
- ❌ No memory editing/deletion UX
- ❌ No memory importance UI (users can't see/adjust scores)
- ❌ No memory categories surfaced to users
- ❌ P2 observations lack structured validation (severity 1-5 scale mapped arbitrarily)

---

### Subscription Journey
**Files**: `convex/stripe.ts` + `convex/internal/stripe.ts`
**Status**: ✅ Working (basic tier only)

**Implemented**:
- **Plans**: Monthly ($9.99), Annual ($99.00)
- Stripe Checkout session creation
- Webhook processing (idempotent via `billing_events` table)
- Welcome SMS on `checkout.session.completed`
- Billing Portal for self-service (update payment, cancel, view invoices)
- Subscription states: active, canceled, past_due
- 30-day grace period after cancellation
- Feature gating via `SUBSCRIPTIONS_ENABLED` env var
- Rate limit bypass for crisis regardless of subscription status

**Webhook Events Handled**:
- `checkout.session.completed`: Triggers welcome SMS
- `customer.subscription.created/updated`: Updates subscription status
- `customer.subscription.deleted`: Sets status to canceled, starts grace period

**Subscription Scenarios**:
- `new_user`: Send signup invitation
- `active`: Full access
- `grace_period`: Limited time to resubscribe
- `grace_expired`: No access, resubscribe prompt
- `past_due`: Payment failed, update payment prompt

**Gaps**:
- ❌ **No trials** - Free trial logic not implemented
- ❌ **No promo codes** - Discount/coupon system not integrated
- ❌ **No tiered plans** - Single paid tier only (documentation mentions Plus/Enterprise)
- ❌ **No graduated messaging** - No behavior changes based on plan tier
- ❌ **No usage caps** - All users get same rate limits regardless of tier
- ❌ **No subscription analytics** - No MRR/churn tracking exposed

---

## Partially Implemented Journeys

### Scheduled EMA Check-Ins
**Files**: `convex/workflows.ts` + `convex/crons.ts:11`
**Status**: 🚧 Built but disabled

**Implemented**:
- Durable workflow via @convex-dev/workflow
- Timezone-aware scheduling
- Respects quiet hours (8am-9pm local time)
- Sends EMA prompt at user's preferred time
- Checks for completion within 1 hour
- Sends follow-up if completed

**Disabled**:
- ❌ **Cron commented out** - Daily check-in trigger not active
- ❌ **Manual only** - Works via `startAssessment` tool when agent suggests
- ❌ **No user preferences** - No UI to set preferred check-in time
- ❌ **No opt-out** - Users can't disable daily check-ins (though it's not running)

**To Enable**:
```typescript
// Uncomment in convex/crons.ts:11
crons.daily(
  "daily check-in",
  { hourUTC: 14 }, // 9am EST
  internal.workflows.triggerDailyCheckIns
);
```

---

### Engagement Monitoring
**Files**: `convex/workflows.ts` + `convex/internal/sms.ts:122-146`
**Status**: 🚧 Templates exist, no trigger logic

**Implemented**:
- Nudge message templates:
  - **Day 5**: "Just checking in - how are you holding up?"
  - **Day 7**: "I'm here when you need to talk. How's your week been?"
  - **Day 14**: "It's been a couple weeks - want to share how things are going?"
- `sendEngagementNudge` function exists
- `lastEngagementDate` tracked on `users` table

**Missing**:
- ❌ **No watcher** - No cron/workflow monitoring `lastEngagementDate`
- ❌ **No escalation** - No "gentle then urgent" logic
- ❌ **No crisis resources** - Urgent nudges don't include 988/741741 as documented
- ❌ **No thread resume** - No stored conversation context retrieval on re-engagement
- ❌ **No completion tracking** - No marking nudges as sent/acknowledged

**To Implement**:
```typescript
// Add to convex/crons.ts
crons.daily(
  "engagement monitoring",
  { hourUTC: 18 }, // 1pm EST
  internal.workflows.checkEngagement
);

// Create internal/workflows.ts:checkEngagement
export const checkEngagement = internalMutation({
  handler: async (ctx) => {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const users = await ctx.db
      .query("users")
      .filter(q => q.lt(q.field("lastEngagementDate"), fiveDaysAgo))
      .collect();
    // Send appropriate nudge based on days since last engagement
  }
});
```

---

## Documented But Not Implemented

### Intervention System
**Files**: `convex/schema.ts:136-152` + `convex/tools.ts:166-185`
**Status**: 📝 Schema exists, no data or matching logic

**Schema Exists**:
```typescript
interventions: defineTable({
  title: v.string(),
  description: v.string(),
  category: v.string(),
  evidenceLevel: v.union(
    v.literal("high"),
    v.literal("moderate"),
    v.literal("low")
  ),
  source: v.optional(v.string()),
  microCommitment: v.optional(v.string()),
})
.index("by_category", ["category"])
.index("by_evidence", ["evidenceLevel"]),

intervention_zones: defineTable({
  interventionId: v.id("interventions"),
  zone: v.string(), // P1-P6
})
.index("by_intervention", ["interventionId"])
.index("by_zone", ["zone"]),
```

**Partial Tool**:
```typescript
// convex/tools.ts:166-185
trackInterventionHelpfulness: tool({
  description: "Track whether a suggested intervention was helpful",
  parameters: z.object({
    helpful: z.boolean().describe("Was the intervention helpful?"),
  }),
  execute: async ({ helpful }, { ctx, userId }) => {
    await ctx.runMutation(internal.learning.trackHelpfulnessMutation, {
      userId,
      helpful,
    });
    return { success: true };
  },
}),
```

**Missing**:
- ❌ **No data** - Table empty (docs claim "16 intervention records + micro-commitments")
- ❌ **No `findInterventions` tool** - No matching logic to surface interventions by zone/category
- ❌ **No micro-commitment tracking** - Schema exists but no workflow to follow up
- ❌ **No evidence-based content** - No seeded interventions from research literature
- ❌ **No helpfulness analytics** - `trackHelpfulnessMutation` logs but no closed-loop learning

**Documented Intervention Categories** (from FEATURES.md):
1. Respite planning
2. Self-care scheduling
3. Boundary setting
4. Support group connection
5. Task delegation
6. Mindfulness practices
7. Sleep hygiene
8. Nutrition support
9. Physical activity
10. Social connection
11. Financial planning
12. Legal preparation
13. Medical coordination
14. Communication strategies
15. Grief processing
16. Future planning

**To Implement**:
1. Seed `interventions` table with 16 evidence-based records
2. Create `findInterventions` tool:
   ```typescript
   findInterventions: tool({
     description: "Find evidence-based interventions for specific zones",
     parameters: z.object({
       zones: z.array(z.string()).describe("Priority zones (P1-P6)"),
       limit: z.number().optional().default(3),
     }),
     execute: async ({ zones, limit }, { ctx }) => {
       // Query intervention_zones by zone
       // Join to interventions table
       // Sort by evidenceLevel (high > moderate > low)
       // Return top N with micro-commitments
     },
   }),
   ```
3. Add micro-commitment follow-up workflow
4. Implement closed-loop learning from helpfulness feedback

---

### Proactive Messaging
**Status**: 📝 Documented, not implemented

**Documented Features**:
- Post-assessment resource suggestions (FEATURES.md:90)
- Stress spike follow-ups (FEATURES.md:40)
- Crisis follow-up day after (FEATURES.md:64)
- Engagement escalation day 5/7/14 (FEATURES.md:225)

**Current Reality**:
- ✅ Post-assessment suggestions work via Assessment Agent (prompt-driven, not automated)
- ❌ No stress spike monitoring (no score change detection)
- ❌ Crisis follow-up explicitly removed (code comment `inbound.ts:420`)
- ❌ Engagement escalation templates exist but not triggered (see "Engagement Monitoring" above)

**To Implement**:
1. **Score spike monitoring**:
   ```typescript
   // Add to convex/internal/score.ts:updateUserScore
   const oldScore = user.gcSdohScore ?? 0;
   const delta = newScore - oldScore;

   if (delta >= 20) { // 20+ point increase
     await ctx.scheduler.runAfter(0, internal.sms.sendScoreSpikeFollowUp, {
       userId,
       oldScore,
       newScore,
       zones: newZones,
     });
   }
   ```

2. **Crisis follow-up** (re-implement):
   ```typescript
   // Add to convex/internal/sms.ts
   export const sendCrisisFollowUp = internalAction({
     args: { userId: v.id("users") },
     handler: async (ctx, { userId }) => {
       // Check if crisis alert was created in last 24h
       // Send: "Checking in after yesterday - how are you feeling today?"
       // Include resources again
     },
   });

   // Schedule in crisis detection (convex/lib/utils.ts:93)
   await ctx.scheduler.runAfter(
     24 * 60 * 60 * 1000, // 24 hours
     internal.sms.sendCrisisFollowUp,
     { userId }
   );
   ```

---

### Advanced Subscription Features
**Status**: 📝 Schema exists, logic not implemented

**Missing Features**:
- ❌ **Free trials** - No trial period logic (checkout goes straight to paid)
- ❌ **Promo codes** - No discount/coupon integration (Stripe supports, not wired)
- ❌ **Tiered plans** - Documentation mentions Plus/Enterprise tiers, only one paid plan exists
- ❌ **Graduated messaging** - No behavior changes based on subscription tier
- ❌ **Usage-based pricing** - No SMS count/token usage metering per plan
- ❌ **Team/family plans** - No multi-user support
- ❌ **Annual discount enforcement** - Annual plan is manually priced, no auto-discount logic

**Documented Tiers** (from FEATURE_STATUS.md:90):
- **Free**: Limited messages, basic assessments
- **Plus** ($9.99/mo): Unlimited messages, all assessments, priority support
- **Enterprise**: Custom pricing, multiple caregivers, dedicated support

**To Implement**:
1. **Trial logic**:
   ```typescript
   // Add to convex/internal/stripe.ts
   trialPeriodDays: 7, // in checkout session creation

   // Check in subscription gating (convex/inbound.ts)
   const subscription = await ctx.db
     .query("subscriptions")
     .withIndex("by_user", q => q.eq("userId", user._id))
     .first();

   const inTrial = subscription?.status === "trialing";
   if (inTrial) return "active"; // Grant access during trial
   ```

2. **Tiered plans**:
   - Create additional Stripe price IDs for Plus/Enterprise
   - Add `plan_tier` field to `subscriptions` table
   - Implement feature gating by tier:
     ```typescript
     if (user.planTier === "free" && dailySMSCount >= 5) {
       return { gated: true, reason: "Free plan limit (5 SMS/day)" };
     }
     ```

3. **Promo codes**:
   - Wire Stripe coupon support in checkout session creation
   - Add `promoCode` parameter to `createCheckoutSession`

---

## Critical Gaps vs. Documentation

| Documented Feature | Actual Status | Evidence | Priority |
|-------------------|---------------|----------|----------|
| **Crisis Agent** | Deterministic keyword matching, NO agent | `convex/lib/utils.ts:6-93` | P3 (working, just mislabeled) |
| **4 assessments** (EMA/BSFC/REACH-II/SDOH) | Only 2 (EMA/SDOH-28) | `convex/lib/assessmentCatalog.ts` | P2 (clinical validation needed) |
| **Skip affordance** each turn | No skip handling in code | `convex/assessments.ts` | P1 (UX friction) |
| **Stress spike escalation** | No score monitoring/triggers | Missing | P1 (safety-critical) |
| **10 resource categories** | Only 3 (respite/support/default) | `convex/resources.ts` | P2 (limited utility) |
| **Hours/ratings/reviews** in results | Only placeId/name/address | `convex/lib/maps.ts` | P3 (policy-compliant only) |
| **16 intervention records** | Table empty | `interventions` table | P1 (core value prop) |
| **findInterventions tool** | Tool doesn't exist | Missing | P1 (core value prop) |
| **Day-after crisis follow-up** | Removed per code comment | `convex/inbound.ts:420` | P1 (safety-critical) |
| **5-day silence monitoring** | Workflow exists, not triggered | `convex/workflows.ts` | P2 (engagement) |
| **Trials/promo codes** | Not implemented | Missing | P3 (growth/conversion) |
| **Tiered plans** (Free/Plus/Enterprise) | Only one paid plan | Missing | P3 (monetization) |

---

## Working Modules (Verified)

### Conversation Layer
**Status**: ✅ Fully operational

- Twilio webhook ingestion via `http.ts`
- Convex Agent Component context hydration
- 2 OpenAI-powered agents:
  - **Main Agent**: Gemini 2.5 Flash-Lite (95% traffic)
  - **Assessment Agent**: GPT-4o mini (5% traffic)
- Trauma-informed prompts (P1-P6 principles)
- Reply delivery via Twilio SMS

### Wellness Assessment
**Status**: ✅ 2 of 4 assessments working

- EMA (3 questions, daily) + SDOH-28 (28 questions, comprehensive)
- Scoring logic via `lib/assessmentCatalog.ts` + `assessments.ts`
- Zone breakdown (P1-P6) + composite GC-SDOH (0-100)
- Dedicated Convex tables: `assessment_sessions`, `assessments`, `scores`, `score_history`

### Crisis Detection
**Status**: ✅ Deterministic, <600ms

- Keyword policy lists (19+ phrases across 3 severity levels)
- Workflows-based escalation (parallel logging + response)
- 988/741741/911 resource messaging
- Downstream logging to `alerts` + `guardrail_events`

### Resource Discovery
**Status**: ✅ Google Maps integration working

- Google Maps Grounding API via Gemini 2.5 Flash-Lite
- 3-second timeout with national fallback
- Progressive enhancement (national → local → zone-targeted)
- Policy-compliant caching (placeId/name/types only)
- SMS-optimized formatting (top 3, <160 chars)

### Working Memory
**Status**: ✅ Agent Component vector search

- `recordMemory` tool + `memories` table
- 5 categories with importance scoring (1-10)
- Automatic embedding generation (Agent Component)
- Retrieval by importance (≥7, limit 5) + semantic search
- Natural agent references in conversation

### Subscriptions
**Status**: ✅ Stripe integration complete

- Webhook handler via `stripe.ts`
- Idempotent processing via `billing_events` table
- Monthly ($9.99) + Annual ($99.00) plans
- Billing portal for self-service
- 30-day grace period logic
- Feature gating via `SUBSCRIPTIONS_ENABLED` env var

### Usage Tracking & Rate Limiting
**Status**: ✅ Convex Rate Limiter component

- 20 SMS/day per user (configurable)
- Crisis bypass (no limits for crisis messages)
- Rate limit messaging via `sendRateLimitMessage`
- `lastEngagementDate` tracking

### Workflows & Jobs
**Status**: ✅ Durable workflows operational

- @convex-dev/workflow for retry-safe execution
- Check-in workflow (built, disabled)
- Crisis escalation (working)
- Enrichment workflows (working)
- Daily cleanup cron (90-day message retention)

---

## Agent Tools & Capabilities

### Main Agent Tools (6 tools)
**Location**: `convex/tools.ts`

1. ✅ **getResources** (lines 26-85)
   - Progressive enhancement (national → local → zone-targeted)
   - Google Maps Grounding integration
   - ZIP extraction, zone enhancement

2. ✅ **recordObservation** (lines 120-161)
   - P2 (Physical Health) zone updates from conversation
   - Severity scale (1-5) → zone score (0-100)

3. ✅ **startAssessment** (lines 90-115)
   - Triggers EMA or SDOH-28
   - Cooldown period checks
   - Creates `assessment_sessions` record

4. ✅ **trackInterventionHelpfulness** (lines 166-185)
   - Simple yes/no feedback
   - Logs to `internal.learning.trackHelpfulnessMutation`

5. ❌ **findInterventions** - MISSING (documented, not implemented)

6. ❌ **updateProfile** - FLAGGED "needs verification" (ARCHITECTURE.md:235)

### Assessment Agent Tools (1 tool)
**Location**: `convex/tools.ts`

1. ✅ **getResources** (reused from Main Agent)
   - Post-assessment resource suggestions based on worst zone

### Guardrails Tooling
**Status**: ✅ Working (deterministic, not LLM-based)

- Crisis keyword detection
- False-positive filtering
- DV hint detection
- Logging to `alerts` + `guardrail_events`

---

## Integration Points

### Inbound
| Integration | Endpoint | Handler | Status |
|------------|----------|---------|--------|
| Twilio SMS | `POST /twilio/incoming-message` | `handleIncomingMessage` | ✅ Working |
| Stripe Webhooks | `POST /stripe/webhook` | `applyStripeEvent` | ✅ Working |
| Web Client | Convex queries/mutations | Various | ✅ Working |

### Outbound
| Integration | Purpose | Handler | Status |
|------------|---------|---------|--------|
| Twilio API | Send SMS | `internal.sms.sendSMS` | ✅ Working |
| OpenAI API | GPT-4o mini (Assessment Agent) | Vercel AI SDK | ✅ Working |
| Google Gemini | Gemini 2.5 Flash-Lite (Main Agent + Maps) | Vercel AI SDK | ✅ Working |
| Google Maps Grounding | Local resource search | `lib/maps.searchWithMapsGrounding` | ✅ Working |
| Stripe API | Checkout + Billing Portal | Stripe SDK | ✅ Working |

### Convex Components
| Component | Purpose | Status |
|-----------|---------|--------|
| @convex-dev/agent | Thread management, vector search, embeddings | ✅ Working |
| @convex-dev/workflow | Durable workflows (check-in, crisis, enrichment) | ✅ Working |
| @convex-dev/rate-limiter | SMS rate limiting (10/day) | ✅ Working |
| @convex-dev/twilio | Twilio SDK wrapper + message storage | ✅ Working |

---

## Priority Action Items

### P1 - Safety & Core Value
1. **Seed interventions** - Add 16 evidence-based records + implement `findInterventions` tool
2. **Re-implement crisis follow-up** - Day-after check-in (removed per `inbound.ts:420`)
3. **Add skip affordance** - Allow "skip" reply during assessments (reduce friction)
4. **Implement stress spike monitoring** - Detect GC-SDOH jumps ≥20 points → proactive follow-up

### P2 - Clinical & Engagement
1. **Enable EMA check-ins** - Uncomment cron in `crons.ts:11`, test timezone/quiet hours
2. **Implement engagement watcher** - 5-day silence detection → nudge escalation (day 5/7/14)
3. **Expand resource categories** - Support all 10 documented categories beyond respite/support/default
4. **Add BSFC/REACH-II assessments** - Close gap between documented 4 and implemented 2

### P3 - Growth & Monetization
1. **Implement free trials** - 7-day trial period for new signups
2. **Add promo codes** - Wire Stripe coupon support
3. **Create tiered plans** - Free/Plus/Enterprise with feature gating
4. **Build subscription analytics** - MRR, churn, conversion tracking

### P4 - UX Polish
1. **Add structured P2 questions** - Physical health assessment (currently inference-only)
2. **Expose memory categories** - Let users see/edit saved memories
3. **Fix score band mismatch** - Align code with documented bands (0-40/40-60/60-80/80-100)
4. **Expand Maps results** - Surface hours/ratings when policy-compliant (not just placeId)

---

## Testing Recommendations

### Simulation Testing Protocol
**Location**: `tests/simulation/` (directory mentioned in CLAUDE.md but not found in codebase)

**Missing Tests**:
- ❌ First-contact SMS flow simulation
- ❌ Crisis detection edge cases (false positives, DV hints)
- ❌ Assessment completion flows (EMA, SDOH-28)
- ❌ Resource discovery with/without ZIP/score
- ❌ Memory retrieval and context hydration
- ❌ Subscription state transitions
- ❌ Rate limiting enforcement
- ❌ Engagement monitoring triggers

**To Implement**:
1. Create `tests/simulation/` directory
2. Add end-to-end tests against live Convex dev deployment
3. Verify ARCHITECTURE.md compliance
4. Test edge cases (missing data, boundary values, race conditions)
5. No mocks - real Convex environment only

---

## Changelog

### v1.7.0 (Current)
- ✅ Crisis detection (<600ms deterministic)
- ✅ EMA + SDOH-28 assessments
- ✅ GC-SDOH scoring system
- ✅ Google Maps resource discovery
- ✅ Memory system with vector search
- ✅ Stripe subscriptions + billing portal
- ✅ Rate limiting (20 SMS/day)
- ✅ Durable workflows
- 🚧 Check-in workflow built but disabled
- 🚧 Engagement monitoring templates exist, no trigger
- 📝 Interventions schema exists, no data
- 📝 Advanced subscription features (trials/promos/tiers) not implemented

### Known Regressions
- ❌ Crisis follow-up removed (was in earlier version per code comment)
- ⚠️ Score band logic doesn't match product spec
- ⚠️ Only 2 of 4 documented assessments exist

---

## References

- `give-care-app/docs/ARCHITECTURE.md` - System architecture and component integration
- `give-care-app/docs/FEATURES.md` - Product feature specifications
- `give-care-app/docs/FEATURE_STATUS.md` - Implementation status tracking
- `give-care-app/docs/DEPLOYMENT.md` - Deployment and environment configuration
- `give-care-app/docs/WEBHOOKS.md` - Twilio and Stripe webhook handling

---

**Document Maintainer**: Generate via `claude-code` exploration of actual codebase
**Next Review**: After P1 action items completed
