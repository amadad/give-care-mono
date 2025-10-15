# Dashboards & Evaluation Framework - Product Specification

**Version**: 0.6.0 | **Status**: Planning | **Created**: 2025-10-10 | **Updated**: 2025-10-10

---

## Overview

Expand give-care-type platform with **visibility, self-service, and quality assurance** through three interconnected systems:

1. **Admin Dashboard** - Real-time monitoring, user management, analytics
2. **User Dashboard** - Self-service portal for wellness tracking, interventions, profile management
3. **Evaluation Framework** - Automated quality measurement, GEPA prompt optimization

**Expected Impact:**
- **Admin**: 10x faster user management, real-time crisis visibility, data-driven decisions
- **User**: 5x increase in engagement (web + SMS), 80%+ intervention satisfaction
- **Evals**: Continuous quality improvement, empirical prompt optimization

---

## Task 3: Admin Dashboard

### **Priority**: 🔥 HIGH | **Estimated Time**: 2 weeks

### Product Requirements

**Purpose**: Provide admins with comprehensive visibility into system health, user behavior, and operational metrics.

**Target Users**: Platform administrators, clinical supervisors, operations team

**Key Features**:

1. **Real-Time Metrics Overview**
   - Total users, active users (7d), crisis alerts (24h)
   - Average burnout score, response time (p95), SMS usage
   - Auto-refresh every 30 seconds
   - Alert badges for critical thresholds

2. **User Management**
   - Searchable/filterable user table
   - Filters: journey phase, burnout band, subscription status, date range
   - Bulk actions: export CSV, send message, reset assessment
   - User detail view: wellness history, conversation logs, assessment results

3. **Crisis Management**
   - Real-time list of users in crisis band (burnout 80-100)
   - Recent crisis agent triggers (last 24h)
   - Pending 24hr follow-ups with countdown timers
   - One-click "send check-in" action

4. **Analytics & Insights**
   - Burnout score distribution (histogram)
   - User journey funnel (onboarding → active → maintenance → churned)
   - SMS volume trends (daily/weekly)
   - Agent performance (latency by service tier, token usage)
   - Intervention effectiveness (delivery count, avg rating)

5. **System Health Monitoring**
   - Rate limiter status (per-user quotas, global quotas)
   - OpenAI API usage (tokens consumed, cost, quota remaining)
   - Database performance (query latency, connection pool)
   - Error logs (last 24h, grouped by type)

### Technical Architecture

**Frontend**:
- Vite + React 19 + TypeScript
- TanStack Router (file-based routing)
- TanStack Query (Convex real-time subscriptions)
- TanStack Table (user list with server-side filtering)
- Recharts (interactive charts)
- Radix UI + Tailwind CSS (consistent design system)

**Backend**:
- Convex queries for real-time data (auto-refresh)
- Mutations for admin actions (send message, reset assessment)
- Analytics aggregations (daily/weekly rollups)

**Deployment**:
- Subdomain: `admin.givecare.app`
- Vercel or Cloudflare Pages
- Protected by admin authentication

### Data Requirements

**New Convex Functions**:
- `admin/getAllUsers` - Filtered user list
- `admin/getCrisisAlerts` - Real-time crisis users
- `admin/getSystemMetrics` - Dashboard overview stats
- `admin/getUserDetails` - Individual user drill-down
- `admin/sendAdminMessage` - Direct SMS to user
- `analytics/getDailyMetrics` - Time-series data
- `analytics/getBurnoutDistribution` - Score histogram
- `analytics/getUserJourneyFunnel` - Conversion funnel
- `analytics/getInterventionStats` - Usage & ratings

**Schema Additions**:
- None (uses existing tables: `users`, `conversations`, `wellnessScores`, `assessmentSessions`, `knowledgeUsage`)

### Success Criteria

**Functional**:
- [ ] Dashboard loads in <2s, metrics update every 30s
- [ ] Can view all users with filtering by 5+ criteria
- [ ] Crisis panel shows users requiring follow-up
- [ ] Charts render burnout distribution, user funnel, SMS trends
- [ ] Can drill down into individual user details
- [ ] Admin can send direct message to user (via Twilio)

