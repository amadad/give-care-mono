# Pricing Update - October 14, 2025

## Summary

Updated GiveCare subscription pricing across all landing page files to match production pricing.

---

## Changes Made

### Old Pricing
- **Monthly**: $7.99/month
- **Annual**: $81.51/year ($6.79/month)
- **Badge**: "Save 15%"

### New Pricing
- **Monthly**: $9.99/month ✅
- **Annual**: $99/year ($8.25/month) ✅
- **Badge**: "Save $20" ✅

---

## Files Updated

### 1. Main Component
**File**: `app/components/sections/SignupFormConvex.tsx`
- Line 163: Monthly price updated to $9.99
- Line 185: Annual price updated to $99
- Line 186: Monthly breakdown updated to $8.25/month
- Line 180: Badge updated to "Save $20"

### 2. Documentation
**Files**:
- `docs/CUSTOMER_JOURNEY_SYSTEM.md`
- `docs/SIGNUP_DEPLOYMENT_GUIDE.md`
- `docs/CONVEX_INTEGRATION_SUMMARY.md`

**Changes**: All references to $7.99 → $9.99 and $81.51 → $99

### 3. Backup Files (Not Updated)
**File**: `app/components/sections/SignupForm.tsx.backup`
- Contains old pricing (deprecated file)
- Left as-is for reference

---

## Pricing Rationale

### Monthly: $9.99
- Industry standard for caregiver support apps
- Competitive with Wellthy ($99/month), Honor Family ($0-50/month)
- Affordable for target demographic
- Sustainable unit economics with OpenAI + Twilio costs

### Annual: $99
- $20 savings vs monthly ($119.88 vs $99)
- 17% discount (not 15%)
- Encourages commitment (better retention)
- Reduces payment processing fees

---

## Stripe Configuration

### Price IDs (from .env.local)
```bash
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1RJ3l1AXk51qocidWUcvmNR1
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_1RKnYwAXk51qocidnJFB39A1
```

### Action Required
⚠️ **Verify Stripe Dashboard matches these prices**:
1. Go to Stripe Dashboard → Products
2. Check "GiveCare (Official)" product
3. Verify prices:
   - Monthly: $9.99 (price_1RJ3l1AXk51qocidWUcvmNR1)
   - Annual: $99 (price_1RKnYwAXk51qocidnJFB39A1)

If Stripe shows different amounts, update either:
- **Option A**: Update Stripe prices to match ($9.99 and $99)
- **Option B**: Update .env.local with correct Price IDs

---

## Promo Code Impacts

### Current Active Codes (15 total)

#### Affordability Program (5 codes)
| Code | Discount | New Price (Monthly) | New Price (Annual) |
|------|----------|---------------------|-------------------|
| **CAREGIVER50** | 50% off (6 months) | $4.99 | $49.50 |
| **MEDICAID** | 90% off (12 months) | $0.99 | $9.90 |
| **SNAP** | 90% off (12 months) | $0.99 | $9.90 |
| **VETERAN** | 75% off (12 months) | $2.49 | $24.75 |
| **STUDENT** | 60% off (12 months) | $3.99 | $39.60 |

#### Partner Tracking (2 codes)
| Code | Discount | New Price | Duration |
|------|----------|-----------|----------|
| **PARTNER-401C** | $2 off/month | $7.99 | 3 months |
| **PARTNER-STORK** | $2 off/month | $7.99 | 3 months |

#### Marketing (4 codes)
| Code | Discount | New Price |
|------|----------|-----------|
| **LAUNCH2025** | $4 off/month | $5.99 (3 months) |
| **ANNUAL20** | $20 off | $79 (once) |
| **FRIEND50** | $5 off | $4.99 (once) |
| **CAREGIVER25** | $2 off | $7.99 (once) |

#### Assessment Rewards (1 code)
| Code | Discount | New Price |
|------|----------|-----------|
| **BSFC20** | $2 off | $7.99 (once) |

#### Legacy (3 codes - Keep active, hide from UI)
| Code | Discount | New Price |
|------|----------|-----------|
| **WELCOME50** | $4 off | $5.99 (once) |
| **Early Users** | $4 off/month | $5.99 (3 months) |
| **Beta Testers** | Free | $0 (3 months) |

---

## Testing Checklist

### Pre-Deploy
- [x] Update main component pricing
- [x] Update documentation
- [x] Verify Stripe Price IDs in .env.local
- [ ] Check Stripe Dashboard prices match

### Post-Deploy
- [ ] Test signup with monthly plan ($9.99)
- [ ] Test signup with annual plan ($99)
- [ ] Test promo codes:
  - [ ] CAREGIVER50 → Should show $4.99/month
  - [ ] PARTNER-401C → Should show $7.99/month
  - [ ] MEDICAID → Should show $0.99/month
  - [ ] ANNUAL20 → Should show $79/year
- [ ] Verify Stripe checkout displays correct amounts
- [ ] Complete test payment with card 4242 4242 4242 4242
- [ ] Verify welcome SMS received
- [ ] Verify user can text agent

---

## Deployment

### Production Deployment
```bash
cd /Users/amadad/Projects/givecare/give-care-site
git add app/components/sections/SignupFormConvex.tsx docs/
git commit -m "Update pricing to $9.99/month and $99/year"
git push origin main

# Deploy via Vercel/Cloudflare
vercel --prod
```

### Rollback Plan
If issues arise:
1. Revert commit: `git revert HEAD`
2. Redeploy: `vercel --prod`
3. Or manually update prices back to $7.99 and $81.51

---

## Communication Plan

### Customer Communication (If Active Users Exist)
**Email Subject**: "Updated Pricing for New Members"

**Message**:
```
Hi [Name],

We wanted to let you know that starting [Date], our pricing for new members will be:
- Monthly: $9.99/month (was $7.99)
- Annual: $99/year (was $81.51)

Your current subscription is grandfathered at your original rate. No changes to your plan.

If you have friends or family who might benefit, they can still get up to 90% off with our affordability codes (MEDICAID, SNAP, VETERAN).

Thank you for being an early supporter!

- The GiveCare Team
```

### Marketing Updates
- [ ] Update pricing page (when created)
- [ ] Update FAQ
- [ ] Update ads/landing page copy
- [ ] Update partner agreements (if price-dependent)

---

## Financial Impact

### Old Pricing
- Monthly: $7.99 × 12 = $95.88/year
- Annual: $81.51/year
- Average: $88.70/year

### New Pricing
- Monthly: $9.99 × 12 = $119.88/year
- Annual: $99/year
- Average: $109.44/year

**Increase**: +23.4% average revenue per user (ARPU)

### Unit Economics (with new pricing)
**Assumptions**:
- Average 10 SMS/month per user
- 2 assessments/month
- 1000 users

**Monthly Costs**:
- Convex: FREE (under 10K users)
- OpenAI: $5 (10,000 msgs × $0.0005)
- Twilio: $79 (10,000 msgs × $0.0079)
- Stripe: ~$300 (3% fees on $9,990 revenue)
- **Total**: $384/month

**Monthly Revenue**:
- 1000 users × $9.99 = $9,990

**Profit Margin**: ($9,990 - $384) / $9,990 = **96.2%** 🎉

---

## Notes

- Pricing is now aligned with industry standards
- Maintains affordability via promo codes (up to 90% off)
- Improves unit economics while staying accessible
- Old Supabase backup files not updated (deprecated)

---

**Updated**: October 14, 2025
**Version**: 1.0.0
**Status**: ✅ Ready for deployment
