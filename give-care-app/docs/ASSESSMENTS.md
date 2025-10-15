# Clinical Assessments Reference

**Version**: 0.2.0
**Last Updated**: 2025-10-09

Complete reference for all clinical assessments used in GiveCare.

---

## Overview

GiveCare uses **4 validated clinical tools** to measure caregiver wellness:

| Assessment | Type | Questions | Duration | Frequency | Evidence Level |
|------------|------|-----------|----------|-----------|----------------|
| **EMA** | Daily pulse check | 3 | ~30 sec | Daily | Clinical trial |
| **CWBS** | Activities & needs | 12 | ~3 min | Biweekly | Clinical trial (Tebb et al. 1999, 2012) |
| **REACH-II** | Stress & coping | 10 | ~3 min | Monthly | Clinical trial (NIH) |
| **SDOH** | Social needs | 28 | ~5 min | Quarterly | Expert consensus (GC-SDOH-28) |

**Source**: `src/assessmentTools.ts`

---

## 1. EMA (Ecological Momentary Assessment)

### Purpose
Quick daily check-in to capture **moment-to-moment** wellness fluctuations.

**Theory**: Caregiver stress varies day-to-day. Daily EMAs detect patterns (e.g., Mondays worse than weekends) and early warning signs (3+ days of low scores).

### Questions

**Reduced to 3 questions for daily use** (lower friction, higher completion rates):

| # | Question | Scale | Subscale | Reverse Scored |
|---|----------|-------|----------|----------------|
| 1 | "How are you feeling right now?" | 1-5 | `mood` | No |
| 2 | "How overwhelming does caregiving feel today?" | 1-5 | `burden` | Yes |
| 3 | "How stressed do you feel right now?" | 1-5 | `stress` | Yes |

**Removed**: Support and sleep questions (can be assessed in longer CWBS)

**Source**: `src/assessmentTools.ts:45-81`

### Scoring

```typescript
// src/assessmentTools.ts:538-546
1. Collect responses (1-5 for each question)
2. Reverse score questions 2 and 3:
   reversed_score = scale + 1 - original_score
   Example: User says "5" (extremely overwhelming) → 5 + 1 - 5 = 1 (low wellness)
3. Normalize to 0-100:
   normalized = ((score - 1) / (scale - 1)) * 100
   Example: score=4, scale=5 → ((4-1) / (5-1)) * 100 = 75
4. Average all 3 normalized scores
```

**Example Calculation**:
```
User responses: [4, 2, 3]
  1. mood=4 (feeling good)
  2. burden=2 (a little overwhelming) → REVERSE → 5+1-2 = 4 (after reverse)
  3. stress=3 (moderate stress) → REVERSE → 5+1-3 = 3 (after reverse)

After reverse: [4, 4, 3]
Normalized: [75, 75, 50]
Average: (75+75+50) / 3 = 66.67/100

Band: "mild" (60-79 range)
```

### Subscales

| Subscale | Questions | What It Measures |
|----------|-----------|------------------|
| `mood` | 1 | Current emotional state |
| `burden` | 2 | Caregiving overwhelm |
| `stress` | 3 | Perceived stress level |

**Note**: Support and self-care are assessed in the more comprehensive CWBS.

### Delivery Timing

- **First EMA**: Day 1 after profile complete
- **Daily**: Sent at 9am user's local time (future: learn optimal time)
- **Skip logic**: If user doesn't respond for 3 days, pause and send check-in message

---

## 2. CWBS (Caregiver Well-Being Scale)

### Purpose
Validated measure of **caregiving activities** and **unmet needs**.

**Evidence**: Tebb, S., Berg-Weger, M., & Rubio, D. M. (1999, 2012). Caregiver Well-Being Scale. *Journal of Gerontological Social Work*.

**Theory**: Caregiving burden comes from both **what you do** (activities) and **what you lack** (needs). Subscale scores identify where support is needed most.

### Part I: Activities (8 items)

Scale: **1 = Rarely, 5 = Usually**

