# Stripe Coupons

**Updated:** 2025-01-08 | **Total:** 16 | **Source:** Stripe MCP

---

## Base Pricing

- Monthly: $9.99/month (`price_1RJ3l1AXk51qocidWUcvmNR1`)
- Annual: $99/year (`price_1RKnYwAXk51qocidnJFB39A1`)

**Note:** All coupons use fixed dollar amounts, not percentages. Values won't auto-adjust if base pricing changes.

---

## Active Coupons

### Financial Assistance (12 months)

| Code | Discount | Effective Price | Stripe ID |
|------|----------|----------------|-----------|
| MEDICAID | $9.00 off | $0.99/mo (90% off) | `h2RJm11w` |
| SNAP | $9.00 off | $0.99/mo (90% off) | `8BPnoFZJ` |
| VETERAN | $5.00 off | $4.99/mo (50% off) | `vuxLdjCS` |
| STUDENT | $5.00 off | $4.99/mo (50% off) | `YQddQd0S` |

### Partner Tracking (3 months)

| Code | Discount | Effective Price | Stripe ID |
|------|----------|----------------|-----------|
| PARTNER-401C | $2.00 off | $7.99/mo | `pdu3yiPI` |
| PARTNER-STORK | $2.00 off | $7.99/mo | `zuRTG1Y9` |

### Marketing & Promotional

| Code | Discount | Duration | Effective Price | Stripe ID |
|------|----------|----------|----------------|-----------|
| CARE12 | $9.00 off | Once | $0.99 first month | `Gqw36vA3` |
| CAREGIVER50 | $5.00 off | 6 months | $4.99/mo | `U1vi08rY` |
| LAUNCH2025 | $4.00 off | 3 months | $5.99/mo | `O7x47yIn` |
| FRIEND50 | $5.00 off | Once | $4.99 first month | `2ODjFMTz` |
| WELCOME50 ⚠️ | $4.00 off | Once | $5.99 first month | `u8NNTxHe` |
| CAREGIVER25 ⚠️ | $2.00 off | Once | $7.99 first month | `B3h659kW` |

⚠️ Redundant coupons (replaced by CARE12/CAREGIVER50)

### Assessment Rewards

| Code | Discount | Effective Price | Stripe ID |
|------|----------|----------------|-----------|
| BSFC20 | $2.00 off | $7.99 first month | `TRZM47tU` |

Auto-apply after BSFC assessment completion.

### Annual Plan

| Code | Discount | Effective Price | Stripe ID |
|------|----------|----------------|-----------|
| ANNUAL20 | $15.80 off | $83.20/year | `S8vmovFV` |

### Legacy (Hidden from new signups)

| Code | Discount | Duration | Effective Price | Stripe ID |
|------|----------|----------|----------------|-----------|
| Early Users | $4.00 off | 3 months | $5.99/mo | `GdMGNpdI` |
| Beta Testers | $7.99 off | 3 months | FREE | `b1Uc6xOI` |

---

## Recommended Actions

**Archive:** WELCOME50, CAREGIVER25 (redundant, one-time codes, no active users affected)

**Keep:** All other 14 coupons serve unique purposes

---

## Integration

**Backend:** `give-care-app/convex/stripe.ts`
**Frontend:** `give-care-site/app/components/sections/SignupFormConvex.tsx`
**Dashboard:** https://dashboard.stripe.com/coupons
**MCP:** `mcp__stripe-givecare__list_coupons`, `mcp__stripe-givecare__create_coupon`

**Cross-ref:** `give-care-site/docs/PRICING_UPDATE_2025-10-14.md` (contains outdated percentages)
