# GiveCare Subscription System - Documentation Index

This directory contains comprehensive analysis of the GiveCare subscription and resubscribe system.

## Documents

### 1. SUBSCRIPTION_SUMMARY.md (START HERE)
**Quick reference** - 5 minute read
- Five critical entry points
- Message routing logic
- Key behaviors
- Troubleshooting checklist
- Code snippets for common tasks

### 2. SUBSCRIPTION_ANALYSIS.md (DETAILED)
**Comprehensive breakdown** - 20 minute read
- Detailed explanation of all 5 entry points
- How the resubscribe message is triggered
- Complete resubscribe flow with code
- Subscription status determination (decision tree)
- Onboarding logic for new vs returning users
- Message handling pipeline (complete order)
- Crisis bypass rules
- Stripe webhook processing
- Key data flows summary
- Database schema reference

### 3. SUBSCRIPTION_FLOWS.md (VISUAL)
**Flow diagrams** - Reference guide
- Complete SMS inbound message handling pipeline
- Subscription access decision tree
- Resubscribe flow (7 phases)
- Subscription state machine
- New user onboarding journey
- Crisis message handling (with patterns)
- Message type routing table
- Data storage & query patterns
- Critical timing & grace period math
- Error handling paths

---

## Core Concepts

### The Five Critical Entry Points

1. **Subscription Check During Message Processing**
   - Location: `convex/inbound.ts` line 92-101
   - Triggered: Every non-crisis message
   - Decision: Route to agent OR send resubscribe message

2. **User Initiates Resubscribe**
   - Location: `convex/inbound.ts` line 63
   - Triggered: User texts "RESUBSCRIBE"
   - Action: Create Stripe checkout + send URL

3. **Stripe Webhook Processing**
   - Location: `convex/internal/stripeActions.ts`
   - Triggered: User completes Stripe checkout
   - Action: Update subscription record in database

4. **Grace Period Calculation**
   - Location: `convex/lib/domain/stripeMapping.ts` line 73-75
   - Formula: `canceledAt + 30 days`
   - Used: To determine if user in grace period

5. **New User Detection**
   - Location: `convex/inbound.ts` line 167-182
   - Triggered: First SMS from phone number
   - Action: Create user with `onboardingStage="new"`

---

## Key Code Locations

### Message Handling
- **Entry point**: `/convex/inbound.ts` - Main message processing
- **User resolution**: `/convex/inbound.ts:122-183` - getUserOrCreate
- **Keyword detection**: `/convex/lib/utils.ts` - isStopRequest, isHelpRequest, isResubscribeRequest
- **Crisis detection**: `/convex/lib/utils.ts:50-86` - detectCrisis

### Subscription Management
- **Access check**: `/convex/lib/services/subscriptionService.ts` - checkSubscriptionAccess
- **Resubscribe handler**: `/convex/internal/twilioMutations.ts:103-156` - handleResubscribeAction
- **Checkout creation**: `/convex/internal/stripeActions.ts:58-137` - createCheckoutSessionForResubscribe
- **Webhook processing**: `/convex/internal/stripeActions.ts:17-52` - processWebhook
- **Event mapping**: `/convex/lib/domain/stripeMapping.ts` - mapStripeEventToSubscription
- **Event application**: `/convex/internal/stripe.ts:18-122` - applyStripeEvent

### SMS Templates
- **Resubscribe message**: `/convex/internal/sms.ts:78-98` - sendResubscribeMessage
- **Crisis response**: `/convex/lib/utils.ts:180-189` - getCrisisResponse
- **Other templates**: `/convex/lib/twilio.ts:37-62`

### Onboarding
- **Service layer**: `/convex/lib/services/onboardingService.ts`
- **Domain logic**: `/convex/lib/domain/onboarding.ts`
- **Internal queries**: `/convex/internal/onboarding.ts`

### Schema
- **Table definitions**: `/convex/schema.ts:189-205` (subscriptions table)
- **All tables**: `/convex/schema.ts:28-320`

---

## Database Tables Reference

### subscriptions
```typescript
Index: by_user (userId)          // Primary lookup
Index: by_customer (stripeCustomerId)  // Webhook lookup
Index: by_user_status (userId, status) // Status queries

Fields:
- userId: Id<"users">
- stripeCustomerId: string
- planId: "monthly" | "annual"
- status: "active" | "canceled" | "past_due"
- currentPeriodEnd: number      // Stripe billing period end
- canceledAt?: number           // Timestamp of cancellation
- gracePeriodEndsAt?: number    // 30 days after canceledAt
```

### users
```typescript
Index: by_phone (phone)          // User lookup
Index: by_externalId (externalId) // Legacy lookup

Relevant Fields:
- phone: string                 // E.164 format (+1XXXXXXXXXX)
- externalId: string            // Phone number (legacy)
- channel: "sms" | "email" | "web"
- lastEngagementDate?: number
- metadata?: {
    onboardingStage?: string
    careRecipient?: string
    zipCode?: string
  }
```

### billing_events (Idempotency)
```typescript
Index: by_event (stripeEventId)  // Unique event check

Fields:
- stripeEventId: string         // Stripe webhook event ID
- userId?: Id<"users">
- type: string                  // Event type
- data: any                     // Full Stripe event data
```

### inbound_receipts (Message Idempotency)
```typescript
Index: by_messageSid (messageSid) // Unique message check
Index: by_user (userId)

Fields:
- messageSid: string            // Twilio message SID
- userId?: Id<"users">
- receivedAt?: number
```

---

## Decision Trees