| # | Question | What It Measures |
|---|----------|------------------|
| 1 | "Buying food" | Meal planning/shopping |
| 2 | "Taking care of personal daily activities (meals, hygiene, laundry)" | ADLs (Activities of Daily Living) |
| 3 | "Making sure medications are taken" | Medication management |
| 4 | "Managing financial affairs" | Financial caregiving |
| 5 | "Arranging for services or medical appointments" | Care coordination |
| 6 | "Checking in and making sure they are ok" | Monitoring/supervision |
| 7 | "Providing transportation" | Mobility support |
| 8 | "Assisting with bathing and dressing" | IADLs (Instrumental ADLs) |

**Subscale**: `activities`

**Source**: `src/assessmentTools.ts:103-159`

### Part II: Needs (4 items)

Scale: **1 = Rarely, 5 = Usually** (reverse scored - higher need = lower wellness)

| # | Question | What It Measures |
|---|----------|------------------|
| 9 | "I need a break from caregiving" | Respite need |
| 10 | "I need help managing daily caregiving responsibilities" | Task support need |
| 11 | "I need help coordinating all aspects of care" | Care coordination need |
| 12 | "I need information about caregiving and available resources" | Educational need |

**Subscale**: `needs` (reverse scored)

**Source**: `src/assessmentTools.ts:161-192`

### Scoring

```typescript
// src/assessmentTools.ts:538-573
1. Part I (Activities):
   - Normalize each response: ((score - 1) / 4) * 100
   - Average all 8 → activities_subscore

2. Part II (Needs):
   - REVERSE SCORE: reversed = 5 + 1 - original
     Example: "I need a break" = 5 (always) → 6-5 = 1 (low wellness)
   - Normalize: ((reversed - 1) / 4) * 100
   - Average all 4 → needs_subscore

3. Overall score:
   - Average of activities_subscore and needs_subscore
```

**Interpretation**:
- **High activities score** (e.g., 80): Doing many tasks (potential burnout risk)
- **Low needs score** (e.g., 30): High unmet needs (respite, help, info)
- **Combined low score**: High burden + high needs = crisis

### Delivery Timing

- **Baseline**: Week 1 (after first 3 EMAs)
- **Biweekly**: Every 14 days
- **Ad-hoc**: If EMA scores drop 20+ points for 3 consecutive days

---

## 3. REACH-II (Resources for Enhancing Alzheimer's Caregiver Health)

### Purpose
Evidence-based assessment of **caregiver stress** and **coping strategies**.

**Evidence**: Belle, S. H., et al. (2006). Enhancing the Quality of Life of Dementia Caregivers from Different Ethnic or Racial Groups: A Randomized, Controlled Trial. *Annals of Internal Medicine*, 145(10), 727-738. [NIH-funded multi-site trial]

**Theory**: Stress comes from multiple domains (emotional, physical, social). Effective interventions must address specific domains, not just "reduce stress" generically.

### Questions by Subscale

**Source**: `src/assessmentTools.ts:202-287`

#### Stress (1 item)
| # | Question | Scale |
|---|----------|-------|
| 1 | "In the past week, how often have you felt overwhelmed?" | 1=never, 5=always (reverse) |

#### Self-Care (3 items)
| # | Question | Scale |
|---|----------|-------|
| 2 | "How often do you feel you have enough time for yourself?" | 1=never, 5=always |
| 9 | "How often do you engage in activities you enjoy?" | 1=never, 5=always |
| 10 | "How well are you managing your own health needs?" | 1=very poorly, 5=very well |

#### Social Isolation (1 item)
| # | Question | Scale |
|---|----------|-------|
| 3 | "How often do you feel isolated or alone?" | 1=never, 5=always (reverse) |

#### Self-Efficacy (1 item)
| # | Question | Scale |
|---|----------|-------|
| 4 | "How confident are you in managing daily caregiving tasks?" | 1=not confident, 5=very confident |

