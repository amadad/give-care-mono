# Signup Flow Deployment Guide

## Overview

This guide walks through deploying the complete GiveCare signup flow with Stripe payment integration and Supabase user management.

## Prerequisites

- [ ] Stripe account with live mode enabled
- [ ] Supabase project with `users` table configured
- [ ] Twilio account with SMS-enabled phone number
- [ ] Access to hosting platform (Vercel, etc.)
- [ ] Packages installed: `@supabase/supabase-js`, `twilio`

## Required Package Installation

```bash
# Install Supabase client library
pnpm add @supabase/supabase-js

# Install Twilio SDK for SMS
pnpm add twilio

# Verify Stripe SDK is installed
pnpm list stripe
```

## Environment Variables Setup

### Step 1: Stripe Configuration

#### Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers > API keys**
3. Copy **Secret key** (starts with `sk_live_` or `sk_test_`)
4. Copy **Publishable key** (starts with `pk_live_` or `pk_test_`)

#### Get Stripe Price IDs
From the MCP investigation, your price IDs are:
- **Monthly**: `price_1RJ3l1AXk51qocidWUcvmNR1` ($9.99/month)
- **Annual**: `price_1RKnYwAXk51qocidnJFB39A1` ($79.00/year)

Verify these in Stripe Dashboard: **Products > Pricing**

#### Create Webhook Endpoint
1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 2: Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Service Role Key**: `eyJxxx...` (⚠️ Keep this secret!)

### Step 3: Twilio Configuration

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Account > API keys & tokens**
3. Copy:
   - **Account SID**: `ACxxxx...`
   - **Auth Token**: Click "Show" to reveal
4. Go to **Phone Numbers > Manage > Active numbers**
5. Copy your SMS-enabled phone number (E.164 format: `+15551234567`)

### Step 4: Set Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID=price_1RJ3l1AXk51qocidWUcvmNR1
STRIPE_MONTHLY_PRICE_ID=price_1RJ3l1AXk51qocidWUcvmNR1
STRIPE_ANNUAL_PRICE_ID=price_1RKnYwAXk51qocidnJFB39A1
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration
SUPABASE_URL=https://jstusysixwdsiaszvbai.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# Resend (Email)
RESEND_API_KEY=re_your_actual_resend_api_key_here
RESEND_AUDIENCE_ID=your-audience-id-here

# Application
NEXT_PUBLIC_SITE_URL=https://givecareapp.com
```

### Step 5: Run Database Migration

Apply the `subscription_status` migration to your Supabase database:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually via SQL Editor in Supabase Dashboard
# Copy contents of supabase/migrations/20251008122028_add_subscription_status.sql
# Paste and run in SQL Editor
```

Verify the migration:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'subscription_status';
```

### Step 6: Add to Hosting Platform

#### For Vercel:
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings > Environment Variables**
3. Add each variable above
4. Important: **Never** commit `.env.local` to Git!

#### For other platforms:
Consult your platform's documentation for setting environment variables.

## Database Verification

Verify your Supabase `users` table has these columns:

```sql
-- Check table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

Required columns:
- ✅ `id` (uuid, primary key)
- ✅ `phone_number` (text, unique)
- ✅ `email` (text, nullable)
- ✅ `first_name` (text, nullable)
- ✅ `stripe_customer_id` (text, nullable)
- ✅ `stripe_subscription_id` (text, nullable)
- ✅ `subscription_status` (text, default: 'inactive') **← NEW**
- ✅ `journey_phase` (text, default: 'onboarding')
- ✅ `app_state` (jsonb, default: '{}')
- ✅ `created_at` (timestamptz)
- ✅ `updated_at` (timestamptz)

## Deployment Steps

### 1. Build and Test Locally

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run locally to test
pnpm start
```

### 2. Test Webhook Locally with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test with a checkout session
stripe trigger checkout.session.completed
```

### 3. Deploy to Production

```bash
# Deploy (Vercel example)
vercel --prod

# Or push to main branch if auto-deploy is enabled
git push origin main
```

### 4. Update Stripe Webhook URL

1. Go to Stripe Dashboard > **Developers > Webhooks**
2. Click on your webhook endpoint
3. Update URL to production: `https://givecareapp.com/api/webhooks/stripe`
4. Save changes

## Testing the Complete Flow

### End-to-End Test Checklist

