# GiveCare Pricing Quick Reference

**Version:** 2.0.0
**Last Updated:** 2025-10-11

---

## 📊 **CURRENT PRICING**

### Standard Tier
- **Monthly:** $7.99/month
- **Annual:** $81.51/year ($6.79/month)

---

## 🚀 **NEW PRICING (Recommended)**

### Phase 1: Immediate (30-Day Notice)
- **Monthly:** $9.99/month (+25%)
- **Annual:** $99/year ($8.25/month)

### Phase 2: After 6 Months
- **Standard:** $14.99/month ($149/year)
- **Premium:** $19.99/month ($199/year)

---

## 🎟️ **ALL ACTIVE COUPON CODES**

### Partner Referral (Org-Specific)
| Code Format | Discount | Duration | Commission | Stripe ID |
|-------------|----------|----------|------------|-----------|
| `PARTNER-[ORG]` | $3 off/month | 3 months | 20% to partner | Create per org |

**Example Codes:** `PARTNER-NOTION`, `HEALTH-MAYO`, `EDU-STANFORD`

---

### Affordability Program
| Code | Discount | Duration | Final Price @ $9.99 | Stripe ID |
|------|----------|----------|-------------------|-----------|
| **CAREGIVER50** | $5 off/month | 6 months | $4.99/month | `U1vi08rY` |
| **MEDICAID** | $9 off/month | 12 months | $0.99/month | `8BPnoFZJ` |
| **SNAP** | $9 off/month | 12 months | $0.99/month | `h2RJm11w` |
| **VETERAN** | $5 off/month | 12 months | $4.99/month | `vuxLdjCS` |
| **STUDENT** | $5 off/month | 12 months | $4.99/month | `YQddQd0S` |

---

### Launch & Marketing
| Code | Discount | Duration | Use Case | Stripe ID |
|------|----------|----------|----------|-----------|
| **LAUNCH2025** | $4 off/month | 3 months | Launch promo | `O7x47yIn` |
| **ANNUAL20** | $15.80 off | Once | Annual discount | `S8vmovFV` |
| **FRIEND50** | $5 off | Once | Referrals | `2ODjFMTz` |
| **CAREGIVER25** | $2 off | Once | First signup | `B3h659kW` |

---

### Legacy (Keep Active, Remove from UI)
| Code | Discount | Duration | Status |
|------|----------|----------|--------|
| **WELCOME50** | $4 off | Once | ✅ Active |
| **Early Users** | $4 off/month | 3 months | ✅ Active |
| **Beta Testers** | $7.99 off/month | 3 months | ✅ Active |
| **TEST25** | $7.99 off forever | ❌ Remove from UI |
| **TRYFREE** | 100% off forever | ❌ Remove from UI |

---

## 💡 **WHEN TO USE EACH CODE**

### Customer Says: "Price is too high"
→ **Give:** `CAREGIVER50` ($4.99/month for 6 months)

### Customer Says: "I'm on Medicaid/SNAP"
→ **Give:** `MEDICAID` or `SNAP` ($0.99/month for 12 months)

### Customer Says: "I'm a veteran/caregiver"
→ **Give:** `VETERAN` ($4.99/month for 12 months)

### Customer Says: "I'm a student"
→ **Give:** `STUDENT` ($4.99/month for 12 months)

### Partner/Org Wants to Offer GiveCare
→ **Create:** `PARTNER-[ORGNAME]` (20% commission)
→ **Example:** Notion partnership = `PARTNER-NOTION`

### One-Time Referral/Gift
→ **Give:** `FRIEND50` ($5 off once)

---

## 🔗 **KEY URLS**

- **Affordability Application:** `givecareapp.com/affordability`
- **Partner Landing Page:** `givecareapp.com/partners/[org-name]`
- **Pricing Page:** `givecareapp.com/pricing`

---

## 📝 **CUSTOMER SUPPORT SCRIPTS**

### Script 1: "I can't afford $9.99"
```
"I understand. We never want price to be a barrier. Visit
givecareapp.com/affordability to apply for a discount code.
We offer codes from $0.99-$4.99/month based on your situation.
No income verification needed."

Code to give: CAREGIVER50 (if they ask directly)
```

### Script 2: "I'm on government assistance"
```
"Great news - we have a special rate for Medicaid/SNAP recipients.
Use code MEDICAID at checkout for just $0.99/month for 12 months."

Codes: MEDICAID, SNAP (both same discount)
```

### Script 3: "Does my employer/org offer this?"
```
"Let me check! What organization do you work for? If they're
not a partner yet, I can have our team reach out to set up a
partnership where you'd get a discount code."

Action: Create PARTNER-[ORGNAME] code if org signs up
```

