# GiveCare Essential Requirements & Goals
## Foundation for Performance-First Rebuild

**Purpose:** Extract core features, requirements, and goals from current GiveCare app to inform a performance-optimized rebuild from first principles.

**Last Updated:** 2025-01-14

---

## 1. Core Vision & Goals

### Mission
AI-powered SMS caregiving support platform that reduces caregiver burnout through trauma-informed AI support, accessible via any phone without app downloads.

### Target Users
- **Primary:** Family caregivers of elderly/disabled loved ones (53M in US)
- **Demographics:** Ages 40-70, varying tech comfort levels
- **Context:** Exhausted, overwhelmed, often isolated, need 24/7 support

### Value Proposition
- **Zero friction:** Text a number, start talking immediately (no signup, no app)
- **Clinical validity:** Real assessments (EMA, BSFC, REACH-II, SDOH), not made-up scores
- **Trauma-informed:** P1-P6 principles ensure respectful, boundary-aware communication
- **Proactive support:** System initiates check-ins, resource discovery, crisis detection
- **Local resources:** Google Maps integration finds real services nearby

---

## 2. Essential Features (Must-Have)

### 2.1 Conversation Engine

**Core Capability:** Thread-based SMS conversations with AI agents

**Requirements:**
- **Multi-agent routing:**
  - Main Agent (90%): General support, resource discovery, daily check-ins
  - Crisis Agent (5%): Suicide/self-harm keywords → instant safety response
  - Assessment Agent (5%): Clinical scoring and intervention matching
- **SMS-first:** Works on any phone, any carrier, any age
- **Response time:** <900ms average (p95 <1s) for non-crisis messages
- **Crisis response:** <600ms (p95) with pre-approved language
- **Message length:** ≤160 characters (SMS constraint) unless sharing resources
- **Thread continuity:** Maintains context across days/weeks
- **Conversation summarization:** Recent detail + historical compression (60-80% token savings)

**User Experience:**
- One question at a time (never overwhelm)
- Progress indicators ("2 of 10") for assessments
- Skip option always available ("Reply 'skip' to move on")
- Value delivered every turn (validation, tip, resource, or progress)

### 2.2 Trauma-Informed Communication (P1-P6)

**Non-negotiable principles embedded in all agent prompts:**

- **P1:** Acknowledge feelings → Answer question → Advance conversation
- **P2:** Never repeat the same question within a session
- **P3:** Offer skip after two attempts (max 2 attempts per question)
- **P4:** Use soft confirmations ("Got it: Sarah, right?") not assumptions
- **P5:** Give a skip option on every ask
- **P6:** Deliver value every turn (validation, resource, tip, or progress update)

**Implementation:**
- System prompts enforce P1-P6
- Guardrails tool logs compliance checks
- No exceptions for "engagement hacks"

### 2.3 Clinical Measurement

**4 Validated Assessments:**

1. **EMA (Ecological Momentary Assessment)**
   - 3 questions, ~2 minutes
   - Real-time stress monitoring
   - Daily check-in format

2. **BSFC (Burden Scale for Family Caregivers)**
   - 10 questions, ~5 minutes
   - 4 pressure zones: emotional, physical, social, time
   - Comprehensive burden assessment

