# Stripe Cleanup Audit

**Date:** 2025-10-11
**Account:** Live Mode
**Status:** 🚨 CLEANUP NEEDED

---

## 📦 **PRODUCTS AUDIT**

### ✅ **KEEP (1 Product)**

| Product ID | Name | Status | Price | Lookup Key | Reason |
|------------|------|--------|-------|------------|--------|
| `prod_SDUkeJ6wMtUviV` | **GiveCare (Official)** | ✅ Active | $7.99/mo, $79/yr | `givecare_premium_monthly`, `givecare_premium_annual` | **PRIMARY PRODUCT** |

---

### ❌ **ARCHIVE (9 Products)**

#### GiveCare Duplicates (Archive These)
| Product ID | Name | Status | Issue |
|------------|------|--------|-------|
| `prod_SFI9qzAOq1h8Ku` | GiveCare (Annual) | Active | **DUPLICATE** - Archive, use Official product |
| `prod_SFI7ndnLqdKS37` | GiveCare (Annual) | Active | **DUPLICATE** - Archive, use Official product |
| `prod_SFI6GhDRPDegEC` | (Copy) GiveCare (Official) | Active | **DUPLICATE COPY** - Archive |
| `prod_SDV5GR5uxLPi4X` | GiveCare | Inactive | Old version, already inactive |
| `prod_SDUpb4oAsuEGEn` | GiveCare | Inactive | Old version, already inactive |
| `prod_SDUn3egDQJ6907` | (Copy) GiveCare | Inactive | Old version, already inactive |
| `prod_RX1grpQIafZHx3` | GiveCare | Inactive | Old version, already inactive |

#### Unrelated Products (Already Inactive)
| Product ID | Name | Status | Notes |
|------------|------|--------|-------|
| `prod_Rw5yMLYUzUDeOy` | GiveCare LinkedIn Update | Inactive | Not related to subscriptions |
| `prod_Rw5xiK2wYRfJQf` | GiveCare Weekly Update | Inactive | Not related to subscriptions |
| `prod_Ob57XlWoJfJlHN` | Monthly Plus Subscription | Inactive | Old business, not GiveCare |
| `prod_Ob56H7DwUXzqcS` | Monthly Core Subscription | Inactive | Old business, not GiveCare |
| `prod_OHF1Zj66HXOqMd` | Summer Intern (Strategist) | Inactive | Old business, not GiveCare |
| `prod_O5wSEfn8C5bp6p` | Membership Add-On | Inactive | Old business, not GiveCare |
| `prod_O2qSHidg5WJNMj` | Test Product | Inactive | Old test, not GiveCare |
| `prod_O1OnbvgcYizxEO` | Annual Membership | Inactive | Old business, not GiveCare |
| `prod_O1Omz3A6K1He96` | Quarterly Membership | Inactive | Old business, not GiveCare |
| `prod_O1OlcK6YgfdYwl` | Monthly Subscription | Inactive | Old business, not GiveCare |

---

## 💰 **PRICES AUDIT**

### ✅ **KEEP (2 Prices for Official Product)**

| Price ID | Product | Amount | Interval | Lookup Key | Status |
|----------|---------|--------|----------|------------|--------|
| `price_1RJ3l1AXk51qocidWUcvmNR1` | GiveCare (Official) | $7.99 | Monthly | `givecare_premium_monthly` | ✅ **CURRENT MONTHLY** |
| `price_1RKnYwAXk51qocidnJFB39A1` | GiveCare (Annual) | $79.00 | Yearly | `givecare_premium_annual` | ✅ **CURRENT ANNUAL** |

---

### 🆕 **CREATE (2 New Prices for $9.99 Pricing)**

| Price to Create | Product | Amount | Interval | Lookup Key | Purpose |
|-----------------|---------|--------|----------|------------|---------|
| **New Monthly** | `prod_SDUkeJ6wMtUviV` | $9.99 | Monthly | `givecare_standard_monthly` | New standard monthly price |
| **New Annual** | `prod_SDUkeJ6wMtUviV` | $99.00 | Yearly | `givecare_standard_annual` | New standard annual price |

---

### ❌ **ARCHIVE (15 Old Prices)**

#### Duplicate GiveCare Prices (from duplicate products)
| Price ID | Product | Amount | Status | Issue |
|----------|---------|--------|--------|-------|
| `price_1RKnX9AXk51qocidcZNeMJg0` | GiveCare (Annual) duplicate | $7.99 | Active | Duplicate product price |
| `price_1RKnW0AXk51qocidZrT4scJQ` | (Copy) GiveCare (Official) | $7.99 | Active | Duplicate product price |
| `price_1RJ45aAXk51qocid4wHXGiVZ` | GiveCare (inactive) | $7.99 | Active | Old product, already inactive |
| `price_1RJ3q2AXk51qocidRWFgyoPk` | GiveCare (inactive) | $7.99 | Active | Old product, already inactive |
| `price_1RJ3nsAXk51qocidkhCj7Otw` | (Copy) GiveCare (inactive) | $7.99 | Active | Old product, already inactive |
| `price_1R6WOKAXk51qocidj8uHcCCk` | GiveCare (inactive) | $7.99 | Active | Old product, already inactive |
| `price_1QdxdcAXk51qocidIeLPL2ui` | GiveCare (inactive) | $6.99 | Inactive | Old test price |

