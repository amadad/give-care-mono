# GiveCare Taxonomy & Nomenclature

**Complete reference for tiering, naming, and classification systems across the platform.**

Last updated: 2025-10-10 (v0.6.0)

---

## Table of Contents

1. [Burnout Measurement Hierarchy](#burnout-measurement-hierarchy)
2. [Assessment Classification](#assessment-classification)
3. [Pressure Zone System](#pressure-zone-system)
4. [Agent Architecture](#agent-architecture)
5. [User Journey Phases](#user-journey-phases)
6. [Subscription & Rate Limiting](#subscription--rate-limiting)
7. [Proactive Messaging Tiers](#proactive-messaging-tiers)
8. [Resource Directory Taxonomy](#resource-directory-taxonomy)
9. [Formatting Conventions](#formatting-conventions)

---

## Burnout Measurement Hierarchy

### 1. Score Scale (Quantitative)

**Range**: 0-100 (continuous numeric scale)

**Direction**: Higher = Healthier, Lower = More Distressed

```
0 ─────────────────────────────────────────────────────── 100
│                                                          │
Crisis              Moderate                          Thriving
(Severe burnout)    (Common)                    (Minimal burnout)
```

**Interpretation**:
- **0-19**: Severe caregiver distress, immediate intervention needed
- **20-39**: Significant burnout, high risk
- **40-59**: Moderate burnout (typical for caregivers)
- **60-79**: Managing well, low burnout
- **80-100**: Thriving, minimal burnout symptoms

**Source**: `src/burnoutCalculator.ts:85` - Composite weighted score from 4 assessments

---

### 2. Bands (Qualitative Categories)

**5-tier classification** for clinical interpretation:

| Band | Score Range | Clinical Meaning | User-Facing Label | Action Required |
|------|-------------|------------------|-------------------|-----------------|
| **crisis** | 0-19 | Severe burnout, immediate support needed | "High stress - let's find support" | Immediate intervention |
| **high** | 20-39 | High burnout, significant distress | "Elevated stress" | Proactive check-ins |
| **moderate** | 40-59 | Moderate burnout, common for caregivers | "Managing, but challenging" | Weekly check-ins |
| **mild** | 60-79 | Low burnout, managing well | "Doing pretty well" | Monitoring only |
| **thriving** | 80-100 | Minimal burnout, healthy state | "You're doing great!" | No intervention |

**Type Definition**: `src/context.ts:36`
```typescript
burnoutBand: z.enum(['crisis', 'high', 'moderate', 'mild', 'thriving'])
```

**Band Calculation**: `src/burnoutCalculator.ts:147-154`

**User-Facing Messages**: `src/tools.ts:225-229` (checkWellnessStatus), `src/tools.ts:285-289` (recordAssessmentAnswer)

---

### 3. Confidence (Data Quality Metric)

**Range**: 0-1 (decimal)

**Interpretation**:
- **1.0**: All 4 assessments completed recently (100% confidence)
- **0.7**: 3 of 4 assessments completed (70% confidence)
- **0.4**: 2 of 4 assessments completed (40% confidence)
- **0.1**: Only 1 assessment completed (10% confidence)

**Calculation**: `totalWeight / totalPossibleWeight`

**Why it matters**: Low confidence means score is extrapolated from limited data. Agents should recommend more assessments when confidence < 0.5.

**Source**: `src/burnoutCalculator.ts:88-89`

---

## Assessment Classification

### 4 Clinical Assessment Types

| Assessment | Type ID | Full Name | Purpose | Questions | Duration | Evidence Level | Frequency |
|------------|---------|-----------|---------|-----------|----------|----------------|-----------|
| **EMA** | `ema` | Ecological Momentary Assessment | Daily pulse check | 5 | 1 min | Clinical trial | Daily |
| **CWBS** | `cwbs` | Caregiver Well-Being Scale | Weekly burnout assessment | 10 | 3 min | Validated (Tebb et al. 1999) | Weekly |
| **REACH-II** | `reach_ii` | Resources for Enhancing Alzheimer's Caregiver Health | Stress & coping evaluation | 9 | 3 min | RCT-validated (Belle et al. 2006) | Biweekly |
| **SDOH** | `sdoh` | Social Determinants of Health | Needs screening | 22 | 5 min | Public health standard | Monthly |

**Type Definition**: `src/assessmentTools.ts:14`
```typescript
export type AssessmentType = 'ema' | 'cwbs' | 'reach_ii' | 'sdoh';
```

**Weight in Composite Score**:
```typescript
const ASSESSMENT_WEIGHTS = {
  ema: 0.40,      // 40% - daily pulse (most recent data)
  cwbs: 0.30,     // 30% - weekly burnout (core metric)
  reach_ii: 0.20, // 20% - stress/coping (specialized)
  sdoh: 0.10      // 10% - needs screening (contextual)
};
```

**Subscale Mapping**: See section on [Pressure Zones](#pressure-zone-system)

---

### Assessment Score Calculation

**Method**: Subscale averaging with reverse scoring

```typescript
// For each question:
rawScore = userResponse // 1-5 on Likert scale

// If reverse_score = true:
adjustedScore = (scale + 1) - rawScore  // Invert: 1→5, 2→4, etc.

// Normalize to 0-100:
normalizedScore = ((adjustedScore - 1) / (scale - 1)) * 100

// Average by subscale:
subscaleScore = mean(normalizedScores for subscale)

// Overall score:
overallScore = mean(all subscale scores)
```

**Edge Case**: If all questions skipped → `overall_score: null` (not NaN or 0)

**Source**: `src/assessmentTools.ts:520-596`

---

## Pressure Zone System

### 5 Pressure Zones (Stressor Categories)

Pressure zones identify **where** a caregiver is struggling (vs. bands which indicate **how much**).

| Zone ID | Display Label | Subscales Included | Intervention Focus |
|---------|---------------|-------------------|-------------------|
| `emotional_wellbeing` | Emotional Well-being | mood, stress, burden, guilt, efficacy, emotional, coping | Mindfulness, crisis support, stress relief |
| `physical_health` | Physical Health | self_care, physical, life_satisfaction, healthcare | Respite care, sleep hygiene, self-care |
| `social_support` | Social Support | support, social, social_isolation, social_needs, technology, safety | Support groups, community resources |
| `financial_concerns` | Financial Concerns | financial, housing, transportation, food, legal | Assistance programs, budgeting, benefits |
| `time_management` | Time Management | burden, activities, needs, behavior_problems | Task prioritization, delegation scripts |

**Type Definition**: `src/burnoutCalculator.ts:254-259` (formatZoneName)

**Subscale-to-Zone Mapping**: `src/burnoutCalculator.ts:170-210`

---

### Subscale → Zone Mapping (Detailed)

**EMA Subscales**:
- `mood` → emotional_wellbeing
- `burden` → time_management
- `stress` → emotional_wellbeing
- `support` → social_support
- `self_care` → physical_health

**CWBS Subscales**:
- `activities` → time_management
- `needs` → time_management

**REACH-II Subscales**:
- `stress` → emotional_wellbeing (shared)
- `self_care` → physical_health (shared)
- `social` → social_support
- `efficacy` → emotional_wellbeing
- `emotional` → emotional_wellbeing
- `physical` → physical_health
- `support` → social_support (shared)

**SDOH Subscales**:
- `financial` → financial_concerns
- `housing` → financial_concerns
- `transportation` → financial_concerns
- `social` → social_support (shared)
- `healthcare` → physical_health
- `food` → financial_concerns
- `legal` → financial_concerns
- `technology` → social_support

**Legacy Mappings** (backward compatibility):
- `emotional_exhaustion` → emotional_wellbeing
- `physical_exhaustion` → physical_health
- `financial_strain` → financial_concerns
- `social_isolation` → social_support
- `caregiving_tasks` → time_management

---

### Pressure Zone Calculation

**Algorithm**:
```typescript
1. For each assessment subscale score:
   - Invert score: pressure = 100 - subscaleScore
   - Map subscale to zone (e.g., "stress" → "emotional_wellbeing")
   - Add pressure value to zone's score list

2. Calculate zone average:
   - zoneAverage = mean(all pressure scores for that zone)

3. Filter high-pressure zones:
   - Include zones where zoneAverage > 50 (threshold)

4. Sort by pressure level (highest first)

5. Return top 2-3 zones as pressure zones
```

**Example**:
```
User completes EMA with:
- mood: 2/5 (40/100) → pressure 60 → emotional_wellbeing
- stress: 4/5 (75/100) → pressure 25 → emotional_wellbeing (reverse scored)
- support: 2/5 (40/100) → pressure 60 → social_support

Zone averages:
- emotional_wellbeing: (60 + 25) / 2 = 42.5 (below threshold, not included)
- social_support: 60 (above threshold, included)

Result: pressureZones = ["social_support"]
```

**Source**: `src/burnoutCalculator.ts:163-244`

---

## Agent Architecture

### 3-Agent Multi-Agent System

| Agent | Name | Purpose | Tools Available | Handoff Triggers |
|-------|------|---------|----------------|------------------|
| **Main Agent** | Main Support | Orchestrator, general conversation | updateProfile, checkWellnessStatus, findInterventions | Crisis keywords → Crisis Agent<br>Assessment keywords → Assessment Agent |
| **Crisis Agent** | Crisis Support | Immediate safety support | None (resource-focused) | User says "I'm okay now" → Main Agent |
| **Assessment Agent** | Assessment Guide | Clinical evaluations | startAssessment, recordAssessmentAnswer | Assessment complete → Main Agent |

**Type Definition**: `src/agents.ts:28-88`

**Handoff Rules**: Seamless (invisible to users) - See `SEAMLESS_HANDOFF_RULE` in `src/instructions.ts:53`

---

### Agent Service Tiers

**Model Configuration**:
```typescript
model: "gpt-5-nano",           // Fast, cost-effective
reasoning: "minimal",          // No extended thinking
verbosity: "low",              // SMS-optimized
maxTokens: 300,                // SMS-friendly responses
store: true,                   // 30-day session retention
```

**Priority Tier**: Standard (20-30% faster than flex tier)

**Performance**:
- Main Agent: ~900ms average response time
- Crisis Agent: ~600ms (200-400ms faster, no tools)
- Assessment Agent: ~600ms (300-500ms faster, stopAtTools)

**Source**: `src/agents.ts:20-52`

---

## User Journey Phases

### 5 Journey States

| Phase | Definition | Typical Burnout Band | Active Features | Next Phase Trigger |
|-------|-----------|---------------------|----------------|-------------------|
| **onboarding** | Collecting profile (first 4 fields) | N/A | Profile collection, trauma-informed prompts | Profile complete → active |
| **active** | Regular engagement, completing assessments | moderate to mild | All tools, assessments, interventions | 30 days no contact → maintenance |
| **crisis** | Elevated risk, immediate support needed | crisis or high | Crisis resources, daily check-ins | 7 days stable → recovery |
| **recovery** | Post-crisis stabilization | high to moderate | Weekly check-ins, intervention follow-up | 14 days stable → active |
| **maintenance** | Low engagement, dormant user | mild to thriving | Reactivation messages (max 3) | New message → active |

**Type Definition**: `src/context.ts:23`
```typescript
journeyPhase: z.enum(['onboarding', 'active', 'crisis', 'recovery', 'maintenance'])
```

**Phase Transitions**: Managed by `convex/functions/scheduling.ts` and `convex/twilio.ts`

---

### Profile Completeness Tiers

**4 Required Fields** (collected during onboarding):

| Field | Prompt | Validation | Attempts Allowed |
|-------|--------|------------|------------------|
| `firstName` | "What's your first name?" | Any string | 2 max (P3) |
| `relationship` | "What's your relationship to the person you're caring for?" | Any string | 2 max (P3) |
| `careRecipientName` | "What's their name?" | Any string | 2 max (P3) |
| `zipCode` | "What's your ZIP code?" | `/^\d{5}$/` | 2 max (P3) |

**Completeness Check**: `src/context.ts:63-69` (contextHelpers.profileComplete)

**Trauma-Informed Rules** (P2/P3):
- P2: Never ask same field twice in one session
- P3: Max 2 attempts per field, then 24-hour cooldown

---

## Subscription & Rate Limiting

### Subscription Tiers

| Status | Access Level | Price | Rate Limits |
|--------|-------------|-------|-------------|
| `trialing` | Full access (7 days) | $0 | Same as active |
| `active` | Full access | $8/month | 10 SMS/day, 3 assessments/day |
| `past_due` | Grace period (7 days) | Payment failed | Reduced: 3 SMS/day |
| `canceled` | Read-only (30 days) | - | No new assessments |
| `inactive` | No access | - | Welcome message only |

**Type Definition**: `convex/schema.ts:48`
```typescript
subscriptionStatus: v.string() // active | inactive | past_due | canceled | trialing
```

---

### Rate Limit Tiers (5 Layers)

**Token Bucket Algorithm** with refill rates:

| Limit Name | Scope | Capacity | Refill Rate | Purpose | User Message |
|------------|-------|----------|-------------|---------|--------------|
| **SMS Per-User** | User | 10/day | 10 tokens/day (at midnight) | Prevent spam | "Daily limit reached. Resets at midnight." |
| **SMS Global** | System | 1000/hour | 1000 tokens/hour | Twilio tier protection | "High volume detected. Try again in an hour." |
| **Assessment** | User | 3/day | 3 tokens/day (at midnight) | Prevent gaming | "Assessment limit reached (3/day)." |
| **OpenAI API** | System | 100/min | 100 tokens/min | Quota management | "Service busy. Try again in a minute." |
| **Spam Protection** | User | 20/hour | 20 tokens/hour | Extreme usage detection | "Too many messages. Try again later." |

**Cost Protection**: Max $1,200/day global spend (prevents overage incidents)

**Configuration**: `convex/rateLimits.config.ts`

**Documentation**: `docs/RATE_LIMITS.md`

---

## Proactive Messaging Tiers

### Wellness Check-In Cadence (Based on Burnout Band)

**3-tier system** with crisis escalation:

| Band | Cadence | Duration | Stop Condition | Implementation |
|------|---------|----------|----------------|----------------|
| **crisis** | Daily → Weekly | 7 days daily, then weekly | User improves to "moderate" or better | Multi-stage follow-up (7 stages) |
| **high** | Every 3 days | Ongoing | User improves to "moderate" or better | Simple interval check |
| **moderate** | Weekly | Ongoing | User improves to "mild" or better | Simple interval check |
| **mild** | Never | - | - | No proactive outreach |
| **thriving** | Never | - | - | No proactive outreach |

**Crisis Follow-Up Stages** (7 messages over 35 days):
- Day 0: Crisis detected → Daily check-ins begin
- Day 1-6: Daily support messages
- Day 7: Transition to weekly check-ins
- Week 2, 3, 4, 5: Weekly support messages
- After 35 days: Return to band-based cadence

**Source**: `convex/functions/scheduling.ts:62-185`

---

### Dormant User Reactivation (Maintenance Phase)

**3-stage escalation** with hard stops:

| Stage | Day | Message Tone | Stop Condition |
|-------|-----|--------------|----------------|
| **Stage 1** | Day 7 | Gentle reminder: "We're here when you need us" | User responds |
| **Stage 2** | Day 14 | Value reminder: "Your wellness matters" | User responds |
| **Stage 3** | Day 30 | Final outreach: "We miss you" | User responds or permanent stop |

**Hard Stops**: No messages on days other than 7, 14, 30 (prevents spam)

**Permanent Stop**: After day 30 with no response, no further outreach unless user initiates

**Source**: `convex/functions/scheduling.ts:187-283`

---

### Global Deduplication

**Rule**: Maximum 1 proactive message per day per user

**Logic**:
```typescript
if (now - user.lastProactiveMessageAt < 24 hours) {
  skip // Already received proactive message today
}
```

**Field**: `users.lastProactiveMessageAt` (timestamp)

**Purpose**: Prevent multiple systems from bombarding users

---

## Resource Directory Taxonomy

The resource directory separates **interventions** (stored in `knowledgeBase`) from actionable **services** (stored across the directory graph). This graph prevents duplication, captures provenance, and lets one program surface across multiple facilities or service areas without cloning data.

### Canonical Records

| Entity | Table | Purpose |
|--------|-------|---------|
| Provider | `providers` | Organization that operates programs (AAA, VA office, CBO, health system). |
| Program | `programs` | Benefit or service offering (respite vouchers, caregiver coaching, support groups). |
| Facility | `facilities` | Physical or virtual touchpoint delivering a program; stores phones, hours, and geocodes. |
| Service Area | `serviceAreas` | Geographic coverage for a program (ZIP clusters, counties, statewide). |
| Resource | `resources` | User-facing join across program + facility + coverage details, with RBI and compliance flags. |
| Resource Version | `resourceVersions` | Snapshot of a resource edit for audit history. |
| Resource Verification | `resourceVerifications` | Evidence collected during verification (call script, email receipt, timestamp). |

### Resource Categories (`resource_category`)

| Value | Description | Typical Pressure Zones |
|-------|-------------|------------------------|
| `respite` | In-home or facility-based relief care, vouchers, short-term stays. | `time_management`, `physical_health` |
| `caregiver_support` | Peer or professional support groups, navigator programs. | `social_support`, `emotional_wellbeing` |
| `counseling` | Behavioral health, grief, crisis lines, caregiver coaching. | `emotional_wellbeing` |
| `education_training` | Skills classes, dementia training, evidence-based workshops. | `time_management`, `emotional_wellbeing` |
| `navigation` | Benefits enrollment, case management, care coordination. | `financial_concerns`, `social_support` |
| `equipment_devices` | DME loans, home modification programs, assistive tech. | `physical_health`, `financial_concerns` |
| `legal_planning` | Advance directives, caregiver rights, guardianship resources. | `financial_concerns` |
| `financial_assistance` | Stipends, reimbursement programs, emergency grants. | `financial_concerns` |

### Provider Sectors (`sector`)

| Value | Description |
|-------|-------------|
| `public_federal` | Federally funded or administered services (ACL, CMS, VA). |
| `public_state` | State Units on Aging, Medicaid agencies, state grant programs. |
| `public_local` | County/city aging offices, senior centers, municipal respite. |
| `va` | VA Caregiver Support Program and affiliated services. |
| `nonprofit` | 501(c)(3) organizations delivering caregiver services. |
| `cbo` | Community-based organizations, including grassroots and neighborhood groups. |
| `faith_based` | Congregation-led ministries and faith-affiliated services. |
| `private_for_profit` | Commercial respite providers or paid care services. |
| `payer` | Health plan or insurer-sponsored caregiver benefits. |
| `employer_program` | Employer-backed caregiver support offerings. |
| `aggregator` | Directory-of-directories (Eldercare Locator, BenefitsCheckUp, 211 metadata). |

### Verification Status (`verification_status`)

| Value | Definition | Evidence Requirement |
|-------|-----------|----------------------|
| `unverified` | Imported or user-submitted record with no validation. | Metadata only. |
| `verified_basic` | Confirmed contact and availability via email, web form, or voice script. | Timestamp + method + reviewer. |
| `verified_full` | Verified plus documented eligibility, pricing, and success signal. | Evidence attachment + next review date. |

### Jurisdiction Level (`jurisdiction_level`)

| Value | Definition | Typical Use |
|-------|-----------|-------------|
| `federal` | Nationwide programs governed by federal agencies. | VA Caregiver Support Line. |
| `state` | Statewide coverage or mandate. | CalGrows, NY State Office for the Aging. |
| `tribal` | Tribal jurisdiction or IHS partnership. | Tribal elder services. |
| `county` | County or parish service boundary. | County aging services. |
| `city` | City or municipal programs. | City caregiver respite fund. |
| `national` | Private or nonprofit services with national reach. | National helplines, virtual support groups. |

### Service Area Types (`serviceAreas.type`)

| Value | Definition |
|-------|-----------|
| `statewide` | Covers entire state or territory. |
| `county` | One or more county FIPS codes. |
| `city` | City or town boundary. |
| `zip_cluster` | Cluster of ZIP codes (ZIP3 or curated set). |
| `national` | Operates virtually with no geo restriction. |

### Mapping: Assessment → Pressure Zones → Resource Categories

| Assessment (`assessment_type`) | Primary Pressure Zones (`pressure_zones`) | Default Resource Categories (`resource_category`) |
|--------------------------------|--------------------------------------------|---------------------------------------------------|
| `ema` | `['emotional_wellbeing', 'time_management']` | `['counseling', 'navigation']` |
| `cwbs` | `['emotional_wellbeing', 'social_support']` | `['caregiver_support', 'respite']` |
| `reach_ii` | `['emotional_wellbeing', 'social_support', 'time_management']` | `['caregiver_support', 'education_training']` |
| `sdoh` | `['financial_concerns', 'physical_health', 'social_support']` | `['financial_assistance', 'navigation', 'equipment_devices']` |

### Compliance Flags

- `license`: Source license or citation (plain text or URL).
- `tos_allows_scrape`: Boolean reflecting explicit Terms of Service allowance; default `false`.
- `robots_allowed`: Robots.txt allowance for automated fetches.
- `last_crawled_at`: Epoch millis for the last fetch or verification attempt.

These fields support audit trails and escalation to the curator workflow (review queue, diff viewer, verification toolkit).

---

## Formatting Conventions

### Display Name Formats

**Context**: Different surfaces need different formatting

| Surface | Format | Example | Implementation |
|---------|--------|---------|----------------|
| **SMS to User** | Lowercase, natural | "emotional well-being, social support" | `formatZoneName().toLowerCase()` |
| **Agent Instructions** | Title Case | "Emotional Well-being, Social Support" | `formatZoneName()` |
| **Database/API** | snake_case | "emotional_wellbeing" | Raw identifier |
| **UI Dashboard** | Title Case | "Emotional Well-being" | `formatZoneName()` |

---

### Band Display Labels

**User-Facing Messages** (trauma-informed):

| Band | Internal ID | User-Facing Label | Message Context |
|------|-------------|-------------------|-----------------|
| crisis | `crisis` | "high stress - let's find support" | Empathetic, solution-focused |
| high | `high` | "elevated stress" | Acknowledging, supportive |
| moderate | `moderate` | "managing, but challenging" | Normalizing, validating |
| mild | `mild` | "doing pretty well" | Encouraging, positive |
| thriving | `thriving` | "you're doing great!" | Celebrating, affirming |

**Source**: `src/tools.ts:225-229`

---

### Zone Display Descriptions

**Contextual descriptions** for agent use:

```typescript
getZoneDescription('emotional_wellbeing')
// → "Emotional Burden"

getZoneDescription('physical_health')
// → "Physical Health Strain"

getZoneDescription('social_support')
// → "Social Isolation"

getZoneDescription('financial_concerns')
// → "Financial Stress"

getZoneDescription('time_management')
// → "Caregiving Demands"
```

**Source**: `src/burnoutCalculator.ts:289-313`

---

## Cross-Reference Index

### Key Files for Each System

| System | Primary File | Secondary Files | Tests |
|--------|-------------|-----------------|-------|
| **Burnout Score** | `src/burnoutCalculator.ts` | `src/assessmentTools.ts` | `tests/burnout.test.ts` |
| **Pressure Zones** | `src/burnoutCalculator.ts:163-244` | `src/interventionData.ts` | `tests/burnout.pressure-zones.test.ts` |
| **Assessments** | `src/assessmentTools.ts` | `convex/schema.ts:99-161` | `tests/assessments.test.ts` |
| **Agents** | `src/agents.ts` | `src/instructions.ts` | (integration tests) |
| **Journey Phases** | `src/context.ts:23` | `convex/functions/scheduling.ts` | `tests/scheduling.test.ts` |
| **Rate Limits** | `convex/rateLimits.config.ts` | `convex/twilio.ts:80-155` | `tests/rateLimiter.test.ts` |
| **Formatting** | `src/burnoutCalculator.ts:247-313` | `src/tools.ts` | `tests/zoneFormatting.test.ts` |

---

## Terminology Quick Reference

### Prefer These Terms

✅ **Use**:
- "Burnout score" (not "wellness score")
- "Pressure zone" (not "stressor area" or "domain")
- "Band" (not "tier" or "level" or "category")
- "Assessment" (not "survey" or "questionnaire")
- "Subscale" (not "subdomain" or "dimension")
- "Crisis" (not "emergency" or "urgent")
- "Journey phase" (not "user state" or "status")
- "Proactive message" (not "outreach" or "notification")

❌ **Avoid**:
- "Wellness score" → Use "burnout score" (clearer directionality)
- "Tier" → Ambiguous (subscription tier? band tier? rate limit tier?)
- "Level" → Ambiguous (score level? band level?)
- "Category" → Too generic
- "Survey" → Not clinical enough
- "State" → Overloaded term (journey state? assessment state?)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.6.0 | 2025-10-10 | Added: Taxonomy doc with complete nomenclature, fixed pressure zone integration |
| 0.5.0 | 2025-10-10 | Added: Rate limiting tiers (5 layers) |
| 0.4.0 | 2025-10-10 | Added: Proactive messaging tiers (wellness check-ins, dormant reactivation) |
| 0.3.0 | 2025-10-09 | Initial: Burnout bands, pressure zones, assessment types |

---

## Notes on Consistency

**When adding new features**:

1. ✅ Use existing terminology (see Quick Reference above)
2. ✅ Add to this taxonomy doc if creating new classification
3. ✅ Update cross-reference index with new files
4. ✅ Update version history in CHANGELOG.md
5. ✅ Ensure display formatting matches conventions (snake_case → Title Case)

**When modifying taxonomy**:

1. ⚠️ Check all 3 systems that use it (agent, database, UI)
2. ⚠️ Update tests to match new taxonomy
3. ⚠️ Document in this file + CHANGELOG.md
4. ⚠️ Consider backward compatibility (add legacy mappings if needed)

---

**Last updated**: 2025-10-10 by Claude Code (taxonomy documentation + integration fixes)

---

# PART 2: VISUAL REFERENCE

**Quick visual diagrams for the platform's classification systems.**

---

## Burnout Measurement System (Visual)

### The Three Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: NUMERIC SCORE (Quantitative)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  0 ───────────────────────────────────────────────────── 100   │
│  │                                                          │   │
│  Crisis            Moderate                          Thriving   │
│  (Severe)          (Common)                         (Minimal)   │
│                                                                 │
│  Higher = Healthier ✓                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: BANDS (Qualitative Categories)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────┬──────┬──────┬──────┬──────┐                         │
│  │crisis│ high │ mod  │ mild │thriv.│                         │
│  ├──────┼──────┼──────┼──────┼──────┤                         │
│  │ 0-19 │20-39 │40-59 │60-79 │80-100│                         │
│  └──────┴──────┴──────┴──────┴──────┘                         │
│                                                                 │
│  User sees: "High stress - let's find support"                 │
│  Agent sees: burnoutBand = 'crisis'                            │
│  DB stores: band: v.string()                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: CONFIDENCE (Data Quality)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  0.0 ─────────────────────────────────────────────────── 1.0   │
│  │                                                          │   │
│  Low confidence                                   High confidence│
│  (1 assessment)                                  (4 assessments)│
│                                                                 │
│  < 0.5 → Recommend more assessments                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Assessment Hierarchy (Visual)

### 4 Types → Weighted Composite

```
┌──────────────────────────────────────────────────────────────────┐
│ ASSESSMENT INPUT SYSTEM                                          │
└──────────────────────────────────────────────────────────────────┘

        ┌────────────┐
        │    USER    │
        └─────┬──────┘
              │ SMS responses to questions
              ▼
    ┌─────────────────────────┐
    │   4 ASSESSMENT TYPES    │
    └─────────────────────────┘
              │
    ┌─────────┼─────────┬─────────┬─────────┐
    │         │         │         │         │
    ▼         ▼         ▼         ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ EMA  │ │ CWBS │ │REACH │ │ SDOH │
│ 40%  │ │ 30%  │ │ 20%  │ │ 10%  │
└──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
   │        │        │        │
   │ 5Q     │ 10Q    │ 9Q     │ 22Q
   │ 1min   │ 3min   │ 3min   │ 5min
   │        │        │        │
   └────────┴────────┴────────┘
              │
              ▼
    ┌─────────────────────────┐
    │  COMPOSITE CALCULATOR   │
    │  (weighted average)     │
    └─────────┬───────────────┘
              │
              ▼
    ┌─────────────────────────┐
    │  BURNOUT SCORE 0-100    │
    │  + BAND (crisis→thriving)│
    │  + CONFIDENCE (0-1)     │
    └─────────────────────────┘
```

---

## Pressure Zone System (Visual)

### 5 Zones → Intervention Matching

```
┌──────────────────────────────────────────────────────────────────┐
│ PRESSURE ZONE MAPPING                                            │
└──────────────────────────────────────────────────────────────────┘

BURNOUT SCORE (0-100)
│
│  0-19 ──► ┌─────────────────────┐
│           │   ZONE 1: CRISIS    │ ──► 988, 741741, therapy
│           └─────────────────────┘
│
│ 20-39 ──► ┌─────────────────────┐
│           │ ZONE 2: HIGH STRESS │ ──► Respite, support groups
│           └─────────────────────┘
│
│ 40-59 ──► ┌─────────────────────┐
│           │ ZONE 3: MODERATE    │ ──► Self-care, boundaries
│           └─────────────────────┘
│
│ 60-79 ──► ┌─────────────────────┐
│           │ ZONE 4: MILD        │ ──► Maintenance strategies
│           └─────────────────────┘
│
│ 80-100 ──► ┌─────────────────────┐
│           │ ZONE 5: THRIVING    │ ──► Keep up the good work
│           └─────────────────────┘
```

---

## Agent Architecture (Visual)

### 3 Agents with Handoffs

```
┌──────────────────────────────────────────────────────────────────┐
│ MULTI-AGENT SYSTEM                                               │
└──────────────────────────────────────────────────────────────────┘

    USER SMS
       │
       ▼
┌────────────────┐
│  MAIN AGENT    │ ◄─────────────────┐
│  (Orchestrator)│                    │
└───┬────────────┘                    │
    │                                 │
    │ Detects crisis keywords         │
    ├──► ┌────────────────┐          │
    │    │  CRISIS AGENT  │──────────┘ handoff back
    │    │  (988/741741)  │
    │    └────────────────┘
    │
    │ User needs assessment
    ├──► ┌────────────────┐          │
    │    │ ASSESSMENT     │──────────┘ handoff back
    │    │     AGENT      │
    │    └────────────────┘
    │
    ▼
  RESPONSE
  via Twilio
```

**Key:** Handoffs are seamless (user doesn't see agent changes)

---

## User Journey Phases (Visual)

### 5 Phases with Transitions

```
┌──────────────────────────────────────────────────────────────────┐
│ USER JOURNEY PROGRESSION                                         │
└──────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌────────────────┐
│  1. DISCOVERY  │ ← First text, profile setup
└───┬────────────┘
    │ Complete profile
    ▼
┌────────────────┐
│ 2. ASSESSMENT  │ ← Taking wellness assessments
└───┬────────────┘
    │ Get burnout score
    ▼
┌────────────────┐
│ 3. ACTIVE USE  │ ← Regular conversations, interventions
└───┬────────────┘
    │ No texts for 7 days
    ▼
┌────────────────┐
│  4. DORMANT    │ ← Inactive but subscribed
└───┬────────────┘
    │ Cancel subscription
    ▼
┌────────────────┐
│  5. CHURNED    │ ← Unsubscribed
└────────────────┘
```

**Reactivation:** Dormant → Active (via check-in), Churned → Discovery (via re-signup)

---

## Rate Limiting Tiers (Visual)

### 5 Layers of Protection

```
┌──────────────────────────────────────────────────────────────────┐
│ RATE LIMIT HIERARCHY                                             │
└──────────────────────────────────────────────────────────────────┘

LAYER 1: Per-User Token Bucket
├─ 5 messages per minute
└─ Burst: 10 messages

LAYER 2: Per-User Daily Cap
├─ 100 messages per day
└─ Reset: 00:00 UTC

LAYER 3: Global Rate Limit
├─ 1,000 messages per minute (all users)
└─ Prevents infrastructure overload

LAYER 4: Subscription-Based
├─ Free tier: 10 messages/day
├─ Standard: 100 messages/day
└─ Premium: Unlimited

LAYER 5: Crisis Override
├─ Bypass limits for crisis keywords
└─ Always allow: "suicide", "hurt", "911"
```

---

## Proactive Messaging Tiers (Visual)

### 3-Tier System

```
┌──────────────────────────────────────────────────────────────────┐
│ PROACTIVE MESSAGING SCHEDULE                                     │
└──────────────────────────────────────────────────────────────────┘

TIER 1: WELLNESS CHECK-INS (All users)
┌─────────────────────────────────────────┐
│ Frequency: Every 7 days                 │
│ Content: "How are you doing this week?" │
│ Goal: Maintain engagement               │
└─────────────────────────────────────────┘

TIER 2: HIGH-RISK FOLLOW-UPS (Burnout 60+)
┌─────────────────────────────────────────┐
│ Frequency: Every 3 days                 │
│ Content: "Check on coping strategies"   │
│ Goal: Prevent crisis escalation         │
└─────────────────────────────────────────┘

TIER 3: CRISIS FOLLOW-UPS (Burnout 80+)
┌─────────────────────────────────────────┐
│ Frequency: Every 24 hours               │
│ Content: "Urgent check-in"              │
│ Goal: Ensure safety                     │
└─────────────────────────────────────────┘
```

---

## Complete System Flow (Visual)

### End-to-End Journey

```
┌──────────────────────────────────────────────────────────────────┐
│ COMPLETE GIVECARE SYSTEM FLOW                                    │
└──────────────────────────────────────────────────────────────────┘

1. USER TEXTS → +1 (XXX) XXX-XXXX
              │
              ▼
2. TWILIO RECEIVES SMS
              │
              ▼
3. WEBHOOK → convex/http.ts /twilio/sms
              │
              ▼
4. SUBSCRIPTION CHECK
       │          │
   NOT SUBSCRIBED │ SUBSCRIBED
       │          │
       ▼          ▼
   SIGNUP LINK   5. RATE LIMIT CHECK
                    │          │
                LIMIT HIT      OK
                    │          │
                    ▼          ▼
                QUEUE MSG   6. AGENT SELECTION
                               │    │    │
                            MAIN CRISIS ASSESSMENT
                               │    │    │
                               └────┼────┘
                                    ▼
                            7. AGENT EXECUTES
                                    │
                                    ▼
                            8. RESPONSE GENERATED
                                    │
                                    ▼
                            9. DB LOGGING
                               │    │
                       CONVERSATION WELLNESS
                               │    │
                               └────┘
                                    ▼
                            10. SMS SENT VIA TWILIO
                                    │
                                    ▼
                            USER RECEIVES RESPONSE
```

---

## Database Schema (Visual)

### Core Tables

```
┌──────────────────────────────────────────────────────────────────┐
│ CONVEX DATABASE SCHEMA                                           │
└──────────────────────────────────────────────────────────────────┘

users
├─ _id
├─ phoneNumber (unique)
├─ fullName
├─ email
├─ journeyPhase
├─ burnoutScore
├─ burnoutBand
└─ subscriptionStatus

conversations
├─ _id
├─ userId (foreign key)
├─ role (user|agent|system)
├─ text
├─ mode (sms|web)
├─ messageSid
└─ timestamp

assessments
├─ _id
├─ userId (foreign key)
├─ type (ema|cwbs|reach-ii|sdoh)
├─ questions (array)
├─ answers (array)
├─ score
└─ completedAt

wellness_scores
├─ _id
├─ userId (foreign key)
├─ compositeScore
├─ band
├─ confidence
├─ pressureZone
├─ pressureZoneScores (breakdown)
└─ calculatedAt

interventions
├─ _id
├─ userId (foreign key)
├─ pressureZone
├─ strategy
├─ description
└─ suggestedAt
```

---

**End of Visual Reference**
