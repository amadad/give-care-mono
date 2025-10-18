# Implementation Guide - Run These 3 Features

**Problem:** Convex deployment has some quirks. Here's the manual way to get everything working.

---

## ✅ **STEP 1: Seed Interventions Manually** (5 min)

Since the seed function isn't deploying cleanly, let's use the Convex dashboard directly:

### Go to Convex Dashboard:
1. Open https://dashboard.convex.dev
2. Select project: `doting-tortoise-411` (prod)
3. Click "Data" tab
4. Click "knowledgeBase" table

### Add 5 interventions manually:

**Intervention 1: Crisis Text Line**
```json
{
  "type": "intervention",
  "category": "crisis_support",
  "title": "Crisis Text Line",
  "description": "Text HOME to 741741 for 24/7 emotional support",
  "content": "Free, confidential crisis support via text message. Available 24/7. Trained crisis counselors respond within minutes.",
  "pressureZones": ["emotional_wellbeing"],
  "tags": ["crisis", "emotional", "texting", "24/7", "free"],
  "evidenceSource": "Crisis Text Line",
  "evidenceLevel": "verified_directory",
  "effectivenessPct": 92,
  "deliveryFormat": "sms_text",
  "deliveryData": {"phoneNumber": "741741", "initialMessage": "HOME"},
  "language": "en",
  "culturalTags": [],
  "locationSpecific": false,
  "zipCodes": [],
  "usageCount": 0,
  "status": "active",
  "createdAt": 1729267200000,
  "updatedAt": 1729267200000
}
```

**Intervention 2: Respite Care Finder**
```json
{
  "type": "intervention",
  "category": "respite_care",
  "title": "Respite Care Finder",
  "description": "Find temporary care support in your area",
  "content": "Respite care provides temporary relief for caregivers. Options include in-home care, adult day centers, and short-term residential facilities.",
  "pressureZones": ["physical_health", "time_management"],
  "tags": ["respite", "temporary relief", "in-home care", "breaks"],
  "evidenceSource": "ARCH National Respite Network",
  "evidenceLevel": "verified_directory",
  "effectivenessPct": 78,
  "deliveryFormat": "url",
  "deliveryData": {"url": "https://archrespite.org/respitelocator"},
  "language": "en",
  "culturalTags": [],
  "locationSpecific": true,
  "zipCodes": [],
  "usageCount": 0,
  "status": "active",
  "createdAt": 1729267200000,
  "updatedAt": 1729267200000
}
```

**Intervention 3: Financial Assistance**
```json
{
  "type": "intervention",
  "category": "financial_assistance",
  "title": "Financial Assistance Programs",
  "description": "Government and nonprofit support resources",
  "content": "Financial assistance for caregivers includes: Medicare/Medicaid benefits, National Family Caregiver Support Program (NFCSP), state programs, tax credits.",
  "pressureZones": ["financial_concerns"],
  "tags": ["financial", "medicare", "medicaid", "tax credits", "NFCSP"],
  "evidenceSource": "Administration for Community Living",
  "evidenceLevel": "verified_directory",
  "effectivenessPct": 81,
  "deliveryFormat": "url",
  "deliveryData": {"url": "https://eldercare.acl.gov", "phoneNumber": "1-800-677-1116"},
  "language": "en",
  "culturalTags": [],
  "locationSpecific": true,
  "zipCodes": [],
  "usageCount": 0,
  "status": "active",
  "createdAt": 1729267200000,
  "updatedAt": 1729267200000
}
```

**Intervention 4: Task Organization**
```json
{
  "type": "intervention",
  "category": "time_management",
  "title": "Caregiving Task Checklist",
  "description": "Organize and prioritize daily responsibilities",
  "content": "Use the Caregiver Action Network Daily Task Organizer to: list tasks, prioritize by urgency, delegate what you can, schedule breaks.",
  "pressureZones": ["time_management", "physical_health"],
  "tags": ["organization", "time management", "checklist", "scheduling"],
  "evidenceSource": "Caregiver Action Network",
  "evidenceLevel": "verified_directory",
  "effectivenessPct": 79,
  "deliveryFormat": "url",
  "deliveryData": {"url": "https://caregiveraction.org/resources/caregiver-toolbox"},
  "language": "en",
  "culturalTags": [],
  "locationSpecific": false,
  "zipCodes": [],
  "usageCount": 0,
  "status": "active",
  "createdAt": 1729267200000,
  "updatedAt": 1729267200000
}
```

**Intervention 5: Support Groups**
```json
{
  "type": "intervention",
  "category": "social_support",
  "title": "Local Caregiver Support Groups",
  "description": "Connect with others who understand",
  "content": "In-person and virtual support groups provide emotional support, practical tips, and community. Find groups through: Family Caregiver Alliance, AARP, Alzheimer's Association.",
  "pressureZones": ["social_support", "emotional_wellbeing"],
  "tags": ["support groups", "community", "peer support", "virtual", "free"],
  "evidenceSource": "Family Caregiver Alliance",
  "evidenceLevel": "verified_directory",
  "effectivenessPct": 88,
  "deliveryFormat": "url",
  "deliveryData": {"url": "https://www.caregiver.org/connecting-caregivers/support-groups/", "phoneNumber": "1-800-445-8106"},
  "language": "en",
  "culturalTags": [],
  "locationSpecific": true,
  "zipCodes": [],
  "usageCount": 0,
  "status": "active",
  "createdAt": 1729267200000,
  "updatedAt": 1729267200000
}
```

