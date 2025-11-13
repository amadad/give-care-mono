# GiveCare Subscription & Resubscribe System - Quick Reference

## Overview

GiveCare uses a **subscription-gated SMS chatbot** where users must have an active Stripe subscription to use non-crisis features. Crisis messages always bypass subscription checks.

**Key Fact**: Users have a **30-day grace period** after cancellation to preserve their data and resume without re-onboarding.

---

## Five Critical Entry Points

### 1. Subscription Check During Message Processing
**File**: `convex/inbound.ts` (Line 92-101)
- Every non-crisis message triggers `checkSubscriptionAccess()`
- No subscription → Send "Your subscription has ended. Reply RESUBSCRIBE"
- Has subscription → Route to agent normally

### 2. User Initiates Resubscribe
**File**: `convex/inbound.ts` (Line 63)
- User texts "RESUBSCRIBE"
- Triggers `handleResubscribeAction` (lines 103-156 in `internal/twilioMutations.ts`)
- Creates Stripe checkout and sends URL via SMS

### 3. Stripe Webhook Processing
**File**: `convex/internal/stripeActions.ts` (processWebhook action)
- Verifies webhook signature
- Calls `applyStripeEvent` mutation to create/update subscription records

### 4. Grace Period Calculation
**File**: `convex/lib/domain/stripeMapping.ts` (Lines 72-76)
- When subscription canceled: `gracePeriodEndsAt = canceledAt + 30 days`
- Shown to user: "You have X day(s) to resubscribe without losing your progress"

### 5. New User Detection
**File**: `convex/inbound.ts` (Lines 167-182)
- First SMS from phone: Creates user with `onboardingStage="new"`
- No subscription record initially
- First message triggers resubscribe prompt

---

## Message Routing Logic

```
Non-crisis message received
  ↓
Check subscription status:
  ├─ status="active" → ROUTE TO AGENT
  ├─ status="canceled" + within grace period → ROUTE TO AGENT
  └─ No subscription OR grace expired → SEND RESUBSCRIBE MESSAGE
```

**Exception**: Crisis messages ALWAYS route to `getCrisisResponse()` regardless of subscription status.

---

## Resubscribe User Journey

```
1. User texts "RESUBSCRIBE"
   ↓
2. Check if already subscribed (in grace or active)
   ├─ Yes → "You're already subscribed!"
   └─ No → Continue
   ↓
3. Create Stripe checkout (existing customers use Billing Portal)
   ↓
4. Send URL: "Click here to resubscribe: [link]"
   ↓
5. User completes Stripe checkout
   ↓
6. Stripe webhook fires: customer.subscription.created/updated
   ↓
7. Mutation updates subscriptions table: status="active"
   ↓
8. Next user message: checkSubscriptionAccess → hasAccess: true
   ↓
9. Message routed to agent normally
```

---

## The Two Resubscribe Messages

### Message 1: During Grace Period (User still has access)
```
"Your subscription has ended, but you have X day(s) to resubscribe 
without losing your progress. Reply RESUBSCRIBE to continue."
```

### Message 2: Grace Period Expired (User loses access)
```
"Your subscription has ended. Reply RESUBSCRIBE to continue using GiveCare."
```

Both messages appear when user sends a non-crisis message without active subscription.

---

## Database Schema (Key Tables)

### subscriptions
```typescript
{
  userId: Id<"users">
  stripeCustomerId: string
  planId: "monthly" | "annual"
  status: "active" | "canceled" | "past_due"
  currentPeriodEnd: number          // Stripe period end timestamp
  canceledAt?: number               // When subscription was canceled
  gracePeriodEndsAt?: number        // 30 days after canceledAt
}
```

### users (relevant fields)
```typescript
{
  phone: string                     // E.164 format (+1XXXXXXXXXX)
  externalId: string               // Phone number (legacy)
  metadata: {
    onboardingStage: "new" | "care_recipient" | "zip_code" | "assessment_offer" | "complete"
    careRecipient?: string
    zipCode?: string
  }
}
```

### billing_events (Idempotency)
```typescript
{
  stripeEventId: string             // Unique Stripe event ID
  userId?: Id<"users">
  type: string                      // "customer.subscription.created", etc.
  data: any                         // Full Stripe event object
}
```

---

## Critical Code Snippets

### Checking Subscription Access
**File**: `convex/lib/services/subscriptionService.ts`

```typescript
async function checkSubscriptionAccess(ctx, userId) {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", q => q.eq("userId", userId))
    .first();

  if (!subscription) return { hasAccess: false };
  if (subscription.status === "active") return { hasAccess: true };
  
  if (subscription.status === "canceled" && subscription.gracePeriodEndsAt) {
    const isInGrace = Date.now() < subscription.gracePeriodEndsAt;
    return { hasAccess: isInGrace, isInGracePeriod: isInGrace };
  }

  return { hasAccess: false };
}
```

