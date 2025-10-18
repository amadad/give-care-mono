# Minimal Onboarding Flow

**Hook into existing:** Welcome SMS already sends after payment ✅  
**Add:** 3-message sequence that triggers on first reply

---

## Current Flow (What Exists)

```
1. User pays via Stripe
2. Welcome SMS sent: "Welcome to GiveCare! I'm here..."
3. User replies... and agent doesn't know they're new
```

---

## Minimal Addition (Use journeyPhase)

You already have `journeyPhase` field in users table:
```typescript
journeyPhase: 'onboarding' | 'active' | 'maintenance' | 'churned' | 'crisis'
```

**Just add logic to welcome SMS handler:**

### File: `convex/services/MessageHandler.ts`

Add at top of `handle()` method:

```typescript
// Check if user is new (onboarding phase)
if (user.journeyPhase === 'onboarding') {
  const messageCount = user.totalInteractionCount || 0;
  
  // Message 1: First reply after welcome
  if (messageCount === 1) {
    return this.onboardingStep1(user, userMessage);
  }
  
  // Message 2: After they respond to step 1
  if (messageCount === 2) {
    return this.onboardingStep2(user, userMessage);
  }
  
  // Message 3: Transition to active
  if (messageCount === 3) {
    await this.transitionToActive(user);
    // Fall through to normal agent
  }
}

// Continue with normal agent flow...
```

---

## The 3 Messages (Trauma-Informed)

### Step 1: Learn About Them
**Trigger:** First message after welcome SMS  
**Goal:** Get basic context

```typescript
private async onboardingStep1(user: any, message: string) {
  const response = `Thanks for reaching out! 

Before we dive in, tell me a bit about your situation:
- Who are you caring for?
- What's the biggest challenge right now?

(You can share as much or as little as feels right)`;

  await this.updateJourneyPhase(user, 'onboarding', { onboardingStep: 1 });
  return this.formatResponse(response);
}
```

### Step 2: Set Expectations
**Trigger:** Second message  
**Goal:** Show what the agent can do

```typescript
private async onboardingStep2(user: any, message: string) {
  // Save what they shared (use recordMemory tool internally)
  await this.ctx.runAction(api.functions.memories.saveMemory, {
    userId: user._id,
    content: message,
    category: 'care_situation',
    importance: 10
  });

  const response = `Got it. Here's how I can help:

✓ Check-ins to track how you're doing
✓ Find resources (respite care, support groups, etc)
✓ Quick assessments to identify what you need most
✓ Crisis support anytime (text 988 for emergencies)

Want to do a quick 2-minute check-in now to see where you're at?`;

  await this.updateJourneyPhase(user, 'onboarding', { onboardingStep: 2 });
  return this.formatResponse(response);
}
```

### Step 3: Transition to Active
**Trigger:** Third message (usually "yes" to check-in)  
**Goal:** Start assessment, mark as active user

```typescript
private async transitionToActive(user: any) {
  await this.updateJourneyPhase(user, 'active', {
    onboardedAt: Date.now(),
    firstAssessmentScheduled: true
  });
  
  // Agent will handle starting assessment naturally
}
```

---

## Why This Works

**1. Hooks into existing patterns:**
- ✅ Uses `journeyPhase` you already have
- ✅ Uses `totalInteractionCount` you already track
- ✅ Uses `recordMemory` tool that exists
- ✅ Falls through to normal agent after 3 messages

**2. Minimal code:**
- ~50 lines in MessageHandler
- No new tables
- No new scheduled functions
- Just branching logic

**3. Trauma-informed:**
- P5: "Share as much or as little as feels right" (Always Offer Skip)
- P1: Acknowledge (what they shared) > Answer (how it works) > Advance (next step)
- P3: Non-intrusive (doesn't demand info)

---

## Implementation (15 minutes)

```typescript
// convex/services/MessageHandler.ts

async handle(args: any) {
  const user = await this.getOrCreateUser(args.from);
  
  // ✨ NEW: Onboarding check
  if (user.journeyPhase === 'onboarding') {
    const count = user.totalInteractionCount || 0;
    
    if (count === 1) {
      return this.onboardingStep1(user, args.body);
    }
    if (count === 2) {
      return this.onboardingStep2(user, args.body);
    }
    if (count === 3) {
      await this.transitionToActive(user);
      // Fall through to agent
    }
  }
  
  // Existing agent flow continues...
  return this.runAgent(user, args.body);
}

private async onboardingStep1(user: any, message: string) {
  const response = `Thanks for reaching out! 

Before we dive in, tell me a bit about your situation:
- Who are you caring for?
- What's the biggest challenge right now?

(Share as much or as little as feels right)`;

  return this.sendSMS(user.phoneNumber, response);
}

private async onboardingStep2(user: any, message: string) {
  // Save context
  await this.ctx.runAction(internal.functions.memories.saveMemory, {
    userId: user._id,
    content: message,
    category: 'care_situation',
    importance: 10
  });

  const response = `Got it. Here's how I can help:

✓ Check-ins to track how you're doing
✓ Find resources (respite care, support groups, etc)
✓ Quick assessments to identify what you need most
✓ Crisis support anytime (text 988 for emergencies)

Want to do a quick 2-minute check-in now?`;

  return this.sendSMS(user.phoneNumber, response);
}

private async transitionToActive(user: any) {
  await this.ctx.runMutation(internal.functions.users.updateJourneyPhase, {
    userId: user._id,
    journeyPhase: 'active',
  });
}
```

---

## Testing

```bash
# 1. Create test user via Stripe checkout
# 2. Wait for welcome SMS
# 3. Reply with anything → Should trigger Step 1
# 4. Reply with care situation → Should trigger Step 2
# 5. Reply "yes" → Should trigger assessment (normal agent flow)
```

---

## Metrics to Track

- `onboardingCompletionRate` = users who reach `journeyPhase: active` / total signups
- `avgTimeToFirstAssessment` = time from signup to first assessment completion
- `onboardingDropoffStep` = which step do users ghost?

Already tracked via:
- `journeyPhase` field
- `totalInteractionCount` field
- `lastContactAt` timestamp

---

**Total effort:** 15 minutes to add logic + 30 minutes to test = **45 minutes**
