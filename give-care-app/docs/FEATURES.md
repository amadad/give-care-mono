# GiveCare Features - Product Source of Truth

**Document Type**: User-Centered Feature Specifications  
**Last Updated**: 2025-11-11  
**Status**: Production (v1.7.0)  
**Purpose**: Non-technical reference for features, experiences, scenarios, and use cases

---

## Vision

GiveCare provides AI-powered emotional support for family caregivers through SMS. No app downloads, no accounts—just text a number and talk to an AI that remembers you, tracks your burnout, and connects you to local help.

---

## Core User Journeys

### 1. First Contact - Sarah's Story

**Context**: Sarah, 52, cares for her mother with Alzheimer's. She's exhausted and found GiveCare's number on a caregiver support group flyer.

**Flow**:
1. Sarah texts: "Hi"
2. System responds immediately: "Hi there. I'm glad you're here. Who are you caring for?"
3. Sarah: "My mom with Alzheimer's"
4. System: "I hear you. Alzheimer's is a long journey. What's the biggest challenge right now?"
5. Sarah: "I'm exhausted and feel guilty all the time"
6. System: "That exhaustion and guilt are so common for caregivers. I help with check-ins to track how you're doing, finding resources, and crisis support anytime. Want to try a quick 2-min check-in?"

**Key Features**:
- **Zero onboarding friction** - No name required, no form filling, start talking immediately
- **One question at a time** - Never overwhelms with multiple questions
- **Empathetic acknowledgment** - Every message validates feelings before moving forward
- **Value proposition delivered on Turn 3** - User knows what they're getting within 3 messages

**Outcome**: Sarah opts in for her first assessment. System now knows who she's caring for and her primary stressor.

---

### 2. Daily Check-In - Sarah, 2 Weeks Later

**Context**: Sarah has been using GiveCare for 2 weeks. System sends a gentle check-in text at 7pm (her preferred time).

**Flow**:
1. System: "Hey Sarah 👋 Quick check-in: On a scale of 1-5, how stressed have you felt today? (1=not at all, 5=extremely)"
2. Sarah: "4"
3. System: "Got it. (2 of 3) How's your mood been? (1=very down, 5=very up)"
4. Sarah: "2"
5. System: "Thanks for sharing. (3 of 3) How much support do you feel you have right now? (1=none, 5=a lot)"
6. Sarah: "3"
7. System: "Thanks, Sarah. Your stress is higher than usual—want to talk about what's happening, or would a quick breathing exercise help?"

**Key Features**:
- **Scheduled check-ins** - Sarah set this once, system remembers and respects her timezone
- **EMA assessment** - 3 questions, 2 minutes, validated clinical tool
- **Progress tracking** - System shows "2 of 3" so Sarah knows when she's almost done
- **Contextual response** - System notices stress spike and offers immediate support
- **Skip option always available** - (Not shown here, but every question offers "skip for now")

**Outcome**: Sarah's burnout score updates. System flags emotional pressure zone for personalized intervention suggestions.

---

### 3. Crisis Detection - Sarah's Breaking Point

**Context**: It's 2am. Sarah's mom had a terrible night. Sarah is at her limit.

**Flow**:
1. Sarah texts: "I can't do this anymore. I just want it to be over"
2. **System detects crisis keywords immediately**
3. System responds in <600ms: "I hear how hard this is. You're not alone.

988 Suicide & Crisis Lifeline (24/7): Call or text
741741 Crisis Text Line: Text HOME
911 if you're in immediate danger

Can I help you connect with any of these?"

**Key Features**:
- **Instant crisis detection** - Keywords trigger immediate routing to Crisis Agent
- **No AI reasoning delay** - Pre-determined response for safety
- **988/741741/911 always included** - Three options covering all crisis levels
- **Warm, non-judgmental tone** - No shame, just support
- **Offer to help connect** - Doesn't just provide numbers, offers to facilitate