#### Emotional Burden (2 items)
| # | Question | Scale |
|---|----------|-------|
| 5 | "How often do you feel frustrated or angry about caregiving?" | 1=never, 5=always (reverse) |
| 8 | "How often do you feel guilty about needing help?" | 1=never, 5=always (reverse) |

#### Physical Exhaustion (1 item)
| # | Question | Scale |
|---|----------|-------|
| 6 | "How often do you feel physically exhausted?" | 1=never, 5=always (reverse) |

#### Social Support (1 item)
| # | Question | Scale |
|---|----------|-------|
| 7 | "How satisfied are you with your support network?" | 1=very dissatisfied, 5=very satisfied |

### Scoring

```typescript
// Subscale averaging, then composite
1. For each question:
   - Reverse score if needed (questions 1, 3, 5, 6, 8)
   - Normalize to 0-100
2. Average by subscale
3. Overall score = average of all 7 subscale scores

Example:
  stress_subscore = 40 (high stress)
  self_care_subscore = 30 (poor self-care)
  social_subscore = 60 (moderate isolation)
  efficacy_subscore = 70 (confident)
  emotional_subscore = 35 (high emotional burden)
  physical_subscore = 25 (exhausted)
  support_subscore = 50 (moderate support)

  Overall = (40+30+60+70+35+25+50) / 7 = 44 ("moderate" band)
```

### Pressure Zone Mapping

| Subscale | Maps to Pressure Zone |
|----------|----------------------|
| `stress` | `emotional` |
| `self_care` | `self_care` |
| `social` | `social_isolation` |
| `efficacy` | `caregiving_tasks` (inverse - low efficacy = high task pressure) |
| `emotional` | `emotional` |
| `physical` | `physical` |
| `support` | `social_needs` (inverse - low support = high need) |

### Delivery Timing

- **Baseline**: Month 1 (after 2 weeks of daily EMAs)
- **Monthly**: Every 30 days
- **Ad-hoc**: After crisis episode (recovery phase)

---

## 4. SDOH (Social Determinants of Health) - GC-SDOH-28

### Purpose
Comprehensive screening for **social needs** that impact caregiving capacity.

**Evidence**: Expert consensus + validated SDOH frameworks (PRAPARE, AHC HRSN, CMS Accountable Health Communities).

**Theory**: Health outcomes driven by non-medical factors (housing, food, transport, social support). Caregivers with unmet SDOH needs have 3x higher burnout risk.

### Domains & Questions

**Source**: `src/assessmentTools.ts:291-488`

#### Financial Strain (5 items)
| # | Question | Type |
|---|----------|------|
| 1 | "In the past year, have you worried about having enough money for food, housing, or utilities?" | Yes/No |
| 2 | "Do you currently have financial stress related to caregiving costs?" | Yes/No |
| 3 | "Have you had to reduce work hours or leave employment due to caregiving?" | Yes/No |
| 4 | "Do you have difficulty affording medications or medical care?" | Yes/No |
| 5 | "Are you worried about your long-term financial security?" | Yes/No |

**What triggers**: Yes to 2+ → `financial_strain` pressure zone

#### Housing Security (3 items)
| # | Question | Type |
|---|----------|------|
| 6 | "Is your current housing safe and adequate for caregiving needs?" | Yes/No (reverse) |
| 7 | "Have you considered moving due to caregiving demands?" | Yes/No |
| 8 | "Do you have accessibility concerns in your home (stairs, bathroom, etc.)?" | Yes/No |

**What triggers**: Yes to 2+ → `housing` pressure zone (future)

#### Transportation (3 items)
| # | Question | Type |
|---|----------|------|
| 9 | "Do you have reliable transportation to medical appointments?" | Yes/No (reverse) |
| 10 | "Is transportation cost a barrier to accessing services?" | Yes/No |
| 11 | "Do you have difficulty arranging transportation for your care recipient?" | Yes/No |

**What triggers**: Yes to 2+ → `transportation` pressure zone (future)

