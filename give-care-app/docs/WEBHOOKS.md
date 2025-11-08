# Webhook Configuration Guide

**Deployment:** prod:doting-tortoise-411
**HTTP URL:** https://doting-tortoise-411.convex.site

## ⚠️ Important: Use `.convex.site` for Webhooks

- ✅ Webhooks/HTTP: `https://doting-tortoise-411.convex.site`
- ❌ NOT: `https://doting-tortoise-411.convex.cloud` (API only)

---

## Twilio SMS Webhook

### Configuration
1. **Go to:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. **Select Phone:** +18889668985
3. **Update Messaging Configuration:**
   - **URL:** `https://doting-tortoise-411.convex.site/webhooks/twilio/sms`
   - **HTTP Method:** POST
   - **Content Type:** application/x-www-form-urlencoded
4. **Click:** Save

### Test
```bash
# Send test SMS to +18889668985
# Expected: Bot responds within 2-3 seconds

# Or test webhook directly:
curl -X POST "https://doting-tortoise-411.convex.site/webhooks/twilio/sms" \
  -d "From=+15555551234" \
  -d "Body=Hello" \
  -d "MessageSid=SM123test"
# Expected: 500 (needs valid auth token)
```

### Environment Variables Required
Set in Convex Dashboard (Settings → Environment Variables):
- `TWILIO_ACCOUNT_SID=<from_twilio_console>`
- `TWILIO_AUTH_TOKEN=<from_twilio_console>`
- `TWILIO_PHONE_NUMBER=+18889668985`
- `HARNESS_CONVEX_TOKEN=<needs to be set>` ⚠️

---

## Stripe Webhook

### Configuration
1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Find Webhook or Create New**
3. **Update Endpoint URL:** `https://doting-tortoise-411.convex.site/webhooks/stripe`
4. **Select Events:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Copy Webhook Signing Secret**
6. **Click:** Save

### Test
```bash
# Test webhook endpoint:
curl -X POST "https://doting-tortoise-411.convex.site/webhooks/stripe" \
  -H "Content-Type: application/json" \
  -d '{"id":"test_evt","type":"customer.subscription.updated","data":{"object":{}}}'
# Expected: {"received":true}
```

### Environment Variables Required
Set in Convex Dashboard:
- `STRIPE_KEY=<from_stripe_dashboard>`
- `STRIPE_WEBHOOKS_SECRET=whsec_<from_dashboard>` ⚠️

---

## Health Check

### Test
```bash
curl https://doting-tortoise-411.convex.site/health
# Expected: {"status":"ok","timestamp":1762531668339}
```

No authentication required.

---

## Troubleshooting

### Webhook Returns 404
- ✅ Using `.convex.site` domain?
- ✅ Correct path (`/webhooks/twilio/sms` or `/webhooks/stripe`)?
- ✅ Using POST method?

### Webhook Returns 500
- Check Convex logs: `npx convex logs --prod`
- Verify environment variables set
- Check `HARNESS_CONVEX_TOKEN` is configured
- Verify Stripe webhook secret matches

### SMS Not Responding
- Verify Twilio webhook updated
- Check phone number format: +1XXXXXXXXXX
- Verify `TWILIO_AUTH_TOKEN` set in Convex
- Check Convex logs for errors

### Stripe Events Not Processing
- Verify webhook secret matches
- Check event types are selected
- View Stripe dashboard → Webhooks → Recent events
- Check Convex logs for processing errors

### Subscription Created in Stripe But Not in Convex
**Symptoms:**
- Stripe shows active subscription
- User received welcome SMS
- `refreshEntitlements` returns `plan: "free"`
- Webhook returns HTTP 200 but no subscription in database

**Root Causes:**
1. **Event deduplication**: Webhook processed event before phoneNumber fallback was added, event now exists in `billing_events` table preventing reprocessing
2. **User lookup failure**: Original webhook couldn't find user (no userId or phoneNumber in metadata), skipped subscription creation
3. **DEV vs PROD deployment**: Code deployed to DEV but production webhooks hitting PROD deployment

**Diagnosis:**
```bash
# Check if billing event exists but no subscription
npx convex run --prod functions/billing:debugBillingEvents

# Check if user has subscription
npx convex run --prod functions/debugSubscriptions:getSubscriptionsByPhone '{"phoneNumber":"+15551234567"}'

# Check entitlements
npx convex data --prod entitlements
```

**Fix:** Manually link subscription using billing event data
```bash
# Get subscription details from Stripe dashboard or billing_events
# Then run manual link with correct deployment:
npx convex run --prod functions/manualLinkSubscription:linkSubscription '{
  "phoneNumber": "+15551234567",
  "stripeCustomerId": "cus_XXXXX",
  "planId": "price_XXXXX",
  "currentPeriodEnd": 1234567890000
}'

# Verify fix
npx convex run --prod functions/billing:refreshEntitlements '{"userId":"+15551234567"}'
npx convex data --prod entitlements
```

---

## Environment Variable Checklist

| Variable | Status | Location |
|----------|--------|----------|
| `OPENAI_API_KEY` | ✅ Set | Convex Dashboard |
| `TWILIO_ACCOUNT_SID` | ✅ Set | Convex Dashboard |
| `TWILIO_AUTH_TOKEN` | ✅ Set | Convex Dashboard |
| `TWILIO_PHONE_NUMBER` | ✅ Set | Convex Dashboard |
| `STRIPE_KEY` | ✅ Set | Convex Dashboard |
| `STRIPE_WEBHOOKS_SECRET` | ⚠️ Verify | Convex Dashboard |
| `HARNESS_CONVEX_TOKEN` | ⚠️ Needs Set | Convex Dashboard |
| `SKIP_TWILIO_VALIDATION` | ✅ Set | Convex Dashboard |

---

## Manual Update Steps

### Step 1: Update Twilio
- [ ] Login to Twilio Console
- [ ] Navigate to Phone Numbers → Manage → Incoming
- [ ] Select +18889668985
- [ ] Update webhook URL to `.convex.site`
- [ ] Save configuration
- [ ] Send test SMS

### Step 2: Update Stripe
- [ ] Login to Stripe Dashboard
- [ ] Navigate to Developers → Webhooks
- [ ] Update or create webhook endpoint
- [ ] Copy signing secret
- [ ] Update `STRIPE_WEBHOOKS_SECRET` in Convex
- [ ] Save configuration
- [ ] Send test webhook from Stripe dashboard

### Step 3: Verify
- [ ] Test health endpoint
- [ ] Send test SMS
- [ ] Trigger test Stripe event
- [ ] Check Convex logs for any errors
- [ ] Verify responses received

---

**Last Updated:** 2025-11-07
**Deployment:** prod:doting-tortoise-411
