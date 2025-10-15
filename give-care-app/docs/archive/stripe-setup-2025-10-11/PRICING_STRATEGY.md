# GiveCare Pricing Strategy 2025

**Version:** 2.0.0
**Last Updated:** 2025-10-11
**Status:** Implementation Ready

---

## Executive Summary

**Current Pricing:** $7.99/month, $81.51/year (underpriced by 60-80%)
**New Pricing (Phase 1):** $9.99/month, $99/year
**New Pricing (Phase 2):** $14.99/month, $149/year
**Revenue Impact:** +50-100% with minimal churn

---

## Phase 1: Immediate Price Increase (Next 30 Days)

### New Pricing Structure

| Tier | Monthly | Annual | Effective Monthly | vs Current | Gross Margin |
|------|---------|--------|------------------|------------|--------------|
| **Standard** | $9.99 | $99/year | $8.25/month | +25% | 72% |

### Grandfathering Policy

**Existing Users:**
- Keep $7.99/month for 12 months (loyalty reward)
- Email 30 days before increase: "Your price will increase to $9.99 on [date]"
- Offer annual upgrade: "Lock in $99/year (save $20) before monthly price increases"

**New Users (after 30-day notice):**
- Standard: $9.99/month or $99/year

---

## Phase 2: Premium Tier (6 Months After Phase 1)

### Two-Tier Structure

| Tier | Monthly | Annual | Features |
|------|---------|--------|----------|
| **Standard** | $14.99 | $149/year | Unlimited messages, 4 assessments, crisis support, wellness tracking |
| **Premium** | $19.99 | $199/year | + Priority response (<30s), family coordination (3 accounts), monthly reports, human escalation |

### A/B Test Strategy

- **Cohort A:** See $9.99 → $14.99 increase (safe)
- **Cohort B:** See $9.99 → Standard $14.99 + Premium $19.99 (test upsell)
- **Duration:** 60 days, 1,000 signups per cohort
- **Metric:** Revenue per user (price × conversion rate)

---

## Coupon Code System

### 1. Partner Referral Program (Org-Specific Codes)

**Purpose:** Drive B2B2C signups via partner organizations

| Partner Type | Code Format | Benefit | Duration | Commission |
|--------------|-------------|---------|----------|------------|
| **Startup Partners** | `PARTNER-[ORG]` | $3 off/month | 3 months | 20% ($2/user/month) |
| **Healthcare Orgs** | `HEALTH-[ORG]` | $3 off/month | 3 months | 20% |
| **Advocacy Groups** | `ADVOCATE-[ORG]` | $3 off/month | 3 months | 20% |
| **Universities** | `EDU-[SCHOOL]` | $3 off/month | 3 months | 20% |

**Examples:**
```
PARTNER-NOTION    → $9.99 - $3 = $6.99/month for 3 months (Notion employees)
HEALTH-MAYO       → $14.99 - $3 = $11.99/month for 3 months (Mayo Clinic staff)
ADVOCATE-AARP     → $9.99 - $3 = $6.99/month for 3 months (AARP members)
EDU-STANFORD      → $14.99 - $3 = $11.99/month for 3 months (Stanford students)
```

**Partner Benefits:**
- Custom landing page: `givecareapp.com/partners/[org-name]`
- 20% commission on all signups ($2/user/month recurring)
- Co-branded welcome email
- Quarterly impact report: "Your code helped 150 caregivers this quarter"

**Stripe Implementation:**
- Create coupon per partner: `PARTNER-ACME` (Stripe ID: unique per org)
- Track via metadata: `{partner: "acme", type: "startup"}`
- Commission paid monthly via Stripe payouts or manual invoicing

---

### 2. Caregiver Affordability Program (Financial Hardship)

**Purpose:** "No caregiver left behind due to cost"

| Code | Discount | Duration | Final Price (at $9.99) | Final Price (at $14.99) | Eligibility |
|------|----------|----------|----------------------|------------------------|-------------|
| **CAREGIVER50** | $5 off/month | 6 months | $4.99/month | $9.99/month | General hardship |
| **MEDICAID** | $9 off/month | 12 months | $0.99/month | $5.99/month | Medicaid recipients |
| **SNAP** | $9 off/month | 12 months | $0.99/month | $5.99/month | SNAP benefits |
| **VETERAN** | $5 off/month | 12 months | $4.99/month | $9.99/month | Military caregivers |
| **STUDENT** | $5 off/month | 12 months | $4.99/month | $9.99/month | College students |

**Stripe Coupon IDs:**
- CAREGIVER50: `U1vi08rY` (Stripe ID)
- MEDICAID: `8BPnoFZJ` (Stripe ID)
- SNAP: Create via `mcp__stripe-givecare__create_coupon`
- VETERAN: Create via `mcp__stripe-givecare__create_coupon`
- STUDENT: Create via `mcp__stripe-givecare__create_coupon`

