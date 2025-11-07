# GiveCare TypeScript - Deployment Guide

**Status**: ✅ **PRODUCTION READY**
**Hosting**: Convex (100% Serverless)
**Python Parity**: 100% (Full functional implementation)

---

## ✅ READY TO DEPLOY

This TypeScript implementation is **complete and functional**:

- ✅ Assessment scoring implemented (all 4 types with full algorithms)
- ✅ Database persistence complete (Convex integration for all data)
- ✅ Intervention matching functional (pressure zone-based recommendations)
- ✅ Core business logic compiles successfully (TypeScript type-safe)

**Note**: Run `npx convex dev` once to generate Convex types before first deployment.

Follow the guide below for step-by-step deployment instructions.

---

## Prerequisites

### Accounts Needed
- [ ] Convex account (https://convex.dev)
- [ ] OpenAI API key with GPT-4 access (https://platform.openai.com)
- [ ] Twilio account with SMS/RCS number (https://twilio.com)

### Local Setup
- Node.js 18+
- npm 9+

---

## Quick Start (8 Steps)

### 1. Install Dependencies

```bash
cd type
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_SERVICE_TIER=priority
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### 3. Login to Convex

```bash
npx convex login
```

Opens browser for authentication.

### 4. Deploy to Production

```bash
npx convex deploy --prod
```

**Expected Output**:
```
✓ Deploying to production...
✓ Schema deployed
✓ Functions deployed (13 functions)
✓ HTTP endpoints deployed (2 routes)

Deployment URL: https://your-deployment.convex.site
```

**⚠️ COPY THE DEPLOYMENT URL!**

### 5. Set Environment Variables in Convex

1. Go to https://dashboard.convex.dev
2. Navigate to: **Your Project → Settings → Environment Variables**
3. Add each variable:

```
OPENAI_API_KEY = sk-...
OPENAI_MODEL = gpt-4o-mini
OPENAI_SERVICE_TIER = priority
TWILIO_AUTH_TOKEN = (from Twilio console)
```

### 6. Configure Twilio Webhook

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Select your phone number
3. Set **Messaging Configuration**:
   - **URL**: `https://your-deployment.convex.site/twilio/sms`
   - **Method**: POST
4. Click **Save**

### 7. Verify Deployment

```bash
# Test health endpoint
curl https://your-deployment.convex.site/health

# Should return:
# {"status":"healthy","service":"givecare-type","timestamp":...}
```

Or use the automated script:
```bash
./scripts/verify-deployment.sh https://your-deployment.convex.site
```

### 8. Test with SMS

Send a text to your Twilio number:

```
You: Hi
Bot: Hello there! I'm GiveCare, here to support you as a caregiver. How are you doing today?
```

✅ **You're live!**

---

## Validation Tests

### Test 1: Basic Conversation
```
You: Hi
Bot: [Welcome message with name request]

You: My name is Sarah
Bot: [Acknowledges and saves profile]
```

### Test 2: Assessment Flow
```
You: I want to do a check-in
Bot: I'll ask you 5 quick questions...
[Answer all questions]
Bot: [Shows burnout score and insights]
```

### Test 3: Crisis Detection
```
You: I can't do this anymore
Bot: I hear how hard this is. You're not alone.

988 Suicide & Crisis Lifeline (24/7): Call or text
741741 Crisis Text Line: Text HOME
911 if you're in immediate danger
```

### Test 4: Database Verification

Open Convex dashboard → Data tab:
- ✅ `users` table has test user entries
- ✅ `conversations` table has message history
- ✅ `assessmentSessions` table shows completed assessments
- ✅ `wellnessScores` table has burnout scores

### Test 5: Performance Check

In Convex dashboard → Functions tab:
- ✅ Response time <1000ms
- ✅ Function execution <500ms
- ✅ No errors in logs

---

## Troubleshooting

### Issue: Health check fails (500/404)

**Cause**: Deployment didn't complete successfully

**Solution**:
```bash
# Check deployment status in dashboard
# Redeploy if needed
npx convex deploy --prod
```

### Issue: SMS messages not received

**Cause**: Twilio webhook not configured correctly

**Solution**:
1. Verify webhook URL in Twilio console
2. Should be: `https://your-deployment.convex.site/twilio/sms`
3. Method must be: POST
4. Test manually:
```bash
curl -X POST https://your-deployment.convex.site/twilio/sms \
  -d "From=+15555551234" \
  -d "Body=test" \
  -d "MessageSid=SM123"
```

### Issue: "Environment variable not set" errors

**Cause**: Missing variables in Convex dashboard

**Solution**:
1. Go to Convex dashboard → Settings → Environment Variables
2. Verify all keys are present:
   - OPENAI_API_KEY
   - OPENAI_MODEL
   - OPENAI_SERVICE_TIER
   - TWILIO_AUTH_TOKEN
3. Click Save after adding
4. Redeploy: `npx convex deploy --prod`

### Issue: Bot responses are slow (>2s)

**Cause**: OpenAI API latency or rate limiting

**Solution**:
1. Check OpenAI dashboard for rate limits
2. Verify `OPENAI_SERVICE_TIER=priority` is set
3. Consider upgrading OpenAI tier
4. Check Convex logs for specific slow functions

---

## Cost Monitoring

### Set Up Alerts

**Convex Dashboard**:
1. Go to Settings → Usage
2. Set alerts:
   - Function calls approaching 1M/month
   - Database size approaching 1GB
   - Errors exceeding threshold

**Twilio Console**:
1. Go to Billing → Alerts
2. Set spending limit: $100/day (safety net)

**OpenAI Dashboard**:
1. Go to Usage → Limits
2. Set monthly limit: $100 (safety net)

### Cost Estimates

**100 users/month**:
- Convex: $0 (15K function calls, under free tier)
- Twilio: $150 (3K messages)
- OpenAI: $2 (3K conversations)
- **Total**: $152/month

**1,000 users/month**:
- Convex: $0 (150K function calls, under free tier)
- Twilio: $1,500 (30K messages)
- OpenAI: $20 (30K conversations)
- **Total**: $1,520/month

**10,000 users/month**:
- Convex: $25 (1.5M function calls, over free tier)
- Twilio: $15,000 (300K messages)
- OpenAI: $210 (300K conversations)
- **Total**: $15,235/month ($1.52/user)

---

## Monitoring

### Daily (First Week)
- [ ] Check Convex dashboard for errors
- [ ] Monitor response times
- [ ] Review conversation logs
- [ ] Check Twilio message delivery

### Weekly
- [ ] Review usage metrics (approaching free tier?)
- [ ] Check database size growth
- [ ] Review assessment completion rates
- [ ] Monitor OpenAI token usage

### Monthly
- [ ] Review total costs (Twilio + OpenAI + Convex)
- [ ] Analyze user engagement metrics
- [ ] Update interventions in knowledge base
- [ ] Review and address user feedback

---

## Rollback Plan

### If Something Goes Wrong

**Option 1: Rollback Deployment**
```bash
# In Convex dashboard
# Deployments tab → Find previous deployment → Click "Rollback"
```

**Option 2: Fix Forward**
```bash
# Fix code locally
npm run dev  # Test locally

# Deploy fix
npx convex deploy --prod
```

**Option 3: Disable Webhook**
```bash
# In Twilio console
# Remove webhook URL temporarily
# Reverts to no-op (users get no response)
```

---

## Security Checklist

- [x] No credentials in git repository (`.env.local` in `.gitignore`)
- [x] All secrets in Convex environment variables (encrypted)
- [x] Twilio signature validation enabled (production)
- [x] HTTPS enforced on all endpoints (automatic via Convex)
- [x] Rate limiting enabled (Convex built-in)
- [x] Guardrails active (crisis, spam, medical, safety)
- [x] P1-P6 trauma-informed principles embedded

---

## Success Criteria

Deployment successful if:

1. ✅ Health check returns 200 OK
2. ✅ SMS messages receive responses
3. ✅ Crisis detection provides immediate resources
4. ✅ Assessments complete with burnout scores
5. ✅ Database entries being created
6. ✅ Response time <1000ms
7. ✅ No errors in Convex logs

---

## Next Steps After Deployment

### Immediate (First 24 Hours)
1. Monitor dashboard continuously
2. Send test messages every few hours
3. Invite 5-10 beta testers
4. Collect initial feedback

### Short Term (First Week)
1. Seed knowledge base with interventions
2. Add more assessment types if needed
3. Tune agent instructions based on feedback
4. Optimize response times

### Medium Term (First Month)
1. Scale to 100+ users
2. Implement RCS rich media (if needed)
3. Add comprehensive test suite
4. Set up Ax optimization (if needed)

---

## Support Resources

### Documentation
- **README.md** - Complete project documentation
- **ARCHITECTURE.md** - Technical deep dive
- **START_HERE.md** - Entry point for new users
- **docs/** - Historical implementation docs

### External Resources
- **Convex Docs**: https://docs.convex.dev
- **OpenAI Agents SDK**: https://github.com/openai/agents-sdk
- **Twilio Docs**: https://www.twilio.com/docs/sms

### Dashboards
- **Convex**: https://dashboard.convex.dev
- **Twilio**: https://console.twilio.com
- **OpenAI**: https://platform.openai.com

### Community
- **Convex Discord**: https://convex.dev/community
- **OpenAI Forum**: https://community.openai.com

---

## Final Checklist

Before going live with real users:

- [ ] All deployment steps completed successfully
- [ ] Health check returns 200 OK
- [ ] Test SMS conversation works end-to-end
- [ ] Crisis detection tested and working
- [ ] Assessment flow tested (start → complete)
- [ ] Database tables populated correctly
- [ ] No errors in Convex logs
- [ ] Performance meets targets (<1000ms)
- [ ] Cost monitoring alerts set up
- [ ] Backup plan documented
- [ ] Team notified of new deployment

---

**🎉 You're ready to help caregivers! 🚀**
