# LLM-Composable Email System - Completion Guide

## What's Been Completed ✅

### Phase 1: Component Library (DONE)
- ✅ Design token system (`emails/tokens.ts`)
- ✅ All email components created:
  - EmailShell, EmailContainer, EmailSection
  - EmailHeader, EmailFooter
  - ValidationBlock, ScoreCard, PressureZoneCard
  - InterventionCard, TipCallout, ResourceList, CTAButton

### Phase 2: Content Library Extension (DONE)
- ✅ Extended `knowledgeBase` schema with email metadata
- ✅ Created `functions/emailContent.ts` with seeding and search functions

### Phase 3: Rendering Pipeline (DONE)
- ✅ Email renderer (`lib/email/renderer.ts`)
- ✅ Rendering API route (`app/api/email/render/route.ts`)

### Phase 4: Agent Foundation (PARTIAL)
- ✅ EmailContext interface (`src/email/context.ts`)
- ✅ Dynamic instructions (`src/email/instructions.ts`)
- ⏸️ Need: Agent implementations with OpenAI Agents SDK

---

## Remaining Implementation (4-6 hours)

### Step 1: Complete Email Agent System (2-3 hours)

Since `give-care-app` doesn't currently use OpenAI Agents SDK, we'll use a simpler approach with direct OpenAI API calls.

**File**: `give-care-app/convex/emailActions.ts`

```typescript
"use node";

import { action } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { Resend } from 'resend';
import OpenAI from 'openai';
import { buildEmailContext } from '../src/email/context';
import { getOrchestratorInstructions, getComposerInstructions } from '../src/email/instructions';

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate and send personalized email using LLM agents
 */
export const generateAndSendEmail = action({
  args: {
    email: v.string(),
    trigger: v.object({
      type: v.string(),
      day: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { email, trigger }) => {
    try {
      // 1. Load subscriber context
      const contact = await ctx.runQuery(api.functions.emailContacts.getByEmail, { email });

      if (!contact) {
        throw new Error(`Contact not found: ${email}`);
      }

      const emailContext = buildEmailContext(contact, trigger);

      // 2. Orchestrator: Select content strategy
      const orchestratorPrompt = getOrchestratorInstructions(emailContext);

      const orchestratorResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: orchestratorPrompt,
          },
          {
            role: 'user',
            content: `Generate content plan for this email. Available tools: searchEmailContent. Return JSON only.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const contentPlan = JSON.parse(orchestratorResponse.choices[0].message.content || '{}');

      // 3. Search for content blocks based on plan
      const contentBlocks = [];
      for (const block of contentPlan.contentBlocks || []) {
        const results = await ctx.runQuery(api.functions.emailContent.searchEmailContent, {
          blockType: block.blockType,
          tone: block.tone,
          pressureZones: block.pressureZones,
          limit: 1,
        });
        if (results.length > 0) {
          contentBlocks.push(results[0]);
        }
      }

      // 4. Composer: Map to components
      const composerPrompt = getComposerInstructions(contentPlan, contentBlocks, emailContext);

      const composerResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: composerPrompt,
          },
          {
            role: 'user',
            content: `Map content blocks to React Email components. Return JSON component tree only.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const componentTree = JSON.parse(composerResponse.choices[0].message.content || '{}');

      // 5. Render to HTML (call Next.js API)
      const renderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/render`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(componentTree),
        }
      );

      if (!renderResponse.ok) {
        throw new Error('Failed to render email');
      }

      const { html, subject } = await renderResponse.json();

      // 6. Send via Resend
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'GiveCare <hello@my.givecareapp.com>',
        to: [email],
        subject,
        html,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      // 7. Track in Convex
      await ctx.runMutation(internal.functions.emailContacts.trackEmailSent, { email });

      console.log(`✅ LLM-generated email sent to: ${email} (${trigger.type})`);

      return {
        success: true,
        messageId: data?.id,
        subject,
        componentsUsed: componentTree.components?.map((c: any) => c.type),
      };
    } catch (error) {
      console.error('Email generation error:', error);
      throw error;
    }
  },
});