### Script 4: "Can I refer a friend?"
```
"Yes! Share this link: givecareapp.com/signup?ref=FRIEND50
Your friend gets $5 off, and you get a free month when they subscribe."

Code: FRIEND50 (auto-applied via URL)
```

---

## ⚙️ **TECHNICAL IMPLEMENTATION**

### Frontend (Signup Form)
```tsx
<input
  type="text"
  placeholder="Coupon code (optional)"
  value={couponCode}
  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
/>

// Pass to Convex
const checkoutUrl = await createCheckout({
  fullName,
  email,
  phoneNumber,
  priceId,
  couponCode, // ← Add this
});
```

### Backend (convex/stripe.ts)
Already updated! ✅
- Accepts `couponCode` parameter
- Validates coupon via Stripe API
- Applies discount to checkout session
- Tracks coupon usage in metadata

---

## 📈 **REVENUE IMPACT ESTIMATES**

### Phase 1: $9.99 Pricing
- **Current:** 500 users @ $7.99 = $3,995/month
- **New:** 475 users @ $9.99 = $4,745/month
- **Impact:** +$750/month (+18.8%) with 5% churn

### Phase 2: $14.99 Pricing
- **New:** 450 users @ $14.99 = $6,746/month
- **Impact:** +$2,751/month (+68.9%) with 10% churn

### Partner Referral Program
- 10 partners × 120 users = 1,200 users
- Revenue: 1,200 × $9.99 = $11,988/month
- Commission: 1,200 × $2 = $2,400/month
- **Net:** $9,588/month (after commission)

### Affordability Program Impact
- 10% of users (50/500) use codes
- Cost: -$142/month (MEDICAID users at $0.99)
- Benefit: +50 caregivers served who couldn't afford full price
- **Mission trade-off:** Worth it for accessibility

---

## ✅ **IMPLEMENTATION CHECKLIST**

### Stripe Setup
- [x] Create CAREGIVER50 coupon
- [x] Create MEDICAID coupon
- [x] Create SNAP coupon
- [x] Create VETERAN coupon
- [x] Create STUDENT coupon
- [x] Update convex/stripe.ts with couponCode support
- [ ] Test all codes in Stripe test mode

### Frontend
- [ ] Add coupon input to signup form
- [ ] Build /affordability page
- [ ] Build /partners/[org] template
- [ ] Update /pricing page with new $9.99 tier
- [ ] Add "Need help affording?" link

### Testing
- [ ] Test CAREGIVER50 code at checkout
- [ ] Test MEDICAID code at checkout
- [ ] Test invalid code handling
- [ ] Test partner code (create PARTNER-TEST)
- [ ] Verify discount appears in Stripe Dashboard

---

## 🚨 **COMMON ISSUES & FIXES**

### Issue: "Coupon code not working"
**Check:**
1. Is code typed correctly? (case-insensitive)
2. Is code expired? (check duration_in_months)
3. Is code valid in Stripe Dashboard?

**Fix:**
```bash
# Check code in Stripe
npx ts-node -e "
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_KEY);
stripe.coupons.retrieve('CAREGIVER50').then(console.log);
"
```

### Issue: "Partner wants custom commission rate"
**Solution:** Create custom coupon with different metadata:
```typescript
await stripe.coupons.create({
  name: 'PARTNER-ACME',
  amount_off: 300,
  currency: 'usd',
  duration: 'repeating',
  duration_in_months: 3,
  metadata: {
    commission_rate: '0.25' // 25% instead of 20%
  }
});
```

### Issue: "User says discount didn't apply"
**Check:**
1. Look up Stripe subscription in Dashboard
2. Check metadata for `couponCode` field
3. Verify `discounts` array in subscription object

**Example:**
```
Subscription ID: sub_ABC123
Metadata: { couponCode: 'CAREGIVER50', userId: '...' }
Discounts: [{ coupon: 'CAREGIVER50', start: 1633024800, end: 1648598400 }]
```

---

## 📞 **SUPPORT CONTACTS**

- **Pricing Questions:** support@givecareapp.com
- **Partnership Inquiries:** partnerships@givecareapp.com
- **Technical Issues:** dev@givecareapp.com

---

**Quick Links:**
- Full Pricing Strategy: [`PRICING_STRATEGY.md`](PRICING_STRATEGY.md)
- Stripe Integration Guide: [`STRIPE_CONVEX_INTEGRATION.md`](STRIPE_CONVEX_INTEGRATION.md)
- Competitive Analysis: [`docs/PRICING_COMPETITIVE_ANALYSIS.md`](docs/PRICING_COMPETITIVE_ANALYSIS.md)