**Outcome**: Sarah calls 741741. Crisis interaction logged for follow-up. Next day, system sends gentle check-in: "Thinking of you today. How are you doing?"

---

### 4. Resource Discovery - Finding Respite Care

**Context**: Sarah's assessment shows "time burden" as her highest pressure zone. She needs a break.

**Flow**:
1. System (proactively after assessment): "Your assessment shows you're feeling stretched thin on time. Would it help to find respite care near you?"
2. Sarah: "Yes please"
3. **System accesses her zip code from onboarding (no re-asking)**
4. System searches Google Maps for respite care in her area
5. System: "Found 3 respite care options near you in 10583:

**Respite Plus Care Center**
📍 123 Main St, Tarrytown
⏰ M-F 7am-6pm | Weekends available
⭐ 4.8/5 (89 reviews)
'Professional staff, clean facility'

**Angel Care Respite Services**
📍 456 Broadway, Sleepy Hollow
⏰ 24/7 availability
⭐ 4.9/5 (67 reviews)
'Flexible scheduling, specialized dementia care'

**Westchester Senior Day Center**
📍 789 River Rd, Irvington
⏰ M-F 8am-4pm
⭐ 4.6/5 (124 reviews)
'Activities, meals included'

Want me to send you the Google Maps links?"

**Key Features**:
- **Proactive suggestion** - System doesn't wait for Sarah to ask
- **Zip code remembered** - Used the zip from Turn 1 onboarding, no re-asking
- **Google Maps grounding** - Real places, real hours, real reviews
- **10 predefined categories** - Respite, support groups, meal delivery, transportation, etc.
- **Natural language format** - Presented conversationally, not as database dump
- **Attribution** - Reviews and ratings help Sarah trust the suggestions

**Outcome**: Sarah books respite care for Saturday. System remembers this and follows up: "How did respite care go on Saturday?"

---

### 5. Burnout Assessment - The Deep Dive

**Context**: Sarah's been using daily check-ins for a month. System suggests a deeper assessment.

**Flow**:
1. System: "You've been checking in for a month now—nice work! Want to try a deeper burnout assessment? It's 10 questions, takes about 5 minutes. I'll use it to suggest personalized support strategies."
2. Sarah: "Sure"
3. System: "Great! This is the Burden Scale for Family Caregivers (BSFC). I'll ask about emotional, physical, social, and time pressures. Ready?"
4. Sarah: "Yes"
5. System: "(1 of 10) In the past week, how often have you felt emotionally drained? (1=never, 5=always)"
6. Sarah: "4"
7. System: "Got it. (2 of 10) How often do you feel physically tired or exhausted? (1=never, 5=always)"
8. Sarah: "5"
9. _[Process continues through 10 questions]_
10. System: "(10 of 10) How often do you feel you don't have enough time for yourself? (1=never, 5=always)"
11. Sarah: "5"
12. System: "Thanks for sharing, Sarah. Analyzing your results now..."
13. **Assessment Agent takes over**
14. System: "Your burnout score is 72/100 (Moderate-High range). Your highest pressure zones are:
- **Physical burden** (very high)
- **Time burden** (very high)
- **Emotional burden** (high)

Here are 3 strategies that might help:

**Micro-breaks (2-5 min)**
→ Evidence: High effectiveness for physical fatigue
→ Try: Set a 2-min timer every 2 hours. Just breathe.

**Respite scheduling**
→ Evidence: Moderate effectiveness for time pressure
→ Try: Block 1 hour this week where someone else covers. Non-negotiable.

**Support group connection**
→ Evidence: High effectiveness for emotional + social burden
→ Try: I found 2 Alzheimer's groups meeting this week (see previous message for locations)

Want to try one of these, or talk through what's hardest right now?"

