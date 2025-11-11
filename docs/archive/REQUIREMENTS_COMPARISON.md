# GiveCare Requirements Comparison
## Documentation vs. Code Implementation

**Purpose:** Compare documented requirements (`ESSENTIAL_REQUIREMENTS.md`) with actual code implementation (`CODE_REQUIREMENTS.md`) to identify gaps, discrepancies, and priorities for performance-first rebuild.

**Last Updated:** 2025-01-14

---

## Executive Summary

**Documentation Status:** Comprehensive but aspirational
**Code Status:** Core features implemented, some gaps vs. documentation
**Key Finding:** Documentation describes ideal state, code shows pragmatic implementation with performance optimizations

---

## 1. Feature Comparison Matrix

| Feature | Documented | Code Status | Gap Severity |
|---------|-----------|-------------|--------------|
| **SMS Processing** | ✅ Full flow | ✅ Implemented | None |
| **3-Agent System** | ✅ Main/Crisis/Assessment | ✅ Implemented | None |
| **Crisis Detection** | ✅ 15+ keywords, <600ms | ⚠️ 13 keywords, <600ms target | Low |
| **Crisis Follow-up** | ✅ 24h follow-up | ⚠️ Workflow exists, emergency contact not implemented | Medium |
| **4 Assessments** | ✅ EMA/BSFC/REACH-II/SDOH | ✅ Implemented | None |
| **Assessment Flow** | ✅ Agent asks questions | ❌ Agent interprets results only | High |
| **Memory System** | ✅ Embeddings stored | ⚠️ No embeddings (Agent Component handles) | Low (different approach) |
| **Resource Search** | ✅ Google Maps + Gemini | ⚠️ Maps Grounding only (no Gemini) | Low |
| **Interventions** | ✅ 16+ seeded | ⚠️ Schema exists, may not be seeded | Medium |
| **Profile Management** | ✅ Progressive onboarding | ✅ Implemented | None |
| **Rate Limiting** | ✅ 10 SMS/day, 50K tokens/hour | ⚠️ 20 req/min only | High |
| **Token Budget** | ✅ $1,200/day global | ❌ Not implemented | High |
| **Proactive Check-ins** | ✅ Daily/weekly scheduled | ❌ Not implemented | High |
| **Engagement Monitoring** | ✅ 3 warning signs | ❌ Not implemented | High |
| **Billing** | ✅ Full Stripe integration | ⚠️ Webhook recording only | High |
| **Resource Cache** | ✅ TTL-based cleanup | ✅ Implemented (6h cron) | None |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented
- ❌ Not implemented

---

## 2. Critical Gaps (High Priority)

### 2.1 Token Budget Enforcement

**Documented:**
- 50K tokens/hour per user
- 500K tokens/minute globally
- $1,200 daily budget
- Graceful degradation if budget hit

**Code:**
- No token tracking
- No budget enforcement
- No cost monitoring

**Impact:** High - Cost control missing, potential unbounded spending

**Recommendation:** Implement token tracking + budget enforcement before scale

---

### 2.2 Rate Limiting (SMS Daily Limits)

**Documented:**
- 10 SMS per day per user
- Prevents spam/abuse

**Code:**
- 20 requests/minute per phone (fixed window)
- No daily limit

**Impact:** High - Abuse prevention incomplete

**Recommendation:** Add daily SMS limit (10/day) in addition to per-minute limit

---

### 2.3 Proactive Check-ins

**Documented:**
- Daily check-ins for crisis/moderate users
- Weekly for stable users
- Reactivation nudges for dormant users
- Frequency adapts to burnout score

**Code:**
- No scheduling logic
- No cron job
- No frequency adaptation

**Impact:** High - Core engagement feature missing

**Recommendation:** Implement scheduling system (RRULE-based) + cron job

---

### 2.4 Engagement Monitoring

**Documented:**
- 3 warning signs: sudden drop, crisis burst, decline trend
- Graduated responses (day 5, day 7)
- Non-judgmental nudges

**Code:**
- No monitoring logic
- No warning detection
- No proactive messaging

**Impact:** High - User retention feature missing

**Recommendation:** Implement engagement watcher + proactive messaging

---

### 2.5 Assessment Question Flow

**Documented:**
- Agent asks questions automatically
- Progress indicators ("2 of 10")
- Skip option on every question
- After completion: summarize zones + recommend interventions

**Code:**
- Assessment agent interprets results only
- No automatic question asking
- Questions must be asked manually (via main agent or external system)

**Impact:** High - User experience gap (manual vs. automatic)

**Recommendation:** Implement question-asking flow in assessment agent or main agent

---

### 2.6 Billing (Stripe Event Processing)

**Documented:**
- Full subscription management
- Checkout sessions
- Webhook handling
- Entitlement checks

**Code:**
- Webhook recording (idempotent) ✅
- Event processing: TODO (not implemented)
- No subscription creation/update logic

**Impact:** High - Monetization incomplete

**Recommendation:** Implement Stripe event processing (subscription.created, subscription.updated, etc.)

---

## 3. Medium Priority Gaps

### 3.1 Crisis Keywords

**Documented:** 15+ keywords
**Code:** 13 keywords

**Missing Keywords (Potential):**
- "no way out"
- "better off without me"
- "burden"

**Impact:** Medium - May miss some crisis signals

**Recommendation:** Review and expand keyword list based on user data

