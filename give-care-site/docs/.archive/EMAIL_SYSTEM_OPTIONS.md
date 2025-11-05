# Email System Options - Clear Comparison

You asked: "Is it Convex or Resend? How do I manage designs/flows/pathing?"

Here's the truth: **What I built is code-heavy with no visual tools.**

## What You Have Now (Code-Based)

### Architecture
```
CONVEX (database)     →    YOUR CODE (logic)    →    RESEND (delivery)
"Who to email"            "When to email"            "Actually send"
```

### To Send a Newsletter
```typescript
// 1. Code email template
// emails/Newsletter.tsx
export default function Newsletter() {
  return <Html>...</Html>
}

// 2. Code sending logic
const contacts = await convex.query(api.functions.emailContacts.getNewsletterSubscribers);
for (const contact of contacts) {
  await resend.emails.send({...});
}

// 3. Manually run script
node scripts/send-newsletter.js
```

### To Create 3-Email Sequence
```typescript
// 1. Code 3 email templates
// emails/Day3Followup.tsx
// emails/Day7Followup.tsx
// emails/Day14Followup.tsx

// 2. Code cron jobs in Convex
crons.daily('day-3', { hourUTC: 14 }, internal.email.day3);
crons.daily('day-7', { hourUTC: 14 }, internal.email.day7);
crons.daily('day-14', { hourUTC: 14 }, internal.email.day14);

// 3. Code logic to track what was sent
// Store lastEmailSent date per contact
// Check if 3/7/14 days passed
// Send appropriate email
```

**This works but requires:**
- Coding skills for every change
- Deployment for updates
- No visual preview
- No drag-and-drop

---

## Option 1: Hybrid with Resend UI

### What Resend Provides (Beyond Delivery)
- Broadcasts: Send one-off newsletters via UI
- Audiences: Contact management interface
- Email Editor: Drag-and-drop designer (basic)

### What Resend DOESN'T Provide
- ❌ Sequence automation
- ❌ Visual flow builder
- ❌ Event-based triggers
- ❌ Advanced segmentation

### How This Would Work
```
CONVEX           →    SYNC    →    RESEND AUDIENCE    →    RESEND BROADCASTS
(source of truth)     (your code)   (contact list)          (send via UI)
```

### Workflow
1. Keep Convex for contact storage
2. Write sync script to push contacts to Resend Audience
3. Design newsletters in Resend UI: https://resend.com/broadcasts
4. Schedule/send via UI
5. Still code sequences yourself (Resend has no automation)

### Example Sync Script
```typescript
// scripts/sync-to-resend.ts
const contacts = await convex.query(api.functions.emailContacts.getNewsletterSubscribers);

for (const contact of contacts) {
  await resend.contacts.create({
    email: contact.email,
    audienceId: process.env.RESEND_AUDIENCE_ID,
  });
}
```

### Pros
- Uses existing Resend subscription
- Visual newsletter design
- Simple for one-off sends

### Cons
- Still need code for sequences
- Basic editor (not as good as dedicated tools)
- Contact data lives in two places (Convex + Resend)
- Manual sync required

---

## Option 2: Loops.so (Recommended)

### What Loops.so Provides
- ✅ Visual email designer (drag-and-drop)
- ✅ Visual sequence builder (with branching)
- ✅ Event-based triggers
- ✅ Contact properties (custom fields)
- ✅ Segmentation filters
- ✅ A/B testing
- ✅ Analytics dashboard

### Architecture
```
CONVEX           →    EVENTS/SYNC    →    LOOPS          →    LOOPS
(source of truth)     (your code)         (automation)        (delivery)
```

### How This Would Work
1. Replace Resend with Loops for marketing emails (keep Resend for transactional)
2. Keep Convex as source of truth
3. Send events to Loops when things happen
4. Loops handles sequences automatically

### Workflow for Newsletter
1. Go to Loops dashboard: https://loops.so
2. Design email visually (drag-and-drop)
3. Create campaign → Select audience → Schedule
4. Done

### Workflow for Assessment Sequence
1. Design 3 emails visually in Loops
2. Create Loop (sequence):
   ```
   Trigger: "assessment_completed" event
     ↓
   Filter: band = "Severe"
     ↓
   Wait 3 days
     ↓
   Send Email 1: "Coping Strategies"
     ↓
   Wait 4 days
     ↓
   Send Email 2: "Resource Guide"
     ↓
   Wait 7 days
     ↓
   Send Email 3: "Check-in"
   ```
3. In your code, just trigger the event:
   ```typescript
   // app/api/assessment/email/route.ts
   await loops.sendEvent({
     email: contact.email,
     eventName: 'assessment_completed',
     contactProperties: {
       band: band,
       score: score,
       pressureZones: zones.join(',')
     }
   });
   ```