**Application Process:**
1. Visit `givecareapp.com/affordability`
2. Fill 3-question form:
   - "Which program do you qualify for?" (Medicaid, SNAP, Veteran, Student, Other)
   - "Why do you need financial assistance?" (optional, free text)
   - "Email address" (to receive code)
3. Instant code delivery (no income verification, honor system)
4. Code applied at checkout

**Post-Discount Messaging:**
- 30 days before expiration: "Your affordability code expires soon. Reply 'help' if you still need support."
- After expiration: "Your price increased to $9.99. Still too much? Text 'afford' to renew your discount."

**Financial Impact:**
- **Cost per subsidized user:** $2.84/month (variable cost)
- **Revenue at $0.99:** -$1.85/month loss (mission-driven, accessibility mandate)
- **Revenue at $4.99:** +$2.15/month profit (sustainable)
- **Target:** 10% of users on affordability codes (90% full price maintains margins)

---

### 3. Launch & Marketing Codes (Time-Limited)

**Purpose:** Drive signups during campaigns

| Code | Discount | Duration | Use Case | Stripe ID |
|------|----------|----------|----------|-----------|
| **LAUNCH2025** | $4 off/month | 3 months | Launch promo | `O7x47yIn` |
| **ANNUAL20** | $15.80 off | Once | Annual plan discount | `S8vmovFV` |
| **FRIEND50** | $5 off | Once | Referral program | `2ODjFMTz` |
| **CAREGIVER25** | $2 off | Once | First-time signup | `B3h659kW` |

**Campaign-Specific Codes (Create as needed):**
```bash
# Example: Mother's Day campaign
npx ts-node -e "
  import Stripe from 'stripe';
  const stripe = new Stripe(process.env.STRIPE_KEY!);
  stripe.coupons.create({
    name: 'MOTHERSDAY',
    amount_off: 500, // $5 off
    currency: 'usd',
    duration: 'once'
  });
"
```

---

### 4. Legacy Codes (Keep Active, Remove from UI)

**Purpose:** Honor existing commitments

| Code | Discount | Duration | Status | Action |
|------|----------|----------|--------|--------|
| **WELCOME50** | $4 off | Once | Active | Keep for existing users |
| **Early Users** | $4 off/month | 3 months | Active | Keep for beta users |
| **Beta Testers** | $7.99 off/month | 3 months | Active | Keep (essentially free) |
| **TEST25** | $7.99 off forever | Active | ❌ Remove from UI (test only) |
| **TRYFREE** | 100% off forever | Active | ❌ Remove from UI (dangerous) |

**Action Items:**
- ❌ **Remove TEST25 and TRYFREE from signup form** (leave active for existing users)
- ✅ **Keep all other legacy codes active** (honoring commitments)
- ✅ **Grandfather legacy users** (maintain trust)

---

## Pricing Migration Timeline

### Week 1-2: Preparation
- ✅ Create all coupon codes in Stripe
- ✅ Build affordability application page (`/affordability`)
- ✅ Build partner landing page template (`/partners/[org]`)
- ✅ Update pricing page with new $9.99 tier
- ✅ Draft email to existing users (30-day notice)

### Week 3-4: Announcement
- ✅ Email all existing users: "Price increasing to $9.99 in 30 days (you keep $7.99 for 12 months)"
- ✅ Update homepage pricing table
- ✅ Update Stripe price IDs in signup flow
- ✅ Launch partner referral program (3 pilot partners)

### Week 5-8: Phase 1 Go-Live
- ✅ New users pay $9.99/month or $99/year
- ✅ Existing users stay at $7.99 (grandfathered)
- ✅ Monitor conversion rate (target: <10% drop)
- ✅ Track revenue increase (target: +12.5% net)

### Month 6: Phase 2 Evaluation
- ✅ Analyze Phase 1 results (conversion, churn, LTV)
- ✅ A/B test $14.99 pricing with new cohorts
- ✅ Launch Premium tier ($19.99) if demand exists
- ✅ Decide: Proceed with Phase 2 or stay at $9.99

---

## Revenue Projections

### Phase 1: $9.99 Pricing (Immediate)

**Assumptions:**
- Current: 500 users @ $7.99 = $3,995/month
- New pricing: $9.99/month
- Conversion impact: -10% (450 users)

**Projected Revenue:**
- Monthly subscribers: 270 × $9.99 = $2,697/month
- Annual subscribers: 180 × $8.25 = $1,485/month
- **Total: $4,182/month** (+$187/month, +4.7%)

