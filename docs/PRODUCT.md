# GiveCare - Product Brief

**What**: AI-powered SMS caregiving support with clinical burnout monitoring
**How**: Text any time, get instant personalized support from multi-agent AI
**Why**: 53M US caregivers need 24/7 support without app downloads

---

## Core Product (give-care-app)

### Conversation Engine
- **3-agent system**: Main (support) → Crisis (safety) → Assessment (clinical)
- **SMS-first**: Works on any phone, no app required
- **~900ms response**: GPT-5 nano with tool use
- **Working memory**: Remembers care routines, preferences, triggers
- **Trauma-informed**: P1-P6 principles (never repeat questions, offer skip, warmth)

### Clinical Measurement
- **4 validated assessments**:
  - EMA (Ecological Momentary Assessment) - real-time stress monitoring, 3 questions
  - BSFC (Burden Scale for Family Caregivers) - 10 questions, 4 pressure zones
  - REACH-II (Risk Appraisal) - 16 questions, caregiver strain assessment
  - SDOH (Social Determinants of Health) - 28 questions, 5 pressure zones
- **Burnout score**: 0-100 scale with 5 bands (Crisis→Thriving)
- **Pressure zones**: 5 domains (emotional, physical, social, time, financial)
  - Note: BSFC uses 4 zones (no financial), SDOH adds financial zone
- **Personalized scheduling**: RRULE-based check-ins in user timezone

### Intelligence Layer
- **Proactive messaging**: Daily (crisis) → weekly (stable) → reactivation (dormant)
- **Engagement monitoring**: 3 warning signs (sudden drop, crisis burst, decline trend)
- **Conversation summarization**: Recent detail + historical compression (60-80% token savings)
- **Passive feedback**: 6 signal types, zero user burden, continuous learning

### Resource Matching
- **Evidence-based interventions**: 16 strategies matched to pressure zones
- **Local resource search**: Semantic search + geocoding
- **Knowledge base**: 290+ curated resources with embedding search

### Safety & Compliance
- **Crisis detection**: 988/741741 in <600ms
- **HIPAA logging**: Phone hashing, message redaction, zero PII leaks
- **Rate limiting**: 10 SMS/day per user, $1,200/day global cap
- **Guardrails**: Medical advice blocking, spam protection, P1-P6 enforcement

### Business Operations
- **Stripe subscriptions**: $9.99/mo, $99/yr, 7-day trial, 15 promo codes
- **Admin dashboard**: Real-time monitoring, alerts, analytics
- **ETL pipeline**: Cloudflare Workers for resource ingestion

---

## Marketing Site (give-care-site)

### Public-Facing
- **Next.js 16**: App router, RSC, static export
- **Public assessment**: CWBS tool for lead gen → newsletter signup
- **Checkout flow**: Stripe integration with promo codes
- **Content pages**: /how-it-works, /about, /partners, /press
- **SEO**: Sitemap, robots.txt, metadata optimization

### Integration Points
- **Convex client**: Imports types from give-care-app
- **Shared schemas**: Assessment scoring logic
- **Newsletter API**: Syncs with Resend audience
- **Subscription webhooks**: Stripe → Convex → site confirmation

---

## Tech Stack

### Backend (give-care-app)
- **Convex**: Serverless DB (28 tables) + functions (57 exports) + real-time subscriptions
- **@convex-dev/agent**: Multi-agent orchestration using Convex Agent Component
- **Twilio**: SMS delivery
- **Stripe**: Payment processing
- **Model layer**: Data access abstraction (`convex/model/` - 6 modules)
- **Materialized metrics**: Pre-aggregated analytics (4 tables, cron-updated)
- **Scheduled jobs**: 3 cron jobs (triggers every 5min, engagement every 6h, metrics daily)
- **Vitest**: 52 passing tests across 5 test files
- **Codebase**: 105 TypeScript files

### Frontend (give-care-site)
- **Next.js 16**: SSR + SSG
- **Tailwind v4**: DaisyUI components
- **Framer Motion**: Animations
- **Resend**: Email delivery
- **Playwright**: E2E tests

### Infrastructure
- **Vercel**: Site hosting
- **Convex Cloud**: Backend hosting
- **Cloudflare Workers**: ETL pipeline
- **GitHub Actions**: CI/CD

---

## Key Metrics

### Performance
- Response time: ~900ms avg (p95 <1s)
- Uptime: 99.95% SLA
- Auto-scaling: 10K+ concurrent users

### Clinical
- 4 assessments: EMA (3q), BSFC (10q), REACH-II (16q), SDOH (28q) = 57 questions total
- 5 pressure zones (financial zone added via SDOH)
- 16 evidence-based interventions seeded

### Business
- Cost: $1.52/user at 10K scale
- Test coverage: 52 passing tests (5 test files: assessments, billing, prompts, scheduler, summarization)
- Zero PII leaks (HIPAA compliant)

---

## What This Is

**Not a PRD** (that's forward-looking "what to build")
**Is a product brief** (current capabilities for stakeholders)

For details:
- **User Scenarios** → `give-care-app/docs/FEATURES.md` (narrative user flows, no code)
- **Technical Architecture** → `give-care-app/docs/ARCHITECTURE.md` (implementation reference)
- **Developer Guide** → `give-care-app/docs/README.md` (setup, configuration, examples)
