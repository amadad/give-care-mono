# GiveCare - Product Features

**Audience**: Product managers, sales, investors, stakeholders
**Version**: 0.8.3 | **Last Updated**: 2025-10-22

---

## Value Proposition

**AI-powered SMS caregiving support** that predicts burnout, prevents churn, and personalizes engagement—delivering 24/7 clinical-grade wellness monitoring with zero app downloads.

**One conversation. Three specialists. Infinite memory.**

---

## Quick Reference

| Category | Key Features | Status |
|----------|-------------|--------|
| **Core Platform** | Multi-agent AI, Clinical assessments, Resource matching | ✅ Production |
| **Intelligence Layer** ⭐ | Personalized schedules, Working memory, Engagement monitoring, Feedback tracking | ✅ Production |
| **Safety & Scale** | Guardrails, Proactive check-ins, Admin dashboard, HIPAA logging | ✅ Production |
| **Business** | Transparent pricing, Rate limits, Stripe integration | ✅ Production |

⭐ = OpenPoke Intelligence Features (v0.8.0-0.8.3)

---

## Core Platform Features

### 1. Multi-Agent AI System ✅

**User Benefit**: *One conversation, three specialists—no app switching*

**How It Works**:
- 3 AI agents work together invisibly (Main, Crisis, Assessment)
- Seamless handoffs (user never notices agent changes)
- ~900ms response time (50% faster than competitors)
- GPT-5 nano with minimal reasoning (cost-optimized)

**User Experience**:
> "Feels like talking to one caring person who remembers everything"

---

### 2. Clinical Wellness Measurement ✅

**User Benefit**: *Track your burnout like tracking blood pressure*

**4 Validated Assessments**:

| Tool | Questions | Duration | When | Validated |
|------|-----------|----------|------|-----------|
| Daily Check-In (EMA) | 3 | 30 sec | Daily | ✓ Clinical trial |
| Well-Being (CWBS) | 12 | 3 min | Weekly | ✓ Tebb et al. 1999 |
| Stress & Coping (REACH-II) | 10 | 3 min | Biweekly | ✓ Belle et al. 2006 |
| Needs Screening (SDOH) | 28 | 5 min | Monthly | ✓ Public health |

**Your Burnout Score (0-100)**:
- Higher = Healthier (inverse of distress)
- 5 Wellness Bands: Crisis (0-19) → Thriving (80-100)
- Confidence Score: Shows data quality (0-1)

---

### 3. Smart Resource Matching ✅

**User Benefit**: *Get help for YOUR specific struggles*

**5 Pressure Zones**:
1. **Emotional Well-being** → Mindfulness, crisis support
2. **Physical Health** → Respite care, sleep hygiene
3. **Social Support** → Support groups, community
4. **Financial Concerns** → Assistance programs, budgeting
5. **Time Management** → Task prioritization, delegation

**5 Evidence-Based Strategies** (expanding to 15 in Q1 2026): Matched to your top 2-3 pressure zones
**Real-Time Resources**: Local support groups, respite care, financial aid

---

### 4. Trauma-Informed Design ✅

**User Benefit**: *No judgment, no pressure—just understanding*

**6 Core Principles**:
- **P1**: Warmth & validation in every message
- **P2**: Never asks same question twice
- **P3**: Max 2 attempts, then 24-hour cooldown
- **P4**: Soft confirmations ("When you're ready...")
- **P5**: Immediate crisis detection (<20ms)
- **P6**: Culturally sensitive, inclusive language

---

### 5. SMS-First Platform ✅

**User Benefit**: *Works on ANY phone—no app required*

- Text a number, start chatting (no sign-up)
- Works on flip phones (no smartphone needed)
- RCS-ready (rich media when available)
- Offline-friendly (SMS fallback)

---

## Intelligence Layer ⭐ NEW

### 6. Personalized Check-In Schedules ⭐

**User Benefit**: *Get reminders when YOU want them*

**Examples**:
- "Every Monday/Wednesday at 7pm ET"
- "Daily at 9am Pacific"
- "Every other day at noon"

**Key Features**:
- All US timezones supported
- DST-aware (no missed reminders)
- Easy changes via SMS ("Change to 8am")
- RRULE-based (RFC 5545 standard)

**Expected Impact**: 2x engagement increase

---

