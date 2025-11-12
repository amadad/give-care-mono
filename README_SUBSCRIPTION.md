# GiveCare Subscription System - Complete Analysis

This analysis covers the entire subscription and resubscribe flow in the GiveCare backend.

## What You'll Find Here

Four comprehensive documents totaling 1,728 lines of analysis:

1. **SUBSCRIPTION_INDEX.md** - Navigation guide and quick links
2. **SUBSCRIPTION_SUMMARY.md** - 5-minute quick reference (START HERE)
3. **SUBSCRIPTION_ANALYSIS.md** - 20-minute detailed breakdown
4. **SUBSCRIPTION_FLOWS.md** - Visual flow diagrams and state machines

---

## The System at a Glance

GiveCare is a **subscription-gated SMS chatbot** where:

- Users must have active Stripe subscriptions to use non-crisis features
- Crisis messages ALWAYS work regardless of subscription status
- Users have a 30-day grace period after cancellation to preserve their data
- Resubscribe flow is initiated by texting "RESUBSCRIBE"
- New users are automatically detected and prompted to subscribe

### Key Statistics
- 5 critical entry points for subscriptions
- 3 subscription statuses: active, canceled, past_due
- 30-day grace period (customizable)
- 6 message routing paths (STOP, HELP, RESUBSCRIBE, Crisis, Subscribed, Unsubscribed)
- 2 resubscribe message variants (with/without grace period countdown)

---

## Quick Start

### I have 5 minutes
Read **SUBSCRIPTION_SUMMARY.md**:
- Five critical entry points
- Message routing logic
- Key behaviors
- Troubleshooting checklist

### I have 20 minutes
Read **SUBSCRIPTION_ANALYSIS.md**:
- Detailed breakdown of all 5 entry points
- Complete resubscribe flow with code snippets
- Subscription status determination
- Onboarding logic
- Database schema reference

### I want visual flow diagrams
Read **SUBSCRIPTION_FLOWS.md**:
- Complete SMS pipeline flow
- Subscription access decision tree
- 7-phase resubscribe flow
- Subscription state machine
- Grace period timeline math

### I need to navigate the codebase
Read **SUBSCRIPTION_INDEX.md**:
- Key code locations with line numbers
- Database table schemas
- Decision trees
- Common tasks and how to do them
- Debugging checklist

---

## The Five Critical Entry Points

### 1. Subscription Check (inbound.ts:92-101)
Every non-crisis message triggers a subscription check:
```
User sends message → checkSubscriptionAccess() → Route to agent OR send resubscribe
```

### 2. User Initiates Resubscribe (inbound.ts:63)
User explicitly texts "RESUBSCRIBE":
```
"RESUBSCRIBE" → handleResubscribeAction → Create Stripe checkout → Send URL
```

### 3. Stripe Webhook Processing (internal/stripeActions.ts)
User completes checkout and Stripe sends webhook:
```
Checkout complete → Stripe webhook → applyStripeEvent → Update subscriptions table
```

### 4. Grace Period Calculation (lib/domain/stripeMapping.ts:73-75)
When subscription canceled, calculate 30-day grace period:
```
canceledAt → gracePeriodEndsAt = canceledAt + 30 days
```

### 5. New User Detection (inbound.ts:167-182)
First SMS from phone creates new user:
```
New phone → Create user → onboardingStage="new" → No subscription → First message triggers resubscribe
```

---

## Core Logic

### Message Routing Decision
```
If message is STOP/UNSUBSCRIBE → handleStop()
Else if message is HELP         → handleHelp()
Else if message is RESUBSCRIBE  → handleResubscribe()
Else if detectCrisis()          → sendCrisisResponse() [bypass subscription]
Else:
  Check subscription access:
    If has access (active or in grace) → routeToAgent()
    Else → sendResubscribeMessage()
```

### Subscription Access Decision
```
Query subscriptions by userId:
  If not found → hasAccess: false
  Else if status="active" → hasAccess: true
  Else if status="canceled":
    If Date.now() < gracePeriodEndsAt → hasAccess: true
    Else → hasAccess: false
  Else (past_due) → hasAccess: false
```