---

### 3.2 Emergency Contact Notification

**Documented:**
- Notify emergency contact for high-severity crises
- Email or SMS notification

**Code:**
- Workflow step exists
- Returns `sent: false` (not implemented)
- Checks consent but doesn't send

**Impact:** Medium - Safety feature incomplete

**Recommendation:** Implement email/SMS notification for emergency contacts

---

### 3.3 Interventions Seeding

**Documented:** 16+ pre-seeded interventions
**Code:** Schema exists, no seed script found

**Impact:** Medium - Feature may not work without data

**Recommendation:** Create seed script or verify interventions table is populated

---

### 3.4 Resource Search (Gemini 2.0 Flash)

**Documented:** Google Maps Grounding + Gemini 2.0 Flash semantic search
**Code:** Maps Grounding API only (no Gemini mentioned)

**Impact:** Low - Maps Grounding may be sufficient

**Recommendation:** Verify if Gemini integration needed or Maps Grounding is sufficient

---

## 4. Low Priority Differences (Architectural Choices)

### 4.1 Memory Embeddings

**Documented:** Embeddings stored in memories table
**Code:** No embeddings stored (Agent Component handles semantic search)

**Impact:** Low - Different approach, same outcome

**Rationale:** Agent Component's built-in semantic search eliminates need for manual embedding storage

**Recommendation:** Keep current approach (simpler, less code)

---

### 4.2 Model Selection

**Documented:** GPT-4o nano/mini
**Code:** Gemini 2.5 Flash Lite (all agents)

**Impact:** Low - Performance/cost trade-off

**Rationale:** Gemini 2.5 Flash Lite is cheaper and faster than GPT-4o

**Recommendation:** Keep Gemini if performance targets met, consider GPT-4o if quality issues arise

---

### 4.3 Response Time Target

**Documented:** <900ms average, <1s p95
**Code:** 4s timeout (may exceed target)

**Impact:** Medium - May not meet documented SLA

**Recommendation:** Measure actual response times, optimize if needed

---

## 5. Performance Optimizations (Code Has, Docs Don't Mention)

### 5.1 Fast Path for Short Inputs

**Code:** Skips LLM for inputs <5 chars if profile complete
**Impact:** Significant latency reduction for simple inputs

**Recommendation:** Document this optimization

---

### 5.2 Stale-While-Revalidate Caching

**Code:** Serves stale cache while refreshing in background
**Impact:** Fast responses (<100ms) even when cache expired

**Recommendation:** Document this pattern

---

### 5.3 Race Pattern (Maps API vs Stub)

**Code:** Races Maps API (1.5s) against stub fallback
**Impact:** <500ms responses even if Maps API slow

**Recommendation:** Document this pattern

---

### 5.4 Background Processing

**Code:** Non-blocking memory enrichment, analytics logging
**Impact:** Faster response times (doesn't wait for background work)

**Recommendation:** Document this pattern

---

## 6. Recommendations for Performance-First Rebuild

### 6.1 Must-Have Features (P0)

1. **Token Budget Enforcement** - Cost control critical
2. **SMS Daily Limits** - Abuse prevention
3. **Proactive Check-ins** - Core engagement feature
4. **Engagement Monitoring** - User retention
5. **Assessment Question Flow** - User experience
6. **Billing (Stripe Processing)** - Monetization

### 6.2 Performance Priorities

1. **Response Time** - Measure actual times, optimize if >900ms
2. **Caching Strategy** - Expand stale-while-revalidate pattern
3. **Background Processing** - More async operations
4. **Fast Paths** - More optimization opportunities

### 6.3 Architecture Decisions

1. **Keep Agent Component** - Simplifies thread/message management
2. **Keep Gemini 2.5 Flash Lite** - If performance targets met
3. **Keep Memory Approach** - No manual embeddings (simpler)
4. **Expand Caching** - More TTL-based caches

### 6.4 Technical Debt

1. **Stripe Event Processing** - Complete billing implementation
2. **Emergency Contact** - Complete notification flow
3. **Interventions Seeding** - Verify/implement seed script
4. **Crisis Keywords** - Review and expand list

---

## 7. Comparison Summary

### What's Better in Code

1. **Performance Optimizations** - Fast paths, caching, background processing
2. **Error Handling** - Fallbacks at every layer
3. **Idempotency** - Message deduplication, Stripe event deduplication
4. **Architecture** - Component-based (simpler, less code)

### What's Better in Documentation

1. **Completeness** - Full feature set described
2. **User Experience** - Detailed user journeys
3. **Business Logic** - Clear requirements and metrics

### What Needs Alignment

1. **Token Budget** - Documented but not implemented
2. **Rate Limiting** - Documented limits don't match code
3. **Proactive Features** - Documented but not implemented
4. **Assessment Flow** - Documented flow doesn't match code

---

## 8. Next Steps

1. **Prioritize Gaps** - Focus on P0 features (token budget, rate limiting, proactive features)
2. **Measure Performance** - Verify response times meet <900ms target
3. **Complete Billing** - Implement Stripe event processing
4. **Implement Proactive Features** - Check-ins, engagement monitoring
5. **Document Optimizations** - Add performance patterns to docs

---

**Conclusion:** Code shows pragmatic implementation with performance optimizations, but missing several documented features. Focus on completing P0 features (token budget, rate limiting, proactive features) before scaling.