### 7. Working Memory System ⭐

**User Benefit**: *We remember what matters to you*

**What We Remember**:
- **Care Routines**: "John prefers morning baths at 9am"
- **Preferences**: "Yoga reduces my stress by 30%"
- **Crisis Triggers**: "Insurance paperwork overwhelms me"
- **What Works**: "Respite care helped last month"

**Smart Features**:
- Importance scoring (1-10)
- Access tracking for analytics
- Never forget critical details

**Expected Impact**: 50% reduction in repeated questions

---

### 8. Engagement Monitoring ⭐

**User Benefit**: *We notice when you're struggling*

**3 Warning Signs**:
1. **Sudden Drop**: Active → silent in 24h
2. **Crisis Burst**: 3+ stress signals in 6 hours
3. **Worsening Trend**: 4 consecutive declining scores

**What Happens**:
- Proactive SMS check-in
- Admin alert for human follow-up
- Early intervention before crisis

**Expected Impact**: 20-30% churn reduction

---

### 9. Conversation Summarization ⭐

**User Benefit**: *Infinite memory—we never forget your story*

**How It Works**:
- Recent (<7 days): Full detail
- Historical (>7 days): Compressed summaries
- Critical facts: Never compressed

**Benefits**:
- Pick up where you left off (even after months)
- Never starts over
- 60-80% token cost savings (passed to you)

**Expected Impact**: $2-5/month savings at 1,000 users

---

### 10. Passive Feedback Collection ⭐

**User Benefit**: *We learn from every conversation—without asking*

**How It Works**:
- **6 Signal Types**: Gratitude, frustration, confusion, re-ask, follow-up, tool success
- **Zero User Burden**: No "was this helpful?" prompts
- **Pattern Detection**: Automatic sentiment analysis from natural responses
- **Engagement Scoring**: Timing-based and content-based quality signals

**Examples**:
- "Thank you!" → Gratitude signal (1.0 helpfulness)
- "Never mind" → Frustration signal (0.0 helpfulness)
- Quick response → High engagement score
- Repeat question → Re-ask signal (needs improvement)

**Training Data Export**: OpenAI fine-tuning format ready

**Expected Impact**: Continuous model improvement, 20-30% better responses over time

---

### 11. Semantic Resource Search 🚧

**User Benefit**: *Resources that match what you MEAN*

**Example**:
"I'm exhausted" → Understands = physical health + emotional support

**Smart Ranking**: 70% similarity + 30% relevance to your zones

**Expected Impact**: 40% better relevance

**Status**: Infrastructure ready, integration pending

---

## Safety & Performance

### Safety Guardrails ✅
- **Crisis Detection**: 988/741741 in <600ms
- **Spam Protection**: Token bucket algorithm
- **Medical Advice Blocking**: No diagnosis/prescriptions
- **P1-P6 Compliance**: Trauma-informed enforcement
- **HIPAA-Compliant Logging**: Phone hashing, message redaction, zero PII leaks

### Proactive Check-Ins ✅
- **Crisis Band**: Daily → Weekly (7-35 days)
- **High Stress**: Every 3 days
- **Moderate**: Weekly
- **Dormant Users**: Days 7, 14, 30 (then stop)

### Performance ✅
- **Response Time**: ~900ms average (p95 <1000ms)
- **Uptime**: 99.95% (Convex SLA)
- **Auto-Scaling**: 10,000+ concurrent users
- **Cost**: $1.52/user at scale (10K users)

### Quality Assurance ✅
- **235 passing tests** (100% critical coverage)
- **TDD workflow** (tests written first)
- **Zero data loss** (all bugs caught)
- **Strict TypeScript** (type-safe)

---

## Business Features

### Pricing ✅
- **Monthly**: $9.99/month (less than 2 coffees)
- **Annual**: $99/year (save $20)
- **Free Trial**: 7 days full access
- **15 Promo Codes**: CAREGIVER50, MEDICAID, VETERAN, etc.

### Rate Limiting ✅
- **Per-User**: 10 SMS/day
- **Assessments**: 3/day
- **Cost Protection**: $1,200/day cap (prevents overages)

### Admin Dashboard ✅
**Live**: https://dash.givecareapp.com

Features:
- Real-time user monitoring
- Wellness trend charts
- Conversation logs
- Alert system (engagement, crisis, decline)
- Analytics (response times, token usage)