#### Old Business Prices (not GiveCare)
| Price ID | Product | Amount | Notes |
|----------|---------|--------|-------|
| `price_1NnswyAXk51qocid9vLWVXSL` | Monthly Plus | $6,995.00 | Old business |
| `price_1Nnsw8AXk51qocidVrD1qwR4` | Monthly Core | $5,995.00 | Old business |
| `price_1NUgXQAXk51qocid0S6x4h2x` | Summer Intern | $5.00 | Old business |
| `price_1NJkZGAXk51qocidLg2jsf1T` | Membership Add-On | $999.00 | Old business |
| `price_1NGkloAXk51qocidq7WVz21z` | Test Product | $1.00 | Old test |
| `price_1NFLzYAXk51qocidP0aDVKOL` | Annual Membership | $59,940.00 | Old business |
| `price_1NFLyqAXk51qocidYSSWZuNc` | Quarterly Membership | $16,485.00 | Old business |
| `price_1NFLxaAXk51qocidHFgBUwYr` | Monthly Subscription | $5,995.00 | Old business |

---

## 🎟️ **COUPONS AUDIT**

### ✅ **KEEP (11 Active Coupons)**

#### Partner Referral (2 codes)
| Code | Stripe ID | Discount | Duration | Purpose |
|------|-----------|----------|----------|---------|
| `PARTNER-401C` | `pdu3yiPI` | $2 off/mo | 3 months | 401C partner tracking |
| `PARTNER-STORK` | `zuRTG1Y9` | $2 off/mo | 3 months | Stork partner tracking |

#### Affordability Program (5 codes)
| Code | Stripe ID | Discount | Duration | Purpose |
|------|-----------|----------|----------|---------|
| `CAREGIVER50` | `U1vi08rY` | $5 off/mo | 6 months | General hardship |
| `MEDICAID` | `8BPnoFZJ` | $9 off/mo | 12 months | Medicaid recipients |
| `SNAP` | `h2RJm11w` | $9 off/mo | 12 months | SNAP benefits |
| `VETERAN` | `vuxLdjCS` | $5 off/mo | 12 months | Military caregivers |
| `STUDENT` | `YQddQd0S` | $5 off/mo | 12 months | College students |

#### Marketing Codes (4 codes)
| Code | Stripe ID | Discount | Duration | Purpose |
|------|-----------|----------|----------|---------|
| `LAUNCH2025` | `O7x47yIn` | $4 off/mo | 3 months | Launch promo |
| `ANNUAL20` | `S8vmovFV` | $15.80 off | Once | Annual discount |
| `FRIEND50` | `2ODjFMTz` | $5 off | Once | Referrals |
| `CAREGIVER25` | `B3h659kW` | $2 off | Once | First signup |

---

### ⚠️ **KEEP BUT REMOVE FROM UI (3 Legacy Codes)**

| Code | Stripe ID | Discount | Issue |
|------|-----------|----------|-------|
| `WELCOME50` | `u8NNTxHe` | $4 off once | Legacy, honor existing users |
| `Early Users` | `GdMGNpdI` | $4 off/mo 3mo | Legacy, honor beta users |
| `Beta Testers` | `b1Uc6xOI` | $7.99 off/mo 3mo | Legacy, honor beta users (free) |

---

### 🗑️ **DELETE OR DEACTIVATE (3 Dangerous Codes)**

| Code | Stripe ID | Discount | Issue | Action |
|------|-----------|----------|-------|--------|
| `TEST25` | `4Id7zJV7` | $7.99 off FOREVER | **DANGEROUS** - free forever | ❌ **DELETE** |
| `TRYFREE` | `kGNF3v8N` | 100% off FOREVER | **DANGEROUS** - 100% free forever | ❌ **DELETE** |
| `PARTNER_TEMPLATE` | `ZV7qHdDk` | $3 off/mo 3mo | Unused template | ❌ **DELETE** |

---

## 🚨 **CLEANUP ACTION PLAN**

### Phase 1: Archive Duplicate Products (Do This First)

**Why First?** Prevents accidental use of wrong products in signup flow.

**Products to Archive via Stripe Dashboard:**
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Archive these 3 **active** duplicate products:
   - `prod_SFI9qzAOq1h8Ku` - GiveCare (Annual)
   - `prod_SFI7ndnLqdKS37` - GiveCare (Annual)
   - `prod_SFI6GhDRPDegEC` - (Copy) GiveCare (Official)
3. Leave `prod_SDUkeJ6wMtUviV` (GiveCare Official) as the only active product

**Result:** Only 1 active GiveCare product in Stripe.

---

### Phase 2: Create New $9.99 Prices

**Create these 2 prices via Stripe Dashboard or API:**

