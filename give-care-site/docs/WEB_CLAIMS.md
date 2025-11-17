# Website Claims & Promises - GiveCare Marketing Site

**Document Type**: Public-Facing Feature Claims
**Source**: https://www.givecareapp.com (Next.js site)
**Last Updated**: 2025-01-11
**Purpose**: Catalog all product promises, claims, and commitments made to users on the public website

---

## Hero Section (Homepage)

### Primary Value Proposition

**Headline**:
> "You're carrying more than anyone sees—we remember all of it"

**Subheadline**:
> "Track your capacity. Get help matched to YOUR needs. We check in before things get hard. Works on any phone—no app required."

**Primary CTA**: "Start Free Assessment"
**Secondary CTA**: "See How It Works →"

**Forbes Badge**: "As Featured In: Forbes"
- Link: https://www.forbes.com/sites/christinecarter/2025/08/12/12-startups-proving-motherhood-over-40-is-a-market-advantage/

---

## Core Feature Claims (Bento Grid)

### Feature 1: Understand Your Capacity
**Claim**: "Validated assessments show a number (0-100) that reflects what you're carrying. A way to see and track what you're experiencing."

**Implied Promise**:
- Quantified burnout measurement (numerical score)
- Validation by external authorities (clinical backing)
- Visibility and tracking (a way to see and track what you're experiencing)

---

### Feature 2: See Patterns and Progress
**Claim**: "Track your score week by week. Visual timelines help you spot what's working and what's shifting."

**Implied Promise**:
- Longitudinal tracking (historical data)
- Visual dashboards/charts
- Trend detection ("what's working and what's shifting")

---

### Feature 3: Find Help That Fits Your Life
**Claim**: "Resources matched to your specific needs—respite funding, local support groups, practical strategies. Plus evidence-based micro-interventions (2-10 min) matched to your pressure zones. Not generic lists you have to filter yourself."

**Implied Promise**:
- Personalized resource matching
- Geographic specificity (local)
- Pre-filtered results (no manual sorting)
- Multiple resource types (funding, groups, strategies)
- Evidence-based micro-interventions (2-10 min duration)
- Interventions matched to pressure zones (P1-P6)

**Specific Examples Given**:
- Respite funding
- Local support groups
- Practical strategies
- Micro-interventions (2-10 min)
- Pressure zone matching

---

### Feature 4: We Remember What Matters to You
**Claim**: "Care routines, preferences, crisis triggers—saved forever. 50% fewer repeated questions. Your story never starts over."

**Implied Promise**:
- Permanent memory storage
- Reduction in repetitive questions (quantified: 50%)
- Continuity across sessions/weeks/months

**Specific Examples of What's Remembered**:
- Care routines
- Preferences
- Crisis triggers

---

### Feature 5: Proactive Check-Ins Based on Patterns
**Claim**: "Haven't heard from you? Score changed? We check in when patterns shift—offering support before things feel overwhelming. Stress-spike follow-ups share quick strategies. Next-day check-ins after difficult moments ensure you're connected. You're not alone."

**Implied Promise**:
- Pattern detection (silence, score spikes ≥20 points, crisis events)
- Proactive outreach (system initiates)
- Early intervention (before escalation)
- Stress-spike follow-ups with intervention offers
- Crisis next-day check-ins (T+24h) with T+72h nudges

**Warning Signs Detected**:
- Sudden silence (5/7/14 day engagement watcher)
- Score spikes (20+ point increase)
- Crisis events (next-day follow-up)
- Shifting routines

**Follow-Up Types**:
- Stress-spike follow-ups: "ask-first" pattern, offers interventions if YES
- Crisis next-day check-ins: T+24h follow-up asking if user connected to 988/741741
- Engagement nudges: 5/7/14 day inactivity triggers with suppression logic

---

### Feature 6: Reminders When YOU Want Them
**Claim**: "Not everyone wants 9am check-ins. Text DAILY or WEEKLY to set your schedule. Text PAUSE CHECKINS to take a break, RESUME when ready. Your timezone, your pace. We can adjust frequency if weekly feels better for you."

**Implied Promise**:
- User-controlled scheduling via SMS keywords
- Timezone awareness
- Flexible frequency options (daily, weekly)
- Pause/resume functionality
- Safety protections (high-risk users auto-downgraded)

**Scheduling Keywords**:
- DAILY: Set daily check-ins
- WEEKLY: Set weekly check-ins
- PAUSE CHECKINS: Pause for 7 days
- RESUME: Resume check-ins

**Safety Features**:
- Frequency can be adjusted if weekly feels better (respects user agency)
- Quiet hours respected (9 AM - 7:59 PM local time)
- Snooze functionality (7-day pause)

---

## SMS-First Value Proposition

### Accessibility Claims

**No App Required**:
> "Works on flip phones, smartphones, any device with SMS. No downloads. No passwords. No smartphone required."

**Specific Devices Supported**:
- Flip phones
- Smartphones
- Any device with SMS

**Barriers Removed**:
- No downloads
- No passwords
- No smartphone required

---

### Speed Claims

**Instant Support**:
> "Text to start. Send a message, get instant support. No account creation, no password, no email verification."

> "Get support in seconds, not days. No waiting 24-48 hours for a callback."

**Specific Timing Claims**:
- "Instant support"
- "Seconds" response time
- Contrasted with "days" or "24-48 hours" for traditional services

**Onboarding Friction Removed**:
- No account creation
- No password
- No email verification

---

### Reliability Claims

**Offline Capability**:
> "SMS fallback when data unavailable. No Wi-Fi? No problem."

> "Works offline"

**Specific Scenarios**:
- No WiFi
- No data connection
- SMS as fallback mechanism

---

### Accessibility for Disabilities

**Assistive Technology Support**:
> "Works with screen readers, voice dictation, and all assistive technology—because SMS works with everything"

**Specific Technologies Named**:
- Screen readers
- Voice dictation
- All assistive technology (unspecified)

---

## How It Works Page - Interactive Scenarios

### Scenario 1: Getting Started (Onboarding)
**User Journey**:
1. User: "Hi!"
2. System: Asks name
3. User: Provides name ("Sarah")
4. System: Asks who they're caring for
5. User: "My mom"
6. System: Asks how long
7. User: "About 2 years now"
8. System: Asks for zip code
9. User: Provides zip code ("94103")
10. System: Suggests check-in

**Claims Demonstrated**:
- Natural conversation flow
- Minimal data collection (name, care recipient, duration, zip)
- Transition to check-in within 10 messages

---

### Scenario 2: Daily Check-In
**User Journey**:
1. System initiates: "Morning! Quick check-in. How are you feeling right now?"
2. User: "Honestly? Not great"
3. System asks about overwhelm
4. User: "Pretty overwhelming"
5. System asks about stress
6. User: "Very stressed"
7. **System calculates score**: "Your wellness score today: 45/100 (Managing, but challenging)"
8. **System identifies pressure**: "Top pressure: Emotional strain"
9. **System offers resources**: "Found a caregiver support group meeting tonight at 7pm. Interested?"

**Claims Demonstrated**:
- System-initiated check-ins
- 3-question assessment (feelings, overwhelm, stress)
- Real-time scoring (45/100)
- Pressure zone identification (Emotional strain)
- Same-day local resource matching

---

### Scenario 3: Finding Resources (Respite)
**User Journey**:
1. User expresses need: "I haven't left the house in 3 weeks" + "I just snapped at my kids"
2. System asks clarifying question
3. User: "I can't remember" last time away
4. User: "There's no one to watch mom"
5. **System searches**: "Let me find respite services near you"
6. **System returns 3 options**:
   - ElderCare @ Home: (415) 555-0100
   - Comfort Keepers: (415) 555-0234
7. Notes: "Two offer same-day bookings"

**Claims Demonstrated**:
- Empathetic context detection (snapping at kids → burnout signal)
- Local search (geographic)
- Multiple options (3 providers)
- Same-day availability flagged
- Phone numbers provided directly

---

### Scenario 4: Crisis Support
**User Journey**:
1. User: "I don't know if I can do this anymore"
2. System: "Are you safe right now?"
3. User: "I think so" + "just overwhelmed"
4. **System provides validation**: "It's okay to feel overwhelmed. You're doing something incredibly hard."
5. **System provides crisis resources**:
   - 988 Suicide & Crisis Lifeline
   - Crisis Text Line: Text HOME to 741741
   - 911 for emergencies
6. System: "I'm here too. What do you need right now?"

**Claims Demonstrated**:
- Crisis language detection ("can't do this anymore")
- Safety assessment ("Are you safe?")
- Multi-tier resources (988, 741741, 911)
- Continued support offer ("I'm here too")

---

### Scenario 5: Financial Assistance
**User Journey**:
1. User: "I can't afford her medications this month" + "The bills keep piling up"
2. System: "Let me help find financial assistance. What medications does she need?"
3. User: "Blood pressure and diabetes meds"
4. **System returns 3 programs**:
   - RxAssist: Free meds for qualifying patients
   - NeedyMeds: Up to 80% off
   - Medicare Extra Help: (800) 772-1213

**Claims Demonstrated**:
- Financial burden detection
- Medication-specific assistance
- Multiple program types (free, discount, government)
- Specific savings quantified ("up to 80% off")

---

## Clinical Foundation Claims

### Assessment Validation

**REACH-II**:
> "NIH-validated caregiving assessment"
> "Coordinated by University of Pittsburgh"

**GC-SDOH-28**:
> "Evidence-based wellness framework"
> "Created by GiveCare"
> "28 questions. 2 minutes. A number that finally makes your burden visible."

**CWBS**:
> "Caregiver Well-Being Scale"
> "© 1993 Susan Tebb, Saint Louis University"

---

### GC-SDOH-28 Positioning (Featured Assessment)

**What It Measures**:
> "GC-SDOH-28 measures the invisible—financial strain, isolation, access to care, housing quality, community support. The real-world factors dragging you down."

**Specific Domains**:
- Financial strain
- Isolation
- Access to care
- Housing quality
- Community support

**Time Claim**: "28 questions. 2 minutes."

**Value Proposition**:
> "Your score is your starting line. Week by week, we track changes. When the number drops, you have proof: things are getting better. When it climbs, we find more support before you break."

**Purpose Statement**:
> "A number that finally makes your burden visible."

---

### Clinical Philosophy

**Measurement Philosophy**:
> "You can't fix what you can't measure"
> "Understanding your burden helps you address it"

**Early Intervention Claim**:
> "Caregiver burnout can creep up gradually. Early support helps prevent crisis points."

**Longitudinal Tracking**:
> "Week by week, we track changes. When the number drops, you have proof: things are getting better."

---

## Open Source Commitment

**Public Positioning**:
> "Built in the open"
> "Sharing our work helps everyone caring for others"

**What's Shared**:
> "Caregiving shouldn't be solved in silos. We're sharing what we learn—assessment frameworks, research insights, clinical approaches, and implementation strategies—so other organizations can adapt and improve on our work."

**Collaboration Invitation**:
> "Share your insights. Collaborate on solutions. Together, we can make caregiving support better for everyone."

**Specific Open Components**:
- Assessment frameworks
- Research insights
- Clinical approaches
- Implementation strategies
- Open code

**Call to Action**:
> "Explore & Contribute on GitHub"
> Link: https://github.com/orgs/givecareapp/repositories

**Philosophy**:
> "From evidence-based frameworks to open code, we believe in radical transparency and knowledge sharing. The more we collaborate, the faster we can improve support for millions caring for loved ones."

---

## What You Actually Get (Value Summary)

### 1. Immediate Support, Anytime
**Claim**: "Text when you need help. Get a response in seconds, not hours. No appointments, no waiting."

**Key Points**:
- Immediate availability (24/7 implied)
- Sub-second response times
- No scheduling required

---

### 2. Resources Matched to Your Exact Situation
**Claim**: "Respite care near you. Financial assistance you qualify for. Support groups that fit your schedule."

**Specific Match Types**:
- Geographic (near you)
- Eligibility (you qualify for)
- Temporal (fit your schedule)

**Resource Types**:
- Respite care
- Financial assistance
- Support groups
- Meals, transport, home care, day programs, hospice, memory care, legal help, financial aid

---

### 3. Evidence-Based Micro-Interventions
**Claim**: "Quick strategies (2-10 min) matched to your pressure zones. Breathing exercises for emotional strain, respite planning for physical exhaustion, boundary scripts for self-care neglect."

**Key Points**:
- 16 evidence-based interventions
- Duration: 2-10 minutes
- Matched to pressure zones (P1-P6)
- Examples: breathing exercises, respite planning, boundary scripts
- Delivered via SMS after assessments or when zones referenced

**Intervention Categories**:
- Emotional strain → Breathing exercises, grief resources
- Physical exhaustion → Sleep hygiene, micro-breaks, respite scheduling
- Self-care neglect → 5-minute routines, boundary scripts
- Financial strain → Respite funding guides, benefits checklists
- Social isolation → Support group connections
- Caregiving tasks → Medication trackers, appointment checklists

---

### 4. Your Burnout Score Tracked Over Time
**Claim**: "See your progress over time. Notice patterns that help you recognize when additional support might be useful."

**Key Points**:
- Longitudinal data (over time)
- Progress visibility (see your journey)
- Pattern recognition (helps you notice when additional support might be useful)

---

### 5. Safety Support When You Need It
**Claim**: "If you're in crisis, we connect you immediately with 988 Suicide & Crisis Lifeline and other support resources. We follow up the next day to see how you're doing."

**Key Points**:
- Automatic detection (no manual flagging)
- Immediate access (no delay)
- Multiple resources (988 + others)
- Next-day follow-up (T+24h) to check how you're doing
- T+72h nudge if no response to follow-up

---

## Pricing & Subscription Claims

### Subscription Plans

**Monthly Plan**: $9.99 per month, billed monthly

**Pricing Claims**:
- "All prices are in U.S. dollars and exclude applicable taxes"
- "We reserve the right to change our pricing with 30 days' advance notice to active subscribers"

**Payment Processing**:
> "All payments are processed securely through Stripe, our third-party payment processor."

---

### Auto-Renewal Policy

**Renewal Claim**:
> "Your subscription will automatically renew at the end of each billing period (monthly or annually, depending on your plan) unless you cancel before the renewal date."

**Notification**:
> "We will send you a reminder before each renewal period."

---

### Cancellation Policy

**How to Cancel**:
> "You may cancel your subscription at any time through your account settings or by contacting us at support@givecareapp.com. There are no cancellation fees."

**What Happens When You Cancel**:
- Subscription remains active through end of current billing period
- Subscription will not renew for next billing period
- No cancellation fees

---

### Refund Policy (7-Day Money-Back Guarantee)

**Refund Window**:
> "If you cancel within 7 days of your initial subscription purchase, you will receive a full refund"

**Key Terms**:
- 7 days from initial purchase (not from current billing cycle)
- Full refund (no partial refunds mentioned)
- Applies to initial subscription only (not renewals)

---

## Data & Privacy Claims

### What Data Is Collected

**Personal Information**:
- Name, email, phone number
- ZIP code for local resources

**Conversation Data**:
- Assessment responses
- SMS message history

**Payment Information**:
- "Billing details processed through Stripe for your $9.99/month or $99/year subscription (we do not store credit card numbers directly)"

**Communication Preferences**:
- Newsletter subscriptions
- Notification settings
- Communication preferences

---

### How Data Is Used

**Stated Purposes**:
- Provide personalized caregiving support
- Match resources to needs
- Track burnout over time
- Process subscription payments and manage billing

**Third-Party Sharing**:
- **Stripe (Payment Processing)**: "Handles all subscription billing and payment processing. Stripe receives your payment information directly (we never see or store your full credit card numbers)."

---

### User Control

**SMS Consent Withdrawal**:
> "Text 'STOP' at any time to stop receiving messages and cancel your subscription"

**Data Rights**:
- Cancel subscription without penalty
- If disagree with policy changes, may cancel and delete account

---

## Technical Claims

### Platform Requirements
- Works on any phone with SMS capability
- No app download required
- No WiFi or data connection required
- Works with assistive technology (screen readers, voice dictation)

### Response Time
- "Instant replies"
- "Get support in seconds"
- "Response in seconds, not hours" or "days"

### Reliability
- SMS fallback when data unavailable
- Works offline
- No dependency on WiFi or internet connection

---

## Competitive Positioning

### What GiveCare Is NOT

**Compared to Traditional Services**:
- Not "waiting 24-48 hours for a callback"
- Not "generic lists you have to filter yourself"
- Not requiring appointments or scheduling

**Compared to Apps**:
- Not requiring downloads
- Not requiring account creation
- Not requiring passwords or email verification
- Not requiring smartphones

**Friction Points Removed**:
- No app installation
- No account setup
- No waiting periods
- No manual resource filtering
- No repeated questions (50% reduction claimed)

---

## Unspecified Claims (Implied but Not Explicit)

### Geographic Coverage
- **Not Specified**: Which countries/regions are supported
- **Implied**: U.S.-based (pricing in USD, 988 hotline is U.S.-specific)

### Language Support
- **Not Specified**: Languages supported beyond English
- **No Claims**: About multilingual support

### Care Recipient Types
- **Implied**: Elderly care (mentions Alzheimer's, dementia)
- **Not Specified**: Pediatric caregiving, disability care, chronic illness care

### Professional Credentials
- **Not Specified**: Who created the assessments (beyond "GiveCare" for GC-SDOH-28)
- **Not Specified**: Clinical advisory board, if any

### Limitations
- **Not Specified**: What happens if you exceed message limits
- **Not Specified**: Response time guarantees (SLA)
- **Not Specified**: Data retention periods

---

## Summary of Key Promises

### Speed & Accessibility
✅ "Seconds" response time (not minutes or hours)
✅ Works on any phone (flip phones, smartphones)
✅ No app, no WiFi, no account required
✅ Works with assistive technology

### Clinical Validity
✅ 4 validated assessments (REACH-II, GC-SDOH-28, CWBS, plus 1 more)
✅ 0-100 burnout score
✅ NIH validation (REACH-II)
✅ University-backed research (Pitt, Saint Louis University)

### Personalization
✅ Resources matched to needs (not generic lists)
✅ Local resource search (geographic specificity)
✅ 50% fewer repeated questions (memory system)
✅ User-controlled scheduling (timezone, frequency)

### Proactive Support
✅ Pattern detection (silence, score changes, routine shifts)
✅ Proactive check-ins (system initiates)
✅ Early intervention (before escalation)

### Crisis Safety
✅ Crisis language detection
✅ Immediate 988/741741/911 resources
✅ Safety check-ins

### Pricing & Business
✅ $9.99/month
✅ 7-day money-back guarantee
✅ No cancellation fees
✅ No credit card storage (Stripe handles)

### Open Source
✅ Assessment frameworks published
✅ GitHub repository available
✅ Collaboration invited

---

## Cross-Reference Guide

| Website Claim | Backend Implementation File | Notes |
|---------------|----------------------------|-------|
| 4 validated assessments | `convex/assessments.ts` | EMA, SDOH-28 (BSFC & REACH-II removed) |
| 0-100 burnout score | `convex/internal/score.ts` | Scoring logic with zones |
| Resources matched to needs | `convex/resources.ts` | Google Maps grounding, 8+ categories |
| Micro-interventions (2-10 min) | `convex/interventions.ts` + `convex/tools.ts` | 16 interventions, matched to zones |
| 50% fewer repeated questions | `convex/agents.ts` (memory tools) | Memory system via `recordMemory` |
| User-controlled scheduling (DAILY/WEEKLY) | `convex/inbound.ts` | Keyword detection (DAILY, WEEKLY, PAUSE CHECKINS, RESUME) |
| Stress-spike follow-ups | `convex/internal/sms.ts` | 20+ point increase triggers ask-first message |
| Crisis next-day check-in | `convex/internal/sms.ts` | T+24h follow-up, T+72h nudge |
| Engagement watcher (5/7/14 day) | `convex/internal/workflows.ts` | Inactivity detection with suppression |
| Crisis detection | `convex/lib/utils.ts` | Crisis keyword detection |
| 988/741741/911 resources | `convex/lib/prompts.ts` (CRISIS_PROMPT) | Hard-coded in crisis agent |
| SMS-first | `convex/http.ts` + `convex/inbound.ts` | Twilio webhooks |
| Same-day respite booking | `convex/resources.ts` | Google Maps search |
| Financial assistance programs | `convex/resources.ts` | Expanded resource categories |
| Open source GitHub | https://github.com/orgs/givecareapp | Public repos |

---

## Document Maintenance

**Update Triggers**:
- Homepage redesign or copy changes
- New features added to website
- Pricing changes
- Policy updates (refund, cancellation, privacy)
- New assessment tools added
- Geographic expansion

**Review Frequency**: Monthly or when website changes are deployed

**Owner**: Product team (cross-check with Marketing and Engineering)
