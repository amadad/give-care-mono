# Stripe Cleanup Action Plan

**Date Created:** 2025-10-11
**Status:** Ready to Execute
**Estimated Time:** 30-45 minutes

---

## 🎯 **OBJECTIVE**

Clean up your Stripe account to have:
- **1 active product** (GiveCare Official)
- **4 active prices** ($7.99 legacy, $79 legacy, $9.99 new, $99 new)
- **14 safe coupons** (remove 3 dangerous ones)

---

## ⚠️ **CRITICAL: Do These Steps IN ORDER**

**Why?** Archiving products before creating new prices prevents confusion and ensures clean setup.

---

## 📋 **PHASE 1: Environment Setup** (5 minutes)

### Set Convex Environment Variables

These are required for the Stripe integration to work:

```bash
# Navigate to give-care-type directory
cd /Users/amadad/Projects/givecare/give-care-type

# Set Stripe keys (replace with your actual keys)
npx convex env set STRIPE_KEY sk_live_YOUR_ACTUAL_KEY_HERE
npx convex env set STRIPE_WEBHOOKS_SECRET whsec_YOUR_ACTUAL_SECRET_HERE
npx convex env set HOSTING_URL https://www.givecareapp.com

# Verify they're set
npx convex env list | grep -E "(STRIPE|HOSTING)"
```

**Expected Output:**
```
STRIPE_KEY: sk_live_...
STRIPE_WEBHOOKS_SECRET: whsec_...
HOSTING_URL: https://www.givecareapp.com
```