**Non-Functional**:
- [ ] Query latency <1s for all views (p95)
- [ ] Mobile-responsive design (works on tablets)
- [ ] Real-time updates via Convex subscriptions
- [ ] Error handling for all admin actions
- [ ] Audit log for admin actions (future)

**Business**:
- [ ] Reduces user support time by 50% (self-service lookups)
- [ ] Enables data-driven decision making (weekly metrics review)
- [ ] Crisis response time <5min (from alert to action)

---

## Task 4: User Dashboard

### **Priority**: 🟡 MEDIUM | **Estimated Time**: 2 weeks

### Product Requirements

**Purpose**: Empower users to track their wellness progress, access interventions, and manage their account.

**Target Users**: Family caregivers using GiveCare platform

**Key Features**:

1. **Authentication**
   - Phone number + OTP login (6-digit code)
   - Session persistence (30 days)
   - Seamless experience (no passwords)

2. **Wellness Dashboard** (Home Page)
   - Current burnout score (large, prominent display)
   - Score trend chart (last 30 days)
   - Pressure zone breakdown (radar/circular chart)
   - Next assessment due date
   - Quick action: "Start Assessment"

3. **Assessment History**
   - List of completed assessments (type, date, score)
   - Expandable details: domain scores, responses
   - Visual progress indicator (scores over time)
   - Download PDF report (future)

4. **Intervention Library**
   - Recommended interventions (based on pressure zones)
   - Search by keyword
   - Filter by category (crisis, respite, financial, emotional, etc.)
   - Save favorites
   - Rate interventions (1-5 stars)
   - Share via SMS/email (future)

5. **Profile Management**
   - Edit: name, relationship, care recipient, zip code
   - Language preference
   - Communication preferences (SMS frequency)
   - Consent management

6. **Subscription & Billing**
   - Current plan (free trial, pro)
   - Usage stats (messages sent this month, assessments completed)
   - Link to Stripe Customer Portal (manage billing)
   - Plan comparison (upgrade prompts)

### Technical Architecture

**Frontend**:
- Vite + React 19 + TypeScript
- TanStack Router
- TanStack Query (Convex integration)
- Recharts (wellness trend charts)
- Radix UI + Tailwind CSS

**Backend**:
- Convex Auth (phone OTP)
- Convex queries for user-specific data
- Mutations for profile updates, intervention ratings

**Deployment**:
- Subdomain: `my.givecare.app`
- Vercel or Cloudflare Pages
- Public (authenticated users only)

### Data Requirements

**New Convex Functions**:
- `auth/sendOTP` - Send verification code
- `auth/verifyOTP` - Validate code, create session
- `dashboard/getCurrentUser` - Get user by session token
- `dashboard/getWellnessHistory` - Last 30 days of scores
- `dashboard/getAssessmentHistory` - Completed assessments
- `dashboard/getRecommendedInterventions` - Match by pressure zones
- `dashboard/rateIntervention` - Submit 1-5 star rating
- `dashboard/updateProfile` - Edit user info

**Schema Additions**:
```
otp_codes: { phoneNumber, code, expiresAt }
sessions: { userId, token, expiresAt }
```

### Success Criteria

**Functional**:
- [ ] Phone OTP login works (send code, verify, create session)
- [ ] Wellness dashboard shows current score + 30-day trend
- [ ] Pressure zone chart renders correctly
- [ ] Assessment history lists all completed assessments
- [ ] Can view domain scores per assessment
- [ ] Intervention library shows personalized recommendations
- [ ] Can search/filter interventions
- [ ] Can rate interventions (1-5 stars)
- [ ] Profile editor saves changes
- [ ] Subscription page links to Stripe portal

**Non-Functional**:
- [ ] Page load <2s (p95)
- [ ] Mobile-first design (80%+ users on mobile)
- [ ] Session persists 30 days (no re-login)
- [ ] Offline-friendly (service worker, future)
- [ ] Accessible (WCAG 2.1 AA)

**Business**:
- [ ] 50%+ of SMS users also use web dashboard (within 30 days)
- [ ] 80%+ intervention satisfaction rating (avg 4+ stars)
- [ ] 30% reduction in support requests (self-service profile updates)

---

## Task 5: Evaluation Framework