#### Test Monthly Subscription
1. [ ] Go to `/signup`
2. [ ] Fill in form with test data and **valid phone number**
3. [ ] Select **Monthly** plan ($9.99)
4. [ ] Complete Stripe checkout with test card: `4242 4242 4242 4242`
5. [ ] Verify redirect to `/welcome?session_id=cs_test_xxx`
6. [ ] Verify personalized welcome message with user's name
7. [ ] **Check phone: Receive welcome SMS** 📱
8. [ ] Check Supabase: User created with correct data
9. [ ] Check Supabase: `stripe_customer_id` and `stripe_subscription_id` populated
10. [ ] Check Supabase: `subscription_status = 'active'` **← NEW**
11. [ ] Check Supabase: `journey_phase` set to 'onboarding'
12. [ ] Check Stripe Dashboard: Subscription created for $9.99/month

#### Test Annual Subscription
1. [ ] Repeat above with **Annual** plan ($79/year)
2. [ ] Verify correct price charged in Stripe

#### Test Invalid Session ID
1. [ ] Try accessing `/welcome` without session_id
2. [ ] Should redirect to `/signup`
3. [ ] Try accessing `/welcome?session_id=invalid`
4. [ ] Should redirect to `/signup`

### Verify Webhook Delivery

1. Go to Stripe Dashboard > **Developers > Webhooks**
2. Click on your endpoint
3. View **Recent events** tab
4. Check for successful `checkout.session.completed` events
5. Verify response code: `200 OK`
6. If failed, check **Response** tab for error details

## Troubleshooting

### Webhook Not Receiving Events

**Problem**: Stripe webhook shows errors or timeouts

**Solutions**:
```bash
# Check webhook logs in Stripe Dashboard
# Verify webhook URL is correct
# Check server logs for errors
vercel logs

# Test webhook signature verification locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

### User Not Created in Database

**Problem**: Webhook runs but user not in Supabase

**Solutions**:
1. Check webhook handler logs for errors
2. Verify Supabase service role key is correct
3. Check RLS policies on `users` table
4. Verify phone number format (should be normalized to E.164)

```sql
-- Check if RLS is blocking writes
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Temporarily disable RLS to test (⚠️ dev only!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Wrong Price Charged

**Problem**: User selected annual but charged monthly price

**Solutions**:
1. Verify `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` are set
2. Check `.env.local` file has both variables
3. Restart Next.js server after env changes
4. Check Stripe Dashboard for correct price configuration

### SMS Not Sending

**Problem**: User created but no SMS received

**Solutions**:
1. Check Twilio credentials are correct
2. Verify phone number is in E.164 format (+15551234567)
3. Check Twilio Console for delivery status
4. Verify webhook handler logs show SMS attempt

```bash
# Test Twilio credentials
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "From=$TWILIO_PHONE_NUMBER" \
  --data-urlencode "To=+15551234567" \
  --data-urlencode "Body=Test message" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Check Vercel logs for SMS errors
vercel logs --follow
```

**Twilio Test Mode:**
```bash
# Use Twilio test credentials for development
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Test SID
TWILIO_AUTH_TOKEN=test_token_here
TWILIO_PHONE_NUMBER=+15005550006  # Twilio magic number (doesn't send real SMS)
```

### Subscription Status Not Updating

**Problem**: `subscription_status` stays 'inactive' after payment

**Solutions**:
1. Verify migration was applied successfully
2. Check webhook handler sets `subscription_status: 'active'`
3. Check Supabase logs for errors

```sql
-- Manually check subscription status
SELECT id, phone_number, subscription_status, stripe_subscription_id
FROM users
WHERE stripe_subscription_id IS NOT NULL;

-- Manually fix if needed (dev only)
UPDATE users
SET subscription_status = 'active'
WHERE stripe_subscription_id IS NOT NULL
AND subscription_status = 'inactive';
```

### Environment Variables Not Loading

**Problem**: Build fails or missing configuration

**Solutions**:
```bash
# Verify .env.local exists and has all required vars
cat .env.local

# Check environment validation
node -e "require('./lib/env').env"

# Rebuild after env changes
rm -rf .next && pnpm build
```

## Monitoring & Alerts

### Set Up Monitoring

1. **Stripe Webhook Monitoring**:
   - Enable email notifications for webhook failures
   - Dashboard > Developers > Webhooks > Configure alerts

2. **Supabase Database Monitoring**:
   - Set up alerts for failed inserts
   - Monitor `users` table growth

3. **Twilio SMS Monitoring**:
   - Monitor delivery rates in Twilio Console
   - Set up alerts for failed messages
   - Track SMS costs per month

4. **Application Logging**:
   - Check Vercel logs for webhook errors
   - Set up Sentry or similar error tracking

### Key Metrics to Track

- Webhook delivery success rate (target: > 99%)
- User creation success rate
- **SMS delivery success rate (target: > 98%)**
- Checkout abandonment rate
- Average time from signup to first SMS
- Monthly vs Annual plan split
- **Active subscribers** (`subscription_status = 'active'`)
- **Churn rate** (canceled subscriptions)

## Security Checklist

- [ ] STRIPE_WEBHOOK_SECRET is set and correct
- [ ] STRIPE API keys (secret and publishable) are for correct mode (live/test)
- [ ] SUPABASE_SERVICE_ROLE_KEY never exposed to frontend
- [ ] TWILIO_AUTH_TOKEN never exposed to frontend
- [ ] Webhook signature verification enabled
- [ ] RLS policies enabled on users table
- [ ] .env.local in .gitignore
- [ ] API keys rotated if ever committed to Git
- [ ] HTTPS enabled on production domain
- [ ] CORS configured correctly
- [ ] Phone numbers validated and sanitized before SMS

## SMS Feature Gates

To ensure only paying subscribers receive SMS:

```sql
-- Query for active subscribers only
SELECT * FROM users
WHERE subscription_status = 'active'
AND phone_number IS NOT NULL;

-- Count active subscribers
SELECT COUNT(*) as active_subscribers
FROM users
WHERE subscription_status = 'active';

-- Find users with past_due payments (for payment reminders)
SELECT phone_number, first_name, stripe_customer_id
FROM users
WHERE subscription_status = 'past_due';
```

**SMS Gating Rules:**
- ✅ `active` → Can receive all SMS
- ✅ `trialing` → Can receive onboarding SMS
- ⚠️ `past_due` → Only payment reminders
- ❌ `canceled` → No SMS
- ❌ `inactive` → No SMS

## Next Steps

1. ✅ **SMS Integration** - COMPLETE (sends welcome SMS on signup)
2. **Subscription Management**: Add customer portal for plan changes
3. **SMS Conversation Flow**: Build interactive SMS responses
4. **Error Handling**: Add retry logic for failed SMS/webhook processing
5. **Testing**: Add integration tests for signup + SMS flow
6. **Monitoring**: Set up comprehensive logging and alerting
7. **Cost Optimization**: Track SMS usage per subscriber

## Support

- **Stripe Issues**: https://support.stripe.com/
- **Supabase Issues**: https://supabase.com/docs/guides/platform
- **Twilio Issues**: https://support.twilio.com/
- **Project Issues**: See AGENTS.md for contribution guidelines

## Related Documentation

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MCP Troubleshooting Guide](./MCP_TROUBLESHOOTING.md)

