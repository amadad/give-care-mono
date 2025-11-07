# Architecture Quick Reference

One-page cheat sheet for implementing improved Convex patterns.

---

## 📋 Schema Tables

```typescript
users              // Auth identity only (phoneNumber for webhook lookup)
userProfiles       // Static profile data (burnout, journey, etc.)
conversationState  // High-churn conversation data
billingAccounts    // Subscription data
jobs               // Idempotent side-effects (outbox pattern)
```

---

## 🔧 Context Types (Use Minimal)

```typescript
import { DbReader, DbWriter } from '../lib/context'

// Read-only model helper
async function getProfile(db: DbReader, userId: Id<'users'>) {
  return await db.query('userProfiles')
    .withIndex('by_user', q => q.eq('userId', userId))
    .first()
}

// Read/write model helper
async function updateBurnout(db: DbWriter, userId: Id<'users'>, score: number) {
  const profile = await getProfile(db, userId)
  if (!profile) throw new Error('Profile not found')

  await db.patch(profile._id, {
    burnoutScore: score,
    burnoutBand: getBand(score),
    updatedAt: Date.now(),
  })
}
```

**Rule:** Model helpers take `DbReader` or `DbWriter`, NOT full contexts.

---

## 🎯 Jobs Pattern (Idempotency)

### 1. Enqueue Job (HTTP or Mutation)

```typescript
import { ensureUniqueJob, twilioJobKey } from '../lib/idempotency'

// In HTTP webhook
await ctx.runMutation(internal.jobs.enqueue, {
  key: twilioJobKey(messageSid),
  type: 'process_inbound_sms',
  payload: { messageSid, from, body },
})
```

### 2. Process Job (Worker Action)

```typescript
import { claimNextJob, completeJob, failJob } from '../lib/idempotency'

export const worker = internalAction({
  handler: async (ctx) => {
    const job = await ctx.runMutation(internal.jobs.claim, { type: 'send_sms' })
    if (!job) return

    try {
      await sendSMS(ctx, job.payload)
      await ctx.runMutation(internal.jobs.complete, { jobId: job._id })
    } catch (error) {
      await ctx.runMutation(internal.jobs.fail, {
        jobId: job._id,
        error: error.message,
        attempts: job.attempts,
      })
    }
  }
})
```

### 3. Schedule Worker (Cron)

```typescript
// convex/crons.ts
crons.interval('process-jobs', { seconds: 30 }, internal.jobs.worker)
```

---

## 🔐 Webhook Verification

```typescript
import { verifyTwilioWebhook, verifyStripeWebhook } from '../lib/webhooks'

// Twilio
const result = verifyTwilioWebhook(
  process.env.TWILIO_AUTH_TOKEN,
  request.headers.get('X-Twilio-Signature'),
  request.url,
  params
)
if (!result.valid) return { error: result.reason }

// Stripe
const result = verifyStripeWebhook(
  process.env.STRIPE_WEBHOOK_SECRET,
  request.headers.get('Stripe-Signature'),
  await request.text()
)
if (!result.valid) return { error: result.reason }
```

---

## 👮 Role-Based Auth

```typescript
import { ensureAdmin, hasRole } from '../lib/auth'

// Require admin
export const deleteUser = internalMutation({
  handler: async (ctx, { userId }) => {
    await ensureAdmin(ctx)  // Throws if not admin
    await ctx.db.delete(userId)
  }
})

// Check role
const isSupport = await hasRole(ctx, 'support')
```

### Grant Role

```typescript
// One-time setup
await ctx.db.patch(userId, {
  roles: ['admin']  // or ['admin', 'support']
})
```

---

## 📊 Query Patterns

### Split User Data

```typescript
// Get user by phone (fast webhook lookup)
const user = await ctx.db
  .query('users')
  .withIndex('by_phone', q => q.eq('phoneNumber', phone))
  .first()

// Get profile separately (only when needed)
const profile = await ctx.db
  .query('userProfiles')
  .withIndex('by_user', q => q.eq('userId', user._id))
  .first()

// Get conversation state (only when needed)
const convo = await ctx.db
  .query('conversationState')
  .withIndex('by_user', q => q.eq('userId', user._id))
  .first()

// Get billing (only when needed)
const billing = await ctx.db
  .query('billingAccounts')
  .withIndex('by_user', q => q.eq('userId', user._id))
  .first()
```