### Resubscribe Decision
```
User asks RESUBSCRIBE:
  Check if already subscribed (active or in grace)
    If yes → "You're already subscribed!"
    Else:
      If has stripeCustomerId → Use Billing Portal
      Else → Create new Stripe customer + checkout
      Send checkout URL via SMS
```

---

## Critical Features

1. **Subscription Blocks Non-Crisis Messages**
   - Crisis detection is deterministic (pattern matching, no LLM)
   - Non-crisis messages without subscription get resubscribe prompt
   - Users can't access agent without subscription (except crisis)

2. **Grace Period Preserves User Data**
   - 30 days after cancellation
   - Users maintain access during grace period
   - Countdown message shown ("X days to resubscribe")
   - After expiration, must resubscribe to regain access

3. **Existing Customers Use Billing Portal**
   - Simpler UX than new checkout
   - Uses Stripe Customer Portal
   - Can resubscribe directly without creating new session

4. **New Customers Get Checkout**
   - Creates new Stripe customer
   - Creates new checkout session
   - Metadata includes userId for webhook lookup

5. **Idempotent Webhook Processing**
   - billing_events table stores Stripe eventId
   - Duplicate webhooks safely ignored
   - Stripe can retry without double-charging

6. **Onboarding Isolated from Subscription**
   - New users start with onboardingStage="new"
   - Separate from subscription status
   - Can onboard during grace period

---

## Database Tables

### subscriptions (Core)
- **by_user** index: Primary lookup (userId)
- **by_customer** index: Webhook lookup (stripeCustomerId)
- Fields: status, planId, currentPeriodEnd, canceledAt, gracePeriodEndsAt

### billing_events (Idempotency)
- **by_event** index: Prevents duplicate webhooks (stripeEventId)
- Stores full Stripe event for replay/debugging

### inbound_receipts (Idempotency)
- **by_messageSid** index: Prevents duplicate messages
- Stores message metadata for debugging

### users (User Profiles)
- **by_phone** index: User resolution
- **by_externalId** index: Legacy compatibility
- Fields: onboardingStage, careRecipient, zipCode, lastEngagementDate

---

## File Organization

```
give-care-app/convex/
├── inbound.ts                    ← Entry point for all messages
├── internal/
│   ├── twilioMutations.ts        ← Resubscribe handler wrapper
│   ├── stripeActions.ts          ← Checkout & webhook processing
│   ├── stripe.ts                 ← Event application
│   ├── sms.ts                    ← SMS sending (actions)
│   └── onboarding.ts             ← Onboarding queries
├── lib/
│   ├── services/
│   │   ├── subscriptionService.ts    ← Access checking logic
│   │   └── onboardingService.ts      ← Onboarding service
│   ├── domain/
│   │   ├── stripeMapping.ts      ← Event mapping (pure function)
│   │   └── onboarding.ts         ← Onboarding policy
│   ├── twilio.ts                 ← SMS templates
│   └── utils.ts                  ← Crisis detection
└── schema.ts                     ← Database schema definitions
```

---

## Important Constants

| Constant | Value | Location |
|----------|-------|----------|
| Grace Period | 30 days | `stripeMapping.ts:73` |
| Crisis patterns (high) | "suicide", "kill myself", etc. | `utils.ts:8-14` |
| Crisis patterns (medium) | "hurt myself", "hopeless", etc. | `utils.ts:15-19` |
| Stripe API version | 2025-10-29.clover | `stripeActions.ts:32` |
| Success redirect | givecareapp.com/signup?resubscribed=true | `twilioMutations.ts:135` |
| Cancel redirect | givecareapp.com/signup?canceled=true | `twilioMutations.ts:136` |
| Price lookup (monthly) | givecare_standard_monthly | `stripeActions.ts:113` |
| Price lookup (annual) | givecare_standard_annual | `stripeActions.ts:114` |

---

## Common Changes

### Change Grace Period Duration
File: `/convex/lib/domain/stripeMapping.ts` line 73-75
```typescript
// Current: 30 days
gracePeriodEndsAt = canceledAt + 30 * 24 * 60 * 60 * 1000

// To change, modify the multiplier:
// 14 days:   canceledAt + 14 * 24 * 60 * 60 * 1000
// 60 days:   canceledAt + 60 * 24 * 60 * 60 * 1000
```

