# GiveCare Landing Page Integration Specification

## Overview

This document provides complete technical specifications for implementing a subscription landing page that integrates with your existing GiveCare infrastructure. The flow will collect user information, process Stripe payments, create users in Supabase, and initiate RCS welcome messages.

## Architecture Flow

```
Landing Page → Stripe Elements → Edge Function → Supabase + Stripe → Welcome RCS Message
```

## 1. Stripe Configuration

### Required Stripe Resources

#### Products and Prices
```javascript
// Create these in Stripe Dashboard or via API
const STRIPE_PRODUCTS = {
  monthly: {
    product_id: "prod_XXX", // Create in Stripe Dashboard
    price_id: "price_XXX",  // Monthly price
    amount: 2997, // $29.97 in cents
    interval: "month"
  },
  annual: {
    product_id: "prod_YYY", 
    price_id: "price_YYY",   // Annual price
    amount: 29970, // $299.70 in cents (save 2 months)
    interval: "year"
  }
}
```

#### Webhook Configuration
Set up webhook endpoint in Stripe Dashboard:
- **URL**: `https://jstusysixwdsiaszvbai.supabase.co/functions/v1/stripe-webhook`
- **Events**: 
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### Stripe Environment Variables
```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_XXX  # For frontend
STRIPE_SECRET_KEY=sk_live_XXX       # For backend
STRIPE_WEBHOOK_SECRET=whsec_XXX     # Webhook endpoint secret
```

## 2. Supabase Schema Reference

### Existing Users Table Structure
```sql
-- Your existing users table (from models.py)
TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (
    subscription_status IN ('active', 'inactive', 'trialing', 'canceled', 'past_due', 'unpaid')
  ),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  message_count INTEGER DEFAULT 0,
  profile_data JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  profile_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_profile_update TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  care_recipient_name TEXT,
  care_recipient_details JSONB DEFAULT '{}'
);
```

### Required User Data Structure
```typescript
interface NewUserData {
  phone_number: string;        // E.164 format: "+1234567890"
  first_name: string;
  last_name?: string;
  subscription_status: 'active' | 'trialing';
  stripe_customer_id: string;
  stripe_subscription_id: string;
  profile_data: {
    onboarding_step: 0;
    current_phase: "onboarding";
    metadata: {
      source: "website_subscription";
      email: string;
      plan_type: "monthly" | "annual";
      signup_date: string; // ISO timestamp
    }
  }
}
```

## 3. Supabase Edge Functions

### 3.1 Checkout Creation Function

