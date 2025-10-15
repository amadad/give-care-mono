# Stripe + Convex Integration Setup Guide

This guide walks through setting up the complete subscription flow for GiveCare.

## Overview

**User Flow:**
1. User visits `https://www.givecareapp.com/signup`
2. Fills form (full name, email, phone, selects plan)
3. Redirected to Stripe Checkout
4. Completes payment
5. Redirected to `/welcome`
6. Receives welcome SMS
7. Can now access the app with active subscription

## Prerequisites

1. Stripe account ([sign up free](https://stripe.com/))
2. Stripe CLI installed (`brew install stripe/stripe-cli/stripe`)
3. Twilio account for SMS (optional, for welcome messages)

---

## Step 1: Set Up Stripe Products

### 1.1 Create Products in Stripe Dashboard

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)

Create your subscription plans (examples):

**Plan 1: Basic**
- Name: GiveCare Basic
- Billing: Recurring
- Price: $9.99/month
- Copy the **Price ID** (starts with `price_`)

**Plan 2: Premium**
- Name: GiveCare Premium
- Billing: Recurring
- Price: $19.99/month
- Copy the **Price ID**

**Plan 3: Annual**
- Name: GiveCare Annual
- Billing: Recurring
- Price: $99/year
- Copy the **Price ID**

### 1.2 Get API Keys

From [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys):

- **Test Publishable Key** (starts with `pk_test_`)
- **Test Secret Key** (starts with `sk_test_`)

---

## Step 2: Configure Convex Environment Variables

```bash
# Set Stripe secret key
npx convex env set STRIPE_KEY sk_test_YOUR_KEY_HERE

# Set webhook secret (we'll get this in Step 3)
# npx convex env set STRIPE_WEBHOOKS_SECRET whsec_YOUR_SECRET_HERE

# Set your hosting URL (for redirects)
npx convex env set HOSTING_URL https://www.givecareapp.com
```

---

## Step 3: Set Up Stripe Webhooks

### Option A: Development (Local Testing with Stripe CLI)

```bash
# 1. Login to Stripe CLI
stripe login

# 2. Forward webhooks to your local Convex dev server
stripe listen --forward-to https://YOUR_CONVEX_DEV_URL/stripe

# Example:
# stripe listen --forward-to https://happy-monkey-123.convex.site/stripe

# 3. Copy the "webhook signing secret" from the output (starts with whsec_)
# 4. Set it as an environment variable
npx convex env set STRIPE_WEBHOOKS_SECRET whsec_YOUR_SECRET_HERE
```

### Option B: Production (Stripe Dashboard)

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://YOUR_CONVEX_PROD_URL/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** and add to Convex:

```bash
npx convex env set STRIPE_WEBHOOKS_SECRET whsec_YOUR_PROD_SECRET_HERE --prod
```

---

## Step 4: Update Your Signup Form

On your marketing website (`givecareapp.com/signup`), add this code:

```tsx
// app/signup/page.tsx (or wherever your signup form lives)
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    priceId: 'price_YOUR_BASIC_PLAN_ID', // Default to basic plan
  });

  const createCheckout = useAction(api.stripe.createCheckoutSession);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate phone number is E.164 format (+1XXXXXXXXXX)
    if (!formData.phoneNumber.startsWith('+1')) {
      alert('Phone number must start with +1');
      return;
    }

    // Create Stripe checkout session
    const checkoutUrl = await createCheckout(formData);

    if (checkoutUrl) {
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <input
        type="tel"
        placeholder="Phone Number (+1XXXXXXXXXX)"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        required
      />

      <select
        value={formData.priceId}
        onChange={(e) => setFormData({ ...formData, priceId: e.target.value })}
        required
      >
        <option value="price_YOUR_BASIC_ID">Basic - $9.99/month</option>
        <option value="price_YOUR_PREMIUM_ID">Premium - $19.99/month</option>
        <option value="price_YOUR_ANNUAL_ID">Annual - $99/year</option>
      </select>

      <button type="submit">Continue to Payment</button>
    </form>
  );
}
```

---

## Step 5: Add Subscription Check (Route Protection)

Use this query to check if a user has an active subscription:

```tsx
// In your app pages
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const router = useRouter();
  const phoneNumber = '+1234567890'; // Get from session/auth

  const subscription = useQuery(api.subscriptions.checkSubscription, {
    phoneNumber,
  });

  if (subscription && !subscription.isActive) {
    // Redirect to signup if not subscribed
    router.push('/signup');
    return null;
  }

  return <div>Protected content for subscribers only!</div>;
}
```

---

## Step 6: Test the Flow

### Using Stripe Test Cards

Stripe provides test card numbers for different scenarios:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Decline:**
- Card: `4000 0000 0000 0002`

**Requires 3D Secure:**
- Card: `4000 0025 0000 3155`

### Testing Steps:

1. Fill out signup form on `givecareapp.com/signup`
2. Use test card `4242 4242 4242 4242`
3. Complete checkout
4. You should be redirected to `/welcome`
5. Check Convex dashboard - user should have `subscriptionStatus: "active"`
6. Check console logs for "🎉 Welcome SMS to..." message

---

## Step 7: Integrate Twilio for Welcome SMS

Update `convex/stripe.ts` to actually send SMS:

```typescript
// Uncomment and configure in convex/stripe.ts sendWelcomeSMS function

export const sendWelcomeSMS = internalAction({
  args: { phoneNumber: v.string(), userId: v.string() },
  handler: async (ctx, { phoneNumber, userId }) => {
    // Add Twilio credentials to Convex env:
    // npx convex env set TWILIO_ACCOUNT_SID your_sid
    // npx convex env set TWILIO_AUTH_TOKEN your_token
    // npx convex env set TWILIO_PHONE_NUMBER +1234567890

    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await twilio.messages.create({
      body: "Welcome to GiveCare! 🎉 Reply with any question to get started with your AI caregiving support.",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ Welcome SMS sent to ${phoneNumber}`);
    return { success: true };
  },
});
```

---

## Troubleshooting

### "Missing stripe-signature header"
- Make sure Stripe webhook is pointing to the correct URL (`/stripe` not `/stripe/webhook`)
- Verify webhook is configured in Stripe Dashboard

### "User not found" after payment
- Check that `userId` is being passed in session metadata
- Verify user was created before checkout redirect

### Welcome SMS not sending
- Check Convex logs for errors
- Verify Twilio credentials are set
- Make sure phone number is in E.164 format

### Subscription not activating
- Check webhook is receiving `checkout.session.completed` event
- Verify `STRIPE_WEBHOOKS_SECRET` is correct
- Check Convex logs for webhook processing errors

---

## Next Steps

1. **Create welcome page** at `/welcome` showing subscription confirmation
2. **Add customer portal** for users to manage subscriptions
3. **Handle failed payments** (past_due status)
4. **Add grace period** before canceling access
5. **Implement usage limits** based on subscription tier

---

## Production Checklist

- [ ] Switch to live Stripe API keys
- [ ] Configure production webhook endpoint
- [ ] Test with real payment (small amount)
- [ ] Set up Stripe webhook monitoring/alerts
- [ ] Configure Twilio production credentials
- [ ] Add error tracking (Sentry, LogRocket, etc.)
- [ ] Test subscription cancellation flow
- [ ] Test subscription upgrade/downgrade
- [ ] Document customer support processes

---

## Resources

- [Stripe Checkout Docs](https://stripe.com/docs/checkout)
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions)
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