### Then run embeddings:
```bash
cd give-care-app
npx convex run functions/embeddings:generateAllEmbeddings
```

---

## ✅ **STEP 2: Add Onboarding Flow** (15 min)

Edit `convex/services/MessageHandler.ts`:

### Find the `handle()` method (around line 50) and add THIS at the top:

```typescript
async handle(args: HandlerArgs): Promise<TwiMLResponse> {
  const user = await this.getOrCreateUser(args.from);
  const userMessage = args.body.trim();

  // ✨ NEW: 3-step onboarding for new users
  if (user.journeyPhase === 'onboarding') {
    const count = user.totalInteractionCount || 0;
    
    if (count === 1) {
      const response = `Thanks for reaching out! 

Before we dive in, tell me a bit about your situation:
- Who are you caring for?
- What's the biggest challenge right now?

(Share as much or as little as feels right)`;
      
      return this.sendSMS(args.from, response);
    }
    
    if (count === 2) {
      // Save what they shared
      await this.ctx.runAction(internal.functions.memories.saveMemory, {
        userId: user._id,
        content: userMessage,
        category: 'care_situation',
        importance: 10
      });

      const response = `Got it. Here's how I can help:

✓ Check-ins to track how you're doing
✓ Find resources (respite care, support groups, etc)
✓ Quick assessments to identify what you need most
✓ Crisis support anytime (text 988 for emergencies)

Want to do a quick 2-minute check-in now?`;
      
      return this.sendSMS(args.from, response);
    }
    
    if (count === 3) {
      // Transition to active
      await this.ctx.runMutation(internal.functions.users.updateJourneyPhase, {
        userId: user._id,
        journeyPhase: 'active',
      });
      // Fall through to normal agent
    }
  }

  // ... rest of existing handle() code
```

Deploy:
```bash
npx convex deploy --yes
```

---

## ✅ **STEP 3: Add Weekly Progress** (10 min)

### Create file: `convex/scheduledFunctions/weeklyProgress.ts`

```typescript
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';

export const sendWeeklyProgress = internalAction({
  handler: async (ctx) => {
    const activeUsers = await ctx.runQuery(internal.watchers.getActiveUsers);
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    let sent = 0;

    for (const user of activeUsers) {
      if (user.createdAt && user.createdAt > oneWeekAgo) continue;

      const weeksSinceSignup = Math.floor((now - user.createdAt) / (7 * 24 * 60 * 60 * 1000));
      
      let message = `Week ${weeksSinceSignup} update:\n\n`;
      message += `💬 We checked in ${user.totalInteractionCount || 0} times\n`;

      if (weeksSinceSignup === 1) {
        message += `\n🎉 You made it a week! That's huge.\n`;
      } else if (weeksSinceSignup === 4) {
        message += `\n🎉 One month in! You're building a habit.\n`;
      }

      message += `\nWhat's on your mind this week?`;

      await ctx.runAction(internal.twilio.sendOutboundSMS, {
        to: user.phoneNumber,
        body: message
      });
      sent++;
    }

    return { sent, total: activeUsers.length };
  }
});
```

### Edit `convex/crons.ts` - add this line:

```typescript
// At the end of the file, before export default crons
crons.weekly(
  "send-weekly-progress",
  { dayOfWeek: "monday", hourUTC: 16, minuteUTC: 0 },
  internal.scheduledFunctions.weeklyProgress.sendWeeklyProgress
);
```

Deploy:
```bash
npx convex deploy --yes
```

---

## ✅ **DONE! Test Everything**

###1. Test Vector Search:
```bash
npx convex run functions/vectorSearch:searchByBurnoutLevel \
  '{"burnoutBand": "crisis", "limit": 3}'
```

### 2. Test Onboarding:
- Have a friend sign up via Stripe
- They get welcome SMS
- They reply → Should get step 1 message
- They reply again → Should get step 2 message
- They reply "yes" → Should start assessment

### 3. Test Weekly Progress:
- Manually run: `npx convex run summarizationActions:summarizeAllUsers`
- Check if active users get message

---

## 📊 Verify It's Working

### Check knowledgeBase has data:
https://dashboard.convex.dev → Data → knowledgeBase (should have 5+ rows)

### Check embeddings generated:
```bash
npx convex run functions/seedKnowledgeBase:countKnowledgeBase
```

Should return:
```json
{
  "total": 5,
  "withEmbeddings": 5,
  "withoutEmbeddings": 0
}
```

---

**Total time: 30 minutes**

Then I'll give you the marketing/SEO guide!