## Summary of Implementation

### What Was Built

1. **Complete Signup Flow**:
   - ✅ Stripe checkout with monthly/annual pricing
   - ✅ Webhook handler for post-payment processing
   - ✅ User creation in Supabase database
   - ✅ Session-verified welcome page

2. **SMS Integration** (NEW):
   - ✅ Twilio SMS service integration
   - ✅ Welcome SMS sent after signup
   - ✅ Payment reminder SMS for past_due subscriptions
   - ✅ Non-blocking SMS (doesn't fail webhook)

3. **Subscription Status Tracking** (NEW):
   - ✅ `subscription_status` field added to users table
   - ✅ Automatic status updates from Stripe webhooks
   - ✅ Payment-gated SMS features
   - ✅ Churn tracking and metrics

### Files Created/Modified

**Created:**
- `lib/supabase-server.ts` - Server-side Supabase client
- `lib/sms-service.ts` - Twilio SMS integration
- `app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- `supabase/migrations/20251008122028_add_subscription_status.sql` - DB migration

**Modified:**
- `app/api/checkout/embedded/route.ts` - Fixed price selection
- `app/welcome/page.tsx` - Added session verification
- `lib/env.ts` - Added Twilio + Supabase env vars
- `.env.example` - Documented all configuration

### Architecture

```
User Signs Up
    ↓
Stripe Checkout (Embedded)
    ↓
Payment Success
    ↓
Webhook: checkout.session.completed
    ↓
├─ Create User in Supabase
│  └─ Set subscription_status = 'active'
├─ Send Welcome SMS via Twilio 📱
└─ Return 200 OK to Stripe
    ↓
User Redirected to /welcome
    ↓
Display Personalized Confirmation
```

### Ongoing Webhook Events

- `customer.subscription.updated` → Update `subscription_status`, send payment reminders if past_due
- `customer.subscription.deleted` → Set `subscription_status = 'canceled'`