**Key Features**:
- **Voluntary, not forced** - Sarah opts in when ready
- **Progress indicators** - "3 of 10" shows it's finite and progressing
- **Validated instrument** - BSFC is clinically validated, not made up
- **Multi-zone scoring** - Breaks down pressure by domain (emotional, physical, social, time)
- **Evidence-based interventions** - Matched to her specific zones, not generic advice
- **Actionable recommendations** - Clear, specific, achievable actions
- **References previous conversations** - Connects back to respite care search

**Outcome**: Sarah's profile now includes detailed burnout data. System uses this to personalize all future interactions.

---

### 6. Memory System - Remembering Routines

**Context**: Sarah has been using GiveCare for 3 months. She's mentioned many details about her mom's care.

**Flow** (scattered across multiple conversations):

**Week 1**:
- Sarah: "Mom gets really agitated in the evenings around 6pm"
- **System remembers**: Mom's evening agitation pattern

**Week 4**:
- Sarah: "The morning bath at 9am works really well for her"
- **System remembers**: Morning bath routine that works

**Week 8**:
- Sarah: "I've been doing yoga on Tuesday mornings and it really helps"
- **System remembers**: Sarah's yoga routine and its positive impact

**Week 12**:
- Sarah texts at 6:15pm: "She's really agitated again"
- **System remembers**: Finds the evening agitation pattern from Week 1
- System: "I remember you mentioned she often gets agitated around this time. Have you tried the calming music technique we talked about?"

**Key Features**:
- **Automatic memory recording** - No "should I remember this?" prompts, just saves important info
- **Smart categorization** - Five memory types help organize information:
  - **Care Routine**: Daily schedules, routines that work (e.g., "morning bath at 9am works well")
  - **Preference**: User choices and preferences (e.g., "prefers text check-ins in the evening")
  - **Intervention Result**: Outcomes of strategies tried (e.g., "yoga on Tuesdays really helps")
  - **Crisis Trigger**: Warning signs and patterns that precede crisis (e.g., "gets agitated around 6pm")
  - **Family Health**: Care recipient conditions and diagnoses (e.g., "mom has Alzheimer's")
- **Importance scoring** - Memories ranked 1-10 (critical=9-10, important=6-8, useful=3-5, minor=1-2)
- **Prioritizes what matters** - Important details surface when relevant
- **Understands context** - Finds related memories by meaning, not just keywords
- **Natural references** - References past conversations naturally

**Outcome**: Sarah feels truly heard. The AI doesn't just respond—it remembers her life.

---

### 7. Proactive Engagement - When Sarah Goes Silent

**Context**: Sarah usually checks in daily. She hasn't responded in 5 days.

**Flow**:
1. **Day 5 silence detected** - Engagement watcher flags sudden drop
2. System sends gentle nudge: "Hey Sarah, just checking in. Haven't heard from you in a bit—hope you and your mom are okay. No pressure to reply, just want you to know I'm here if you need anything."
3. **If still no response after 2 days**:
4. System: "Sarah, I'm a bit worried—you've been quiet for a week, which isn't like you. If you're feeling overwhelmed or need help, please reach out. You can always call 988 if you're in crisis. Thinking of you."
5. **If response**:
6. Sarah: "Sorry, mom was in the hospital. It's been crazy"
7. System: "I'm so sorry. That sounds really hard. How are you holding up? Want to talk about it or do a quick check-in to see how you're doing?"

**Key Features**:
- **Engagement monitoring** - Detects sudden silence (drop from daily to 5+ days quiet)
- **Graduated responses** - Light nudge first, stronger concern if silence continues
- **Non-judgmental** - No guilt, just care
- **Crisis resources always available** - Includes 988 in case silence is crisis-related
- **Resume conversation naturally** - When Sarah returns, picks up where they left off

**Outcome**: Sarah re-engages. System adjusts check-in frequency based on her hospital crisis—less frequent during acute stress, daily when things stabilize.

---

## Feature Breakdown by Layer

### Layer 1: Conversation Intelligence

