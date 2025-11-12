# GiveCare Subscription Check & Resubscribe Flow Analysis

## 1. Where Subscription Checks Happen

### Primary Location: inbound.ts (Message Processing Entry Point)
**File**: `/Users/amadad/Projects/givecare/give-care-app/convex/inbound.ts`

The subscription check is performed at **Step 7** of the message handling pipeline:

```typescript
// Step 7: Check subscription access (crisis bypasses this)
const access = await checkSubscriptionAccess(ctx, user._id);
if (!access.hasAccess) {
  // No access - send resubscribe message
  await ctx.scheduler.runAfter(0, internal.twilioMutations.sendResubscribeMessageAction, {
    userId: user._id,
    gracePeriodEndsAt: access.gracePeriodEndsAt,
  });
  return { status: "subscription_required" };
}
```

**Key Point**: Crisis messages bypass subscription checks completely (detected before this check)

---

## 2. How the "You're not subscribed" Message is Triggered

### Two Message Flows:

#### Flow 1: Triggered During Non-Crisis Message Handling (inbound.ts, line 92-101)
When a user sends a non-crisis message without active subscription:
1. `checkSubscriptionAccess()` returns `hasAccess: false`
2. Scheduler queues `sendResubscribeMessageAction` (async, 0 delay)
3. This calls `sendResubscribeMessage` action

#### Flow 2: User Initiates RESUBSCRIBE Keyword (inbound.ts, line 63-66)
When user explicitly texts "RESUBSCRIBE":
1. Detected by `isResubscribeRequest()` (line 63)
2. Calls `handleResubscribe()` which queues `handleResubscribeAction`

### The Resubscribe Message Template (internal/sms.ts, lines 78-98)

```typescript
export const sendResubscribeMessage = internalAction({
  args: {
    userId: v.id("users"),
    gracePeriodEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, { userId, gracePeriodEndsAt }) => {
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

---

## 3. Current Resubscribe Flow and Logic

### Step-by-Step Flow:

#### Phase 1: User Initiates Resubscribe
User texts "RESUBSCRIBE" → Triggers `handleResubscribeAction` (internal/twilioMutations.ts, lines 103-156)

#### Phase 2: Check Current Subscription Status
```typescript
const subscription = await ctx.runQuery(internal.internal.subscriptions.getByUserId, {
  userId: args.userId,
});

const hasAccess = subscription?.status === "active" || 
  (subscription?.status === "canceled" && 
   subscription.gracePeriodEndsAt && 
   Date.now() < subscription.gracePeriodEndsAt);

