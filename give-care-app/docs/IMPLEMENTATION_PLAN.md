# Implementation Plan - Feature Completion

**Created:** 2025-11-11  
**Target Version:** v1.8.0  
**Status:** Planning  
**Estimated Timeline:** 3-4 weeks

---

## Overview

This plan addresses all gaps identified in `FEATURE_STATUS.md` to bring GiveCare to 100% feature completeness. Work is organized into 4 phases, prioritized by business impact and dependencies.

---

## Phase 1: Critical Revenue Blockers (Week 1) 🔴

**Goal:** Enable subscription billing and revenue generation  
**Impact:** Unblocks business operations  
**Dependencies:** None

### 1.1 Stripe Checkout Flow

**Status:** ⏳ Not Started  
**Priority:** P0 (Critical)  
**Estimated Time:** 2-3 days

#### Tasks

1. **Create Checkout Session Endpoint** (`convex/public.ts`)
   - Add `createCheckoutSession` mutation
   - Accept `userId`, `priceId` (monthly/yearly), `trialDays` (7)
   - Create Stripe Checkout Session with:
     - `client_reference_id`: userId
     - `mode`: 'subscription'
     - `subscription_data.trial_period_days`: 7
     - `success_url`: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`
     - `cancel_url`: `${FRONTEND_URL}/cancel`
   - Return `checkoutUrl` and `sessionId`

2. **Add Price IDs to Environment**
   - `STRIPE_PRICE_ID_MONTHLY`: $9.99/month
   - `STRIPE_PRICE_ID_YEARLY`: $99/year
   - Document in `.env.example`

3. **Update Checkout Completed Handler** (`convex/internal.ts`)
   - Extract `client_reference_id` from session
   - Link `stripeCustomerId` to user via `user.metadata.stripeCustomerId`
   - Create subscription record with `trialEndsAt` timestamp

4. **Add Free Trial Tracking** (`convex/schema.ts`)
   - Add `trialEndsAt: v.optional(v.number())` to `subscriptions` table
   - Add `trialStartedAt: v.optional(v.number())` to `subscriptions` table

5. **Create Subscription Status Helper** (`convex/lib/subscription.ts`)
   - `isTrialActive(subscription)`: Check if trial is still active
   - `isSubscriptionActive(subscription)`: Check if subscription is paid
   - `requireActiveSubscription(ctx, userId)`: Throw if not subscribed (for premium features)

6. **Tests**
   - Unit tests for checkout session creation
   - Integration test for webhook → subscription creation
   - Test trial period logic

**Files to Create/Modify:**
- `convex/public.ts` (add `createCheckoutSession`)
- `convex/internal.ts` (enhance `handleCheckoutCompleted`)
- `convex/schema.ts` (add trial fields)
- `convex/lib/subscription.ts` (new file)
- `tests/billing.test.ts` (add checkout tests)

**Acceptance Criteria:**
- ✅ User can create checkout session via mutation
- ✅ Checkout redirects to Stripe
- ✅ Webhook creates subscription with trial period
- ✅ Trial status tracked correctly
- ✅ Subscription status helper works

---

### 1.2 Promo Code System

**Status:** ⏳ Not Started  
**Priority:** P1 (High)  
**Estimated Time:** 1-2 days

#### Tasks

1. **Create Promo Codes Table** (`convex/schema.ts`)
   - `promo_codes`: `code`, `discountType` ('percent' | 'amount'), `discountValue`, `maxUses`, `usedCount`, `expiresAt`, `active`

2. **Seed Initial Promo Codes** (`convex/lib/promoSeeds.ts`)
   - Create 15 promo codes (partners/press)
   - Store in `promo_codes` table via migration script

3. **Add Promo Code to Checkout** (`convex/public.ts`)
   - Update `createCheckoutSession` to accept optional `promoCode`
   - Validate promo code (exists, active, not expired, not maxed out)
   - Apply to Stripe Checkout Session via `discounts` parameter

4. **Track Promo Code Usage** (`convex/internal.ts`)
   - Increment `usedCount` when checkout completes
   - Log promo code usage in `billing_events`

5. **Admin Query** (`convex/public.ts`)
   - Add `getPromoCodeStats` query for admin dashboard

**Files to Create/Modify:**
- `convex/schema.ts` (add `promo_codes` table)
- `convex/lib/promoSeeds.ts` (new file)
- `convex/public.ts` (add promo code validation)
- `convex/internal.ts` (track usage)

**Acceptance Criteria:**
- ✅ Promo codes table exists
- ✅ 15 promo codes seeded
- ✅ Promo code validation works
- ✅ Discount applied to checkout
- ✅ Usage tracked correctly

---

## Phase 2: Core Feature Completion (Week 2) 🟡

**Goal:** Complete intervention system and proactive messaging  
**Impact:** Unblocks core user value  
**Dependencies:** None

### 2.1 Intervention Seeding

**Status:** ⏳ Not Started  
**Priority:** P0 (Critical)  
**Estimated Time:** 2-3 days

#### Tasks

1. **Research Evidence-Based Interventions**
   - Review clinical literature for caregiver interventions
   - Identify 16 strategies with evidence levels (High/Moderate/Low)
   - Map to 5 pressure zones (emotional, physical, social, time, financial)

2. **Create Intervention Seed Data** (`convex/lib/interventionSeeds.ts`)
   - Define 16 interventions with:
     - `title`: Short, actionable name
     - `description`: What it is and why it helps
     - `category`: 'breathing' | 'respite' | 'support_group' | 'exercise' | etc.
     - `targetZones`: Array of zones (e.g., ['emotional', 'physical'])
     - `evidenceLevel`: 'high' | 'moderate' | 'low'
     - `duration`: '2-5 min' | '15-30 min' | '1+ hour'
     - `tags`: Array of keywords
     - `content`: Detailed instructions for SMS delivery

3. **Create Seed Migration** (`convex/lib/seedInterventions.ts`)
   - `seedInterventions` mutation (idempotent - checks if exists)
   - Insert interventions into `interventions` table
   - Insert zone mappings into `intervention_zones` table
   - Return count of seeded interventions

4. **Run Seed Script**
   - Execute via Convex dashboard or CLI
   - Verify all 16 interventions created
   - Verify zone mappings correct

5. **Update Agent Tool** (`convex/tools.ts`)
   - Verify `findInterventions` tool works with seeded data
   - Test zone matching logic

**Files to Create/Modify:**
- `convex/lib/interventionSeeds.ts` (new file - seed data)
- `convex/lib/seedInterventions.ts` (new file - migration script)
- `convex/tools.ts` (verify tool works)

**Example Intervention Structure:**
```typescript
{
  title: "4-7-8 Breathing Exercise",
  description: "A simple breathing technique to reduce stress and anxiety",
  category: "breathing",
  targetZones: ["emotional", "physical"],
  evidenceLevel: "high",
  duration: "2-5 min",
  tags: ["breathing", "stress", "anxiety", "quick"],
  content: "Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times. This activates your body's relaxation response."
}
```

**Acceptance Criteria:**
- ✅ 16 interventions seeded
- ✅ All zones mapped correctly
- ✅ Evidence levels assigned
- ✅ Agent tool returns interventions
- ✅ Zone matching works

---

### 2.2 Proactive Messaging Escalation

**Status:** ⏳ Not Started  
**Priority:** P1 (High)  
**Estimated Time:** 1-2 days

#### Tasks

1. **Enhance Engagement Tracking** (`convex/schema.ts`)
   - Add `lastEngagementDate: v.optional(v.number())` to `users` table
   - Add `engagementFlags: v.optional(v.object({ lastNudgeDate: v.optional(v.number()), nudgeCount: v.optional(v.number()) }))` to `users` table

2. **Update Engagement Monitoring** (`convex/workflows.ts`)
   - Modify `monitorEngagement` to track:
     - Days since last engagement (0, 5, 7, 14)
     - Nudge count (0, 1, 2+)
   - Implement graduated response logic:
     - **Day 5**: Light nudge (current behavior)
     - **Day 7**: Stronger concern + crisis resources (988/741741)
     - **Day 14+**: Final check-in + crisis resources

3. **Create Nudge Messages** (`convex/lib/nudgeMessages.ts`)
   - `getDay5Nudge(name)`: "Hi {name}, we haven't heard from you in a bit—hope you and your care recipient are okay. No pressure to reply, just want you to know I'm here."
   - `getDay7Nudge(name)`: "Hi {name}, I'm a bit worried—you've been quiet for a week, which isn't like you. If you're feeling overwhelmed or need help, please reach out. You can always call 988 or text 741741 if you're in crisis. Thinking of you."
   - `getDay14Nudge(name)`: "Hi {name}, it's been two weeks since we last connected. I'm here whenever you need support. If you're in crisis, call 988 or text 741741. Take care."

4. **Update Engagement Workflow** (`convex/workflows.ts`)
   - Calculate days since last engagement
   - Select appropriate nudge message
   - Update `engagementFlags` after sending
   - Skip if already nudged recently (cooldown: 2 days)

5. **Add Crisis Resource Helper** (`convex/lib/nudgeMessages.ts`)
   - `getCrisisResources()`: Returns formatted 988/741741/911 text

**Files to Create/Modify:**
- `convex/schema.ts` (add engagement tracking fields)
- `convex/workflows.ts` (enhance `monitorEngagement`)
- `convex/lib/nudgeMessages.ts` (new file)

**Acceptance Criteria:**
- ✅ Day 5 nudge sent (light)
- ✅ Day 7 nudge includes crisis resources
- ✅ Day 14 nudge includes crisis resources
- ✅ Nudge count tracked
- ✅ Cooldown prevents spam

---

## Phase 3: Analytics & Observability (Week 3) 🟢

**Goal:** Enable success metrics tracking  
**Impact:** Business intelligence  
**Dependencies:** None

### 3.1 Success Metrics Dashboard

**Status:** ⏳ Not Started  
**Priority:** P2 (Medium)  
**Estimated Time:** 2-3 days

#### Tasks

1. **Create Metrics Queries** (`convex/public.ts`)
   - `getAssessmentCompletionRate(userId?, dateRange?)`: Calculate completion rate
   - `getUserRetention(days)`: Calculate retention at 30/60/90 days
   - `getBurnoutScoreTrends(userId?, dateRange?)`: Track score improvements
   - `getCrisisResponseLatency(dateRange?)`: Calculate p95 latency
   - `getPressureZoneReduction(userId?, dateRange?)`: Track zone improvements

2. **Create Aggregation Queries** (`convex/public.ts`)
   - `getOverallMetrics(dateRange)`: Aggregate all metrics
   - `getUserMetrics(userId)`: User-specific metrics

3. **Add Metrics to Admin Dashboard** (`give-care-admin`)
   - Create metrics dashboard component
   - Display success metrics from queries
   - Add charts/graphs for trends

4. **Create Metrics Cron** (`convex/crons.ts`)
   - Daily aggregation job to populate `metrics_daily` table
   - Calculate retention, completion rates, etc.

**Files to Create/Modify:**
- `convex/public.ts` (add metrics queries)
- `convex/crons.ts` (add metrics aggregation)
- `give-care-admin/src/components/MetricsDashboard.tsx` (new file)

**Acceptance Criteria:**
- ✅ All success metrics queryable
- ✅ Admin dashboard displays metrics
- ✅ Daily aggregation runs
- ✅ User-specific metrics available

---

### 3.2 Follow-Up Check-in After Crisis

**Status:** ⚠️ Needs Verification  
**Priority:** P2 (Medium)  
**Estimated Time:** 0.5-1 day

#### Tasks

1. **Verify Crisis Follow-up Logic** (`convex/workflows.ts`)
   - Check if follow-up trigger exists
   - Verify next-day check-in scheduled

2. **Create Follow-up Workflow** (if missing)
   - `scheduleCrisisFollowUp(userId)`: Schedule check-in 24 hours after crisis
   - Send gentle message: "Hi {name}, I wanted to check in after yesterday. How are you doing today?"

3. **Add Crisis Follow-up Trigger** (`convex/inbound.ts`)
   - After crisis detection, schedule follow-up
   - Store in `triggers` table with `type: 'one_off'`

**Files to Create/Modify:**
- `convex/workflows.ts` (add follow-up workflow)
- `convex/inbound.ts` (schedule follow-up)

**Acceptance Criteria:**
- ✅ Follow-up scheduled after crisis
- ✅ Message sent 24 hours later
- ✅ Trigger created correctly

---

## Phase 4: Polish & Verification (Week 4) 🔵

**Goal:** Verify all features, fix edge cases  
**Impact:** Production readiness  
**Dependencies:** Phases 1-3 complete

### 4.1 Resource Categories Verification

**Status:** ⚠️ Needs Verification  
**Priority:** P3 (Low)  
**Estimated Time:** 0.5 day

#### Tasks

1. **Verify Resource Categories** (`convex/resources.ts`)
   - Check if 10 categories match FEATURES.md spec
   - Document categories in code comments

2. **Update Documentation** (`give-care-app/docs/FEATURES.md`)
   - List exact 10 categories if different from spec

**Files to Create/Modify:**
- `convex/resources.ts` (add category documentation)
- `give-care-app/docs/FEATURES.md` (update if needed)

**Acceptance Criteria:**
- ✅ 10 categories verified
- ✅ Documentation updated

---

### 4.2 End-to-End Testing

**Status:** ⏳ Not Started  
**Priority:** P1 (High)  
**Estimated Time:** 2-3 days

#### Tasks

1. **Create Integration Test Suite** (`tests/integration/`)
   - Test full user journey (onboarding → assessment → intervention → subscription)
   - Test crisis detection → follow-up
   - Test proactive messaging escalation
   - Test Stripe checkout → webhook → subscription

2. **Create Simulation Tests** (`tests/simulation/`)
   - Test intervention seeding and retrieval
   - Test promo code application
   - Test engagement monitoring

3. **Performance Testing**
   - Verify crisis response <600ms
   - Verify main agent <1s
   - Load test checkout flow

**Files to Create/Modify:**
- `tests/integration/full-journey.test.ts` (new file)
- `tests/integration/billing.test.ts` (new file)
- `tests/simulation/interventions.test.ts` (new file)

**Acceptance Criteria:**
- ✅ All user journeys pass
- ✅ Performance targets met
- ✅ Edge cases handled

---

### 4.3 Documentation Updates

**Status:** ⏳ Not Started  
**Priority:** P2 (Medium)  
**Estimated Time:** 1 day

#### Tasks

1. **Update ARCHITECTURE.md**
   - Document intervention seeding process
   - Document Stripe checkout flow
   - Document proactive messaging escalation

2. **Update FEATURES.md**
   - Mark all features as complete
   - Update status to "Production (v1.8.0)"

3. **Update CHANGELOG.md**
   - Document v1.8.0 changes
   - List all completed features

4. **Update FEATURE_STATUS.md**
   - Mark all gaps as resolved
   - Update completion percentage to 100%

**Files to Create/Modify:**
- `give-care-app/docs/ARCHITECTURE.md`
- `give-care-app/docs/FEATURES.md`
- `give-care-app/CHANGELOG.md`
- `give-care-app/docs/FEATURE_STATUS.md`

**Acceptance Criteria:**
- ✅ All docs updated
- ✅ Feature status shows 100%
- ✅ Changelog complete

---

## Implementation Order

### Week 1: Revenue Blockers
1. ✅ Stripe Checkout Flow (Days 1-3)
2. ✅ Promo Code System (Days 4-5)

### Week 2: Core Features
3. ✅ Intervention Seeding (Days 1-3)
4. ✅ Proactive Messaging Escalation (Days 4-5)

### Week 3: Analytics
5. ✅ Success Metrics Dashboard (Days 1-3)
6. ✅ Crisis Follow-up Verification (Day 4)

### Week 4: Polish
7. ✅ Resource Categories Verification (Day 1)
8. ✅ End-to-End Testing (Days 2-4)
9. ✅ Documentation Updates (Day 5)

---

## Dependencies

```
Phase 1 (Revenue)
├── Stripe Checkout Flow (no deps)
└── Promo Code System (depends on: Stripe Checkout)