**Trauma-Informed Principles (P1-P6)**
- **P1**: Acknowledge feelings → Answer question → Advance conversation
- **P2**: Never repeat same question in a session
- **P3**: Two attempts max per question, then move on
- **P4**: Soft confirmations ("Got it: Sarah, right?") not assumptions
- **P5**: Every question includes "skip for now" option
- **P6**: Every message delivers value (validation, tip, resource, progress update)

**Multi-Agent Routing**
- **90% Main Agent** - General support, resource discovery, daily check-ins
- **5% Crisis Agent** - Suicide/self-harm keywords trigger instant safety response
- **5% Assessment Agent** - Clinical scoring and intervention matching

**Conversation Persistence**
- Thread continuity across days/weeks
- Full conversation history maintained automatically
- Context preserved for natural, ongoing dialogue

---

### Layer 2: Clinical Measurement

**4 Validated Assessments**
1. **EMA** (3 questions, 2 min) - Daily stress pulse check
   - Cooldown: 1 day (can retake daily)
   - Zones: Emotional, Physical, Social
2. **BSFC** (10 questions, 5 min) - Comprehensive burden across 4 zones // web only
   - Cooldown: 14 days (prevents over-assessment, ensures meaningful data)
   - Zones: Emotional, Physical, Social, Time, Financial
3. **REACH-II** (16 questions, 8 min) - Caregiver strain risk assessment
   - Cooldown: 21 days
   - Zones: Emotional, Physical, Social, Time, plus Informational and Spiritual
4. **SDOH** (28 questions, 15 min) - Social determinants of health (adds financial zone)
   - Cooldown: 30 days (most comprehensive, longest cooldown)
   - Zones: Financial, Transportation, Housing, Community, Clinical

**Why Cooldowns?** Prevents users from retaking assessments too frequently, which could:
- Lead to gaming the system (trying to improve scores artificially)
- Create assessment fatigue
- Generate less meaningful data (scores need time to reflect real changes)

**5 Pressure Zones**
- Emotional: Anxiety, depression, overwhelm
- Physical: Fatigue, sleep deprivation, health decline
- Social: Isolation, relationship strain, loss of identity
- Time: Constant demands, no breaks, scheduling conflicts
- Financial: Care costs, income loss, insurance battles (SDOH only)

**Scoring Logic**
- 0-100 burnout score across 4 bands (Very Low → High)
- **Very Low** (0-40): Minimal stress, caregiver managing well
- **Low** (40-60): Some stress present, but manageable
- **Moderate** (60-80): Significant stress requiring attention
- **High** (80-100): Severe burnout, immediate support needed
- Zone-specific sub-scores for targeted interventions
- Historical tracking to show trends over weeks/months
- Confidence score reflects how many questions were answered (partial assessments have lower confidence)
- Pressure zones flagged when zone average reaches 3.5 or higher (on 1-5 scale)

---

### Layer 3: Resource Matching

**Evidence-Based Interventions**
- 16 pre-seeded strategies (breathing exercises, support groups, respite planning, etc.)
- Matched to user's top 2-3 pressure zones
- Evidence levels: High (RCT-backed) / Moderate (observational) / Low (expert opinion)
- Micro-commitments: 2-5 minute activities, not hour-long programs

**Local Resource Search**
- Real-time Google Maps integration for verified locations
- 10 predefined categories:
  - **Respite**: Temporary care facilities and services
  - **Support**: Caregiver support groups (in-person and online)
  - **Daycare**: Adult day care centers
  - **Homecare**: In-home health care services
  - **Medical**: Medical supplies and equipment
  - **Community**: Senior centers and community resources
  - **Meals**: Meal delivery services
  - **Transport**: Transportation services for appointments
  - **Hospice**: End-of-life care services
  - **Memory**: Memory care and Alzheimer's-specific facilities
- Zip-code remembered (no re-asking for location)
- Results include hours, ratings, reviews, and map links
- Google Maps attribution included per service requirements
- **Smart caching**: Results cached by category and zip code to reduce API calls and improve response time
- Cache duration varies by category (respite care cached longer than meal delivery, which changes more frequently)

