# GiveCare System Overview

**Audience**: Product managers, non-technical stakeholders, investors
**Purpose**: Understand what the product does and how users interact with it
**Technical Depth**: Low (no code)

**Version**: 0.3.0
**Last Updated**: 2025-10-09
**Platform**: TypeScript + Convex + OpenAI Agents SDK 0.1.9

---

## Table of Contents

1. [How the App Works](#how-the-app-works)
2. [Profile Collection](#1-profile-collection-conversational-onboarding)
3. [Daily EMA](#2-daily-ema-ecological-momentary-assessment)
4. [Clinical Assessments](#3-clinical-assessments)
5. [Burnout Score Calculation](#4-burnout-score-calculation)
6. [Resource Matching](#5-resource-matching-context-aware)
7. [Complete User Journey](#complete-user-journey)
8. [Database Architecture](#database-architecture)
9. [Performance Targets](#performance-targets)

---

## How the App Works

GiveCare is an AI-powered SMS/RCS caregiving support platform that combines:

1. **Conversational onboarding** - Smart profile collection without rigid forms
2. **Daily pulse checks** - Quick EMA to track moment-to-moment wellness
3. **Clinical assessments** - Validated tools (CWBS, REACH-II, SDOH) at intervals
4. **Burnout scoring** - Composite 0-100 score with confidence bands
5. **Context-aware interventions** - Evidence-based resources matched to user needs

**Key Design Principles**:
- Trauma-informed (never pressure users)
- Evidence-based (validated clinical tools)
- Conversational (natural language, not surveys)
- Adaptive (learns from user feedback)

---

## 1. Profile Collection (Conversational Onboarding)

### Core Profile Fields (Required)

The agent collects these **4 required fields** conversationally:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `firstName` | string | User's name | "Sarah" |
| `relationship` | string | Relationship to care recipient | "daughter", "spouse", "son" |
| `careRecipientName` | string | Name of person they're caring for | "Mom", "Dad", "John" |
| `zipCode` | string (5 digits) | Location for resources | "94103" |

**Source**: `src/context.ts:17-21`

### Additional Context (Auto-tracked)

| Field | Type | Description |
|-------|------|-------------|
| `phoneNumber` | string | E.164 format (+1XXXXXXXXXX) |
| `journeyPhase` | enum | `onboarding \| active \| crisis \| recovery \| maintenance` |
| `languagePreference` | string | Language (default: `en`) |
| `rcsCapable` | boolean | Whether phone supports rich messaging |
| `deviceType` | string | Phone model/type |
| `consentAt` | timestamp | Consent to participate |

**Source**: `src/context.ts:10-49`

### Trauma-Informed Tracking

To prevent pressure and respect boundaries:

| Field | Purpose | Rule |
|-------|---------|------|
| `onboardingAttempts` | Track how many times each field was asked | Max 2 attempts per field |
| `onboardingCooldownUntil` | Cooldown period after 2 declines | P3 compliance |

**Principles**:
- **P2**: Never ask same field twice in one session
- **P3**: Max 2 attempts total, then 24-hour cooldown
- **P4**: Soft confirmation before calling `updateProfile` tool

**Tool**: `updateProfile` (`src/tools.ts:15-74`)
- Called **immediately** when user shares info
- Returns `COMPLETE` or `INCOMPLETE:<missing_fields>`
- Agent translates status codes to natural language

---

## 2. Daily EMA (Ecological Momentary Assessment)

### Overview

**Frequency**: Once per day
**Duration**: ~1 minute
**Questions**: 5 quick Likert scale items
**Scoring**: Average of responses (normalized to 0-100)

**Source**: `src/assessmentTools.ts:46-94`

### Questions

| # | Question | Scale | Subscale | Reverse Scored |
|---|----------|-------|----------|----------------|
| 1 | "How are you feeling right now?" | 1-5 | `mood` | No |
| 2 | "How overwhelming does caregiving feel today?" | 1-5 | `burden` | Yes |
| 3 | "How stressed do you feel right now?" | 1-5 | `stress` | Yes |
| 4 | "How supported do you feel?" | 1-5 | `support` | No |
| 5 | "How well did you sleep last night?" | 1-5 | `self_care` | No |

**Scale**: 1 = lowest/worst, 5 = highest/best

### Scoring Logic

```typescript
// src/assessmentTools.ts:519-589
1. Collect responses (1-5 for each question)
2. Reverse score negative items (question 2, 3)
3. Normalize to 0-100: ((score - 1) / (5 - 1)) * 100
4. Average all 5 normalized scores
5. Return overall_score (0-100)
```

**Example**:
```
Responses: [4, 2, 3, 5, 3]
After reverse scoring: [4, 4, 3, 5, 3]
Normalized: [75, 75, 50, 100, 50]
Average: 70/100 (mild burnout band)
```

---

## 3. Clinical Assessments

Three validated clinical tools administered at intervals:

### CWBS (Caregiver Well-Being Scale)

**Frequency**: Every 2 weeks
**Duration**: ~3 minutes
**Questions**: 12 items
**Evidence**: Clinical trial validated (Tebb, Berg-Weger & Rubio 1999, 2012)

**Source**: `src/assessmentTools.ts:98-198`

#### Part I: Activities (8 items)
Scale: 1=Rarely, 5=Usually

1. Buying food
2. Taking care of personal daily activities (meals, hygiene, laundry)
3. Making sure medications are taken
4. Managing financial affairs
5. Arranging for services or medical appointments
6. Checking in and making sure they are ok
7. Providing transportation
8. Assisting with bathing and dressing

**Subscale**: `activities`

#### Part II: Needs (4 items)
Scale: 1=Rarely, 5=Usually (reverse scored)

9. "I need a break from caregiving"
10. "I need help managing daily caregiving responsibilities"
11. "I need help coordinating all aspects of care"
12. "I need information about caregiving and available resources"

**Subscale**: `needs` (reverse scored - higher need = lower wellness)

---

### REACH-II (Resources for Enhancing Alzheimer's Caregiver Health)

**Frequency**: Monthly
**Duration**: ~3 minutes
**Questions**: 10 items
**Evidence**: Clinical trial validated

**Source**: `src/assessmentTools.ts:202-287`

#### Questions by Subscale

| Subscale | Questions | Reverse Scored |
|----------|-----------|----------------|
| `stress` | "How often have you felt overwhelmed?" | Yes |
| `self_care` | "Enough time for yourself?", "Engage in activities you enjoy?", "Managing own health?" | No |
| `social` | "How often feel isolated or alone?" | Yes |
| `efficacy` | "Confident managing daily tasks?" | No |
| `emotional` | "Feel frustrated/angry?", "Feel guilty?" | Yes |
| `physical` | "Feel physically exhausted?" | Yes |
| `support` | "Satisfied with support network?" | No |

**Scoring**: Subscale averages, then composite score (0-100)

---

### SDOH (Social Determinants of Health) - GC-SDOH-28

**Frequency**: Quarterly
**Duration**: ~5 minutes
**Questions**: 28 yes/no items
**Evidence**: Expert consensus validated

**Source**: `src/assessmentTools.ts:291-488`

#### Domains

| Domain | # Questions | Sample Items |
|--------|-------------|--------------|
| **Financial** | 5 | Money worries, caregiving costs, employment impact, medication affordability, long-term security |
| **Housing** | 3 | Safety/adequacy, considering moving, accessibility concerns |
| **Transportation** | 3 | Reliable access, cost barriers, arranging transport |
| **Social Support** | 5 | Help availability, isolation, support groups, relationships, emotional support |
| **Healthcare Access** | 4 | Insurance, delayed care, regular doctor, satisfaction with care |
| **Food Security** | 3 | Food worries, skipped meals, healthy food access |
| **Legal/Administrative** | 3 | Legal documents (POA), benefits navigation, care planning |
| **Technology Access** | 2 | Internet reliability, comfort with tech |

**Scoring**:
- Yes to problem = 100 (issue present)
- No to problem = 0 (no issue)
- Reverse score for positive items (e.g., "Do you have insurance?" → Yes = 0)
- Average by domain, then composite score

---

## 4. Burnout Score Calculation

### Composite Score (0-100)

After each assessment, the system calculates:

**Source**: `src/burnoutCalculator.ts` + `src/assessmentTools.ts:519-589`

#### Step 1: Assessment Score
```typescript
1. Collect all responses for the assessment
2. For each question:
   a. Likert scales: Normalize (score - 1) / (max - 1) * 100
   b. Reverse score negative items if needed
   c. Boolean: Yes/true = 100, No/false = 0
3. Group by subscale and average
4. Average all subscales → overall_score (0-100)
```

#### Step 2: Composite Burnout Score
```typescript
// src/tools.ts:158-164
Combines EMA + CWBS + REACH-II + SDOH scores with weighting:
- Recent assessments weighted higher
- More questions = higher confidence
- Returns: overall_score, confidence (0-1), band, pressure_zones
```

### Burnout Bands

**Source**: `src/assessmentTools.ts:576-581`

| Band | Score Range | Interpretation | Agent Messaging |
|------|-------------|----------------|-----------------|
| **Crisis** | 0-19 | Immediate safety concerns | "High stress - let's find support" |
| **High** | 20-39 | Elevated stress | "Elevated stress" |
| **Moderate** | 40-59 | Managing but challenging | "Managing, but challenging" |
| **Mild** | 60-79 | Doing pretty well | "Doing pretty well" |
| **Thriving** | 80-100 | Excellent well-being | "You're doing great!" |

**Note**: Inverse scale - **lower score = more burnout**

### Pressure Zones (Top Stressors)

**Source**: `src/context.ts:35-36`

The system identifies **top 2-3 stressors** from subscale scores:

| Pressure Zone | Subscales Contributing | Priority for Interventions |
|---------------|------------------------|---------------------------|
| `emotional` | REACH-II emotional | High |
| `physical` | REACH-II physical, EMA self_care | High |
| `financial_strain` | SDOH financial | Medium |
| `social_isolation` | REACH-II social, SDOH social | High |
| `caregiving_tasks` | CWBS activities | Medium |
| `self_care` | EMA self_care, REACH-II self_care | High |
| `social_needs` | SDOH social, REACH-II support | Medium |

Each zone gets a score (0-100 based on subscale averages), and top zones are stored in context.

---

## 5. Resource Matching (Context-Aware)

### Intervention Selection Algorithm

**Tool**: `findInterventions` (`src/tools.ts:284-325`)

**Source**: `src/interventionData.ts` (5 curated interventions, expanding in Q1 2026)

#### Matching Logic

```typescript
1. Get user context:
   - burnoutScore (0-100)
   - burnoutBand (crisis | high | moderate | mild | thriving)
   - pressureZones (top 2-3 stressors)
   - zipCode (for location-specific resources)
   - relationship + careRecipientName (for personalization)

2. Filter interventions:
   - Match pressure zones to intervention tags
   - Filter by evidence level (prefer peer_reviewed, clinical_trial)
   - Filter by location if zip_code available
   - Filter by language preference

3. Rank by effectiveness:
   - effectivenessPct (0-100) - how many caregivers found helpful
   - avgRating (1-5) - user feedback from knowledgeUsage table
   - usageCount (higher = more validated)

4. Return top 2 interventions (one per pressure zone)
```

### Intervention Data Structure

**Source**: `convex/schema.ts:136-188`

```typescript
{
  type: 'routine' | 'resource' | 'intervention' | 'education',
  category: string,
  title: string,
  description: string,
  content: string,

  // Matching
  pressureZones: string[],  // ['emotional', 'physical']
  tags: string[],

  // Evidence
  evidenceSource: string,
  evidenceLevel: 'peer_reviewed' | 'clinical_trial' | 'expert_consensus' | 'verified_directory' | 'community_validated',
  effectivenessPct: number,  // 0-100

  // Delivery
  deliveryFormat: 'sms_text' | 'rcs_card' | 'url' | 'phone_number' | 'interactive',
  deliveryData: object,

  // Localization
  language: string,
  zipCodes: string[],  // Location-specific resources

  // Usage tracking
  usageCount: number,
  avgRating: number,  // 1-5
  lastUsedAt: timestamp
}
```

### Feedback Loop

**Source**: `convex/schema.ts:190-211`

After user tries intervention:
```typescript
1. Agent asks: "Did this help? (1-5)"
2. User rates intervention
3. Stored in knowledgeUsage table:
   - knowledgeId (which intervention)
   - userId (who tried it)
   - pressureZones (what they were struggling with)
   - rating (1-5)
4. Updates intervention.avgRating
5. Improves future matching for similar users
```

---

## Complete User Journey

### Day 1: Onboarding
```
1. User texts GiveCare number
2. Agent: "Hi! I'm here to support you. What's your name?"
3. User: "Sarah"
4. Agent calls updateProfile(first_name="Sarah")
5. Agent: "Nice to meet you, Sarah. Who are you caring for?"
6. User: "My mom"
7. Agent calls updateProfile(care_recipient_name="Mom")
8. Agent: "What's your relationship to your mom?"
9. User: "I'm her daughter"
10. Agent calls updateProfile(relationship="daughter")
11. Agent: "To find local resources, what's your zip code?"
12. User: "94103"
13. Agent calls updateProfile(zip_code="94103")
14. Agent: "Profile complete! Let's do a quick check-in to see how you're doing."
15. Agent calls startAssessment(type='ema')
16. EMA flows (5 questions)
17. Agent calculates baseline burnout score
18. Agent delivers 2 interventions matched to top pressure zones
```

### Week 1: Daily EMA + First CWBS
```
Day 2-7: Daily EMA (1 minute each morning)
Day 7: CWBS baseline (12 questions, 3 minutes)
  → Updated burnout score + pressure zones
  → New interventions if zones changed
```

### Week 2-4: Pattern Establishment
```
Daily: EMA
Week 2: CWBS
Week 3: Daily EMA only
Week 4: CWBS + REACH-II (first monthly check)
```

### Month 2+: Ongoing Support
```
Daily: EMA
Biweekly: CWBS
Monthly: REACH-II
Quarterly: SDOH (comprehensive needs screening)

After EVERY assessment:
  → Burnout score recalculated
  → Pressure zones updated
  → Context-aware interventions delivered
  → User rates interventions (feedback loop)
```

### Crisis Detection
```
If burnoutScore < 20 OR crisis keywords detected:
  1. Handoff to Crisis Agent (src/agents.ts)
  2. Immediate safety resources (988, 741741, 911)
  3. Crisis-specific interventions (respite, emergency contacts)
  4. Follow-up check-in next day
```

---

## Database Architecture

**Source**: `convex/schema.ts`

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles + current state | phoneNumber (unique), firstName, relationship, careRecipientName, zipCode, burnoutScore, burnoutBand, pressureZones, journeyPhase |
| `assessmentSessions` | In-progress assessments | userId, type, completed, currentQuestion, responses, overallScore, domainScores |
| `assessmentResponses` | Individual question answers | sessionId, userId, questionId, responseValue, score |
| `wellnessScores` | Historical burnout scores | userId, overallScore, band, pressureZones, pressureZoneScores, recordedAt |
| `knowledgeBase` | Interventions/resources | type, title, description, pressureZones, evidenceLevel, effectivenessPct, deliveryFormat, zipCodes |
| `knowledgeUsage` | Intervention feedback | knowledgeId, userId, pressureZones, rating, delivered |
| `conversations` | SMS history | userId, role, text, messageSid, agentName, timestamp |

### Indexes

**Performance optimizations**:
- `users.by_phone` - Fast lookup by phone number
- `wellnessScores.by_user_recorded` - Time-series queries for trends
- `knowledgeBase.search_content` - Semantic search for interventions
- `conversations.by_user_time` - Chat history pagination

---

## Performance Targets

**Source**: Python implementation benchmarks (give-care-prod)

### Response Time (p95)
- **Target**: <1s
- **Current**: ~900ms average
- **Breakdown**:
  - Agent execution: 800-1200ms (GPT-5 nano with minimal reasoning)
  - Guardrails: ~20ms (parallel, non-blocking)
  - Database: <10ms (async background logging)

### Scoring Performance
- **EMA**: <50ms (5 questions)
- **CWBS**: <100ms (12 questions, 2 subscales)
- **REACH-II**: <100ms (10 questions, 7 subscales)
- **SDOH**: <150ms (28 questions, 8 domains)
- **Composite burnout**: <50ms (weighted average)

### Database Operations
- User lookup: <10ms (indexed by phone)
- Assessment save: <20ms (background async)
- Wellness score save: <20ms (background async)
- Intervention query: <50ms (indexed by pressure zones + evidence level)

### Model Configuration
```typescript
// GPT-5 nano with minimal reasoning
model: "gpt-5-nano"
modelSettings: {
  reasoning: { effort: "minimal" },  // Trade accuracy for speed
  text: { verbosity: "low" },        // Concise SMS responses
  maxTokens: 300,
  store: true                        // 30-day automatic retention
}
```

**Advantages over Python**:
- 50% faster response time (~900ms vs ~1500ms)
- Serverless auto-scaling (Convex)
- Simpler session management (OpenAI SDK handles it)
- Real-time subscriptions for dashboard

---

## Next Steps

See also:
- [Architecture Deep Dive](./ARCHITECTURE.md) - Multi-agent system design
- [Assessment Scoring](./SCORING.md) - Detailed scoring algorithms
- [Intervention Matching](./INTERVENTIONS.md) - Resource recommendation engine
- [API Reference](./API.md) - Convex functions and tools
