# Production Deployment - v1.0.0

**Date:** 2025-11-07
**Status:** 🟢 Deployed & Functional
**Deployment:** prod:doting-tortoise-411
**HTTP URL:** https://doting-tortoise-411.convex.site
**API URL:** https://doting-tortoise-411.convex.cloud

---

## v0.9.0 → v1.0.0 Migration Complete

**Changes:**
- Functions: 167 → 41 (76% reduction)
- Architecture: 5-layer harness → 3-layer Convex-native
- Code: 4,824 → 2,894 LOC (40% reduction)
- Build: 3.36s → 2.67s (20% faster)

**Tech Stack:**
- @openai/agents → @convex-dev/agent + Vercel AI SDK
- Automatic thread persistence via Agent Component
- Provider-agnostic (easy to swap OpenAI/Claude/Gemini)

---

## HTTP Endpoints ✅

**⚠️ Use `.convex.site` for webhooks, NOT `.convex.cloud`**

| Endpoint | URL | Status |
|----------|-----|--------|
| Health | https://doting-tortoise-411.convex.site/health | ✅ OK |
| Twilio SMS | https://doting-tortoise-411.convex.site/webhooks/twilio/sms | ✅ OK |
| Stripe | https://doting-tortoise-411.convex.site/webhooks/stripe | ✅ OK |

---

## Required Actions ⚠️

### 1. Update Twilio Webhook
**URL:** https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

1. Select: **+18889668985**
2. Update webhook: `https://doting-tortoise-411.convex.site/webhooks/twilio/sms`
3. Method: **POST**
4. Save

### 2. Update Stripe Webhook
**URL:** https://dashboard.stripe.com/webhooks

1. Update endpoint: `https://doting-tortoise-411.convex.site/webhooks/stripe`
2. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
3. Copy signing secret
4. Update `STRIPE_WEBHOOKS_SECRET` in Convex dashboard

### 3. Verify Environment Variables
**Convex Dashboard:** Settings → Environment Variables

Required:
- ✅ `OPENAI_API_KEY`
- ✅ `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- ✅ `STRIPE_KEY`
- ⚠️ `STRIPE_WEBHOOKS_SECRET` (update after Stripe config)
- ⚠️ `HARNESS_CONVEX_TOKEN` (check if needed)

---

## Testing Checklist

### Immediate ⚠️
- [ ] Update Twilio webhook
- [ ] Update Stripe webhook
- [ ] Test SMS: Send message to +18889668985
- [ ] Verify bot responds
- [ ] Check Convex logs

### This Week
- [ ] Test crisis detection
- [ ] Test assessment flow
- [ ] Test Stripe subscription
- [ ] Monitor response times
- [ ] Onboard first real user

---

## Deployments: DEV vs PROD ⚠️

**CRITICAL:** Always verify which deployment you're targeting.

### Environments

| Environment | Deployment | URL | Use Case |
|------------|------------|-----|----------|
| **DEV** | `dev:agreeable-lion-831` | https://agreeable-lion-831.convex.cloud | Local development, testing |
| **PROD** | `prod:doting-tortoise-411` | https://doting-tortoise-411.convex.cloud | Live users, webhooks |

### Deployment Commands

```bash
# Deploy to PROD (ALWAYS use this for production changes)
CONVEX_DEPLOYMENT=prod:doting-tortoise-411 npx convex deploy --yes

# Deploy to DEV (default from .env.local)
npx convex dev
```

### Common Mistake ⚠️

**Issue:** Deploying code to DEV but webhooks/users are on PROD.

**Symptoms:**
- New functions don't appear when running queries
- Webhook events process but subscriptions not created
- Users exist in PROD but code changes only in DEV

**Solution:** ALWAYS use `CONVEX_DEPLOYMENT=prod:doting-tortoise-411` for production deployments.

### Verify Current Deployment

```bash
# Check which deployment .env.local points to
cat .env.local | grep CONVEX_DEPLOYMENT

# Should show: CONVEX_DEPLOYMENT=dev:agreeable-lion-831 (for local dev)
# Production uses: CONVEX_DEPLOYMENT=prod:doting-tortoise-411
```

---

## Monitoring

```bash
# View PROD logs (use --prod flag)
npx convex logs --prod --history 100

# View DEV logs (default)
npx convex logs --history 100

# Check health (PROD)
curl https://doting-tortoise-411.convex.site/health

# Run queries on PROD (use --prod flag)
npx convex run --prod functions/billing:refreshEntitlements '{"userId":"+15551234567"}'

# View PROD functions
npx convex function-spec --prod | grep -c identifier
# Expected: 41

# View PROD tables
npx convex data --prod

# View PROD specific table
npx convex data --prod users
```

---

## Rollback Plan

If issues occur:

1. **Redeploy:** `npx convex deploy --prod`
2. **Dashboard:** Convex Dashboard → Deployments → Rollback
3. **Archive:** Code preserved in `_archive/src-harness-20251107/`

---

## Documentation

- **[WEBHOOKS.md](./WEBHOOKS.md)** - Detailed webhook configuration
- **[convex.md](./convex.md)** - Convex playbook (MANDATORY)
- **[architecture.md](./architecture.md)** - Architecture overview
- **[README.md](./README.md)** - Full project documentation

---

## Dashboards

- **Convex:** https://dashboard.convex.dev/deployment/prod:doting-tortoise-411
- **Twilio:** https://console.twilio.com
- **Stripe:** https://dashboard.stripe.com

---

**Next:** Update webhooks → Test SMS flow → Monitor for 48h
