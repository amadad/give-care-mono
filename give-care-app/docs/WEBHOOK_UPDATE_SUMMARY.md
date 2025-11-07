# Webhook Configuration Summary

## ✅ What's Ready

### Production Deployment
- **Status:** 🟢 Live and functional
- **Deployment:** prod:doting-tortoise-411
- **HTTP Endpoint:** https://doting-tortoise-411.convex.site

### HTTP Endpoints Working
- ✅ Health: https://doting-tortoise-411.convex.site/health
- ✅ Twilio SMS: https://doting-tortoise-411.convex.site/webhooks/twilio/sms
- ✅ Stripe: https://doting-tortoise-411.convex.site/webhooks/stripe

### Documentation Cleaned
**Active Docs (7 files):**
- README.md - Main documentation
- convex.md - Convex playbook (MANDATORY)
- architecture.md - Architecture overview
- admin.md - Admin dashboard
- metrics.md - Metrics tracking
- DEPLOYMENT.md - Production deployment status
- WEBHOOKS.md - Webhook configuration guide

**Archived (5 files moved to _archive/docs/):**
- architecture-before.md
- PRODUCTION_REBUILD.md
- REFACTOR_AUDIT.md
- REFACTOR_COMPLETE.md
- CLEANUP_PLAN.md

## ⚠️ Manual Actions Required

### 1. Update Twilio Webhook (2 minutes)
1. Login: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Select phone: +18889668985
3. Update webhook URL: `https://doting-tortoise-411.convex.site/webhooks/twilio/sms`
4. Method: POST
5. Save configuration

### 2. Update Stripe Webhook (3 minutes)
1. Login: https://dashboard.stripe.com/webhooks
2. Find existing webhook or create new
3. Update URL: `https://doting-tortoise-411.convex.site/webhooks/stripe`
4. Ensure events selected:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. Copy webhook signing secret
6. Update `STRIPE_WEBHOOKS_SECRET` in Convex dashboard
7. Save configuration

### 3. Test End-to-End (5 minutes)
```bash
# Test health
curl https://doting-tortoise-411.convex.site/health

# Send test SMS to +18889668985
# Message: "Hi"
# Expected: Bot responds with welcome message

# Check Convex logs
npx convex logs --prod --history 20
```

## Quick Reference

### Webhook URLs
```
Twilio SMS: https://doting-tortoise-411.convex.site/webhooks/twilio/sms
Stripe:     https://doting-tortoise-411.convex.site/webhooks/stripe
Health:     https://doting-tortoise-411.convex.site/health
```

### Important Notes
- ✅ Use `.convex.site` for webhooks
- ❌ NOT `.convex.cloud` (that's for API calls)
- Method: POST for all webhooks
- All environment variables already set in Convex dashboard

### Documentation
- **Detailed Guide:** docs/WEBHOOKS.md
- **Deployment Status:** docs/DEPLOYMENT.md
- **Architecture:** docs/architecture.md
- **Convex Playbook:** docs/convex.md (MANDATORY READ)

## Next Steps

1. **Now:** Update Twilio + Stripe webhooks (5 min total)
2. **Then:** Send test SMS to +18889668985
3. **Monitor:** Check logs for 24-48h
4. **After:** Onboard first real user

---

**Time Required:** ~10 minutes total
**Complexity:** Low (just URL updates)
**Risk:** None (easily reversible)