```bash
# Monthly $9.99 price
stripe prices create \
  --product prod_SDUkeJ6wMtUviV \
  --unit-amount 999 \
  --currency usd \
  --recurring[interval]=month \
  --lookup-key givecare_standard_monthly \
  --metadata[tier]=standard

# Annual $99 price
stripe prices create \
  --product prod_SDUkeJ6wMtUviV \
  --unit-amount 9900 \
  --currency usd \
  --recurring[interval]=year \
  --lookup-key givecare_standard_annual \
  --metadata[tier]=standard
```

**Result:** You'll have 4 total prices:
- $7.99/month (legacy, keep for grandfathered users)
- $79/year (legacy, keep for grandfathered users)
- $9.99/month (new standard)
- $99/year (new standard)

---

### Phase 3: Archive Old Prices

**Prices to Archive (via Stripe Dashboard):**

**From Duplicate Products:**
- `price_1RKnX9AXk51qocidcZNeMJg0` ($7.99/mo - duplicate)
- `price_1RKnW0AXk51qocidZrT4scJQ` ($7.99/mo - duplicate)
- `price_1RJ45aAXk51qocid4wHXGiVZ` ($7.99/mo - old product)
- `price_1RJ3q2AXk51qocidRWFgyoPk` ($7.99/mo - old product)
- `price_1RJ3nsAXk51qocidkhCj7Otw` ($7.99/mo - old product)
- `price_1R6WOKAXk51qocidj8uHcCCk` ($7.99/mo - old product)

**From Old Business:**
- All 8 prices from old business (Monthly Plus, Core, etc.)

**Result:** Only 4 active GiveCare prices remain.

---

### Phase 4: Delete Dangerous Coupons

**⚠️ CRITICAL: These coupons allow FREE access forever**

**Delete via Stripe Dashboard:**
1. Go to [Stripe Dashboard → Coupons](https://dashboard.stripe.com/coupons)
2. Find and delete:
   - `TEST25` (ID: `4Id7zJV7`) - $7.99 off forever = FREE
   - `TRYFREE` (ID: `kGNF3v8N`) - 100% off forever = FREE
   - `PARTNER_TEMPLATE` (ID: `ZV7qHdDk`) - Unused template

**Result:** No dangerous "free forever" codes in production.

---

### Phase 5: Update Signup Form

**Update your signup form to use new price IDs:**

```tsx
<select value={priceId} onChange={...}>
  <option value="price_NEW_MONTHLY_ID_HERE">
    Monthly - $9.99/month
  </option>
  <option value="price_NEW_ANNUAL_ID_HERE">
    Annual - $99/year (Save $20!)
  </option>
</select>
```

**Replace after creating prices in Phase 2.**

---

## 📊 **BEFORE vs AFTER**

### Before Cleanup
- **Products:** 18 total (4 active GiveCare, 14 inactive old business)
- **Prices:** 17 total (8 active GiveCare duplicates, 9 old business)
- **Coupons:** 17 total (including 2 dangerous "free forever" codes)
- **Issue:** Confusing which product/price to use, risk of using wrong ones

### After Cleanup
- **Products:** 1 active (GiveCare Official), 17 archived
- **Prices:** 4 active ($7.99 legacy, $79 legacy, $9.99 new, $99 new)
- **Coupons:** 14 total (11 active + 3 legacy, 0 dangerous)
- **Result:** Clean, organized, safe to use

---

## ✅ **FINAL CHECKLIST**

### Stripe Dashboard Actions
- [ ] Archive 3 duplicate GiveCare products
- [ ] Create new $9.99/month price for Official product
- [ ] Create new $99/year price for Official product
- [ ] Archive 6 duplicate GiveCare prices
- [ ] Archive 8 old business prices (optional, already inactive)
- [ ] Delete TEST25 coupon
- [ ] Delete TRYFREE coupon
- [ ] Delete PARTNER_TEMPLATE coupon

### Code Updates
- [ ] Update signup form with new price IDs
- [ ] Update pricing page with $9.99 tier
- [ ] Test checkout with new prices
- [ ] Test coupons with new prices
- [ ] Verify legacy users still see $7.99

### Documentation
- [ ] Update STRIPE_SETUP.md with new price IDs
- [ ] Update PRICING_QUICK_REFERENCE.md
- [ ] Document which price IDs are legacy vs new

---

## 🔗 **Quick Links**

- **Stripe Dashboard - Products:** https://dashboard.stripe.com/products
- **Stripe Dashboard - Prices:** https://dashboard.stripe.com/prices
- **Stripe Dashboard - Coupons:** https://dashboard.stripe.com/coupons
- **Stripe CLI Docs:** https://stripe.com/docs/cli

---

## 📝 **Notes**

### Why Keep Legacy $7.99 Prices?
- Existing subscribers are on these prices
- Archiving would break their subscriptions
- Keep active but don't show on signup form (use new $9.99 prices)

### What Happens to Old Subscriptions?
- Existing users keep their current price (no change)
- When they cancel and re-subscribe, they'll see new $9.99 pricing
- You can manually migrate users later (optional)

### Can I Delete Products/Prices?
- **No** - Stripe doesn't allow deletion of products/prices with active subscriptions
- **Archive instead** - Hides from dashboard but keeps existing subscriptions working

---

**Ready to clean up? Start with Phase 1 (archive duplicate products)!**
