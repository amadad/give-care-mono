# Subscription & Message Flow Diagrams

## 1. Complete SMS Inbound Message Handling Pipeline

```
User sends SMS
       ↓
[inbound.ts: handleIncomingMessage]
       ↓
┌─────────────────────────────────┐
│ Step 1: Idempotency Check       │
│ (by messageSid in inbound_receipts) │
└─────────────────────────────────┘
       ↓
  [Already processed?]
  ├─ Yes → Return "duplicate"
  └─ No → Continue
       ↓
┌─────────────────────────────────┐
│ Step 2: User Resolution         │
│ getUserOrCreate(phone)          │
│ - Query by phone                │
│ - Query by externalId (legacy)  │
│ - Create if new                 │
└─────────────────────────────────┘
       ↓
     [New User?]
     ├─ Yes → onboardingStage="new"
     └─ No → Existing user
       ↓
┌─────────────────────────────────┐
│ Step 3-5: Keyword Checks        │
│ (Terminal paths - return early)  │
└─────────────────────────────────┘
       ↓
  [isStopRequest(body)]
  ├─ Yes → handleStop() → Return "stopped"
  └─ No
       ↓
  [isHelpRequest(body)]
  ├─ Yes → handleHelp() → Return "help"
  └─ No
       ↓
  [isResubscribeRequest(body)]
  ├─ Yes → handleResubscribe() → Return "resubscribe_initiated"
  └─ No → Continue
       ↓
┌─────────────────────────────────┐
│ Step 6: Crisis Detection        │
│ detectCrisis(body) - Deterministic
│ (No LLM, <600ms target)         │
└─────────────────────────────────┘
       ↓
  [isCrisis?]
  ├─ Yes:
  │  ├─ Create inbound_receipt
  │  ├─ Insert alert record
  │  ├─ Insert guardrail_event
  │  ├─ Schedule sendCrisisResponse
  │  ├─ Schedule 24h follow-up
  │  └─ Return "crisis" (BYPASS SUBSCRIPTION CHECK)
  │
  └─ No → Continue
       ↓
┌─────────────────────────────────┐
│ Step 3 (non-crisis):            │
│ Create inbound_receipt          │
└─────────────────────────────────┘
       ↓
┌─────────────────────────────────┐
│ Step 7: CRITICAL - Subscription │
│ Check via checkSubscriptionAccess│
│ - Query subscriptions table     │
│ - Check status="active"?        │
│ - Check grace period?           │
└─────────────────────────────────┘
       ↓
  [hasAccess?]
  ├─ No:
  │  ├─ Schedule sendResubscribeMessage
  │  │  (with gracePeriodEndsAt if in grace)
  │  └─ Return "subscription_required"
  │
  └─ Yes → Continue to Step 8
       ↓
┌─────────────────────────────────┐
│ Step 8: Update Engagement       │
│ Set user.lastEngagementDate     │
└─────────────────────────────────┘
       ↓
┌─────────────────────────────────┐
│ Step 9: Route to Agent (Async)  │
│ Schedule processMainAgentMessage │
│ - Agent generates response      │
│ - Response sent via SMS         │
└─────────────────────────────────┘
       ↓
  Return "processed"
```

---

## 2. Subscription Access Decision Tree

```
checkSubscriptionAccess(userId)
       ↓
Query subscriptions table by userId
       ↓
  [Found?]
  ├─ No:
  │  └─ Return {
  │      hasAccess: false,
  │      isInGracePeriod: false
  │    }
  │
  └─ Yes → Check status
       ↓
    [status === "active"]
    ├─ Yes:
    │  └─ Return {
    │      hasAccess: true,
    │      isInGracePeriod: false,
    │      status: "active"
    │    }
    │
    └─ No → Continue
       ↓
    [status === "canceled"]
    ├─ No:
    │  └─ Return {
    │      hasAccess: false,
    │      isInGracePeriod: false,
    │      status: "past_due" | other
    │    }
    │
    └─ Yes → Check grace period
       ↓
    [Now < gracePeriodEndsAt]
    ├─ Yes (within grace):
    │  └─ Return {
    │      hasAccess: true,
    │      isInGracePeriod: true,
    │      gracePeriodEndsAt: <timestamp>,
    │      status: "canceled"
    │    }
    │
    └─ No (expired grace):
       └─ Return {
          hasAccess: false,
          isInGracePeriod: false,
          gracePeriodEndsAt: <timestamp>,
          status: "canceled"
        }
```

---

## 3. Resubscribe Flow (Initiated by User)

