# E2E Test Coverage Plan

## Complete list of real end-to-end tests to verify, validate, and confirm system behavior

---

## ✅ Already Implemented (Working)

### Crisis Detection (3 tests)
- [x] **Immediate Crisis Response** - Detects "end it all" message
- [x] **Crisis Escalation** - Normal chat → crisis thoughts
- [x] **False Positives** - Grief messages don't trigger crisis

### Core Infrastructure (5 tests)
- [x] **User Creation** - Real database user via `upsertUserFromSignup`
- [x] **Subscription Setup** - Real subscription records
- [x] **Message Ingestion** - Twilio webhook processing
- [x] **Database Indexes** - All indexes working (`by_user`, etc.)
- [x] **Test Cleanup** - Deletes all test data

---

## 🔧 Blocked (Needs Scheduled Functions)

### Agent Execution (waiting on advanceTimers fix)
- [ ] Crisis agent runs and creates alerts
- [ ] Main agent conversation flow
- [ ] Assessment agent scoring
- [ ] Agent tool calls (searchResources, startAssessment, etc.)

---

## 🚀 Ready to Implement (No Dependencies)

### 1. Progressive Onboarding (6 tests) ✨ HIGH VALUE
**File**: `scenarios/progressive-onboarding.ts` ✅ Created

- [ ] **ZIP Code Persistence** - Asked once, never again
  - User requests resources → ZIP requested
  - ZIP saved to profile
  - Second resource request → no ZIP prompt

- [ ] **ZIP Code Extraction** - Extract from query text
  - User says "respite care in 90210"
  - System extracts 90210 without asking
  - Profile updated automatically

- [ ] **Field Priority Order** - careRecipient → firstName → relationship
  - New user says "Hi"
  - System asks "Who are you caring for?"
  - User answers, profile updated
  - System asks "What should I call you?"

- [ ] **P2 Compliance** - Never repeat ignored questions
  - System asks "Who are you caring for?"
  - User ignores, talks about stress instead
  - System responds to stress
  - Next message does NOT repeat the question

- [ ] **Contextual ZIP** - Only when resources needed
  - General conversation → no ZIP request
  - User asks for "local resources" → ZIP requested

- [ ] **Skip All Fields** - System uses defaults
  - User types "skip" to all profile questions
  - System continues with defaults ("there", "loved one")

**Why Valuable**: Verifies trauma-informed design (P2 principle), confirms user won't be annoyed by repeated questions

---

### 2. Memory System (5 tests) ✨ HIGH VALUE
**File**: `scenarios/memory.ts` ✅ Created

- [ ] **Record Memory with Importance**
  - Call `public.recordMemory` with category + importance
  - Query database to verify memory saved
  - Verify all fields correct

- [ ] **Importance-Based Ordering**
  - Record 3 memories (importance: 3, 10, 7)
  - Call `public.listMemories`
  - Verify returned in order: 10 → 7 → 3

- [ ] **Category Filtering**
  - Record memories in different categories
  - Query with `category: 'crisis_trigger'`
  - Only crisis_trigger memories returned

- [ ] **Non-Existent User Error**
  - Call recordMemory with fake userId
  - Verify error thrown: "User not found"

- [ ] **Concurrent Write Safety**
  - Write 3 memories in parallel
  - All 3 saved successfully
  - No data corruption

**Why Valuable**: Memory system is core to context persistence, critical for personalized care

---

### 3. Assessment System (5 tests) ✨ CRITICAL
**File**: `scenarios/assessment.ts` ✅ Created

- [ ] **Complete BSFC Flow**
  - startAssessment → session created
  - Submit 10 answers
  - finalizeAssessment → scores calculated
  - Verify composite score + zone scores

- [ ] **Cooldown Enforcement**
  - Complete EMA assessment
  - Try to start again immediately
  - Error: "Assessment on cooldown, X days remaining"

- [ ] **Partial Completion**
  - Start assessment, answer 5/10 questions
  - Abandon (user leaves)
  - Later: retrieve active session
  - Verify can continue from question 6

- [ ] **Multiple Assessment Types**
  - Complete EMA (1-day cooldown)
  - Immediately start BSFC (different type)
  - Both work independently

- [ ] **Score Calculation Accuracy**
  - Submit known answers (all 4s)
  - Verify composite = 100
  - Verify all zone scores = 100

**Why Valuable**: Assessments drive wellness tracking, intervention suggestions, crisis detection

---

### 4. Resource Search & Cache (4 tests)
**File**: `scenarios/resources.ts` (to create)

- [ ] **Google Maps Search**
  - User has ZIP code in profile
  - Request "respite care"
  - Verify Google Maps API called
  - Results returned with place_id

- [ ] **Cache Hit**
  - Search "respite care" in 11576
  - Results cached
  - Search again within 7 days
  - Returns cached results (no API call)

- [ ] **Cache Miss After Expiry**
  - Search cached 8 days ago
  - New search → fresh API call
  - New results cached

- [ ] **Missing ZIP Error**
  - User has no ZIP in profile
  - Request resources without ZIP in query
  - Error: "ZIP code required for local search"

**Why Valuable**: Resource search is primary value-add, cache prevents API waste

---