**With 5% Conversion Impact:**
- Users: 475 (95% retention)
- Revenue: 475 × $9.99 (blended) = $4,470/month
- **Total: +$475/month (+11.9%)**

---

### Phase 2: $14.99 Pricing (6 Months Later)

**Assumptions:**
- Users: 500 (back to baseline after growth)
- New pricing: $14.99/month
- Conversion impact: -20% (400 users)

**Projected Revenue:**
- Monthly subscribers: 240 × $14.99 = $3,598/month
- Annual subscribers: 160 × $12.42 = $1,987/month
- **Total: $5,585/month** (+$1,590/month, +39.8%)

**Best Case (10% Conversion Impact):**
- Users: 450 (90% retention)
- Revenue: 450 × $14.99 (blended) = $6,370/month
- **Total: +$2,375/month (+59.4%)**

---

## Partner Referral Economics

### Partner Revenue Model

**For Partners:**
- 20% commission on all signups using their code
- Paid monthly via Stripe Connect or manual invoicing

**Example: Notion Partnership**
```
Month 1: 50 signups via PARTNER-NOTION
Month 2: 40 more signups (90 total active)
Month 3: 30 more signups (120 total active)

Partner Commission (Month 3):
- 120 users × $9.99 = $1,199 total revenue
- 20% commission = $240/month to Notion
- GiveCare keeps 80% = $959/month
- After costs ($2.84/user × 120 = $341), net profit = $618/month
```

**For GiveCare:**
- 80% of revenue = $959/month from 120 users
- Partner acquisition cost: $240/month (vs $10-20 CAC per user = $1,200-2,400)
- **ROI:** 4-10x better than paid ads

**Scaling:**
- 10 partners × 120 users each = 1,200 users
- Commission: 1,200 × $2/month = $2,400/month
- Revenue: 1,200 × $9.99 = $11,988/month
- **Net: $9,588/month** (after commission, before costs)

---

## Affordability Program Economics

### Financial Impact Analysis

**Assumptions:**
- 10% of users use affordability codes
- 5% use MEDICAID/SNAP ($0.99/month)
- 5% use CAREGIVER50 ($4.99/month)

**Scenario: 1,000 Users**
```
Full Price Users (900): 900 × $9.99 = $8,991/month
MEDICAID Users (50): 50 × $0.99 = $50/month (loss: -$142/month vs cost)
CAREGIVER50 Users (50): 50 × $4.99 = $250/month (profit: +$108/month)

Total Revenue: $9,291/month
Total Costs: 1,000 × $2.84 = $2,840/month
Gross Profit: $6,451/month (69% margin)
```