```
User texts "RESUBSCRIBE"
       ↓
[inbound.ts] isResubscribeRequest() = true
       ↓
[handleResubscribe() calls scheduler]
       ↓
[internal/twilioMutations.ts: handleResubscribeAction]
       ↓
┌──────────────────────────────────┐
│ Phase 1: Check Current Access    │
│ Query subscription by userId     │
└──────────────────────────────────┘
       ↓
  [User already has access?]
  │ (status="active" OR in grace period)
  ├─ Yes:
  │  ├─ Send "You're already subscribed!"
  │  └─ Return
  │
  └─ No → Continue
       ↓
┌──────────────────────────────────┐
│ Phase 2: Create Checkout Session │
│ internal/stripeActions.ts:       │
│ createCheckoutSessionForResubscribe
└──────────────────────────────────┘
       ↓
  [Has stripeCustomerId from prev subscription?]
  ├─ Yes (Existing Customer):
  │  ├─ Create Billing Portal session
  │  │  stripe.billingPortal.sessions.create({
  │  │    customer: stripeCustomerId,
  │  │    return_url: successUrl
  │  │  })
  │  └─ Return portal URL
  │
  └─ No (New Customer):
     ├─ Create Stripe Customer
     │  stripe.customers.create({
     │    email, name,
     │    metadata: { userId, planId }
     │  })
     ├─ Determine plan
     │  (existing subscription or default "monthly")
     ├─ Create Checkout Session
     │  stripe.checkout.sessions.create({
     │    mode: "subscription",
     │    line_items: [{
     │      price: "givecare_standard_${planId}",
     │      quantity: 1
     │    }],
     │    metadata: { userId, planId }
     │  })
     └─ Return checkout URL
       ↓
┌──────────────────────────────────┐
│ Phase 3: Send Checkout URL       │
│ via sendAgentResponse SMS         │
│ "Click here to resubscribe: ..."  │
└──────────────────────────────────┘
       ↓
User clicks link, completes Stripe checkout
       ↓
┌──────────────────────────────────┐
│ Phase 4: Stripe Webhook          │
│ (internal/stripeActions.ts)      │
│ processWebhook action            │
│ - Verify signature               │
│ - Call applyStripeEvent mutation │
└──────────────────────────────────┘
       ↓
[internal/stripe.ts: applyStripeEvent]
       ↓
  Event type: "customer.subscription.created"
              or "customer.subscription.updated"
       ↓
  [Already processed? (billing_events)]
  ├─ Yes → Return "duplicate"
  └─ No
       ↓
  Map to SubscriptionState via mapStripeEventToSubscription
       ↓
  [Find user by stripeCustomerId or metadata.userId]
       ↓
  Upsert subscriptions record:
  - status: "active"
  - planId: from metadata
  - currentPeriodEnd: from Stripe
  - gracePeriodEndsAt: null (new/renewal)
       ↓
  Insert billing_events record (idempotency)
       ↓
Next user message:
       ↓
  checkSubscriptionAccess(userId)
       ↓
  status="active" → hasAccess: true
       ↓
  Message routed to agent normally
```

---

## 4. Subscription State Machine (Stripe Mapping)

```
                    customer.subscription.created
                    or
                    customer.subscription.updated
                    (status="active")
                              ↓
                    ┌─────────────────┐
                    │   ACTIVE        │
                    │ (Full Access)   │
                    └─────────────────┘
                         ↓
                  User cancels subscription
                  (customer.subscription.updated
                   with canceled_at + status="canceled")
                         ↓
                    ┌─────────────────┐
                    │ CANCELED (with  │
                    │ Grace Period)   │
                    │ 30 days access  │
                    │ gracePeriodEndsAt =
                    │ canceledAt + 30d│
                    └─────────────────┘
                         ↓
                  30 days pass
                  (gracePeriodEndsAt timestamp reached)
                         ↓
                    ┌─────────────────┐
                    │ CANCELED (Grace │
                    │ Expired)        │
                    │ No Access       │
                    │ Can resubscribe │
                    └─────────────────┘
                         ↓
                  User texts RESUBSCRIBE
                         ↓
                  (Returns to checkout)


Webhook Event Handling:

checkout.session.completed
├─ Metadata has userId + planId
├─ Subscription event will follow
└─ Ignored (idempotent)

customer.subscription.created
├─ status="active"
├─ gracePeriodEndsAt=null
└─ Creates new subscription record

customer.subscription.updated
├─ Check status (active|canceled|past_due)
├─ If canceled_at present:
│  └─ gracePeriodEndsAt = canceledAt + 30 days
└─ Updates existing subscription record

customer.subscription.deleted
├─ status="canceled"
├─ gracePeriodEndsAt = now + 30 days
└─ Updates subscription record
```