### 5. Wellness Tracking (4 tests)
**File**: `scenarios/wellness.ts` (to create)

- [ ] **Score from Assessment**
  - Complete BSFC with known answers
  - Query wellness status
  - Verify composite score matches

- [ ] **Zone Scores**
  - Assessment answers: emotional=high, physical=low
  - Verify zone breakdown correct
  - Emotional > 70, Physical < 30

- [ ] **Trend Detection**
  - Complete 3 assessments over time
  - Scores: 80 → 70 → 60 (improving)
  - Verify trend = "improving"

- [ ] **Latest Score Only**
  - Multiple assessments exist
  - getWellnessStatus returns most recent
  - Not average of all scores

**Why Valuable**: Wellness scores drive intervention suggestions, check-in frequency

---

### 6. Intervention System (3 tests)
**File**: `scenarios/interventions.ts` (to create)

- [ ] **Find by Zone**
  - User has high emotional burnout
  - findInterventions(zones: ['emotional'])
  - Returns emotional interventions only

- [ ] **Track Preference - Accepted**
  - Suggest intervention
  - User accepts
  - trackInterventionPreference(accepted: true)
  - Future suggestions prioritize similar types

- [ ] **Track Preference - Rejected**
  - Suggest intervention
  - User rejects
  - Intervention not suggested again

**Why Valuable**: Interventions reduce burnout, preference tracking improves relevance

---

### 7. Subscription Gating (3 tests)
**File**: `scenarios/subscription-gating.ts` (exists, needs updating)

- [ ] **Free User Blocked**
  - User has no subscription
  - Send message
  - Response: "Subscribe to access this feature"

- [ ] **Plus User Full Access**
  - User has active subscription
  - All features available
  - No paywall messages

- [ ] **Expired Subscription**
  - Subscription ended yesterday
  - Send message
  - Response: "Subscription expired, renew to continue"

**Why Valuable**: Business model depends on proper gating

---

### 8. Profile Management (4 tests)
**File**: `scenarios/profile.ts` (to create)

- [ ] **Update Single Field**
  - updateProfile(field: 'firstName', value: 'Sarah')
  - Query user
  - Verify metadata.firstName = 'Sarah'

- [ ] **Get Next Missing Field**
  - New user (empty profile)
  - getNextMissingField()
  - Returns 'careRecipientName' (highest priority)

- [ ] **Concurrent Updates**
  - Two updates in parallel (different fields)
  - Both succeed
  - No data loss

- [ ] **Invalid Field Error**
  - updateProfile(field: 'invalidField', value: 'x')
  - Error: "Field not recognized"

**Why Valuable**: Profile drives personalization, must handle edge cases

---

### 9. Check-in System (3 tests)
**File**: `scenarios/checkins.ts` (to create)

- [ ] **Schedule Based on Wellness**
  - High burnout (score > 70)
  - Check-ins every 2 days
  - Low burnout → weekly check-ins

- [ ] **Check-in Dispatch**
  - Scheduled check-in due
  - dispatchDue() creates message
  - User receives check-in prompt

- [ ] **Update Schedule**
  - User completes assessment
  - Wellness improves
  - Check-in frequency reduced

**Why Valuable**: Proactive engagement, prevents crisis escalation

---

## 📊 Summary by Priority

### Tier 1: CRITICAL (Implement First)
1. **Assessment System** (5 tests) - Drives everything
2. **Memory System** (5 tests) - Core to personalization
3. **Progressive Onboarding** (6 tests) - User retention

**Total: 16 tests**

### Tier 2: HIGH VALUE
4. **Wellness Tracking** (4 tests) - Business metrics
5. **Resource Search** (4 tests) - Primary value-add
6. **Subscription Gating** (3 tests) - Revenue protection

**Total: 11 tests**

### Tier 3: IMPORTANT
7. **Profile Management** (4 tests) - Foundation
8. **Intervention System** (3 tests) - Engagement
9. **Check-in System** (3 tests) - Retention

**Total: 10 tests**

---

## 🎯 Grand Total: 37 New E2E Tests

### Current: 8 tests (3 working, 5 blocked)
### Proposed: +37 tests (all unblocked)
### **Final: 45 comprehensive E2E tests**

---

## Implementation Order (Recommended)

### Week 1: Memory + Assessments (10 tests)
Most foundational, no dependencies

### Week 2: Progressive Onboarding (6 tests)
High user impact, tests P2 compliance

### Week 3: Wellness + Resources (8 tests)
Core features, clear business value

### Week 4: Everything Else (13 tests)
Polish, edge cases, completeness

---

## Test Runner Extensions Needed

To support these tests, add to `runner.ts`:

```typescript
// New action types
- callMutation: Direct mutation call (bypass SMS)
- callQuery: Direct query call
- callMutationParallel: Concurrent mutations
- submitAssessmentAnswers: Helper for multi-answer
- wait: Delay between steps

// New expectation types
- profileUpdated: Check metadata field
- memoryCreated: Verify memory in DB
- memoriesReturned: Count + content check
- memoriesOrdered: Importance order check
- assessmentCreated: Session exists
- assessmentFinalized: Scores calculated
- cooldownError: Specific error message
- errorThrown: Any error verification
```

These are all **simple database queries** - no scheduled functions required!