**Where to find these values:**
- `STRIPE_KEY`: [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
- `STRIPE_WEBHOOKS_SECRET`: [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks) → Click your webhook → "Signing secret"
- `HOSTING_URL`: Your production domain (givecareapp.com)

---

## 📦 **PHASE 2: Archive Duplicate Products** (10 minutes)

**Why First?** Prevents accidentally using wrong products in signup flow.

### Steps:

1. **Open Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/products
   - Make sure you're in **Live Mode** (top-right toggle)

2. **Archive These 3 Products:**

   | Product Name | Product ID | Action |
   |--------------|------------|--------|
   | GiveCare (Annual) | `prod_SFI9qzAOq1h8Ku` | Archive |
   | GiveCare (Annual) | `prod_SFI7ndnLqdKS37` | Archive |
   | (Copy) GiveCare (Official) | `prod_SFI6GhDRPDegEC` | Archive |

3. **How to Archive Each Product:**
   - Find the product in the list
   - Click the **⋯** (overflow menu) on the right
   - Select **Archive product**
   - Confirm the action

4. **Verify:**
   - Only **1 active product** should remain: `GiveCare (Official)` (`prod_SDUkeJ6wMtUviV`)
   - You may need to hide "Archived" products using the filter dropdown

**✅ Checkpoint:** You should now have exactly 1 active GiveCare product.

---

## 💰 **PHASE 3: Create New $9.99 Prices** (10 minutes)

**Method 1: Stripe CLI** (Recommended if installed)

```bash
# Install Stripe CLI if not already installed
# macOS: brew install stripe/stripe-cli/stripe
# Other: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Create monthly $9.99 price
stripe prices create \
  --product prod_SDUkeJ6wMtUviV \
  --unit-amount 999 \
  --currency usd \
  -d "recurring[interval]=month" \
  --lookup-key givecare_standard_monthly \
  -d "metadata[tier]=standard"

# Create annual $99 price
stripe prices create \
  --product prod_SDUkeJ6wMtUviV \
  --unit-amount 9900 \
  --currency usd \
  -d "recurring[interval]=year" \
  --lookup-key givecare_standard_annual \
  -d "metadata[tier]=standard"
```

**Method 2: Stripe Dashboard** (Alternative)

1. Go to: https://dashboard.stripe.com/products
2. Click on **GiveCare (Official)** product (`prod_SDUkeJ6wMtUviV`)
3. Scroll to **Pricing** section
4. Click **+ Add another price**

**For Monthly Price ($9.99):**
- **Pricing model**: Standard pricing
- **Type**: Recurring
- **Price**: $9.99 USD
- **Billing period**: Monthly
- **Lookup key**: `givecare_standard_monthly`
- **Metadata**: Add key `tier` with value `standard`
- Click **Add price**

**For Annual Price ($99):**
- Click **+ Add another price** again
- **Pricing model**: Standard pricing
- **Type**: Recurring
- **Price**: $99 USD
- **Billing period**: Yearly
- **Lookup key**: `givecare_standard_annual`
- **Metadata**: Add key `tier` with value `standard`
- Click **Add price**

**✅ Checkpoint:** Product `prod_SDUkeJ6wMtUviV` should now have 4 prices:
- `price_1RJ3l1AXk51qocidWUcvmNR1` - $7.99/month (legacy)
- `price_1RKnYwAXk51qocidnJFB39A1` - $79/year (legacy)
- New price ID - $9.99/month (standard)
- New price ID - $99/year (standard)

**📝 SAVE THE NEW PRICE IDs:** You'll need these for the frontend update!

---

## 🗑️ **PHASE 4: Delete Dangerous Coupons** (5 minutes)

**⚠️ CRITICAL:** These coupons allow FREE access forever.

### Steps:

1. **Open Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/coupons
   - Make sure you're in **Live Mode**

2. **Delete These 3 Coupons:**

   | Code | Stripe ID | Why Dangerous |
   |------|-----------|---------------|
   | `TEST25` | `4Id7zJV7` | $7.99 off forever = FREE |
   | `TRYFREE` | `kGNF3v8N` | 100% off forever = FREE |
   | `PARTNER_TEMPLATE` | `ZV7qHdDk` | Unused template |

3. **How to Delete Each Coupon:**
   - Find the coupon in the list (use search if needed)
   - Click on the coupon to open details
   - Click **Delete** button
   - Confirm deletion

**✅ Checkpoint:** Verify these 3 codes are GONE from your coupon list.

---

## 📋 **PHASE 5: Archive Old Prices** (Optional, 10 minutes)

**Note:** This step is optional since these prices are from duplicate/inactive products and won't appear in your signup flow anyway. However, archiving them keeps your dashboard clean.

### Prices to Archive:

**From Duplicate Products:**
- `price_1RKnX9AXk51qocidcZNeMJg0` ($7.99/mo - duplicate)
- `price_1RKnW0AXk51qocidZrT4scJQ` ($7.99/mo - duplicate)
- `price_1RJ45aAXk51qocid4wHXGiVZ` ($7.99/mo - old product)
- `price_1RJ3q2AXk51qocidRWFgyoPk` ($7.99/mo - old product)
- `price_1RJ3nsAXk51qocidkhCj7Otw` ($7.99/mo - old product)
- `price_1R6WOKAXk51qocidj8uHcCCk` ($7.99/mo - old product)

**From Old Business (already inactive):**
- All 8 old business prices (Monthly Plus, Core, etc.)

### How to Archive:
1. Go to: https://dashboard.stripe.com/prices
2. Search for each price ID
3. Click **⋯** → **Archive**

**✅ Checkpoint:** Only 4 prices remain active for `prod_SDUkeJ6wMtUviV`.

---

## 🧪 **PHASE 6: Test the Integration** (10 minutes)

### Test Checklist:

```bash
# 1. Test environment variables are set
npx convex env list | grep STRIPE

# 2. Deploy latest code to Convex
npx convex deploy --prod

# 3. Check Convex logs for any errors
npx convex logs --prod
```

### Test Signup Flow:

1. **Go to:** https://www.givecareapp.com/signup
2. **Fill out form:**
   - Name: Test User
   - Email: your-email+test@example.com
   - Phone: +1234567890 (test number)
   - Plan: Select the NEW $9.99/month price
3. **Add coupon code:** Try `CAREGIVER50`
4. **Expected:** Stripe Checkout shows $4.99/month (with discount applied)
5. **Complete payment** with test card: `4242 4242 4242 4242`
6. **Expected:**
   - Redirected to welcome page
   - Receive welcome SMS (if Twilio configured)
   - User record created in Convex with status "active"

### Test Subscription Validation:

1. **Text your GiveCare number** from a phone not subscribed
2. **Expected:** Receive signup link message, NOT agent response
3. **Text your GiveCare number** from subscribed phone
4. **Expected:** Agent responds normally

---

## 📊 **BEFORE vs AFTER**

### Before Cleanup:
- **Products:** 4 active (confusing which to use)
- **Prices:** 8 active (duplicates everywhere)
- **Coupons:** 17 total (including dangerous ones)

### After Cleanup:
- **Products:** 1 active (`prod_SDUkeJ6wMtUviV`)
- **Prices:** 4 active (2 legacy, 2 new)
- **Coupons:** 14 safe codes (3 dangerous ones deleted)

---

## ✅ **FINAL CHECKLIST**

### Stripe Dashboard Actions:
- [ ] Set STRIPE_KEY in Convex
- [ ] Set STRIPE_WEBHOOKS_SECRET in Convex
- [ ] Set HOSTING_URL in Convex
- [ ] Archived 3 duplicate GiveCare products
- [ ] Created $9.99/month price (saved new price ID)
- [ ] Created $99/year price (saved new price ID)
- [ ] Deleted TEST25 coupon
- [ ] Deleted TRYFREE coupon
- [ ] Deleted PARTNER_TEMPLATE coupon
- [ ] (Optional) Archived 6 duplicate prices
- [ ] (Optional) Archived 8 old business prices

### Code Updates:
- [ ] Updated signup form with new price IDs
- [ ] Tested signup flow with new prices
- [ ] Tested coupon code application
- [ ] Tested subscription validation
- [ ] Verified welcome SMS sends

### Documentation:
- [ ] Updated STRIPE_SETUP.md with new price IDs
- [ ] Updated PRICING_QUICK_REFERENCE.md
- [ ] Documented legacy vs new price IDs

---

## 🚨 **TROUBLESHOOTING**

### Issue: "Can't archive product - has active subscriptions"
**Solution:** This is expected for products with existing customers. Use the Dashboard filter to hide archived products instead of deleting them.

### Issue: "Coupon code not working at checkout"
**Check:**
1. Is code spelled correctly? (case-insensitive)
2. Is code still active in Stripe Dashboard?
3. Check browser console for errors
4. Verify `convex/stripe.ts` has coupon validation code (line 65-80)

### Issue: "Environment variables not found"
**Solution:**
```bash
# Re-run these commands
npx convex env set STRIPE_KEY sk_live_YOUR_KEY
npx convex env set STRIPE_WEBHOOKS_SECRET whsec_YOUR_SECRET
npx convex env set HOSTING_URL https://www.givecareapp.com

# Verify
npx convex env list
```

### Issue: "Welcome SMS not sending"
**Check:**
```bash
# Verify Twilio credentials are set
npx convex env list | grep TWILIO

# Expected:
# TWILIO_ACCOUNT_SID: AC...
# TWILIO_AUTH_TOKEN: ...
# TWILIO_PHONE_NUMBER: +1...
```

### Issue: "Webhook not receiving events"
**Solution:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Verify webhook URL: `https://YOUR_CONVEX_SITE.convex.site/stripe`
3. Verify webhook events enabled:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Test webhook with "Send test webhook" button

---

## 📞 **NEED HELP?**

- **Stripe Documentation:** https://stripe.com/docs
- **Convex Documentation:** https://docs.convex.dev
- **Stripe Support:** https://support.stripe.com

---

## 🎉 **NEXT STEPS AFTER CLEANUP**

Once cleanup is complete:

1. **Update Frontend:**
   - Update signup form with new price IDs
   - Build `/affordability` page
   - Update `/pricing` page with $9.99 tier

2. **Marketing Rollout:**
   - Draft 30-day price increase email
   - Notify PARTNER-401C and PARTNER-STORK
   - Update all marketing materials

3. **Monitor Metrics:**
   - Track conversion rate at new $9.99 price
   - Monitor coupon usage (CAREGIVER50, PARTNER codes)
   - Check churn rate for existing users

---

**Ready to start? Begin with Phase 1 (Environment Setup)!**