#### Social Support (5 items)
| # | Question | Type |
|---|----------|------|
| 12 | "Do you have someone you can ask for help with caregiving?" | Yes/No (reverse) |
| 13 | "Do you feel isolated from friends and family?" | Yes/No |
| 14 | "Are you part of a caregiver support group or community?" | Yes/No (reverse) |
| 15 | "Do you have trouble maintaining relationships due to caregiving?" | Yes/No |
| 16 | "Do you wish you had more emotional support?" | Yes/No |

**What triggers**: Yes to 3+ → `social_isolation` + `social_needs` pressure zones

#### Healthcare Access (4 items)
| # | Question | Type |
|---|----------|------|
| 17 | "Do you have health insurance for yourself?" | Yes/No (reverse) |
| 18 | "Have you delayed your own medical care due to caregiving?" | Yes/No |
| 19 | "Do you have a regular doctor or healthcare provider?" | Yes/No (reverse) |
| 20 | "Are you satisfied with the healthcare your care recipient receives?" | Yes/No (reverse) |

**What triggers**: Yes to 2+ → `healthcare` pressure zone (future)

#### Food Security (3 items)
| # | Question | Type |
|---|----------|------|
| 21 | "In the past month, did you worry about running out of food?" | Yes/No |
| 22 | "Have you had to skip meals due to lack of money?" | Yes/No |
| 23 | "Do you have access to healthy, nutritious food?" | Yes/No (reverse) |

**What triggers**: Yes to 1+ → `food` pressure zone (future) + crisis escalation

#### Legal/Administrative (3 items)
| # | Question | Type |
|---|----------|------|
| 24 | "Do you have legal documents in place (POA, advance directives)?" | Yes/No (reverse) |
| 25 | "Do you need help navigating insurance or benefits?" | Yes/No |
| 26 | "Are you concerned about future care planning?" | Yes/No |

**What triggers**: Yes to 2+ → `legal` pressure zone (future)

#### Technology Access (2 items)
| # | Question | Type |
|---|----------|------|
| 27 | "Do you have reliable internet access?" | Yes/No (reverse) |
| 28 | "Are you comfortable using technology for healthcare or support services?" | Yes/No (reverse) |

**What triggers**: No to both → limits RCS delivery, telehealth interventions

### Scoring

```typescript
// src/assessmentTools.ts:549-555
1. For each question:
   - Yes to problem = 100 (issue present)
   - No to problem = 0 (no issue)
   - Reverse score positive items (e.g., "Do you have insurance?" → Yes=0, No=100)

2. Average by domain (e.g., financial = average of Q1-Q5)
3. Overall score = average of all 8 domain scores

Example:
  Financial: [Yes, Yes, No, Yes, Yes] → [100, 100, 0, 100, 100] → avg = 80 (high strain)
  Housing: [No, No, No] → [100, 0, 0] → avg = 33 (moderate)
  ...
  Overall SDOH score = (80 + 33 + ...) / 8 = 52 (moderate needs)
```

### Delivery Timing

- **Baseline**: Month 2 (after 1 CWBS + 1 REACH-II)
- **Quarterly**: Every 90 days
- **Ad-hoc**: If user mentions financial/housing/food issues in conversation

---

## Assessment State Machine

### Flow (1 Question Per Turn)

**Source**: `src/tools.ts:77-109` (startAssessment), `src/tools.ts:111-229` (recordAssessmentAnswer)

```
1. Agent calls startAssessment(type='ema')
   → Sets context.assessmentInProgress = true
   → Sets context.assessmentType = 'ema'
   → Sets context.assessmentCurrentQuestion = 0
   → Returns: "Starting daily check-in. I'll ask you 5 quick questions..."

2. Agent asks Question 1: "How are you feeling right now? (1-5)"
   → User responds: "4"
   → Agent calls recordAssessmentAnswer(answer='4')
   → Stores context.assessmentResponses['ema_1'] = '4'
   → Increments context.assessmentCurrentQuestion = 1
   → Returns: "(2/5) How overwhelming does caregiving feel today? (1-5)"

3. Agent asks Question 2, 3, 4, 5 (same flow)

4. After Question 5:
   → Agent calls recordAssessmentAnswer(answer='3')
   → context.assessmentCurrentQuestion = 5 (>= 5 total questions)
   → Triggers scoring:
     a. Calculate assessment score (EMA)
     b. Calculate composite burnout score (EMA + historical)
     c. Update context.burnoutScore, burnoutBand, pressureZones
     d. Save to wellnessScores table
   → Sets context.assessmentInProgress = false
   → Returns: "✓ Assessment complete! Your wellness score: 70/100 (doing pretty well)"
```