3. **REACH-II (Resources for Enhancing Alzheimer's Caregiver Health)**
   - 16 questions, ~8 minutes
   - Caregiver strain risk assessment
   - Clinical validation

4. **SDOH (Social Determinants of Health)**
   - 28 questions, ~15 minutes
   - Adds financial pressure zone (5 zones total)
   - Broader context assessment

**Scoring System:**
- **Burnout score:** 0-100 scale with 5 bands (Crisis → Thriving)
- **Pressure zones:** 5 domains (emotional, physical, social, time, financial)
- **Zone-specific sub-scores:** For targeted interventions
- **Historical tracking:** Trends over weeks/months
- **Personalized scheduling:** RRULE-based check-ins in user timezone

**Assessment Flow:**
- Voluntary opt-in (never forced)
- Progress indicators ("3 of 10")
- Skip option on every question
- After completion: Summarize zones + recommend interventions

### 2.4 Crisis Detection & Response

**Safety-Critical Feature:**

**Detection:**
- 15+ crisis keywords (suicide, self-harm, "can't go on", etc.)
- Pattern matching triggers immediate routing to Crisis Agent
- No AI reasoning delay for safety

**Response:**
- <600ms response time (p95)
- Pre-determined response language (no generation delay)
- Always includes: 988 Suicide & Crisis Lifeline, 741741 Crisis Text Line, 911
- Warm, non-judgmental tone
- Offer to help connect (not just provide numbers)

**Follow-up:**
- All crisis interactions logged for human review
- Next-day check-in: "Thinking of you today. How are you doing?"
- Durable workflow ensures follow-up happens

### 2.5 Working Memory System

**Purpose:** Remember user context over time (care routines, preferences, triggers)

**Categories:**
- `care_routine`: Daily care patterns (e.g., "Morning bath at 9am works well")
- `preference`: User preferences (e.g., "Yoga Tuesdays reduces stress")
- `intervention_result`: What worked/didn't work
- `crisis_trigger`: Patterns that cause distress (e.g., "Mom agitated evenings 6pm")
- `family_health`: Family member health info

**Features:**
- Automatic memory recording (no "should I remember this?" prompts)
- Importance scoring (1-10) to prioritize what matters
- Semantic search: Retrieves memories by meaning, not exact keywords
- Context-aware responses: References past conversations naturally
- Embeddings stored for vector search

**User Benefit:**
- Reduces repeated questions (P2 compliance)
- Feels truly heard ("I remember you mentioned...")
- Personalized support based on history

### 2.6 Resource Discovery

**Local Resource Search:**
- **Google Maps Grounding API** + Gemini 2.0 Flash semantic search
- **10 predefined categories:** respite, support groups, adult day care, homecare, medical, community, meals, transport, hospice, memory care
- **Zip-code first:** Uses zip from onboarding (no re-asking)
- **Results include:** Hours, ratings, reviews, map links
- **Natural language format:** Conversational presentation, not database dump
- **Proactive suggestion:** System suggests resources based on assessment results

**Evidence-Based Interventions:**
- 16+ pre-seeded strategies (breathing exercises, support groups, respite planning, etc.)
- Matched to user's top 2-3 pressure zones
- Evidence levels: High (RCT-backed) / Moderate (observational) / Low (expert opinion)
- Micro-commitments: 2-5 minute activities, not hour-long programs
- Actionable recommendations: Clear, specific, achievable

**Knowledge Base (Future):**
- 290+ curated articles with semantic search
- Embedded vector search for "find me info about dementia wandering"
- Cited sources, no hallucination

### 2.7 Proactive Engagement

**Scheduled Check-ins:**
- **Frequency adapts to burnout score:**
  - Daily for crisis/moderate users
  - Weekly for stable users
  - Reactivation nudges for dormant users
- **Personalized timing:** User timezone, preferred time of day
- **RRULE-based:** Flexible scheduling (daily, weekly, custom)

**Engagement Monitoring:**
- **3 warning signs:**
  - Sudden drop (daily → 5+ days quiet)
  - Crisis burst (multiple crisis messages)
  - Decline trend (burnout score increasing)
- **Graduated responses:**
  - Day 5 silence: Light nudge ("Haven't heard from you, hope you're okay")
  - Day 7 silence: Stronger concern ("I'm worried, please reach out")
- **Non-judgmental:** No guilt, just care
- **Crisis resources always available:** Includes 988 in case silence is crisis-related

---

## 3. Performance Requirements

### 3.1 Response Time Targets

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| **Average SMS response** | <900ms | ~900ms | P0 |
| **P95 SMS response** | <1s | <1s | P0 |
| **Crisis response (p95)** | <600ms | <600ms | P0 |
| **Assessment question** | <1s | <1s | P1 |
| **Resource search** | <2s | TBD | P1 |
| **Memory retrieval** | <200ms | TBD | P2 |
| **Database queries** | <100ms | TBD | P2 |

### 3.2 Throughput Targets

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| **Concurrent users** | 10K+ | Unknown | P0 |
| **Messages/second** | 50+ (burst) | Unknown | P0 |
| **Uptime** | 99.95% SLA | Unknown | P0 |
| **Error rate** | <0.1% | Unknown | P1 |

### 3.3 Cost Targets

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| **Cost per user/month** | <$2 at 10K users | $1.52 | P0 |
| **Token budget (daily)** | $1,200 global | $1,200 | P0 |
| **SMS cost** | Minimize via rate limits | Unknown | P1 |

### 3.4 Rate Limits

**Per User:**
- 10 SMS per day (prevents spam/abuse)
- 50K tokens per hour
- Crisis messages: Unlimited (tracked separately)

**Global:**
- 500K tokens per minute (TPM)
- $1,200 daily token budget
- Graceful degradation if budget hit

---

## 4. Technical Requirements

### 4.1 Architecture

**Current Stack:**
- **Backend:** Convex (serverless DB + functions + real-time)
- **AI:** OpenAI Agents SDK (GPT-4o nano/mini)
- **SMS:** Twilio
- **Payments:** Stripe
- **Maps:** Google Maps Grounding API + Gemini 2.0 Flash

**Key Patterns:**
- **Agent Component:** Manages thread context automatically (60-80% token savings)
- **Tool-based architecture:** Structured tools instead of free-form generation
- **Durable workflows:** Retry-safe multi-step processes (crisis escalation)
- **Rate limiting:** Token bucket pattern for SMS/token limits
- **Context injection:** Conversation summary injected into prompts

### 4.2 Data Model

**Core Tables (36 total):**
- `users`: User profiles (externalId, phone, email, name, channel, locale, consent)
- `sessions`: Conversation sessions (userId, channel, locale, policyBundle, budget)
- `messages`: Conversation history (userId, channel, direction, text, traceId)
- `memories`: Working memory (userId, category, content, importance, embedding)
- `assessments`: Completed assessments (userId, definitionId, answers)
- `scores`: Burnout scores (userId, assessmentId, composite, band, zones)
- `interventions`: Support strategies (title, category, targetZones, evidenceLevel)
- `resource_cache`: TTL resource search results (category, zip, results, expiresAt)
- `llm_usage`: Token tracking (userId, model, provider, usage, billingPeriod)
- `subscriptions`: Stripe billing (userId, stripeCustomerId, planId, status)

**Indexes:**
- Critical query patterns optimized
- Foreign key constraints for data integrity
- Composite indexes for subscription/message queries

### 4.3 Integration Points

**Inbound:**
- Twilio SMS webhook: `POST /twilio/incoming-message`
- Stripe webhooks: `POST /stripe/webhook`
- Web client: Convex queries/mutations

**Outbound:**
- Twilio API: Send SMS responses
- OpenAI API: LLM generation
- Google Maps API: Resource grounding
- Stripe API: Billing operations

### 4.4 Code Quality

**Testing:**
- 235+ passing tests (Vitest)
- No mocks: Real Convex environment only
- Simulation tests verify against ARCHITECTURE.md
- Edge cases documented

**Type Safety:**
- TypeScript strict mode
- Convex validators (`v.object()`) not Zod (except agent tools)
- Generated types from Convex schema

**Documentation:**
- ARCHITECTURE.md: Complete system reference
- FEATURES.md: User-centered feature specs
- Code comments cite ARCHITECTURE.md

---

## 5. User Experience Requirements

### 5.1 Onboarding Flow

**Turn 1-3 Pattern:**
- **Turn 1:** User texts "Hi"
- **Turn 2:** System: "Hi there. I'm glad you're here. Who are you caring for?"
- **Turn 3:** System delivers value proposition: "I help with check-ins, resources, crisis support. Want to try a quick check-in?"

**Key Principles:**
- Zero onboarding friction (no name required initially)
- One question at a time
- Empathetic acknowledgment every message
- Value proposition delivered on Turn 3

### 5.2 Assessment Experience

**Flow:**
1. Voluntary opt-in (never forced)
2. State assessment name + length
3. Show progress: "(2 of 10)"
4. Each question ≤160 characters
5. Every question ends with "(Reply 'skip' to move on)"
6. After two skips/no responses: Pause and ask if they want to stop
7. After completion: Summarize zones + recommend interventions

**User Benefits:**
- Knows what to expect (length, time estimate)
- Sees progress (not endless)
- Can skip anytime (no pressure)
- Gets immediate value (results + recommendations)

### 5.3 Resource Discovery Experience

**Proactive Suggestion:**
- System suggests resources based on assessment results
- "Your assessment shows you're feeling stretched thin on time. Would it help to find respite care near you?"

**Search Flow:**
1. User agrees to search
2. System uses zip from onboarding (no re-asking)
3. Searches Google Maps for category + zip
4. Returns 3-5 results with:
   - Name, address, hours
   - Ratings and reviews
   - Map links
5. Natural language format (not database dump)

**User Benefits:**
- Proactive (doesn't wait for user to ask)
- Remembers location (no re-asking)
- Real places with real reviews (trustworthy)
- Actionable (can call/book immediately)

### 5.4 Memory System Experience

**Invisible to User:**
- System automatically saves important info
- No "should I remember this?" prompts
- Retrieves memories semantically when relevant

**User Sees:**
- Natural references to past conversations
- "I remember you mentioned she often gets agitated around this time"
- Feels truly heard

### 5.5 Success Metrics

**User Experience:**
- Time to first value: <3 messages ✅
- Assessment completion rate: Target 60%
- Crisis response latency: <600ms (p95) ✅
- User retention: Target 50% at 30 days

**Clinical Impact:**
- Burnout score improvement: Target 10-point drop over 8 weeks
- Pressure zone reduction: At least 1 zone improvement per month
- Crisis escalation prevention: Early intervention reduces 988 calls by 30%

---

## 6. Business Requirements

### 6.1 Subscription Model

**Plans:**
- **Free tier:** Basic support (limited assessments)
- **Premium:** $9.99/month or $99/year
  - Unlimited assessments
  - Priority support
  - Advanced features

**Features:**
- 7-day free trial
- Stripe-powered checkout
- 15 promo codes for partners/press
- Webhook handling for subscription events

### 6.2 Admin Dashboard

**Real-time Metrics:**
- Active users
- Response times
- Crisis alerts
- Burnout distribution charts
- Subscription health

**User Management:**
- User lookup by phone
- Conversation history
- Assessment results
- Memory system access

### 6.3 Business Health Metrics

**Targets:**
- Cost per user: <$2/month at 10K users ✅ ($1.52)
- LTV:CAC ratio: Target 3:1
- Churn rate: <5%/month
- Net Promoter Score: Target 50+

---

## 7. Safety & Compliance Requirements

### 7.1 Crisis Detection

**Detection:**
- 15+ crisis keywords (suicide, self-harm, "can't go on", etc.)
- Pattern matching (no AI delay)
- Immediate routing to Crisis Agent

**Response:**
- <600ms response (p95)
- Pre-approved language (no generation delay)
- Always includes: 988, 741741, 911
- Warm, non-judgmental tone

**Follow-up:**
- All crisis interactions logged for human review
- Next-day check-in
- Durable workflow ensures follow-up

### 7.2 HIPAA Compliance

**Data Protection:**
- Phone numbers hashed before storage
- PII redaction in message logs
- Zero PII leaks in logs/analytics

**Medical Advice:**
- No medical advice given (only support + resources)
- Guardrails tool blocks medical advice attempts
- Audit trail for all interactions

### 7.3 Rate Limiting & Abuse Prevention

**Per User:**
- 10 SMS per day (prevents spam/abuse)
- 50K tokens per hour
- Crisis messages: Unlimited

**Global:**
- 500K tokens per minute (TPM)
- $1,200 daily token budget
- Graceful degradation if budget hit

### 7.4 Guardrails

**Compliance Checking:**
- Guardrails tool logs P1-P6 compliance
- Medical advice blocking
- Spam protection
- Tone guidance enforcement

---

## 8. What's NOT Included (Out of Scope)

**Explicitly Out of Scope:**
- Medical advice or diagnosis
- Emergency dispatch (we route to 911, don't call ourselves)
- Care coordination with providers
- Medication reminders
- Voice calls (SMS only)
- Group chat features
- Social network components

**Future Roadmap (Not Committed):**
- WhatsApp/email channels
- Care recipient monitoring (IoT sensors)
- Provider integrations (EMR, care plans)
- Caregiver marketplace (hire respite workers)
- Support group matching (peer connections)

---

## 9. Design Principles

1. **SMS-first means constraint-driven design** - 160 chars forces clarity
2. **Trauma-informed isn't optional** - P1-P6 in every interaction
3. **Clinical validity over engagement hacks** - Use real assessments, not made-up scores
4. **Proactive but not pushy** - System initiates when helpful, respects silence
5. **Privacy by default** - Minimal data collection, maximum security
6. **No app barrier** - Works on any phone, any carrier, any age
7. **Human-in-loop safety** - AI handles support, humans review crisis

---

## 10. Performance Optimization Opportunities

### 10.1 Current Bottlenecks (Inferred)

**Potential Issues:**
- Database query performance (needs optimization)
- Resource search latency (Google Maps + Gemini)
- Memory retrieval (vector search)
- Context assembly (conversation summarization)
- Token usage (60-80% savings via summarization, but could improve)

### 10.2 Optimization Strategies

**Database:**
- Strategic indexes for critical queries
- Foreign key constraints for data integrity
- Query optimization (reduce N+1 queries)
- Connection pooling

**AI/LLM:**
- Model selection (nano for guardrails, mini for generation)
- Token budget management
- Context compression (already 60-80% savings)
- Caching for common queries

**External APIs:**
- Resource cache (TTL-based, hourly cleanup)
- Rate limit handling
- Retry logic with exponential backoff
- Graceful degradation

**Architecture:**
- Serverless auto-scaling (Convex)
- Edge functions for low-latency operations
- Durable workflows for reliability
- Real-time subscriptions for admin dashboard

---

## 11. Key Questions for Performance-First Rebuild

### 11.1 Architecture Decisions

1. **Database:** Is Convex the right choice for 10K+ concurrent users? Alternatives: Supabase, PlanetScale, Neon?
2. **AI Framework:** Should we use Convex Agent Component or build custom orchestration?
3. **Caching:** What should be cached? Resource searches? Memory embeddings? Assessment results?
4. **CDN/Edge:** Should we use edge functions for crisis detection? For resource search?

### 11.2 Performance Trade-offs

1. **Crisis Detection:** Pre-computed responses vs. dynamic generation (current: pre-computed for <600ms)
2. **Memory Retrieval:** Vector search vs. keyword search (current: vector for semantic)
3. **Resource Search:** Cache TTL vs. freshness (current: hourly cleanup)
4. **Assessment Scoring:** Real-time vs. batch (current: real-time)

### 11.3 Scalability Considerations

1. **Message Volume:** How to handle 10K+ concurrent users sending SMS?
2. **Token Budget:** How to prioritize token usage across users?
3. **Database Load:** How to handle read/write patterns at scale?
4. **External APIs:** How to handle rate limits (Google Maps, Twilio, OpenAI)?

---

## 12. Summary: Essential Requirements

### Must-Have Features
1. ✅ Multi-agent SMS conversation system (Main, Crisis, Assessment)
2. ✅ Trauma-informed communication (P1-P6 principles)
3. ✅ 4 validated clinical assessments (EMA, BSFC, REACH-II, SDOH)
4. ✅ Crisis detection & response (<600ms)
5. ✅ Working memory system (semantic search)
6. ✅ Local resource discovery (Google Maps)
7. ✅ Evidence-based interventions (16+ strategies)
8. ✅ Proactive engagement (scheduled check-ins)
9. ✅ Subscription billing (Stripe)
10. ✅ Admin dashboard (real-time metrics)

### Performance Targets
- **Response time:** <900ms average, <1s p95
- **Crisis response:** <600ms p95
- **Cost:** <$2/user/month at 10K users
- **Uptime:** 99.95% SLA
- **Throughput:** 10K+ concurrent users, 50+ messages/second

### Technical Requirements
- SMS-first (Twilio)
- Serverless backend (Convex or alternative)
- AI/LLM integration (OpenAI)
- Real-time capabilities
- HIPAA compliance
- Rate limiting & abuse prevention

### User Experience Requirements
- Zero onboarding friction
- One question at a time
- Skip option always available
- Value delivered every turn
- Proactive but not pushy
- Clinical validity over engagement hacks

---

**Next Steps:** Use this document to inform architecture decisions for a performance-first rebuild, prioritizing:
1. Response time optimization
2. Cost efficiency
3. Scalability to 10K+ users
4. Maintainability
5. User experience