**File**: `supabase/functions/create-checkout/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.givecareapp.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, plan_type } = await req.json()
    
    if (!name || !email || !phone || !plan_type) {
      throw new Error('Missing required fields')
    }

    // Plan configuration
    const plans = {
      monthly: {
        price_id: Deno.env.get('STRIPE_MONTHLY_PRICE_ID'),
        name: 'GiveCare Monthly'
      },
      annual: {
        price_id: Deno.env.get('STRIPE_ANNUAL_PRICE_ID'), 
        name: 'GiveCare Annual'
      }
    }

    const selectedPlan = plans[plan_type as keyof typeof plans]
    if (!selectedPlan) {
      throw new Error('Invalid plan type')
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: selectedPlan.price_id,
          quantity: 1,
        },
      ],
      metadata: {
        user_name: name,
        user_email: email,
        user_phone: phone,
        plan_type: plan_type,
      },
      success_url: `https://www.givecareapp.com/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.givecareapp.com/signup?canceled=true`,
      allow_promotion_codes: true,
    })

    return new Response(
      JSON.stringify({ 
        checkout_url: session.url,
        session_id: session.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Checkout creation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### 3.2 Stripe Webhook Handler

**File**: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
    }

    return new Response('OK', { status: 200 })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Webhook error', { status: 400 })
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { user_name, user_email, user_phone, plan_type } = session.metadata || {}
  
  if (!user_name || !user_phone) {
    console.error('Missing user data in session metadata')
    return
  }

  // Parse name
  const nameParts = user_name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || null
  const cleanPhone = `+1${user_phone.replace(/\\D/g, '')}`

  // Create user in Supabase
  const { data: user, error: dbError } = await supabase
    .from('users')
    .insert({
      phone_number: cleanPhone,
      first_name: firstName,
      last_name: lastName,
      subscription_status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      profile_data: {
        onboarding_step: 0,
        current_phase: "onboarding",
        metadata: {
          source: "website_subscription",
          email: user_email,
          plan_type: plan_type,
          signup_date: new Date().toISOString(),
          checkout_session_id: session.id
        }
      }
    })
    .select()
    .single()

  if (dbError) {
    console.error('Database error:', dbError)
    return
  }

  // Send welcome RCS message
  await sendWelcomeMessage(cleanPhone, firstName)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data, error } = await supabase
    .from('users')
    .update({
      subscription_status: subscription.status as any
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Subscription update error:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data, error } = await supabase
    .from('users')
    .update({
      subscription_status: 'canceled'
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Subscription deletion error:', error)
  }
}

async function sendWelcomeMessage(phone: string, firstName: string) {
  try {
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'MessagingServiceSid': Deno.env.get('TWILIO_MESSAGING_SERVICE_SID') || '',
          'To': phone,
          'Body': `Hi ${firstName}! 🎉 Welcome to GiveCare! Your subscription is active. I'm here to support you every step of your caregiving journey. Let's start by getting to know your situation - just reply with what's on your mind today.`
        })
      }
    )

    if (!twilioResponse.ok) {
      const error = await twilioResponse.json()
      console.error('Twilio error:', error)
    } else {
      console.log(`Welcome message sent to ${phone}`)
    }
  } catch (error) {
    console.error('Failed to send welcome message:', error)
  }
}
```

## 4. Frontend Integration

### 4.1 HTML Form Structure

```html
<!-- Landing page form -->
<form id="subscription-form">
  <!-- User Information -->
  <div class="user-info">
    <h2>Get Started with GiveCare</h2>
    
    <label for="name">Full Name *</label>
    <input type="text" id="name" name="name" required>
    
    <label for="email">Email Address *</label>
    <input type="email" id="email" name="email" required>
    
    <label for="phone">Phone Number *</label>
    <input type="tel" id="phone" name="phone" placeholder="(555) 123-4567" required>
  </div>

  <!-- Plan Selection -->
  <div class="plan-selection">
    <h3>Choose Your Plan</h3>
    
    <div class="plans">
      <label class="plan-option">
        <input type="radio" name="plan" value="monthly" checked>
        <div class="plan-details">
          <h4>Monthly Plan</h4>
          <div class="price">$29.97/month</div>
          <ul>
            <li>Unlimited daily check-ins</li>
            <li>Personalized support strategies</li>
            <li>Crisis support 24/7</li>
            <li>Progress tracking</li>
          </ul>
        </div>
      </label>
      
      <label class="plan-option popular">
        <input type="radio" name="plan" value="annual">
        <div class="plan-details">
          <h4>Annual Plan</h4>
          <div class="price">$299.70/year</div>
          <div class="savings">Save $59.94 (2 months free!)</div>
          <ul>
            <li>Everything in Monthly</li>
            <li>Priority support</li>
            <li>Advanced analytics</li>
            <li>Family member access</li>
          </ul>
        </div>
      </label>
    </div>
  </div>

  <!-- Consent -->
  <div class="consent">
    <label>
      <input type="checkbox" id="sms-consent" required>
      I agree to receive text messages from GiveCare for my caregiving support. 
      Message frequency varies. Reply STOP to opt out. Data rates may apply.
    </label>
    
    <label>
      <input type="checkbox" id="terms-consent" required>
      I agree to the <a href="/terms" target="_blank">Terms of Service</a> and 
      <a href="/privacy" target="_blank">Privacy Policy</a>
    </label>
  </div>

  <button type="submit" id="subscribe-btn">
    Start My Subscription
  </button>