if (hasAccess) {
  // User already has access - send confirmation message
  await ctx.runAction(internal.internal.sms.sendAgentResponse, {
    userId: args.userId,
    text: "You're already subscribed! You have full access to GiveCare.",
  });
  return;
}
```

#### Phase 3: Create Checkout Session
Calls `createCheckoutSessionForResubscribe` action (internal/stripeActions.ts):

- **Existing customers** (have stripeCustomerId):
  - Use Stripe Billing Portal (`stripe.billingPortal.sessions.create()`)
  - Allows direct resubscription without leaving portal
  
- **New customers** (no stripeCustomerId):
  - Create new Stripe customer via `stripe.customers.create()`
  - Determine plan from existing subscription OR default to "monthly"
  - Create checkout session using lookup key: `givecare_standard_${planId}`
  - Metadata includes userId and planId

#### Phase 4: Send Checkout URL via SMS
```typescript
if (result?.url) {
  await ctx.runAction(internal.internal.sms.sendAgentResponse, {
    userId: args.userId,
    text: `Click here to resubscribe: ${result.url}`,
  });
}
```

#### Phase 5: Stripe Webhook Updates Subscription
When user completes checkout:
1. Stripe fires webhook: `customer.subscription.created` or `customer.subscription.updated`
2. `processWebhook` action (internal/stripeActions.ts) verifies signature
3. Calls `applyStripeEvent` mutation (internal/stripe.ts)
4. Updates subscriptions table with new status, gracePeriodEndsAt

---

## 4. How subscriptionStatus is Determined and Used

### Subscription Status Values
Defined in schema.ts (line 194-197):
```typescript
status: v.union(
  v.literal("active"),
  v.literal("canceled"),
  v.literal("past_due")
)
```

### Determination Logic (lib/services/subscriptionService.ts)

```typescript
export async function checkSubscriptionAccess(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<{
  hasAccess: boolean;
  isInGracePeriod: boolean;
  gracePeriodEndsAt?: number;
  status?: string;
}>
```

**Decision Tree**:

1. **If no subscription record exists**: `hasAccess: false`
2. **If status === "active"**: `hasAccess: true` (immediately)
3. **If status === "canceled" AND within gracePeriodEndsAt**: `hasAccess: true` (grace period)
4. **Otherwise**: `hasAccess: false`

### Grace Period Logic (lib/domain/stripeMapping.ts, lines 72-76)

```typescript
// Calculate grace period (30 days after cancellation)
const gracePeriodEndsAt =
  canceledAt && subscriptionStatus === "canceled"
    ? canceledAt + 30 * 24 * 60 * 60 * 1000  // 30 days in ms
    : undefined;
```

**Key Points**:
- Grace period is **30 days** from cancellation
- Only applies when status is explicitly "canceled"
- After grace period expires, user must resubscribe to regain access

---

## 5. User Onboarding Logic for New vs Returning Users

### New User Flow (inbound.ts, lines 167-182)

When first SMS received from new phone number:

```typescript
// Create new user
const userId = await ctx.db.insert("users", {
  externalId: normalized,
  phone: normalized,
  channel: "sms",
  locale: "en-US",
  consent: {
    emergency: true,
    marketing: true,
  },
  metadata: {
    onboardingStage: "new",           // ← NEW USER FLAG
    onboardingMilestones: [],
  },
});
```

**Initial State**:
- `onboardingStage: "new"`
- Empty milestones array
- Default consent (emergency + marketing enabled)

### Onboarding Stages (lib/domain/onboarding.ts, lines 13-18)

State machine progression:
```
"new" → "care_recipient" → "zip_code" → "assessment_offer" → "complete"
```

### Required Fields by Interaction Type (lib/domain/onboarding.ts, lines 30-35)

```typescript
const REQUIRED: Record<InteractionType, (keyof UserProfile)[]> = {
  resource_search: ["zipCode"],        // User must provide zip code
  assessment: ["careRecipient"],       // User must identify care recipient
  intervention: ["careRecipient"],     // User must identify care recipient
  check_in: [],                        // No required fields
};
```

### Returning User Detection

**Via Existing Subscription**:
- If subscription exists (any status), user is "returning"
- Grace period still applies even if subscription is canceled

**Via Phone Number Lookup (inbound.ts, lines 143-164)**:
```typescript
// Try to find existing user by phone
const existing = await ctx.db
  .query("users")
  .withIndex("by_phone", (q) => q.eq("phone", normalized))
  .first();

if (existing) {
  return existing;  // ← Returning user
}

// Also check by externalId (for backward compatibility)
const existingByExternalId = await ctx.db
  .query("users")
  .withIndex("by_externalId", (q) => q.eq("externalId", normalized))
  .first();
```

### Onboarding Enforcement (lib/services/onboardingService.ts)

```typescript
export async function enforce(
  ctx: QueryCtx,
  userId: Id<"users">,
  interactionType: InteractionType
): Promise<{ allowed: boolean; question?: string }>
```

- Returns `{ allowed: true }` if all required fields present
- Returns `{ allowed: false, question }` if fields missing
- **One question at a time** per onboarding policy

---

## 6. Message Handling Pipeline (Complete Order)

**Order matters** - Some paths are terminal:

1. **Idempotency Check**: Has messageSid been processed? (Stop if duplicate)
2. **User Resolution**: Get or create user by phone
3. **HELP Detection**: If "help", send help message and return
4. **STOP Detection**: If "stop"/"unsubscribe"/"cancel", update consent and return
5. **RESUBSCRIBE Detection**: If "resubscribe", initiate resubscribe flow and return
6. **Crisis Detection**: Deterministic pattern matching (no LLM)
   - If crisis detected:
     - Bypass subscription check
     - Create alert + guardrail event
     - Send crisis response
     - Schedule follow-up
     - Return immediately
7. **Subscription Check**: (Only for non-crisis messages)
   - If no access and not in grace period:
     - Send resubscribe message
     - Return (don't route to agent)
8. **Update Engagement**: Set lastEngagementDate
9. **Route to Agent**: Queue processMainAgentMessage (async)

---

## 7. Crisis Bypass (Special Case)

Crisis messages **always** get a response regardless of subscription:

**Location**: inbound.ts, lines 70-83

```typescript
const crisisResult = detectCrisis(body);
if (crisisResult.isCrisis) {
  // Crisis always available - bypass subscription check
  await Promise.all([
    ctx.db.insert("inbound_receipts", { ... }),
    handleCrisis(ctx, user._id, crisisResult),
  ]);
  return { status: "crisis" };
}
```

**Crisis Response Template** (lib/utils.ts, lines 180-189):
```typescript
const baseResponse =
  "I'm hearing intense distress. You're not alone. Call or text 988 (24/7) or chat at 988lifeline.org. Text HOME to 741741. If in immediate danger, call 911. Want me to connect you now?";

if (isDVHint) {
  return `${baseResponse} If you can't safely reply, call 911.`;
}
```

---

## 8. Subscription State Transitions (Stripe Webhook Processing)

**File**: internal/stripe.ts (applyStripeEvent mutation)

### Webhook Event Types Handled:

1. **customer.subscription.created**
   - Initial subscription starts
   - Status: "active"
   - No gracePeriodEndsAt

2. **customer.subscription.updated**
   - Subscription modified (e.g., plan change)
   - Status mapped based on Stripe status
   - If canceled_at present and status="canceled": Calculate grace period

3. **customer.subscription.deleted**
   - Subscription explicitly deleted
   - Status: "canceled"
   - gracePeriodEndsAt: current time + 30 days

4. **checkout.session.completed**
   - Ignored (subscription events will follow)
   - Metadata used to link userId to future subscription

### Idempotency
Every webhook event is stored in `billing_events` table with Stripe eventId.
Duplicate webhooks are silently ignored (Stripe may retry).

---

## 9. Key Data Flows Summary

### Subscription Check Flow
```
inbound SMS → getUserOrCreate → checkSubscriptionAccess
                                      ↓
                        subscriptions table query (by_user)
                                      ↓
                    status="active" → hasAccess=true
                    status="canceled" + within grace period → hasAccess=true
                    otherwise → hasAccess=false
                                      ↓
                        If no access: sendResubscribeMessage
```

### Resubscribe Flow
```
User texts "RESUBSCRIBE" 
         ↓
handleResubscribeAction checks current subscription status
         ↓
         ├─ Already subscribed → "You're already subscribed!"
         └─ Not subscribed → createCheckoutSessionForResubscribe
                   ↓
                   ├─ Existing customer → Billing Portal
                   └─ New customer → Create customer + checkout session
                   ↓
            Send checkout URL via SMS
                   ↓
            User completes Stripe checkout
                   ↓
            Stripe webhook updates subscription table
                   ↓
            Next message access is granted (if active)
```

### User Journey
```
First SMS from phone number
         ↓
Create user (onboardingStage="new", no subscription)
         ↓
Send non-crisis message
         ↓
checkSubscriptionAccess → no subscription → No access
         ↓
"Your subscription has ended. Reply RESUBSCRIBE to continue."
         ↓
User replies "RESUBSCRIBE"
         ↓
Create checkout session + send URL
         ↓
User completes checkout
         ↓
Stripe webhook creates subscription record (status="active")
         ↓
Next message: checkSubscriptionAccess → status="active" → Access granted
         ↓
Route to agent for normal processing
```

---

## 10. Database Schema (Relevant Tables)

### users
```typescript
{
  _id: Id<"users">
  externalId: string  // Phone number (E.164)
  phone: string
  email?: string
  name?: string
  channel: "sms" | "email" | "web"
  metadata?: {
    onboardingStage?: "new" | "care_recipient" | "zip_code" | "assessment_offer" | "complete"
    careRecipient?: string
    zipCode?: string
    onboardingMilestones?: string[]
  }
  lastEngagementDate?: number
  consent?: {
    emergency: boolean
    marketing: boolean
  }
}
```

### subscriptions
```typescript
{
  _id: Id<"subscriptions">
  userId: Id<"users">
  stripeCustomerId: string
  planId: "monthly" | "annual"
  status: "active" | "canceled" | "past_due"
  currentPeriodEnd: number  // timestamp
  canceledAt?: number       // timestamp
  gracePeriodEndsAt?: number // timestamp (canceledAt + 30 days)
}
```

### billing_events (Idempotency)
```typescript
{
  stripeEventId: string     // Stripe event ID (unique)
  userId?: Id<"users">
  type: string              // Webhook event type
  data: any                 // Full Stripe event data
}
```

---

## 11. Key Behavioral Rules

1. **No subscription = No access** (except crisis)
2. **Canceled subscriptions have 30-day grace period**
3. **Grace period countdown is shown to user** ("X day(s) to resubscribe")
4. **Crisis always bypasses subscription check**
5. **One onboarding question at a time** (never repeated)
6. **New users start at onboardingStage="new"**
7. **Returning users detected by phone number + externalId**
8. **Stripe events are idempotent** (retry-safe)
9. **Webhook processing requires userId** (must be in metadata)
10. **Resubscribe uses Billing Portal for existing customers** (simpler UX)

---

## 12. Important Files Reference

| Purpose | File Path |
|---------|-----------|
| Message entry point | `convex/inbound.ts` |
| Subscription check | `convex/lib/services/subscriptionService.ts` |
| Resubscribe handler | `convex/internal/twilioMutations.ts` |
| Stripe events | `convex/internal/stripe.ts` |
| Stripe mapping | `convex/lib/domain/stripeMapping.ts` |
| SMS templates | `convex/internal/sms.ts` |
| Onboarding logic | `convex/lib/services/onboardingService.ts` |
| Onboarding policy | `convex/lib/domain/onboarding.ts` |
| User utilities | `convex/lib/utils.ts` |
| Schema definitions | `convex/schema.ts` |