---

### Layer 4: Safety & Guardrails

**Crisis Detection**
- 19+ crisis keywords across three severity levels
- **High Severity** (immediate danger): "kill myself", "suicide", "end my life", "overdose", "can't go on"
- **Medium Severity** (serious distress): "hurt myself", "self harm", "hopeless", "done with life", "lost control"
- **Low Severity** (distress signals): "panic attack"
- <600ms response with 988/741741/911 (all severity levels receive immediate crisis resources)
- Severity level determines follow-up urgency and resource emphasis
- All crisis interactions logged for human review
- Follow-up check-in next day for high/medium severity cases

**Privacy & Compliance**
- Secure data handling and storage
- Protected health information safeguards
- No medical advice given (only support + resources)
- Complete audit trail for all interactions

**Rate Limiting**
- 10 SMS per user per day (prevents spam/abuse)
- Cost controls to ensure sustainable service
- Graceful handling of high-demand periods

---

### Layer 5: Business Operations

**Subscription Management**
- **Three Plan Tiers**:
  - **Free**: Basic access, assessments available, interventions limited
  - **Plus** ($9.99/month or $99/year): Full access to assessments and interventions
  - **Enterprise**: All Plus features plus live coach access (future)
- 7-day free trial for Plus plan
- Stripe-powered checkout
- 15 promo codes for partners/press
- **Grace Period**: When subscription is canceled, users retain access for a grace period to resubscribe without losing continuity
- **Subscription Gating**: Inactive subscriptions receive redirect messages to resubscribe, but crisis support always remains available regardless of subscription status

**Admin Dashboard**
- Real-time metrics (active users, response times, crisis alerts)
- User lookup and support tools
- Burnout distribution analytics
- Subscription management

**Proactive Messaging**
- Daily check-ins for crisis/moderate users
- Weekly for stable users
- Reactivation nudges for dormant users
- Frequency adapts to burnout score

---

## Success Metrics

**User Experience**
- Time to first value: <3 messages
- Assessment completion rate: Target 60%
- Crisis response latency: <600ms (p95)
- User retention: Target 50% at 30 days

**Clinical Impact**
- Burnout score improvement: Target 10-point drop over 8 weeks
- Pressure zone reduction: At least 1 zone improvement per month
- Crisis escalation prevention: Early intervention reduces 988 calls by 30%

**Business Health**
- Cost per user: <$2/month at 10K users
- LTV:CAC ratio: Target 3:1
- Churn rate: <5%/month
- Net Promoter Score: Target 50+

---

## What's Not Included

**Explicitly Out of Scope**:
- Medical advice or diagnosis
- Emergency dispatch (we route to 911, don't call ourselves)
- Care coordination with providers
- Medication reminders
- Voice calls (SMS only)
- Group chat features
- Social network components

**Future Roadmap** (not committed):
- WhatsApp/email channels
- Care recipient monitoring (IoT sensors)
- Provider integrations (EMR, care plans)
- Caregiver marketplace (hire respite workers)
- Support group matching (peer connections)

---

## Design Principles

1. **SMS-first means constraint-driven design** - 160 chars forces clarity
2. **Trauma-informed isn't optional** - P1-P6 in every interaction
3. **Clinical validity over engagement hacks** - Use real assessments, not made-up scores
4. **Proactive but not pushy** - System initiates when helpful, respects silence
5. **Privacy by default** - Minimal data collection, maximum security
6. **No app barrier** - Works on any phone, any carrier, any age
7. **Human-in-loop safety** - AI handles support, humans review crisis

---

## Open Questions

- Should we offer voice calls for users who prefer talking?
- How do we handle users with multiple care recipients (caring for 2+ people)?
- Should we integrate with care coordination platforms (Honor, Papa)?
- Do we need a Spanish version? (53M caregivers include non-English speakers)
- Should resource search expand beyond 10 categories?
