# Minimal Retention Strategy

**Hook into existing:** Scheduled functions, conversationFeedback, engagement watchers  
**Add:** Weekly "progress snapshot" SMS (1 new scheduled function)

---

## What You Already Have ✅

1. **Engagement watchers** (`convex/watchers.ts`)
   - Tracks sudden drop (3+ msgs/day → 0 in 24h)
   - Tracks crisis burst
   - Tracks wellness trends

2. **Scheduled functions** (`convex/crons.ts`)
   - Daily summarization (3am PT)
   - Engagement watcher (every 6 hours)
   - Wellness trend watcher (Monday 9am PT)

3. **Data being collected:**
   - `totalInteractionCount`
   - `wellnessScores` (historical)
   - `conversationFeedback` (ratings)
   - `journeyPhase` transitions

---

## Minimal Addition: Weekly Progress Snapshot

**One new scheduled function** that sends weekly "You've been here X days, here's what we've done together"

### Why This Works

**Hooks into existing patterns:**
- ✅ Uses data you already collect
- ✅ Uses scheduled function infrastructure that exists
- ✅ Sends via existing `sendOutboundSMS`
- ✅ Leverages `conversationSummary` you already generate

---

## Implementation (30 minutes)

### File: `convex/scheduledFunctions/weeklyProgress.ts`

```typescript
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * Weekly Progress Snapshot
 * Sends "here's your week" message every Monday 9am PT
 * 
 * HOOKS INTO:
 * - wellnessScores (trend)
 * - totalInteractionCount (engagement)
 * - conversationFeedback (positive moments)
 * - journeyPhase (milestone tracking)
 */
export const sendWeeklyProgress = internalAction({
  handler: async (ctx) => {
    // Get active users (journeyPhase = 'active')
    const activeUsers = await ctx.runQuery(internal.watchers.getActiveUsers);

    let sent = 0;
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    for (const user of activeUsers) {
      // Skip if user signed up less than 7 days ago
      if (user.createdAt && user.createdAt > oneWeekAgo) {
        continue;
      }

      // Generate progress message
      const message = await generateProgressMessage(ctx, user, oneWeekAgo, now);

      if (message) {
        await ctx.runAction(internal.twilio.sendOutboundSMS, {
          to: user.phoneNumber,
          body: message
        });
        sent++;
      }
    }

    console.log(`[Weekly Progress] Sent ${sent} progress snapshots`);
    return { sent, total: activeUsers.length };
  }
});

/**
 * Generate personalized progress message
 */
async function generateProgressMessage(
  ctx: any,
  user: any,
  oneWeekAgo: number,
  now: number
): Promise<string | null> {
  // 1. Get wellness trend (this week vs last week)
  const recentScores = await ctx.runQuery(internal.functions.wellness.getScoreHistory, {
    userId: user._id,
    limit: 10
  });

  const thisWeekScores = recentScores.filter((s: any) => s.recordedAt >= oneWeekAgo);
  const lastWeekScores = recentScores.filter((s: any) => 
    s.recordedAt < oneWeekAgo && s.recordedAt >= oneWeekAgo - 7 * 24 * 60 * 60 * 1000
  );

  // 2. Calculate engagement this week
  const weeksSinceSignup = Math.floor((now - user.createdAt) / (7 * 24 * 60 * 60 * 1000));
  
  // 3. Build message
  let message = `Week ${weeksSinceSignup} update:\n\n`;

  // Wellness trend
  if (thisWeekScores.length > 0 && lastWeekScores.length > 0) {
    const thisAvg = avg(thisWeekScores.map((s: any) => s.overallScore));
    const lastAvg = avg(lastWeekScores.map((s: any) => s.overallScore));
    const diff = thisAvg - lastAvg;

    if (diff > 5) {
      message += `📉 Stress up ${Math.round(diff)} points\n`;
    } else if (diff < -5) {
      message += `📈 Stress down ${Math.round(Math.abs(diff))} points\n`;
    } else {
      message += `📊 Stress holding steady\n`;
    }
  }

  // Interaction count
  message += `💬 We checked in ${user.totalInteractionCount || 0} times\n`;

  // Milestone celebration
  if (weeksSinceSignup === 1) {
    message += `\n🎉 You made it a week! That's huge.\n`;
  } else if (weeksSinceSignup === 4) {
    message += `\n🎉 One month in! You're building a habit.\n`;
  } else if (weeksSinceSignup === 12) {
    message += `\n🎉 Three months! You've been consistent.\n`;
  }

  // Call to action (trauma-informed)
  message += `\nWhat's on your mind this week?`;

  return message;
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
```

---

### Add to `convex/crons.ts`

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Existing crons...

// NEW: Weekly progress snapshot (Monday 9am PT = 16:00 UTC)
crons.weekly(
  "send-weekly-progress",
  { dayOfWeek: "monday", hourUTC: 16, minuteUTC: 0 },
  internal.scheduledFunctions.weeklyProgress.sendWeeklyProgress
);

export default crons;
```

---

## The Message (Example)

```
Week 3 update:

📈 Stress down 12 points
💬 We checked in 18 times

What's on your mind this week?
```

**Why this works:**
- **Concrete progress** = "I'm getting value"
- **Low-pressure CTA** = "What's on your mind" (not demanding)
- **Milestone celebration** = Dopamine hit at weeks 1, 4, 12
- **Trauma-informed** = Acknowledges effort without judgment

---

## Metrics to Track (Already Built In)

- **Open rate** = % who reply within 24h of weekly message
- **Continued engagement** = avg messages/week after receiving snapshot
- **Churn prevention** = Compare churn rate (users who get snapshot vs those who don't)

All tracked via existing:
- `lastContactAt` (replies)
- `totalInteractionCount` (engagement)
- `subscriptionStatus` (churn)

---

## Why NOT Build Complex Retention Features

**You asked for minimal + hooks into existing.**

Things I'm NOT suggesting:
- ❌ User dashboard (2 weeks of work)
- ❌ Email campaigns (new infrastructure)
- ❌ Gamification (badges, streaks)
- ❌ Referral program (complex tracking)

**Why?**
- You don't have 100 users yet
- Don't optimize retention before you have acquisition
- Weekly progress = 80% of retention value for 5% of effort

---

## A/B Test This

**Control:** No weekly message (business as usual)  
**Treatment:** Weekly progress snapshot

**Hypothesis:** Users who receive weekly progress have 30% lower churn

**Measure after 4 weeks:**
- Churn rate (control vs treatment)
- Engagement (messages/week)
- NPS ("How likely are you to recommend?")

---

## Total Effort

- **Code:** 30 minutes (1 new scheduled function)
- **Test:** 15 minutes (trigger manually, verify SMS)
- **Deploy:** 5 minutes (`npx convex deploy`)

**Total: 50 minutes**

---

## Optional: Make It Better (Later)

Once you have data:

1. **Personalize based on burnout band**
   - Crisis: Focus on immediate wins ("You reached out 3 times this week")
   - Thriving: Focus on consistency ("Keeping up your wellness routine")

2. **Add positive feedback loop**
   - If user replies to progress message → record in `conversationFeedback`
   - Use to optimize message timing/content

3. **Detect disengagement early**
   - If user doesn't reply to weekly progress → Flag for manual outreach
   - Integrate with engagement watcher alerts

But start minimal: Just send the message, see if people engage.