### **Priority**: 🟡 MEDIUM | **Estimated Time**: 1 week (Phase 1), 3-5 days (Phase 2 when ready)

### Product Requirements

**Purpose**: Systematically measure agent quality, track performance over time, and optimize prompts using data.

**Target Users**: Product team, AI engineers, clinical advisors

**Key Features**:

**Phase 1: Data Collection & Baseline (Week 1)**

1. **Conversation Feedback Collection**
   - Users can rate responses (1-5 stars)
   - Optional feedback text
   - Dimension-specific ratings: empathy, clarity, helpfulness, trauma-informed
   - In-SMS rating prompt (after key interactions)

2. **Baseline Evaluation**
   - Run existing 50 scenarios through current agents
   - GPT-4 as judge: evaluate on 4 dimensions
   - Calculate baseline metrics (avg empathy, clarity, trauma-informed, actionable)
   - Save results for comparison

3. **Export & Reporting**
   - Export conversations to JSONL format
   - Weekly quality reports (avg ratings, regression detection)
   - Dashboard view (admin panel integration)

**Phase 2: GEPA Optimization (When 100+ rated conversations available)**

4. **GEPA Integration**
   - Generate 5-10 instruction prompt variants
   - Evaluate each against top-rated conversations
   - Prune low-performing variants
   - Augment best performers
   - Iterate 3-5 times

5. **A/B Testing**
   - Deploy optimized instructions to 20% of users
   - Track metrics: empathy score, response time, user satisfaction
   - Statistical significance testing (min 500 users per variant, 30 days)
   - Roll out if >10% improvement