4. Loops automatically sends the sequence

### Code Integration
```typescript
// Install Loops SDK
pnpm add loops

// Initialize
import { LoopsClient } from 'loops';
const loops = new LoopsClient(process.env.LOOPS_API_KEY);

// Create/update contact
await loops.createContact({
  email: 'user@example.com',
  band: 'Severe',
  score: 25,
  pressureZones: 'Physical Exhaustion,Financial Strain',
  tags: ['assessment', 'newsletter']
});

// Send event (triggers sequence)
await loops.sendEvent({
  email: 'user@example.com',
  eventName: 'assessment_completed'
});

// Send transactional email
await loops.sendTransactionalEmail({
  transactionalId: 'assessment-results',
  email: 'user@example.com',
  dataVariables: {
    score: 25,
    band: 'Severe'
  }
});
```

### Migration Steps
1. Sign up: https://loops.so (free to start)
2. Install SDK: `pnpm add loops`
3. Design email templates in Loops UI
4. Replace Resend calls with Loops calls
5. Build sequences visually in Loops dashboard

### Pricing
- Free: 0-1,000 contacts
- Starter: $49/mo (up to 10k contacts)
- Pro: $149/mo (up to 50k contacts)

### Pros
- **Visual everything** (no code for sequences)
- Event-based (clean integration)
- Built for product companies
- Great for non-technical team members
- Advanced segmentation

### Cons
- Additional cost ($49/mo)
- Migration work (~4 hours)
- Learning new platform

---

## Option 3: Customer.io (Enterprise Alternative)

More powerful than Loops but overkill for your stage.

**Provides:**
- Everything Loops has
- Multi-channel (email, SMS, push)
- Advanced reporting
- Webhooks for everything

**Pricing:** $150+/mo

**When to use:** When you need SMS + email + push in one platform

---

## Option 4: Build Admin UI (Most Work)

Build your own campaign management interface:

```
Admin Dashboard (you build)
├── Email Designer (Monaco editor or visual builder)
├── Campaign Scheduler
├── Sequence Builder (React Flow)
├── Contact Segments
└── Analytics
```

**Effort:** 40-80 hours
**When to use:** Never (use Loops instead)

---

## My Recommendation

### Immediate (Next Week)
**Use Resend Broadcasts for first newsletter:**
1. Design in Resend UI: https://resend.com/broadcasts
2. Send to existing subscribers
3. Get first campaign out quickly

### Next Month
**Migrate to Loops.so:**
1. Sign up and design templates
2. Replace Resend calls with Loops
3. Build assessment follow-up sequence visually
4. Let non-technical team manage campaigns

### Why Loops Over Resend
| Feature | Resend | Loops |
|---------|--------|-------|
| Email designer | Basic | Advanced |
| Sequences | ❌ | ✅ |
| Event triggers | ❌ | ✅ |
| Visual flow builder | ❌ | ✅ |
| Segmentation | Basic | Advanced |
| A/B testing | ❌ | ✅ |
| Contact properties | Limited | Unlimited |

### Implementation Plan

**Week 1: Send First Newsletter via Resend**
```bash
# Use Resend UI
1. Go to https://resend.com/broadcasts
2. Create new broadcast
3. Design email
4. Select audience
5. Send
```

**Week 2-3: Migrate to Loops**
```bash
# Setup
pnpm add loops

# Replace in code
- resend.emails.send() → loops.sendTransactionalEmail()
- Add event triggers for sequences

# Build in Loops UI
- Design assessment results template
- Build 3-email follow-up sequence
- Create newsletter template
```

**Week 4: Launch Sequences**
```bash
# Just trigger events
loops.sendEvent({ email, eventName: 'assessment_completed' })

# Loops handles the rest
```

---

## Decision Framework

**Choose Resend Broadcasts if:**
- Only need newsletters (no sequences)
- Want something working today
- Don't mind coding sequences later

**Choose Loops if:**
- Need email sequences
- Want visual tools
- Plan to let others manage emails
- Value speed over cost ($49/mo)

**Choose Code-Based (Current) if:**
- Enjoy coding everything
- Want ultimate flexibility
- Have engineering time
- Don't need visual tools

---

## Summary

**Current System:**
- Convex = Database (who gets emails)
- Your Code = Logic (when to send, what to send)
- Resend = Delivery (actually sends)

**Problem:** All manual, all code-based, no visual tools

**Solution:** Add Loops.so
- Visual email designer
- Visual sequence builder
- Event-based triggers
- Convex stays as source of truth
- Your code just sends events

**Next Steps:**
1. Send first newsletter via Resend Broadcasts (this week)
2. Sign up for Loops.so (free tier)
3. Design first sequence visually
4. Replace Resend calls with Loops
5. Never code email logic again