</form>
```

### 4.2 JavaScript Integration

```javascript
// Frontend integration code
class GiveCareSubscription {
  constructor() {
    this.form = document.getElementById('subscription-form')
    this.submitButton = document.getElementById('subscribe-btn')
    this.init()
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e))
    
    // Format phone number as user types
    const phoneInput = document.getElementById('phone')
    phoneInput.addEventListener('input', this.formatPhoneNumber)
  }

  formatPhoneNumber(e) {
    let value = e.target.value.replace(/\\D/g, '')
    if (value.length >= 6) {
      value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`
    } else if (value.length >= 3) {
      value = `(${value.slice(0,3)}) ${value.slice(3)}`
    }
    e.target.value = value
  }

  async handleSubmit(e) {
    e.preventDefault()
    
    // Disable submit button
    this.submitButton.disabled = true
    this.submitButton.textContent = 'Processing...'

    try {
      const formData = new FormData(this.form)
      const planType = formData.get('plan')
      
      // Create checkout session
      const response = await fetch('https://jstusysixwdsiaszvbai.supabase.co/functions/v1/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + 'your-supabase-anon-key'
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          plan_type: planType
        })
      })

      const result = await response.json()

      if (result.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url
      } else {
        throw new Error(result.error || 'Failed to create checkout session')
      }
      
    } catch (error) {
      console.error('Checkout error:', error)
      alert('There was an error processing your request. Please try again.')
      
      // Re-enable submit button
      this.submitButton.disabled = false
      this.submitButton.textContent = 'Start My Subscription'
    }
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  new GiveCareSubscription()
})
```

## 5. Environment Variables

### Supabase Edge Function Environment Variables

Add these in Supabase Dashboard → Settings → Edge Functions:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_XXX
STRIPE_WEBHOOK_SECRET=whsec_XXX
STRIPE_MONTHLY_PRICE_ID=price_XXX
STRIPE_ANNUAL_PRICE_ID=price_YYY

# Twilio Configuration (existing)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxx

# Supabase Configuration (automatically available)
SUPABASE_URL=https://jstusysixwdsiaszvbai.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Frontend Environment Variables

```javascript
// Replace in your frontend code
const SUPABASE_URL = 'https://jstusysixwdsiaszvbai.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'
```

## 6. Welcome/Success Page

### Welcome Page (`/welcome`)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Welcome to GiveCare!</title>
</head>
<body>
  <div class="success-container">
    <h1>🎉 Welcome to GiveCare!</h1>
    
    <div class="success-message">
      <p>Your subscription is now active!</p>
      <p>Check your phone - you should receive a welcome message shortly.</p>
    </div>
    
    <div class="next-steps">
      <h3>What happens next?</h3>
      <ol>
        <li>You'll receive a personalized welcome message</li>
        <li>I'll ask about your caregiving situation</li>
        <li>We'll create your personalized support plan</li>
        <li>Daily check-ins begin based on your needs</li>
      </ol>
    </div>
    
    <div class="contact-info">
      <p><strong>Save this number:</strong> <span id="givecare-number">[Your RCS Number]</span></p>
      <p>For the best experience, continue our conversations via text message.</p>
    </div>
  </div>
  
  <script>
    // Optional: Check session status
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    
    if (sessionId) {
      // Could verify session status if needed
      console.log('Checkout session:', sessionId)
    }
  </script>
</body>
</html>
```

## 7. Deployment Steps

### 7.1 Deploy Edge Functions

```bash
# Deploy checkout creation function
npx supabase functions deploy create-checkout --project-ref jstusysixwdsiaszvbai

# Deploy webhook handler
npx supabase functions deploy stripe-webhook --project-ref jstusysixwdsiaszvbai
```

### 7.2 Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://jstusysixwdsiaszvbai.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`

### 7.3 Test Webhook

```bash
# Install Stripe CLI
stripe listen --forward-to https://jstusysixwdsiaszvbai.supabase.co/functions/v1/stripe-webhook

# Test webhook
stripe trigger checkout.session.completed
```

## 8. Testing Guide

### 8.1 Test Flow

1. **Fill out form** with test data
2. **Use Stripe test card**: `4242 4242 4242 4242`
3. **Complete checkout** in test mode
4. **Verify user creation** in Supabase
5. **Check welcome message** sent via Twilio

### 8.2 Test Cards

```
# Successful payment
4242 4242 4242 4242

# Requires authentication
4000 0025 0000 3155

# Declined card
4000 0000 0000 0002
```

### 8.3 Verification Checklist

- [ ] User created in `users` table with correct data
- [ ] `stripe_customer_id` and `stripe_subscription_id` populated
- [ ] `subscription_status` set to 'active'
- [ ] Profile data includes email and plan type
- [ ] Welcome message sent successfully
- [ ] User can reply to welcome message

## 9. Error Handling

### Common Issues & Solutions

#### 9.1 Duplicate Phone Numbers
```typescript
// In webhook handler, check for existing users
const { data: existingUser } = await supabase
  .from('users')
  .select('id')
  .eq('phone_number', cleanPhone)
  .single()

if (existingUser) {
  // Update existing user instead of creating new
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription
    })
    .eq('phone_number', cleanPhone)
}
```

#### 9.2 Failed Welcome Messages
```typescript
// Log message failures but don't fail user creation
try {
  await sendWelcomeMessage(phone, firstName)
} catch (error) {
  console.error('Welcome message failed:', error)
  // Could queue for retry later
}
```

#### 9.3 Webhook Failures
- Enable webhook retries in Stripe Dashboard
- Implement idempotency checks
- Log all webhook events for debugging

## 10. Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rate**: Form submissions → Completed checkouts
2. **Success Rate**: Completed checkouts → User creation
3. **Message Delivery**: Welcome messages sent/delivered
4. **Subscription Health**: Active/canceled subscriptions

### Logging Strategy

```typescript
// Add structured logging throughout
console.log(JSON.stringify({
  event: 'user_created',
  user_id: user.id,
  stripe_customer_id: session.customer,
  plan_type: plan_type,
  timestamp: new Date().toISOString()
}))
```

---

## Summary

This specification provides everything needed to implement a complete subscription landing page that:

1. ✅ Collects user information (name, email, phone)
2. ✅ Processes Stripe subscription payments
3. ✅ Creates users in your existing Supabase schema
4. ✅ Sends personalized welcome RCS messages
5. ✅ Handles subscription lifecycle via webhooks

The user experience flow:
**Landing Page** → **Stripe Checkout** → **Welcome Page** → **Welcome RCS Message** → **Existing GiveCare Workflow**

All code integrates with your existing infrastructure and requires no schema changes.