### Skip Logic

Users can decline questions:

```
Agent: "(3/5) How stressed do you feel? (1-5)"
User: "I don't want to answer that"
Agent: recordAssessmentAnswer(answer='SKIPPED')
→ Stores 'SKIPPED' for ema_3
→ Scoring ignores SKIPPED responses (calculates average of answered only)
→ Continues to Question 4
```

**Minimum questions**:
- **EMA**: 3/5 required (60%)
- **CWBS**: 8/12 required (67%)
- **REACH-II**: 6/10 required (60%)
- **SDOH**: 20/28 required (71%)

If below threshold → assessment invalid, restart later.

---

## Scoring Algorithm Deep Dive

### Normalization (0-100 Scale)

All assessments normalized to 0-100 for consistency:

```typescript
// src/assessmentTools.ts:538-555

// Likert scales (1-5):
normalized = ((raw_score - 1) / (scale - 1)) * 100
  1 → 0
  2 → 25
  3 → 50
  4 → 75
  5 → 100

// Boolean (yes/no):
yes = 100 (issue present)
no = 0 (no issue)

// Reverse scoring (negative items):
reversed_score = scale + 1 - original_score
  Scale 1-5, user says 5 (bad) → 5+1-5 = 1 (normalized to 0)
  Scale 1-5, user says 1 (bad) → 5+1-1 = 5 (normalized to 100)
```

### Subscale Calculation

```typescript
// src/assessmentTools.ts:558-566
1. Group questions by subscale
   Example: EMA has 5 subscales (mood, burden, stress, support, self_care)

2. For each subscale:
   - Collect normalized scores for all questions in that subscale
   - Average them

   Example:
     REACH-II self_care subscale (Q2, Q9, Q10):
     Q2 = 50, Q9 = 75, Q10 = 50
     self_care_subscore = (50+75+50)/3 = 58
```

### Overall Score

```typescript
// src/assessmentTools.ts:569-573
1. Calculate all subscale scores
2. Average the subscales (NOT the raw questions)

Why subscale averaging?
  - Prevents domain bias (SDOH has 28 questions, EMA has 5)
  - Each domain weighted equally
  - Matches clinical research methods

Example:
  EMA subscores: {mood: 75, burden: 50, stress: 50, support: 100, self_care: 50}
  Overall = (75+50+50+100+50) / 5 = 65
```

### Composite Burnout Score

**Source**: `src/burnoutCalculator.ts`

Combines multiple assessments with weighting:

```typescript
// Weights (from clinical validation)
EMA: 0.3 (frequent, but lightweight)
CWBS: 0.25 (activities + needs balance)
REACH-II: 0.3 (stress domains)
SDOH: 0.15 (contextual, not direct burnout)

// Recency weighting
Recent assessment (< 7 days): 1.0x weight
1-2 weeks old: 0.8x weight
2-4 weeks old: 0.5x weight
> 4 weeks old: 0.2x weight (stale data)

// Confidence calculation
confidence = (total_questions_answered / total_questions_possible) * recency_factor
```

---

## Related Documentation

- [System Overview](./SYSTEM_OVERVIEW.md) - How assessments fit into user journey
- [Scoring Deep Dive](./SCORING.md) - Detailed burnout calculation algorithms
- [Intervention Matching](./INTERVENTIONS.md) - How scores map to resources
- [API Reference](./API.md) - startAssessment & recordAssessmentAnswer tools