**Without Affordability Program:**
- Users: 950 (lose 50 who can't afford full price)
- Revenue: 950 × $9.99 = $9,491/month
- Costs: 950 × $2.84 = $2,698/month
- Gross Profit: $6,793/month (72% margin)

**Mission vs Margin Trade-Off:**
- Affordability program: -$342/month profit BUT +50 caregivers served
- Cost per additional caregiver: $342 ÷ 50 = $6.84/caregiver/month
- **Decision:** Worth it for mission (accessibility mandate)

---

## Competitor Comparison (Updated)

| Service | Monthly Price | Annual Price | GiveCare Positioning |
|---------|---------------|--------------|---------------------|
| **GiveCare (Current)** | $7.99 | $81.51 | Baseline |
| **GiveCare (Phase 1)** | $9.99 | $99 | 25% increase, still 23% cheaper than competitors |
| **GiveCare (Phase 2)** | $14.99 | $149 | Market rate, matches clinical value |
| **Wysa** | $12.99 | $74.99 | GiveCare 23% cheaper (Phase 1), 15% more (Phase 2) |
| **Youper** | $12.99 | $75 | GiveCare 23% cheaper (Phase 1), 15% more (Phase 2) |
| **Replika** | $19.99 | $70 | GiveCare 50% cheaper (Phase 1), 25% cheaper (Phase 2) |
| **Eve (Caregiver AI)** | $15-30 | N/A | GiveCare 33-67% cheaper (Phase 1), similar (Phase 2) |
| **BetterHelp (Therapy)** | $260-400 | N/A | GiveCare 96-97% cheaper (always) |

**Value Messaging:**
- **Phase 1 ($9.99):** "Professional caregiver support for 96% less than therapy, 23% less than AI competitors"
- **Phase 2 ($14.99):** "Clinical-grade AI with 4 validated assessments, crisis support, and proactive check-ins - still 95% cheaper than human therapy"

---

## Implementation Checklist

### Stripe Setup
- [x] Create CAREGIVER50 coupon (`U1vi08rY`)
- [x] Create MEDICAID coupon (`8BPnoFZJ`)
- [ ] Create SNAP coupon
- [ ] Create VETERAN coupon
- [ ] Create STUDENT coupon
- [ ] Create 3 pilot partner codes (PARTNER-ORG1, PARTNER-ORG2, PARTNER-ORG3)
- [ ] Update createCheckoutSession to accept couponCode parameter
- [ ] Test all coupon codes in Stripe test mode

### Frontend Changes
- [ ] Update pricing page (/pricing) with new $9.99 tier
- [ ] Add coupon code input to signup form
- [ ] Build affordability application page (/affordability)
- [ ] Build partner landing page template (/partners/[org])
- [ ] Update checkout flow to apply coupons
- [ ] Add "Need financial help?" link on pricing page → /affordability

### Backend Changes
- [ ] Update convex/stripe.ts to accept couponCode in createCheckoutSession
- [ ] Add coupon validation (check if code exists in Stripe)
- [ ] Track coupon usage in database (partner_referrals table)
- [ ] Generate partner commission reports (monthly via cron)
- [ ] Send partner impact emails (quarterly: "Your code helped X caregivers")

### Marketing & Communications
- [ ] Draft 30-day price increase email (to existing users)
- [ ] Create partner recruitment deck (benefits, commission structure, setup guide)
- [ ] Write affordability program landing page copy
- [ ] Update homepage hero: "From $9.99/month" (or "From $4.99/month with affordability code")
- [ ] Create partner welcome kit (landing page, email templates, social posts)

### Testing
- [ ] Test signup flow with CAREGIVER50 code
- [ ] Test signup flow with PARTNER-TEST code
- [ ] Test affordability application form
- [ ] Test partner landing page (custom URL)
- [ ] Test coupon expiration (3 months, 6 months, 12 months)
- [ ] Test price increase for grandfathered users (after 12 months)

---

## FAQs

### "Why are you raising prices?"

**Answer:** "We've added 3 new clinical assessments, 24/7 crisis support, and proactive wellness check-ins since launch. Our new pricing reflects this enhanced value while remaining 95% cheaper than therapy and competitive with other AI wellness apps. Plus, we're committed to affordability - if price is a barrier, visit givecareapp.com/affordability for financial assistance options."

### "Can I keep my current price?"

**Answer (Existing Users):** "Yes! As a valued existing user, you'll keep your current $7.99 price for the next 12 months. New users will pay $9.99 starting [date]."

**Answer (New Users):** "Our current price is $9.99/month, but we offer affordability codes for caregivers who qualify. Visit givecareapp.com/affordability to apply."

### "How do I get a partner referral code?"

**Answer:** "If you work for an organization interested in offering GiveCare to your community (employees, members, students), email partnerships@givecareapp.com. We'll create a custom code with a 20% commission on all signups."

### "What if I can't afford the new price?"

**Answer:** "We never want price to be a barrier. Visit givecareapp.com/affordability to apply for a discount code. We offer codes from $0.99-$4.99/month based on your situation (Medicaid, SNAP, veteran status, or general hardship). No income verification required - honor system."

---

## Appendix: Stripe Coupon Creation Scripts

### Create Partner Code
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY!);

async function createPartnerCode(orgName: string) {
  const coupon = await stripe.coupons.create({
    name: `PARTNER-${orgName.toUpperCase()}`,
    amount_off: 300, // $3 off
    currency: 'usd',
    duration: 'repeating',
    duration_in_months: 3,
    metadata: {
      type: 'partner_referral',
      org: orgName,
      commission_rate: '0.20'
    }
  });
  console.log(`Created partner code: ${coupon.name} (ID: ${coupon.id})`);
  return coupon;
}

// Usage:
createPartnerCode('notion');
createPartnerCode('mayo');
createPartnerCode('stanford');
```

### Create Affordability Code
```typescript
async function createAffordabilityCode(
  codeName: string,
  amountOff: number,
  durationMonths: number
) {
  const coupon = await stripe.coupons.create({
    name: codeName,
    amount_off: amountOff,
    currency: 'usd',
    duration: 'repeating',
    duration_in_months: durationMonths,
    metadata: {
      type: 'affordability',
      program: codeName.toLowerCase()
    }
  });
  console.log(`Created affordability code: ${coupon.name} (ID: ${coupon.id})`);
  return coupon;
}

// Usage:
createAffordabilityCode('SNAP', 900, 12); // $9 off for 12 months
createAffordabilityCode('VETERAN', 500, 12); // $5 off for 12 months
createAffordabilityCode('STUDENT', 500, 12); // $5 off for 12 months
```

---

**Document Owner:** Revenue & Product Teams
**Last Review:** 2025-10-11
**Next Review:** 2025-11-11 (monthly)
**Approval Required:** CEO (price changes >20%)