---

## 5. New User Onboarding Journey

```
First SMS from new phone number
       ↓
[inbound.ts: getUserOrCreate]
       ↓
Query by phone → Not found
Query by externalId → Not found
       ↓
Create new user:
{
  externalId: "+1XXXXXXXXXX",
  phone: "+1XXXXXXXXXX",
  channel: "sms",
  locale: "en-US",
  consent: {
    emergency: true,
    marketing: true
  },
  metadata: {
    onboardingStage: "new",      ← NEW FLAG
    onboardingMilestones: []
  }
}
       ↓
No subscription record exists
       ↓
User sends: "I need help"
       ↓
checkSubscriptionAccess(userId) → hasAccess: false
       ↓
Send: "Your subscription has ended. 
        Reply RESUBSCRIBE to continue."
       ↓
User replies: "RESUBSCRIBE"
       ↓
[handleResubscribeAction]
       ↓
Create Stripe customer (no prior subscription)
Create checkout session
Send: "Click here to resubscribe: [link]"
       ↓
User completes checkout
       ↓
Stripe webhook → Create subscription record
status: "active"
       ↓
User sends: "My mom has Alzheimer's"
       ↓
checkSubscriptionAccess(userId)
  └─ Query subscriptions: status="active" → hasAccess: true
       ↓
routeToAgent(mainAgent)
       ↓
Agent: "Who is your mom? What care do you provide?"
       ↓
User: "She needs memory care. I'm her primary caregiver"
       ↓
[Agent can now call onboarding.enforce() to track progress]
[For resource_search: requires zipCode]
[For assessment: requires careRecipient]
[For intervention: requires careRecipient]
```

---

## 6. Crisis Message Handling (Subscription Bypass)

```
User texts: "I want to kill myself"
       ↓
[inbound.ts: handleIncomingMessage]
       ↓
All keyword checks pass (STOP, HELP, RESUBSCRIBE)
       ↓
[detectCrisis(body)]
       ↓
Check crisis patterns:
┌────────────────────────────┐
│ CRISIS_PATTERNS.high:      │
│ - "kill myself"     ← MATCH
│ - "suicide"                │
│ - "end my life"            │
│ - "can't go on"            │
│ - "overdose"               │
│                            │
│ CRISIS_PATTERNS.medium:    │
│ - "hurt myself"            │
│ - "self-harm"              │
│ - "hopeless"               │
│ - "done with life"         │
│                            │
│ CRISIS_PATTERNS.low:       │
│ - "panic attack"           │
└────────────────────────────┘
       ↓
isCrisis: true, severity: "high"
       ↓
[handleCrisis(userId, crisisResult)]
       ↓
Create records (parallel):
├─ alerts table entry
│  {
│    userId,
│    type: "crisis",
│    severity: "high",
│    context: { detection: {...} },
│    message: <crisis response>,
│    status: "pending"
│  }
└─ guardrail_events table entry
       ↓
Schedule sendCrisisResponse (immediate)
├─ Message: "I'm hearing intense distress. 
│            You're not alone. Call or text 988..."
└─ No subscription check! ALWAYS SENT
       ↓
Schedule follow-up check-in (24 hours later)
       ↓
Return "crisis" (exit pipeline early)

NOTE: Crisis messages completely bypass:
  - Subscription status check
  - Onboarding enforcement
  - Agent routing
Crisis gets immediate, hardcoded response
```

---

## 7. Message Type Routing Table

```
┌─────────────────────────────────────────────────────────────────┐
│ INBOUND MESSAGE TYPE           │ ACTION                  │ ROUTE │
├─────────────────────────────────────────────────────────────────┤
│ Duplicate (by messageSid)      │ Idempotent - Ignore     │ STOP  │
├─────────────────────────────────────────────────────────────────┤
│ "STOP", "UNSUBSCRIBE", etc.    │ Update consent.marketing│ STOP  │
│                                │ = false                 │       │
│                                │ Send STOP confirmation  │       │
├─────────────────────────────────────────────────────────────────┤
│ "HELP", "INFO", "SUPPORT"      │ Send help message       │ STOP  │
│                                │ (no subscription check) │       │
├─────────────────────────────────────────────────────────────────┤
│ "RESUBSCRIBE"                  │ Create checkout session │ STOP  │
│                                │ Send URL                │       │
├─────────────────────────────────────────────────────────────────┤
│ Crisis keywords detected       │ Crisis response 988     │ STOP  │
│ ("suicide", "kill myself", etc)│ Create alert record     │ BYPASS│
│                                │ Always sent (no sub req)│ SUBS  │
├─────────────────────────────────────────────────────────────────┤
│ Normal message                 │ Check subscription      │ CONT  │
│ (no keywords, no crisis)       │ ├─ No access:          │       │
│                                │ │  Send resubscribe msg │       │
│                                │ └─ Has access:         │       │
│                                │    Route to agent      │       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Data Storage & Query Patterns

```
SUBSCRIPTIONS TABLE
├─ Index: by_user (userId)
│  └─ Used in: checkSubscriptionAccess
│             getByUserId
│             handleResubscribeAction
│
├─ Index: by_customer (stripeCustomerId)
│  └─ Used in: applyStripeEvent (find user)
│
└─ Index: by_user_status (userId, status)
   └─ Not currently used but available