### Sending Resubscribe Message
**File**: `convex/internal/sms.ts` (Lines 78-98)

```typescript
export const sendResubscribeMessage = internalAction({
  args: { userId: v.id("users"), gracePeriodEndsAt: v.optional(v.number()) },
  handler: async (ctx, { userId, gracePeriodEndsAt }) => {
    const user = await ctx.runQuery(internal.internal.users.getUser, { userId });
    if (!user?.phone) return;

    let message: string;
    if (gracePeriodEndsAt && Date.now() < gracePeriodEndsAt) {
      const daysRemaining = Math.ceil((gracePeriodEndsAt - Date.now()) / 86400000);
      message = `Your subscription has ended, but you have ${daysRemaining} day(s) to resubscribe without losing your progress. Reply RESUBSCRIBE to continue.`;
    } else {
      message = "Your subscription has ended. Reply RESUBSCRIBE to continue using GiveCare.";
    }
    await sendSMS(ctx, user.phone, message);
  },
});
```

### Grace Period Calculation
**File**: `convex/lib/domain/stripeMapping.ts` (Line 73-75)

```typescript
const gracePeriodEndsAt =
  canceledAt && subscriptionStatus === "canceled"
    ? canceledAt + 30 * 24 * 60 * 60 * 1000  // 30 days in milliseconds
    : undefined;
```

---

## Important Behaviors

1. **Subscription BLOCKS non-crisis messages** - Users without active subscription (and not in grace) cannot interact with agents
2. **Crisis always works** - Subscription check is skipped for crisis detection
3. **Grace period is 30 days** - Calculated from cancellation timestamp, not bill end date
4. **Existing customers use Billing Portal** - Simpler UX than new checkout session
5. **New customers get checkout** - If no prior Stripe customer ID
6. **Webhooks are idempotent** - Stored in billing_events table with Stripe eventId
7. **New users start unsubscribed** - Must call RESUBSCRIBE before using non-crisis features
8. **One message at a time** - Onboarding asks one question per interaction (never repeated)
9. **Resubscribe URL sent via SMS** - Users click link to complete payment, then can message again

---

## Troubleshooting Checklist

- User says "I can't send messages":
  - Check subscriptions table for userId
  - Check status: "active"?
  - Check grace period if status="canceled"
  - Run: `db.query("subscriptions").withIndex("by_user", q => q.eq("userId", userId)).first()`

- Resubscribe message not appearing:
  - Check inbound.ts line 92-101 (subscription check)
  - Verify checkSubscriptionAccess is being called
  - Check that message is non-crisis

- Grace period math off:
  - Check stripeMapping.ts for grace calculation
  - Verify canceledAt timestamp in Stripe event
  - Check current time in system (timezone issues?)

- Stripe webhook not updating subscription:
  - Check billing_events table for idempotency
  - Verify STRIPE_WEBHOOK_SECRET is set
  - Check applyStripeEvent mutation for userId lookup

- New user can't resubscribe:
  - Check users table for new user (onboardingStage="new")
  - Verify Stripe price lookup keys exist
  - Check createCheckoutSessionForResubscribe error handling

---

## Files to Modify for Changes

| Change | File | Line |
|--------|------|------|
| Resubscribe message text | `convex/internal/sms.ts` | 78-98 |
| Grace period duration | `convex/lib/domain/stripeMapping.ts` | 73-75 |
| Stripe plans/prices | `convex/internal/stripeActions.ts` | 112-115 |
| Crisis bypass logic | `convex/inbound.ts` | 70-83 |
| Subscription check | `convex/lib/services/subscriptionService.ts` | 13-62 |
| Onboarding stage for new users | `convex/inbound.ts` | 177 |
| Crisis patterns | `convex/lib/utils.ts` | 6-37 |

---

## Related Documentation

- **SUBSCRIPTION_ANALYSIS.md** - Detailed breakdown of all 5 sections
- **SUBSCRIPTION_FLOWS.md** - Visual flow diagrams and state machines
- **ARCHITECTURE.md** - Overall system design (in give-care-app/docs/)
- **Schema**: `convex/schema.ts` lines 189-205 (subscriptions table)

---

## Quick Test Scenarios

1. **New user flow**: Send SMS from new phone → "Your subscription has ended" → Text RESUBSCRIBE → Click link → Complete payment → Text again → Message routed to agent

2. **Canceled subscription**: User with active subscription cancels in Stripe → Day 15 after cancel → User texts message → Still routed to agent (grace period) → See countdown message

3. **Grace expired**: Same as #2 but Day 31 → User gets "Your subscription has ended" → Text RESUBSCRIBE → See checkout

4. **Crisis bypass**: Any subscription status → User texts "suicide" → Always gets 988 lifeline response (no subscription check)

5. **Already subscribed**: User with active subscription → Texts RESUBSCRIBE → Gets "You're already subscribed!" message

---

Generated: 2024