/**
 * Batch send emails (with rate limiting)
 */
export const sendBatchEmails = action({
  args: {
    contacts: v.array(v.string()), // Array of email addresses
    trigger: v.object({
      type: v.string(),
      day: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { contacts, trigger }) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const email of contacts) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email,
          trigger,
        });
        results.success++;

        // Rate limiting: 10 emails per second max
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  },
});
```

**Environment Variables Needed**:
```bash
# give-care-app/.env
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=GiveCare <hello@my.givecareapp.com>
NEXT_PUBLIC_SITE_URL=https://givecareapp.com  # or http://localhost:3000 for dev
```

---

### Step 2: Implement Trigger System (1-2 hours)

**File**: `give-care-app/convex/email/sequences.ts`

```typescript
"use node";

import { internalAction } from '../_generated/server';
import { internal, api } from '../_generated/api';

/**
 * Day 3 assessment follow-up
 */
export const sendDay3Followup = internalAction({
  args: {},
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const oneDayWindow = 2 * 60 * 60 * 1000; // 2 hour window

    // Get contacts eligible for Day 3 follow-up
    const allContacts = await ctx.runQuery(
      api.functions.emailContacts.getAssessmentFollowupSubscribers
    );

    const eligible = allContacts.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(Date.now() - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 2.5 && daysSince <= 3.5; // 2.5-3.5 days
    });

    console.log(`Day 3 follow-up: ${eligible.length} eligible contacts`);

    // Send to each
    for (const contact of eligible) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'assessment_followup', day: 3 },
        });
      } catch (error) {
        console.error(`Failed to send Day 3 follow-up to ${contact.email}:`, error);
      }
    }

    return { sent: eligible.length };
  },
});

/**
 * Day 7 assessment follow-up
 */
export const sendDay7Followup = internalAction({
  args: {},
  handler: async (ctx) => {
    const allContacts = await ctx.runQuery(
      api.functions.emailContacts.getAssessmentFollowupSubscribers
    );

    const eligible = allContacts.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(Date.now() - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 6.5 && daysSince <= 7.5;
    });

    console.log(`Day 7 follow-up: ${eligible.length} eligible contacts`);

    for (const contact of eligible) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'assessment_followup', day: 7 },
        });
      } catch (error) {
        console.error(`Failed to send Day 7 follow-up to ${contact.email}:`, error);
      }
    }

    return { sent: eligible.length };
  },
});

/**
 * Day 14 assessment follow-up
 */
export const sendDay14Followup = internalAction({
  args: {},
  handler: async (ctx) => {
    const allContacts = await ctx.runQuery(
      api.functions.emailContacts.getAssessmentFollowupSubscribers
    );

    const eligible = allContacts.filter((c) => {
      if (!c.latestAssessmentDate) return false;
      const daysSince = Math.abs(Date.now() - c.latestAssessmentDate) / (24 * 60 * 60 * 1000);
      return daysSince >= 13.5 && daysSince <= 14.5;
    });

    console.log(`Day 14 follow-up: ${eligible.length} eligible contacts`);

    for (const contact of eligible) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'assessment_followup', day: 14 },
        });
      } catch (error) {
        console.error(`Failed to send Day 14 follow-up to ${contact.email}:`, error);
      }
    }

    return { sent: eligible.length };
  },
});
```

**File**: `give-care-app/convex/email/campaigns.ts`

```typescript
"use node";

import { internalAction } from '../_generated/server';
import { api } from '../_generated/api';

/**
 * Weekly wellness summary
 */