### Subscription Access Logic
```
User sends non-crisis message
  ↓
Query subscriptions table
  ├─ No record → hasAccess: false
  └─ Found:
      ├─ status="active" → hasAccess: true
      ├─ status="canceled":
      │   └─ if Date.now() < gracePeriodEndsAt
      │       ├─ true → hasAccess: true
      │       └─ false → hasAccess: false
      └─ status="past_due" → hasAccess: false
```

### Resubscribe Flow
```
User texts "RESUBSCRIBE"
  ↓
Check current subscription
  ├─ Active or in grace → "Already subscribed"
  └─ No subscription:
      └─ Has stripeCustomerId?
          ├─ Yes → Use Billing Portal
          └─ No → Create new customer + checkout
```

### Message Routing
```
Message received
  ├─ STOP/UNSUBSCRIBE → handleStop()
  ├─ HELP → handleHelp()
  ├─ RESUBSCRIBE → handleResubscribe()
  ├─ Crisis detected → sendCrisisResponse() (bypass subscription)
  └─ Normal message:
      └─ Has subscription access?
          ├─ Yes → routeToAgent()
          └─ No → sendResubscribeMessage()
```

---

## Important Constants

```
Grace Period Duration: 30 days (in milliseconds)
  = 30 * 24 * 60 * 60 * 1000
  = 2,592,000,000 ms

Days Remaining Calculation:
  Math.ceil((gracePeriodEndsAt - Date.now()) / 86400000)
  where 86400000 ms = 1 day

Stripe API Version: 2025-10-29.clover

Stripe Price Lookup Keys:
  - "givecare_standard_monthly"
  - "givecare_standard_annual"

Success URL (checkout redirect):
  https://www.givecareapp.com/signup?resubscribed=true

Cancel URL (checkout redirect):
  https://www.givecareapp.com/signup?canceled=true
```

---

## Common Tasks

### Check User Subscription Status
```typescript
const subscription = await ctx.db
  .query("subscriptions")
  .withIndex("by_user", q => q.eq("userId", userId))
  .first();

const access = await checkSubscriptionAccess(ctx, userId);
```

### Change Resubscribe Message
Edit `/convex/internal/sms.ts` lines 78-98

### Change Grace Period
Edit `/convex/lib/domain/stripeMapping.ts` line 73-75
Change: `canceledAt + 30 * 24 * 60 * 60 * 1000`
To desired duration in milliseconds

### Add New Keyword
Edit `/convex/lib/utils.ts`:
- Add pattern to appropriate PATTERNS array
- Add handler function in `inbound.ts`
- Add early return in handleIncomingMessage

### Test Resubscribe Flow
1. Send SMS from new number → "Your subscription has ended"
2. Reply "RESUBSCRIBE" → Get checkout URL
3. Complete checkout in Stripe
4. Send SMS again → Route to agent (subscription now active)

---

## Debugging Checklist

- User can't send messages:
  - Check subscriptions table has record with status="active"
  - If status="canceled", verify current time < gracePeriodEndsAt
  - Verify `checkSubscriptionAccess()` called in inbound.ts

- Resubscribe message not appearing:
  - Verify message is non-crisis (not matching crisis patterns)
  - Check subscription check at inbound.ts line 92-101 is executed
  - Verify user object exists and has phone number

- Grace period countdown wrong:
  - Check `gracePeriodEndsAt` value in subscriptions table
  - Verify `canceledAt` timestamp accurate
  - Check system timezone settings

- Stripe webhook failing:
  - Verify STRIPE_WEBHOOK_SECRET environment variable set
  - Check billing_events table for duplicate handling
  - Look at error logs for signature verification failures

---

## Files Structure

```
give-care-app/convex/
├── inbound.ts                          ← Message entry point
├── internal/
│   ├── twilioMutations.ts              ← Resubscribe handler
│   ├── stripeActions.ts                ← Checkout & webhook processing
│   ├── stripe.ts                       ← Event application
│   ├── sms.ts                          ← SMS sending
│   └── onboarding.ts                   ← Onboarding queries
├── lib/
│   ├── services/
│   │   ├── subscriptionService.ts      ← Access checking
│   │   └── onboardingService.ts        ← Onboarding service
│   ├── domain/
│   │   ├── stripeMapping.ts            ← Event mapping
│   │   └── onboarding.ts               ← Onboarding logic
│   ├── twilio.ts                       ← SMS templates
│   └── utils.ts                        ← Crisis detection
└── schema.ts                           ← Database schema
```

---

## Related Documentation

- **CLAUDE.md** - Project conventions and tooling
- **ARCHITECTURE.md** - System design (in docs/ folder)
- **give-care-site/CLAUDE.md** - Frontend integration
- **Stripe API docs** - https://stripe.com/docs

---

## Quick Links to Code

- Subscription check: [inbound.ts:92-101](file:///Users/amadad/Projects/givecare/give-care-app/convex/inbound.ts#L92)
- Resubscribe handler: [internal/twilioMutations.ts:103-156](file:///Users/amadad/Projects/givecare/give-care-app/convex/internal/twilioMutations.ts#L103)
- Access decision: [lib/services/subscriptionService.ts:13-62](file:///Users/amadad/Projects/givecare/give-care-app/convex/lib/services/subscriptionService.ts#L13)
- Grace period: [lib/domain/stripeMapping.ts:72-76](file:///Users/amadad/Projects/givecare/give-care-app/convex/lib/domain/stripeMapping.ts#L72)
- New user creation: [inbound.ts:167-182](file:///Users/amadad/Projects/givecare/give-care-app/convex/inbound.ts#L167)
- Event processing: [internal/stripe.ts:18-122](file:///Users/amadad/Projects/givecare/give-care-app/convex/internal/stripe.ts#L18)
- Webhook handling: [internal/stripeActions.ts:17-52](file:///Users/amadad/Projects/givecare/give-care-app/convex/internal/stripeActions.ts#L17)