---

## Competitive Advantage

| Feature | GiveCare | Cariloop | Wellthy | CaringBridge |
|---------|----------|----------|---------|--------------|
| **AI-Powered** | ✅ Multi-agent | ❌ Human | ❌ Human | ❌ Community |
| **SMS-First** | ✅ No app | ❌ App req'd | ❌ App req'd | ❌ Web only |
| **Clinical Tools** | ✅ 4 validated | ❌ None | ❌ None | ❌ None |
| **Working Memory** ⭐ | ✅ Remembers | ❌ Notes | ❌ Notes | ❌ None |
| **Engagement Monitoring** ⭐ | ✅ Churn prevention | ❌ None | ❌ None | ❌ None |
| **Custom Schedules** ⭐ | ✅ Your timezone | ❌ Fixed 9am | ❌ Business hours | ❌ None |
| **Infinite Memory** ⭐ | ✅ 60-80% savings | ❌ Session-based | ❌ Session-based | ❌ None |
| **Passive Feedback** ⭐ | ✅ Auto-learns | ❌ Manual surveys | ❌ Manual surveys | ❌ None |
| **HIPAA Compliance** ⭐ | ✅ Certified logging | ❓ Unknown | ❓ Unknown | ❌ None |
| **Response Time** | ✅ ~900ms | ❌ 24-48h | ❌ 24-48h | ❌ N/A |
| **Pricing** | ✅ $9.99/mo | ❌ $150+/mo | ❌ $200+/mo | ✅ Free (limited) |
| **24/7** | ✅ Always on | ❌ Business hours | ❌ Business hours | ✅ Community |

⭐ = GiveCare's Unique Intelligence Features

---

## User Benefits Summary

### For Caregivers

**Core Promise**:
1. Know your stress level (burnout score 0-100)
2. Get resources that match YOUR struggles
3. Instant crisis support (988/741741)
4. Works on any phone (no app)
5. Affordable ($9.99/month)

**Intelligence Layer** ⭐:
6. Reminders when YOU want them
7. We remember everything important
8. We notice when you're struggling
9. Never starts over (infinite memory)
10. We learn from every conversation (no surveys)

### For Healthcare Systems

**ROI Metrics**:
- 20-30% churn reduction (engagement monitoring)
- 50% fewer repeated questions (working memory)
- 2x engagement increase (personalized schedules)
- 60-80% token cost reduction (summarization)
- 20-30% better responses over time (passive feedback)
- 100% HIPAA compliant (no PII leaks)
- $1.52/user at scale (10,000 users)

---

## Key Metrics (v0.8.3)

### Performance
- Response Time: ~900ms avg (p95 <1s)
- Uptime: 99.95% SLA
- Test Coverage: 235 passing tests
- Zero PII leaks (HIPAA-compliant logging)

### Clinical
- 4 assessments (53 total questions)
- 5 pressure zones
- 20 evidence-based interventions

### AI System
- 3 specialized agents
- 8 agent tools (added: recordMemory, findLocalResources)
- GPT-5 nano (cost-optimized)
- Continuous learning (passive feedback)

### Database
- 19 tables (added: feedback), 20 indexes
- Real-time subscriptions
- <50ms query latency

### Cost
- $1.52/user at 10K users
- Twilio: $1.50, OpenAI: $0.02, Convex: $0.0025

---

## Coming Soon 🔮

**Enhanced Communication**: RCS rich media, voice calls, multi-channel
**Collaborative Caregiving**: Family portal, care team coordination
**Advanced Analytics**: Predictive models, multi-language, A/B testing

---

**⭐ = OpenPoke Intelligence Features (v0.8.0-0.8.3)**

**Latest Updates (v0.8.3 - 2025-10-22)**:
- ✅ Passive feedback collection (6 signal types, zero user burden)
- ✅ HIPAA-compliant logging (phone hashing, message redaction)
- ✅ 6 critical security fixes (data integrity, PII protection)
- ✅ Google Maps Grounding integration (local resource search)

For detailed technical documentation, see:
- Architecture: `ARCHITECTURE.md`
- Taxonomy: `TAXONOMY.md`
- Assessments: `ASSESSMENTS.md`
- Changelog: `CHANGELOG.md`