export const sendWeeklySummary = internalAction({
  args: {},
  handler: async (ctx) => {
    const subscribers = await ctx.runQuery(
      api.functions.emailContacts.getNewsletterSubscribers
    );

    console.log(`Weekly summary: ${subscribers.length} subscribers`);

    for (const contact of subscribers) {
      try {
        await ctx.runAction(api.emailActions.generateAndSendEmail, {
          email: contact.email,
          trigger: { type: 'weekly_summary' },
        });

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send weekly summary to ${contact.email}:`, error);
      }
    }

    return { sent: subscribers.length };
  },
});
```

**Update**: `give-care-app/convex/crons.ts`

Add these cron jobs:

```typescript
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// ... existing crons ...

// Assessment follow-up sequences (daily at 9am EST = 14:00 UTC)
crons.daily(
  'assessment-day3-followup',
  { hourUTC: 14, minuteUTC: 0 },
  internal.email.sequences.sendDay3Followup
);

crons.daily(
  'assessment-day7-followup',
  { hourUTC: 14, minuteUTC: 0 },
  internal.email.sequences.sendDay7Followup
);

crons.daily(
  'assessment-day14-followup',
  { hourUTC: 14, minuteUTC: 0 },
  internal.email.sequences.sendDay14Followup
);

// Weekly wellness summary (Sundays at 10am EST = 15:00 UTC)
crons.weekly(
  'weekly-wellness-summary',
  { hourUTC: 15, minuteUTC: 0, dayOfWeek: 'sunday' },
  internal.email.campaigns.sendWeeklySummary
);

export default crons;
```

---

### Step 3: Campaign Management (1 hour)

**File**: `give-care-app/convex/functions/campaigns.ts`

```typescript
import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';

/**
 * Send manual campaign to segment
 */
export const sendCampaign = mutation({
  args: {
    segment: v.object({
      band: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      pressureZones: v.optional(v.array(v.string())),
    }),
    campaignData: v.object({
      type: v.string(),
      metadata: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { segment, campaignData }) => {
    // Get contacts based on segment
    let contacts = await ctx.db.query('emailContacts')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect();

    // Filter by band
    if (segment.band) {
      contacts = contacts.filter(c => c.latestAssessmentBand === segment.band);
    }

    // Filter by tags
    if (segment.tags && segment.tags.length > 0) {
      contacts = contacts.filter(c =>
        segment.tags!.some(tag => c.tags.includes(tag))
      );
    }

    // Filter by pressure zones
    if (segment.pressureZones && segment.pressureZones.length > 0) {
      contacts = contacts.filter(c =>
        c.pressureZones && segment.pressureZones!.some(zone =>
          c.pressureZones!.includes(zone)
        )
      );
    }

    const emailAddresses = contacts.map(c => c.email);

    // Trigger batch send via action
    // Note: Must call this separately since mutations can't call actions directly
    console.log(`Campaign queued for ${emailAddresses.length} contacts`);

    return {
      queuedCount: emailAddresses.length,
      contacts: emailAddresses,
      campaignData,
    };
  },
});
```

---

### Step 4: Testing (1 hour)

**Create test script**: `give-care-app/test-email-generation.ts`

```typescript
import { ConvexHttpClient } from 'convex/browser';
import { api } from './convex/_generated/api';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);

async function testEmailGeneration() {
  console.log('🧪 Testing LLM email generation...\n');

  // 1. Seed validation messages
  console.log('1. Seeding validation messages...');
  const seedResult = await convex.mutation(
    api.functions.emailContent.seedValidationMessages,
    {}
  );
  console.log(`✅ Seeded ${seedResult.inserted} messages\n`);

  // 2. Create test contact
  console.log('2. Creating test contact...');
  const testContact = await convex.mutation(
    api.functions.emailContacts.upsert,
    {
      email: 'test@example.com',
      tags: ['assessment'],
      preferences: {
        newsletter: false,
        assessmentFollowup: true,
        productUpdates: true,
      },
      assessmentData: {
        score: 22,
        band: 'Severe',
        pressureZones: ['Physical Exhaustion', 'Emotional Burden'],
      },
    }
  );
  console.log(`✅ Contact created: ${testContact.contactId}\n`);

  // 3. Generate and send test email
  console.log('3. Generating LLM email (Day 3 follow-up)...');
  const emailResult = await convex.action(
    api.emailActions.generateAndSendEmail,
    {
      email: 'test@example.com',
      trigger: { type: 'assessment_followup', day: 3 },
    }
  );

  console.log('✅ Email generated and sent!');
  console.log(`   Message ID: ${emailResult.messageId}`);
  console.log(`   Subject: ${emailResult.subject}`);
  console.log(`   Components: ${emailResult.componentsUsed?.join(', ')}\n`);

  console.log('🎉 Test complete! Check test@example.com for the email.');
}

testEmailGeneration().catch(console.error);
```

**Run**: `npx tsx give-care-app/test-email-generation.ts`

---

## Quick Start Guide

### 1. Seed Content
```bash
# In Convex dashboard or via CLI
npx convex run functions/emailContent:seedValidationMessages
```

### 2. Test Email Generation
```bash
# Send test email
npx convex run emailActions:generateAndSendEmail \
  --email "your-email@example.com" \
  --trigger '{"type":"assessment_followup","day":3}'
```

### 3. Enable Cron Jobs
Cron jobs automatically run:
- Daily at 9am EST: Assessment follow-ups (Day 3, 7, 14)
- Sundays at 10am EST: Weekly summary

### 4. Send Manual Campaign
```typescript
// From admin dashboard or CLI
const result = await convex.mutation(
  api.functions.campaigns.sendCampaign,
  {
    segment: { band: 'Severe', tags: ['assessment'] },
    campaignData: { type: 'crisis_resources' },
  }
);

// Then trigger batch send with returned contacts
await convex.action(
  api.emailActions.sendBatchEmails,
  {
    contacts: result.contacts,
    trigger: { type: 'campaign', metadata: result.campaignData },
  }
);
```

---

## System Architecture Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    TRIGGER (Cron/Manual)                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│              CONVEX: generateAndSendEmail action             │
│  1. Load contact from emailContacts table                    │
│  2. Build EmailContext                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│            OPENAI: Orchestrator (Content Strategy)           │
│  • Determine tone based on band                              │
│  • Select content block types                                │
│  • Generate subject line                                     │
│  • Return content plan JSON                                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│         CONVEX: Search knowledgeBase for content blocks      │
│  • Vector search by pressure zones                           │
│  • Filter by tone, block type                                │
│  • Return top matches                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│              OPENAI: Composer (Component Mapping)            │
│  • Map content blocks to React components                    │
│  • Personalize with subscriber data                          │
│  • Arrange in logical flow                                   │
│  • Return component tree JSON                                │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│         NEXT.JS: /api/email/render (HTML Rendering)          │
│  • Import React Email components                             │
│  • Render component tree to HTML                             │
│  • Return HTML string                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                   RESEND: Send Email                         │
│  • Deliver HTML email                                        │
│  • Track delivery                                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│            CONVEX: Track email sent (metrics)                │
└──────────────────────────────────────────────────────────────┘
```

---

## Files Summary

**Created (Complete):**
- ✅ `give-care-site/emails/tokens.ts`
- ✅ `give-care-site/emails/components/*.tsx` (all components)
- ✅ `give-care-site/lib/email/renderer.ts`
- ✅ `give-care-site/app/api/email/render/route.ts`
- ✅ `give-care-app/convex/functions/emailContent.ts`
- ✅ `give-care-app/src/email/context.ts`
- ✅ `give-care-app/src/email/instructions.ts`
- ✅ `give-care-app/convex/schema.ts` (updated)

**Need to Create:**
- ⏸️ `give-care-app/convex/emailActions.ts` (code provided above)
- ⏸️ `give-care-app/convex/email/sequences.ts` (code provided above)
- ⏸️ `give-care-app/convex/email/campaigns.ts` (code provided above)
- ⏸️ `give-care-app/convex/functions/campaigns.ts` (code provided above)
- ⏸️ `give-care-app/convex/crons.ts` (update with provided code)

**Total Remaining**: ~4 files, ~400 lines of code, 4-6 hours

---

## Success Criteria

✅ Email components render correctly
✅ LLM selects appropriate content blocks
✅ Component tree renders to HTML
✅ Emails send via Resend
✅ Cron triggers fire daily/weekly
✅ Manual campaigns work for segments

You now have a complete LLM-composable email system ready to finish!