Phase 2 (Core Features)
├── Intervention Seeding (no deps)
└── Proactive Messaging (no deps)

Phase 3 (Analytics)
├── Success Metrics (no deps)
└── Crisis Follow-up (no deps)

Phase 4 (Polish)
├── Resource Categories (no deps)
├── End-to-End Testing (depends on: All phases)
└── Documentation (depends on: All phases)
```

---

## Risk Mitigation

### High Risk
- **Stripe Integration**: Test thoroughly in Stripe test mode before production
- **Intervention Seeding**: Verify evidence levels with clinical advisor

### Medium Risk
- **Proactive Messaging**: Ensure cooldown prevents spam
- **Metrics Aggregation**: Test with large datasets

### Low Risk
- **Documentation**: Can be updated incrementally
- **Resource Categories**: Simple verification task

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Users can subscribe via Stripe checkout
- ✅ Promo codes work
- ✅ Free trial tracked

### Phase 2 Complete When:
- ✅ 16 interventions seeded
- ✅ Interventions returned by agent tool
- ✅ Proactive messaging has 3-tier escalation

### Phase 3 Complete When:
- ✅ All success metrics queryable
- ✅ Admin dashboard shows metrics
- ✅ Crisis follow-up verified

### Phase 4 Complete When:
- ✅ All tests pass
- ✅ Documentation updated
- ✅ Feature status shows 100%

---

## Rollout Plan

### Pre-Production
1. Deploy to staging environment
2. Run integration tests
3. Verify Stripe test mode checkout
4. Seed interventions in staging
5. Test proactive messaging escalation

### Production
1. Deploy Phase 1 (Revenue) first
2. Monitor Stripe webhooks for 24 hours
3. Deploy Phase 2 (Core Features)
4. Verify interventions seeded
5. Deploy Phase 3 (Analytics)
6. Deploy Phase 4 (Polish)

### Post-Production
1. Monitor success metrics
2. Collect user feedback
3. Iterate on interventions based on usage
4. Optimize proactive messaging timing

---

## Estimated Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1: Revenue Blockers | 5 days | T+0 | T+5 |
| Phase 2: Core Features | 5 days | T+5 | T+10 |
| Phase 3: Analytics | 4 days | T+10 | T+14 |
| Phase 4: Polish | 5 days | T+14 | T+19 |
| **Total** | **19 days** | **~3-4 weeks** | |

---

## Next Steps

1. **Review this plan** with team
2. **Prioritize phases** based on business needs
3. **Assign owners** for each phase
4. **Set up tracking** (GitHub issues, project board)
5. **Start Phase 1** (Stripe Checkout)

---

**Last Updated:** 2025-11-11  
**Owner:** TBD  
**Status:** Ready for Review

