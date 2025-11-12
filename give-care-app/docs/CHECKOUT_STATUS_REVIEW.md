# Stripe Checkout Status Review

**Date:** 2025-11-11  
**Finding:** Frontend complete, backend action missing

---

## Current State

### ✅ Frontend (give-care-site) - COMPLETE

**File:** `give-care-site/app/components/sections/SignupFormConvex.tsx`

**What's Implemented:**
- ✅ Form component with name, email, phone, plan selection
- ✅ Phone number formatting (E.164)
- ✅ Promo code UI (collapsible section)
- ✅ Calls `api.stripe.createCheckoutSession` action
- ✅ Redirects to Stripe checkout URL
- ✅ Error handling and loading states
- ✅ Environment variables configured (`NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`, `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID`)

**Action Signature Expected:**
```typescript
createCheckoutSession({
  fullName: string,
  email: string,
  phoneNumber: string, // E.164 format (+1XXXXXXXXXX)
  priceId: string
}): Promise<string> // Returns checkout URL
```

---

### ❌ Backend (give-care-app) - MISSING ACTION

**What's Missing:**
- ❌ `convex/stripe.ts` file does not exist
- ❌ `api.stripe.createCheckoutSession` action does not exist
- ❌ No action in `convex/public.ts` either

**What Exists:**
- ✅ Stripe webhook handler (`convex/http.ts:17-75`)
- ✅ Webhook event processing (`convex/internal.ts:360-407`)
- ✅ `handleCheckoutCompleted` function exists but incomplete (has TODO comments)
- ✅ Subscription schema exists (missing trial fields)

---

## Gap Analysis

**Frontend Expectation:**
```typescript
const createCheckoutSession = useAction(api.stripe.createCheckoutSession)
const checkoutUrl = await createCheckoutSession({
  fullName: name,
  email,
  phoneNumber: phoneE164,
  priceId,
})
```

**Backend Reality:**
- Action doesn't exist
- Frontend will fail when called
- Webhook infrastructure exists but can't link users properly

---

## Required Implementation

### 1. Create `convex/stripe.ts` File

**Action Signature (must match frontend):**
```typescript
export const createCheckoutSession = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    phoneNumber: v.string(), // E.164 format
    priceId: v.string(),
    promoCode: v.optional(v.string()), // For Phase 1.2
  },
  handler: async (ctx, args) => {
    // 1. Create/retrieve Stripe customer
    // 2. Create checkout session with:
    //    - client_reference_id: phoneNumber (to link user)
    //    - customer_email: email
    //    - mode: 'subscription'
    //    - subscription_data.trial_period_days: 7
    //    - success_url: `${FRONTEND_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`
    //    - cancel_url: `${FRONTEND_URL}/signup?canceled=true`
    //    - allow_promotion_codes: true
    // 3. Return checkout URL (string)
  },
})
```

### 2. Update `handleCheckoutCompleted` (`convex/internal.ts`)

**Current State:**
- Extracts `client_reference_id` but doesn't use it
- Has TODO comments about linking user

**Required:**
- Extract `client_reference_id` (phoneNumber)
- Find user by phone number
- Link `stripeCustomerId` to user
- Create subscription record with trial fields

### 3. Add Trial Fields to Schema (`convex/schema.ts`)

**Current:**
```typescript
subscriptions: defineTable({
  userId: v.id('users'),
  stripeCustomerId: v.string(),
  planId: v.string(),
  status: v.string(),
  currentPeriodEnd: v.number(),
})
```

**Required:**
```typescript
subscriptions: defineTable({
  userId: v.id('users'),
  stripeCustomerId: v.string(),
  planId: v.string(),
  status: v.string(),
  currentPeriodEnd: v.number(),
  trialEndsAt: v.optional(v.number()), // ADD
  trialStartedAt: v.optional(v.number()), // ADD
})
```

---

## Updated Implementation Plan

### Phase 1.1: Stripe Checkout Flow (REVISED)

**Status:** ⚠️ Frontend Complete, Backend Missing  
**Priority:** P0 (Critical)  
**Estimated Time:** 1-2 days (reduced - frontend already done)

**Tasks:**
1. Create `convex/stripe.ts` with `createCheckoutSession` action
2. Match frontend signature exactly (`fullName`, `email`, `phoneNumber`, `priceId`)
3. Create Stripe checkout session with trial period
4. Update `handleCheckoutCompleted` to link user via `client_reference_id`
5. Add trial fields to `subscriptions` schema
6. Create subscription helpers (`convex/lib/subscription.ts`)

**Files:**
- `convex/stripe.ts` (NEW FILE)
- `convex/internal.ts` (update `handleCheckoutCompleted`)
- `convex/schema.ts` (add trial fields)
- `convex/lib/subscription.ts` (NEW FILE)

**Acceptance Criteria:**
- ✅ `api.stripe.createCheckoutSession` exists and matches frontend signature
- ✅ Frontend can successfully call action
- ✅ User redirected to Stripe checkout
- ✅ Webhook links user to subscription via phone number
- ✅ Trial period tracked correctly

---

## Impact on Overall Plan

**Original Estimate:** 2-3 days  
**Revised Estimate:** 1-2 days (frontend already done)

**Dependencies:**
- Frontend ready to test immediately after backend action created
- No frontend changes needed
- Webhook infrastructure already exists

---

**Last Updated:** 2025-11-11

