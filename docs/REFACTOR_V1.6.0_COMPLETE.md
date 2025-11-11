# GiveCare v1.6.0 Refactor: Feedback Loop Architecture

**Date:** 2025-01-14  
**Status:** ✅ Complete  
**Version:** 1.6.0

---

## Executive Summary

This document consolidates all planning, implementation, and analysis documentation for the v1.6.0 refactor that transformed GiveCare from a linear/reactive system into a recursive feedback loop architecture.

**What Changed:**
- Assessment completion now automatically creates scores
- Scores trigger adaptive check-in scheduling
- Proactive check-ins send EMA questions
- SDOH assessments enrich user profiles
- Automatic intervention suggestions after assessments
- Trend detection triggers proactive support
- Engagement monitoring re-engages silent users

**Result:** True nested feedback loops with minimal upheaval, no schema changes, everything uses existing infrastructure.

---

## Table of Contents

1. [Feature Requirements & Goals](#feature-requirements--goals)
2. [Feature Specification](#feature-specification)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Implementation Plan](#implementation-plan)
5. [Code Impact Analysis](#code-impact-analysis)
6. [Nested Loops Architecture](#nested-loops-architecture)
7. [DSPy Integration (Future)](#dspy-integration-future)

---

## Feature Requirements & Goals

**Source:** `FEATURE_REQUIREMENTS.md`

### Core Features Status

✅ **Fully Implemented:**
- Progressive onboarding
- Burnout score system (scoring logic)
- EMA + Episodic assessments (EMA, CWBS, REACH-II, SDOH)
- Google Maps resource search
- Memory system
- Crisis detection
- Multi-agent system
- Intervention matching

⚠️ **Partially Implemented:**
- Assessment question flow (scoring works, auto-asking now added)
- Conversation summarization (Agent Component handles)
- Intervention tracking (preferences now tracked)
- Resource matching (SDOH data now used)

❌ **Not Implemented (Before Refactor):**
- Automatic score creation → ✅ **NOW IMPLEMENTED**
- Score-based scheduling → ✅ **NOW IMPLEMENTED**
- Proactive check-ins → ✅ **NOW IMPLEMENTED**
- Engagement monitoring → ✅ **NOW IMPLEMENTED**
- SDOH profile extraction → ✅ **NOW IMPLEMENTED**
- Intervention preferences → ✅ **NOW IMPLEMENTED**
- Trend detection → ✅ **NOW IMPLEMENTED**

### Critical Gap Identified

**Before:** The whole app is a feedback loop conceptually, but NOT designed that way in code.

**After:** True feedback loops implemented:
- Assessment → Score → Scheduling → Check-ins → EMA → Score → [LOOP]
- SDOH → Profile → Better matching → Interventions → Preferences → [LOOP]
- Trend detection → Proactive support → Score improvement → [LOOP]
- Engagement monitoring → Re-engagement → Activity → [LOOP]

---

## Feature Specification

**Source:** `FEATURE_SPEC.md`

### Scope: This is a REFACTOR, Not a Start-Over

**Why Refactor (Not Start Over):**
- ~60% fully implemented (foundation is solid)
- ~27% partially implemented (mostly connections missing)
- ~13% not implemented (mostly connections, not core features)

**Key Insight:** Most missing pieces are **connections between existing features**, not new core features.

### Implementation Phases

**Phase 1 (P0): Core Feedback Loop**
1. ✅ Create score when assessment finalized
2. ✅ Score → Adaptive check-in schedule
3. ✅ Proactive check-ins dispatcher
4. ✅ EMA → Score pipeline (fast-path)

**Phase 2 (P1): Enhanced Matching & Proactive Support**
5. ✅ SDOH answers → Profile enrichment
6. ✅ Automatic intervention suggestions after assessments
7. ✅ Trend detection → Proactive suggestions
8. ✅ Intervention preferences tracking
9. ✅ Engagement monitoring → Nudge

**Phase 3 (P1→P2): UX/Flow Polish**
10. ✅ Assessment agent Q&A flow

---

## Architecture Diagrams

**Source:** `ARCHITECTURE_DIAGRAMS.md`

### User Flow (Before vs After)

**Before:** Linear flow
```
User → Assessment → Score → [STOPS]
```

**After:** Feedback loop
```
User → Assessment → Score → Scheduling → Check-ins → EMA → Score → [LOOP]
```

### Nested Feedback Loops

**Inner Loop (User-Facing):**
- Assessment → Score → Check-ins → EMA → Score Update → Trend Detection → Interventions → Effectiveness → Score → New Assessment → [LOOP CONTINUES]

**Outer Loop (System Improvement - Future DSPy):**
- User outcomes → Prompt optimization → Better responses → Improved outcomes → [LOOP CONTINUES]

---

## Implementation Plan

**Source:** `REFACTOR_PLAN_CONSOLIDATED.md` + `IMPLEMENTATION_ROADMAP.md`

### Implementation Order

1. **Phase 1.1** - Score creation (unblocks everything)
2. **Phase 1.2** - Scheduling (enables check-ins)
3. **Phase 1.3** - Check-ins dispatcher (makes it real)
4. **Phase 1.4** - EMA fast-path (improves UX)
5. **Phase 2.5** - SDOH profile (enriches matching)
6. **Phase 2.6** - Auto interventions (closes loop)
7. **Phase 2.7** - Trend detection (proactive)
8. **Phase 2.8** - Preferences (personalization)
9. **Phase 2.9** - Engagement (retention)
10. **Phase 3.10** - Assessment Q&A (UX polish)

### Convex Patterns Verification

**Source:** `CONVEX_PATTERNS_VERIFICATION.md`

All implementations follow Convex idiomatic patterns:
- ✅ Workflows for multi-step processes
- ✅ Cron jobs for scheduled tasks
- ✅ Internal mutations for server-side operations
- ✅ No schema changes (uses existing tables)
- ✅ Idempotent operations
- ✅ Proper error handling

---

## Code Impact Analysis

**Source:** `CODE_IMPACT_ANALYSIS.md`

### File Count
- **Before:** ~43 files
- **After:** ~50 files
- **Change:** +7 files (+16%)

### LOC Count
- **Before:** ~7,200 LOC
- **After:** ~8,445 LOC
- **Change:** +1,245 LOC (+17%)

### Code Quality Improvements
- ✅ Better organization (features connected via workflows)
- ✅ Less duplication (centralized scoring logic)
- ✅ Easier maintenance (changes localized to workflows)
- ✅ Clearer architecture (one pattern vs many)

### Files Created (7)
- `convex/workflows/scheduling.ts` (124 LOC)
- `convex/workflows/checkIns.ts` (119 LOC)
- `convex/workflows/interventions.ts` (118 LOC)
- `convex/workflows/trends.ts` (77 LOC)
- `convex/workflows/engagement.ts` (77 LOC)
- `convex/lib/zones.ts` (48 LOC)
- `convex/tools/trackInterventionPreference.ts` (35 LOC)

### Files Modified (10)
- `convex/lib/assessmentCatalog.ts`
- `convex/assessments.ts`
- `convex/inbound.ts`
- `convex/crons.ts`
- `convex/internal.ts`
- `convex/interventions.ts`
- `convex/agents/main.ts`
- `convex/agents/assessment.ts`
- `convex/lib/profile.ts`
- `package.json`

---

## Nested Loops Architecture

**Source:** `NESTED_LOOPS_ARCHITECTURE.md`

### Inner Loop: User Feedback Loop (Implemented)

**What:** Adapts to individual user needs in real-time
- Assessment → Score → Scheduling → Check-ins → EMA → Score → [LOOP]

**Data Generated:**
- User scores over time
- Intervention effectiveness
- User preferences
- Engagement patterns

### Outer Loop: System Improvement Loop (Future DSPy)

**What:** Optimizes system-wide performance over time
- User outcomes → Prompt optimization → Better responses → Improved outcomes → [LOOP]

**Data Required:**
- Outcome metrics (score improvements, engagement rates)
- User satisfaction signals
- Intervention effectiveness data

**Implementation:** DSPy/Ax-LLM with GEPA optimizer (multi-objective optimization)

### Recursive Nature

The inner loop generates outcome data that feeds the outer loop's optimization, and the outer loop's improvements lead to better inner loop outcomes.

**Example:**
1. Inner loop: User completes assessment → Gets interventions → Scores improve
2. Outer loop: System learns which interventions work best → Optimizes prompts → Better suggestions
3. Inner loop: Better suggestions → Better outcomes → More data
4. Outer loop: More data → Better optimization → [CONTINUES]

---

## DSPy Integration (Future)

**Source:** `DSPY_ROLE_AND_IMPACT.md`

### Role

DSPy/Ax-LLM will optimize prompts based on real outcome data from the feedback loops.

### Expected Impact

- **Token Cost:** 10-20% reduction via prompt optimization
- **Quality:** 15-25% improvement in intervention matching
- **Compliance:** Better adherence to trauma-informed principles
- **SMS Length:** More concise responses (target: <150 chars)

### Optimizer Choice: GEPA

**Why GEPA (Pareto Frontier Optimization):**
- Multi-objective optimization (quality, cost, compliance, SMS length, response time)
- Finds optimal trade-offs between competing goals
- Better than MIPRO (single-objective) or ACE (complex context loops)

### Implementation Timeline

**Phase 1:** Refactor (Weeks 1-4) - ✅ **COMPLETE**
- Build feedback loops
- Collect outcome data

**Phase 2:** DSPy Integration (Weeks 5-6) - ⏳ **FUTURE**
- Install Ax-LLM
- Set up GEPA optimizer
- Define optimization objectives
- Run optimization cycles

**Why Sequential:**
DSPy needs real outcome data from the refactor's feedback loops to optimize effectively.

---

## What You'll See After This Refactor

✅ Completing any assessment → creates score → schedules check-ins → users receive EMA prompts → replies feed new scores → scheduling adapts (inner loop)

✅ SDOH enriches profile → completions auto-suggest interventions → trend drops trigger support (middle/outer loops)

✅ Preferences prevent bad suggestions → engagement monitoring brings back silent users

**Result:** True nested feedback loops with minimal upheaval, no schema changes, everything uses existing infrastructure.

---

## Testing Checklist

1. ✅ Test score creation: Complete assessment → verify scores table record
2. ✅ Test scheduling: Verify triggers created/updated after score creation
3. ✅ Test check-ins: Verify EMA questions sent at scheduled times
4. ✅ Test fast-path: Send numeric reply → verify instant response
5. ✅ Test SDOH enrichment: Complete SDOH → verify profile fields updated
6. ✅ Test intervention suggestions: Complete assessment → verify SMS sent
7. ✅ Test trend detection: Create declining scores → verify proactive suggestions
8. ✅ Test preferences: Like/dislike intervention → verify filtering works
9. ✅ Test engagement: Wait 7 days → verify re-engagement message

---

## Migration Notes

1. Run `pnpm install` to install `luxon` dependency
2. Run `npx convex dev` to generate types and deploy
3. Existing assessments will not have scores (historical data)
4. New assessments will automatically create scores
5. Check-in schedules will be created on next assessment completion
6. Cron jobs will start running automatically after deployment

---

## Known Limitations

1. **Historical Scores:** Existing assessments don't have scores (only new completions)
2. **Timezone Defaults:** Uses 'America/New_York' if user timezone not set
3. **Check-in Frequency:** Fixed thresholds (72/45) - could be made configurable
4. **Trend Detection:** Simple comparison (latest vs previous) - could use moving averages
5. **Engagement Window:** Fixed 7-day window - could be adaptive

---

## Next Steps

- Monitor cron job execution and workflow completion rates
- Collect user feedback on intervention suggestions
- Analyze trend detection accuracy
- Optimize check-in frequency thresholds based on user engagement
- Consider adaptive engagement windows based on user patterns
- Plan DSPy integration once sufficient outcome data is collected

---

## Related Documentation

- **CHANGELOG.md** - Detailed version history and changes
- **give-care-app/docs/ARCHITECTURE.md** - System architecture reference
- **give-care-app/docs/FEATURES.md** - Feature documentation

---

**Last Updated:** 2025-01-14  
**Status:** ✅ Refactor Complete, Ready for Production