6. **Continuous Monitoring**
   - Daily eval loop (run on 10% sample of yesterday's conversations)
   - Alert on quality regression (avg score drops >10%)
   - Monthly GEPA re-runs (when new data available)

### Technical Architecture

**Evaluation Runner**:
- Standalone Node.js scripts (in `evals/` directory)
- OpenAI API for GPT-4 as judge
- ax-llm library for GEPA optimization

**Data Pipeline**:
- Convex functions for feedback collection
- Export queries for offline processing
- Results storage in Convex (for admin dashboard view)

**Infrastructure**:
- GitHub Actions (automated daily evals)
- Results artifacts stored in repo
- Alerts via Slack/email (future)

### Data Requirements

**New Convex Functions**:
- `feedback/recordFeedback` - Store user rating
- `feedback/getTopRatedConversations` - Fetch training data for GEPA
- `feedback/exportConversations` - Export to JSONL

**Schema Additions**:
```
conversation_feedback: {
  conversationId, userId, rating (1-5),
  dimension (empathy | clarity | helpfulness | trauma_informed),
  feedbackText, timestamp
}
```

**Eval Scripts** (in `evals/scripts/`):
- `runEvals.ts` - Baseline evaluation on 50 scenarios
- `gepaOptimize.ts` - GEPA prompt optimization (Phase 2)
- `dailyEvalLoop.ts` - Continuous quality monitoring
- `exportConversations.ts` - Data export utility

### Success Criteria

**Phase 1 (Baseline)**:
- [ ] `conversation_feedback` table created
- [ ] Feedback API works (can record ratings, export conversations)
- [ ] Baseline evals run on 50 scenarios
- [ ] Metrics calculated: empathy, clarity, trauma-informed, actionable
- [ ] Results saved to `evals/results/baseline_eval.json`
- [ ] Daily eval loop script functional

**Phase 2 (GEPA)** (Blocked until 100+ rated conversations):
- [ ] 100+ rated conversations collected (4+ stars)
- [ ] GEPA generates 10+ instruction variants
- [ ] All variants reviewed for P1-P6 compliance (clinical advisor)
- [ ] A/B test runs for 30 days (min 500 users per variant)
- [ ] Optimized instructions show >10% improvement in empathy scores
- [ ] No degradation in response time (<2s p95)
- [ ] No increase in crisis escalations

**Business**:
- [ ] Quality baseline established (can measure improvement)
- [ ] 80%+ of responses rated 4+ stars (user satisfaction)
- [ ] Continuous quality monitoring prevents regressions
- [ ] Data-driven prompt optimization (when ready)

---

## Critical Warnings & Considerations

### Admin Dashboard

**Security**:
- Admin-only authentication required (not phone OTP - use separate admin auth)
- Row-level security for sensitive user data
- Audit logging for all admin actions (future requirement)
- Rate limiting on admin mutations

**Performance**:
- Pagination for user table (load 50 at a time)
- Debounced search/filter (avoid excessive queries)
- Cached aggregations for analytics (refresh every 5min)

**Privacy**:
- Anonymize phone numbers in exports (last 4 digits only)
- HIPAA compliance considerations (future)
- User consent for data access (already captured)

### User Dashboard

**Authentication**:
- **Decision needed**: Supabase Auth vs Convex Auth
  - Supabase: Already used in `give-care-user`, familiar
  - Convex: Simpler, all-in-one, fewer dependencies
  - **Recommendation**: Convex Auth (reduce vendor lock-in)

**Mobile-First**:
- 80%+ users on mobile devices
- Touch-friendly buttons (min 44px)
- Swipe gestures for navigation (future)
- Progressive Web App (PWA) install prompt (future)

**Offline Support** (Future):
- Service worker for offline viewing
- Sync when connection restored
- Show cached data with "offline" indicator

### Evaluation Framework

**GEPA Risks**:
- **DO NOT** blindly deploy GEPA-optimized prompts
- **MUST** have clinical advisor review all variants
- **WATCH** for "performance over empathy" optimization
- **PRESERVE** P1-P6 trauma-informed principles
- **TEST** with diverse user scenarios (edge cases)

**Sample Size**:
- GEPA needs 100+ rated conversations (4+ stars)
- A/B test needs 500+ users per variant (1000 total)
- 30-day minimum duration for statistical significance

**Metrics That Matter**:
- Empathy score (most important)
- Trauma-informed adherence (P1-P6 checklist)
- User satisfaction (1-5 stars)
- Crisis escalations (safety metric - cannot increase)
- Response time (cannot degrade)

---

## Implementation Sequence

### Phase 1: Foundation (Week 1-2)
1. Set up project structure (`admin-dashboard/`, `user-dashboard/`, `evals/`)
2. Create Convex functions (admin, dashboard, analytics, auth, feedback)
3. Add schema tables (otp_codes, sessions, conversation_feedback)
4. Build basic page layouts with routing

### Phase 2: Admin Dashboard MVP (Week 3-4)
1. Metrics overview (6 real-time KPIs)
2. User management table (list, filter, search)
3. Crisis alerts panel
4. Basic analytics charts (burnout distribution, user funnel)

### Phase 3: User Dashboard MVP (Week 5-6)
1. Phone OTP authentication flow
2. Wellness dashboard (score card + trend chart)
3. Assessment history list
4. Intervention library (recommendations, search)

### Phase 4: Evaluation Framework (Week 7)
1. Feedback collection API
2. Baseline eval runner (50 scenarios)
3. Daily eval loop
4. Export utilities

### Phase 5: Polish & Launch (Week 8)
1. Mobile responsive design
2. Error handling & loading states
3. Performance optimization
4. Deploy to production subdomains
5. User acceptance testing

---

## Open Questions / Decisions Needed

1. **Auth Strategy**: Supabase Auth vs Convex Auth for user dashboard?
   - Recommendation: Convex Auth (simpler, fewer dependencies)

2. **Admin Auth**: How do admins authenticate?
   - Options: Email/password, OAuth (Google), Magic link
   - Recommendation: Email/password (Convex Auth)

3. **Dashboard Hosting**: Vercel vs Cloudflare Pages?
   - Recommendation: Vercel (better Next.js integration, easier setup)

4. **Intervention Rating**: In-SMS vs web-only?
   - Recommendation: Both (in-SMS for immediate feedback, web for browsing)

5. **GEPA Timeline**: When to revisit?
   - Earliest: 6 months after production launch (100+ rated conversations)
   - Target: 2026-04-10 (if launched 2025-10-10)

6. **Analytics Rollups**: Real-time vs pre-aggregated?
   - Recommendation: Hybrid (real-time for critical metrics, rollups for charts)

---

**Last Updated**: 2025-10-10
**Next Review**: After Task 2 (Vector Search) completion
**Owner**: Product Team