### Scheduled Queries

```typescript
// Find users for wellness check (optimized composite index)
const users = await ctx.db
  .query('userProfiles')
  .withIndex('by_band_contact', q =>
    q.eq('burnoutBand', 'high')
  )
  .filter(q => q.lte(q.field('lastContactAt'), weekAgo))
  .take(100)
```

---

## 🚀 Common Workflows

### Inbound SMS

```
1. HTTP POST /twilio/sms
2. Verify signature
3. Enqueue job (idempotent with MessageSid)
4. Return 200 TwiML immediately
5. Worker processes job
   - Load user (by phone)
   - Load profile, conversation (if needed)
   - Run agent
   - Enqueue outbound SMS job
6. Worker sends SMS
   - Call Twilio
   - Log to conversations
   - Mark complete
```

### Subscription Update

```
1. HTTP POST /stripe (webhook)
2. Verify signature
3. Enqueue job (idempotent with event.id)
4. Return 200
5. Worker processes job
   - Find user (by stripeCustomerId)
   - Update billingAccounts
   - Send welcome SMS (if new)
   - Mark complete
```

---

## ⚠️ Anti-Patterns (Avoid These)

❌ **Don't:** Accept full `MutationCtx` in model helpers
```typescript
async function update(ctx: MutationCtx, ...) { }  // BAD
```
✅ **Do:** Use minimal capability
```typescript
async function update(db: DbWriter, ...) { }  // GOOD
```

---

❌ **Don't:** Call Twilio/OpenAI directly in mutations
```typescript
export const sendMessage = internalMutation({
  handler: async (ctx, ...) => {
    await twilio.send(...)  // BAD - side-effect in mutation
  }
})
```
✅ **Do:** Enqueue job, process in action
```typescript
export const sendMessage = internalMutation({
  handler: async (ctx, ...) => {
    await ensureUniqueJob(ctx.db, key, 'send_sms', payload)  // GOOD
  }
})
```

---

❌ **Don't:** Write to multiple user tables at once (contention)
```typescript
await ctx.db.patch(userId, { ...profile, ...conversation, ...billing })
```
✅ **Do:** Update specific table for each concern
```typescript
await ctx.db.patch(profileId, profileUpdates)
await ctx.db.patch(conversationId, conversationUpdates)
```

---

❌ **Don't:** Process webhooks without verification
```typescript
export const webhook = httpAction(async (ctx, request) => {
  const data = await request.json()
  await processData(data)  // BAD - no signature check
})
```
✅ **Do:** Verify signature first
```typescript
export const webhook = httpAction(async (ctx, request) => {
  const verification = verifyWebhook(...)
  if (!verification.valid) return new Response('Unauthorized', { status: 403 })
  await enqueueJob(...)  // GOOD
})
```

---

## 📁 File Locations

```
convex/
├── schema.ts                  # Table definitions
├── lib/
│   ├── context.ts            # DbReader, DbWriter types
│   ├── idempotency.ts        # Jobs pattern helpers
│   ├── webhooks.ts           # Signature verification
│   └── auth.ts               # Role-based auth
├── model/                    # Business logic (plain TS)
│   ├── profiles.ts           # Profile operations
│   ├── conversations.ts      # Conversation operations
│   └── billing.ts            # Billing operations
└── functions/                # Public/internal endpoints
    ├── users.ts              # User CRUD
    └── admin.ts              # Admin endpoints
```

---

## 🧪 Testing

```typescript
// Test idempotency
const jobId1 = await ensureUniqueJob(db, 'key1', 'test', {})
const jobId2 = await ensureUniqueJob(db, 'key1', 'test', {})
expect(jobId1).toBe(jobId2)  // Same job

// Test role check
await ctx.db.patch(userId, { roles: ['admin'] })
await ensureAdmin(ctx)  // Should not throw

// Test signature verification
const valid = verifyTwilioSignature(token, sig, url, params)
expect(valid).toBe(true)
```

---

## 📚 Further Reading

- `docs/ARCHITECTURE_REVIEW.md` - Full review with rationale
- `docs/ARCHITECTURE_MIGRATION.md` - Step-by-step migration guide
- `lib/jobs.example.ts` - Complete jobs pattern example
- Convex docs: https://docs.convex.dev/

---

**Questions?** Check migration guide or architecture review docs.