### Change Resubscribe Messages
File: `/convex/internal/sms.ts` lines 78-98
- Update message within grace period (line 91)
- Update message after grace expires (line 93)

### Add New Crisis Pattern
File: `/convex/lib/utils.ts` lines 6-21
- Add regex to appropriate severity array (high, medium, or low)
- Pattern is case-insensitive

### Change Stripe Plans
File: `/convex/internal/stripeActions.ts` lines 112-115
- Update STRIPE_PRICE_LOOKUP_KEYS object
- Keys must match Stripe API lookup keys

---

## Testing Checklist

1. **New User Flow**
   - Send SMS from new number
   - Should receive: "Your subscription has ended. Reply RESUBSCRIBE"
   - Reply RESUBSCRIBE
   - Should receive checkout URL
   - Complete checkout
   - Send another message
   - Should route to agent (subscription now active)

2. **Grace Period Flow**
   - Cancel active subscription in Stripe
   - User sends message within 30 days
   - Should see countdown: "X day(s) to resubscribe"
   - Should be routed to agent (still has access)

3. **Grace Expired**
   - Same as above, but on day 31+
   - Should see: "Your subscription has ended"
   - Should NOT route to agent

4. **Crisis Bypass**
   - Any subscription status
   - Send message with crisis keyword ("suicide")
   - Should receive 988 lifeline response
   - Should create alert record
   - Should NOT check subscription

5. **Resubscribe with Active Subscription**
   - User with active subscription
   - Send RESUBSCRIBE
   - Should receive: "You're already subscribed!"

---

## Debugging Guide

### User reports "can't send messages"
1. Check subscriptions table: `db.query("subscriptions").withIndex("by_user", q => q.eq("userId", userId)).first()`
2. Verify status is "active"
3. If status is "canceled", verify: `Date.now() < gracePeriodEndsAt`
4. Check inbound.ts:92-101 is being executed

### Resubscribe message not appearing
1. Verify message is non-crisis (doesn't match patterns in utils.ts)
2. Check inbound.ts:92-101 (subscription check) is being called
3. Verify user has phone number: `user?.phone` exists

### Grace period countdown math wrong
1. Check `gracePeriodEndsAt` in subscriptions table
2. Verify `canceledAt` timestamp matches Stripe event
3. Verify system timezone doesn't offset calculation

### Stripe webhook failing
1. Verify `STRIPE_WEBHOOK_SECRET` environment variable is set
2. Check billing_events table for webhook event (should be there even on error)
3. Look for error logs on signature verification

### New user can't checkout
1. Verify user was created with `onboardingStage="new"`
2. Check Stripe price lookup keys exist in Stripe dashboard
3. Verify STRIPE_SECRET_KEY is set
4. Check createCheckoutSessionForResubscribe error handling

---

## Documentation Files

- **SUBSCRIPTION_INDEX.md** (335 lines)
  - Navigation and code locations
  - Decision trees
  - Important constants
  - Debugging checklist

- **SUBSCRIPTION_SUMMARY.md** (280 lines)
  - Quick reference (5 min read)
  - Five entry points
  - Message routing logic
  - Troubleshooting

- **SUBSCRIPTION_ANALYSIS.md** (492 lines)
  - Detailed breakdown (20 min read)
  - Complete flow descriptions
  - Database schema
  - Key behaviors

- **SUBSCRIPTION_FLOWS.md** (621 lines)
  - Visual flow diagrams
  - State machines
  - Decision trees
  - Timeline math

- **README_SUBSCRIPTION.md** (this file)
  - Overview and quick start
  - Core logic summary
  - Testing checklist
  - Debugging guide

---

## Related Documentation

- `give-care-app/docs/ARCHITECTURE.md` - System design
- `CLAUDE.md` - Project conventions
- `give-care-site/CLAUDE.md` - Frontend integration
- Stripe API Docs - https://stripe.com/docs

---

## Generated
Analysis created: November 12, 2024

Total documentation:
- 1,728 lines across 5 files
- 15 KB (ANALYSIS) + 21 KB (FLOWS) + 11 KB (INDEX) + 9.3 KB (SUMMARY)
- Complete coverage of subscription system