INBOUND_RECEIPTS TABLE (Idempotency)
├─ Index: by_messageSid (unique check)
│  └─ Used in: handleIncomingMessage (duplicate check)
│
└─ Index: by_user (userId)
   └─ Used for user message history queries

BILLING_EVENTS TABLE (Webhook Idempotency)
├─ Index: by_event (stripeEventId)
│  └─ Used in: applyStripeEvent (duplicate check)
│
└─ Data: Full Stripe event object for replay/debugging

USERS TABLE
├─ Index: by_phone (normalized E.164)
│  └─ Used in: getUserOrCreate
│
├─ Index: by_externalId (legacy phone)
│  └─ Used in: getUserOrCreate (backward compat)
│
└─ Fields needed for agents:
   - metadata.onboardingStage
   - metadata.careRecipient
   - metadata.zipCode
   - lastEngagementDate
```

---

## 9. Critical Timing & Grace Period Math

```
Subscription Cancellation Timeline:

Day 0: User cancels subscription via Stripe
       └─ Webhook: customer.subscription.updated
          status: "canceled"
          canceled_at: 2024-01-01T00:00:00Z
          
          → Mutation calculates:
            gracePeriodEndsAt = canceledAt + 30 * 24 * 60 * 60 * 1000
                               = 2024-02-01T00:00:00Z (approx)

Day 15: User texts non-crisis message
        └─ checkSubscriptionAccess checks:
           - now (2024-01-16) < gracePeriodEndsAt (2024-02-01)?
           - YES → hasAccess: true, isInGracePeriod: true
           - Message sent to agent normally
           
           Send message: "Your subscription has ended, but you have 
                         15 day(s) to resubscribe without losing 
                         your progress. Reply RESUBSCRIBE to continue."

Day 29: User texts message
        └─ checkSubscriptionAccess checks:
           - now (2024-01-30) < gracePeriodEndsAt (2024-02-01)?
           - YES → hasAccess: true, isInGracePeriod: true (barely!)
           - Message sent to agent
           
           Send message: "Your subscription has ended, but you have 
                         1 day(s) to resubscribe without losing 
                         your progress. Reply RESUBSCRIBE to continue."

Day 30: Grace period expires
        └─ checkSubscriptionAccess checks:
           - now (2024-02-01) < gracePeriodEndsAt (2024-02-01)?
           - NO → hasAccess: false
           - User must resubscribe
           
           Send message: "Your subscription has ended. Reply 
                         RESUBSCRIBE to continue using GiveCare."

Day 31: User texts message
        └─ checkSubscriptionAccess returns hasAccess: false
           └─ Send resubscribe message (no countdown)
           └─ NO agent routing
```

---

## 10. Error Handling Paths

```
Resubscribe Error Cases:

1. createCheckoutSessionForResubscribe fails:
   └─ Catch error
   └─ Send: "Sorry, we couldn't create your checkout session. 
             Please try again later or visit givecareapp.com/signup"

2. Stripe webhook signature invalid:
   └─ throw Error("Webhook signature verification failed")
   └─ HTTP 400 response
   └─ Event not processed
   └─ Stripe will retry (exponential backoff)

3. Stripe event has no userId (no metadata):
   └─ Idempotency record created
   └─ Subscription NOT created
   └─ Manual intervention may be needed
   └─ Skip reason: "no_user_id"

4. User queries resubscribe but already subscribed:
   └─ Send: "You're already subscribed! You have full access 
             to GiveCare."
   └─ Return early (no checkout session)

5. Message fails to send via Twilio:
   └─ Handled by Twilio Component
   └─ Automatic retry
   └─ Log for monitoring
```

