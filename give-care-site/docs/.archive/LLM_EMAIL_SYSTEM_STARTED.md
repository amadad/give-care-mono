# LLM-Composable Email System - Implementation Started

## What's Been Built (Phase 1: Foundation)

### ✅ Design Token System
**File**: `give-care-site/emails/tokens.ts`

Complete design system for emails:
- Color palette (amber theme, trauma-informed)
- Typography scale (hero, section, card, body, label)
- Spacing system (section, block, card, inline, tight)
- Layout presets (container, card, section)
- Button styles (primary, secondary, link)
- Trauma-informed tone presets (validation, encouragement, boundary)
- Accessibility helpers (WCAG AA compliance)
- Email client compatibility notes

### ✅ Component Architecture Started
**Directory**: `give-care-site/emails/components/`

**Created:**
- `EmailShell.tsx` - Base wrapper with head/fonts/body
- `EmailContainer.tsx` - Centered content container (600px max)
- `EmailSection.tsx` - Vertical spacing wrapper
- `ValidationBlock.tsx` - P1-compliant validation messages
- `index.ts` - Component exports

**Needed (stub out or complete):**
- `EmailHeader.tsx` - Logo + title
- `EmailFooter.tsx` - Unsubscribe + attribution
- `ScoreCard.tsx` - Assessment score display
- `PressureZoneCard.tsx` - Single pressure zone module
- `InterventionCard.tsx` - Resource/intervention card
- `TipCallout.tsx` - Highlighted tip/insight
- `ResourceList.tsx` - Bulleted resource list
- `CTAButton.tsx` - Primary/secondary CTA

---

## Next Steps (Continue Implementation)

### Phase 1: Complete Component Library (2-3 hours remaining)

1. **Create Remaining Components**

   Use this pattern for each:
   ```typescript
   import { Section, Text, Heading } from '@react-email/components';
   import * as React from 'react';
   import { emailColors, emailTypography, emailSpacing } from '../tokens';

   interface ComponentProps {
     // Props here
   }

   export default function Component({ props }: ComponentProps) {
     return (
       <Section style={sectionStyle}>
         {/* Content */}
       </Section>
     );
   }

   // Inline styles using tokens
   const sectionStyle = {
     padding: emailSpacing.card,
     backgroundColor: emailColors.background.card,
     // etc
   };
   ```

2. **Component Examples to Build**

   **ScoreCard.tsx:**
   ```typescript
   interface ScoreCardProps {
     score: number; // 0-30
     band: 'Mild' | 'Moderate' | 'Severe';
     showTrend?: boolean;
     previousScore?: number;
   }
   // Large score display with band indicator
   // Visual: "18/30" with "Moderate" label
   // Optional trend arrow if previousScore provided
   ```

   **PressureZoneCard.tsx:**
   ```typescript
   interface PressureZoneCardProps {
     zone: {
       name: string;
       severity: 'low' | 'moderate' | 'high' | 'critical';
       description: string;
     };
   }
   // Card with zone name, severity badge, description
   // Use emailColors.severity for severity colors
   ```

   **InterventionCard.tsx:**
   ```typescript
   interface InterventionCardProps {
     title: string;
     description: string;
     ctaText: string;
     ctaHref: string;
     effectivenessRating?: number; // 0-10
   }
   // Card layout with title, description, CTA button
   // Optional effectiveness rating stars
   ```

3. **Test Component Rendering**

   Create test file: `give-care-site/emails/test.tsx`
   ```typescript
   import { render } from '@react-email/render';
   import EmailShell from './components/EmailShell';
   import EmailContainer from './components/EmailContainer';
   import ValidationBlock from './components/ValidationBlock';

   async function testEmail() {
     const html = await render(
       <EmailShell previewText="Test email">
         <EmailContainer>
           <ValidationBlock
             message="What you're feeling is real—and now it's measured."
             tone="compassionate"
           />
         </EmailContainer>
       </EmailShell>
     );
     console.log(html);
   }

   testEmail();
   ```

   Run: `npx tsx give-care-site/emails/test.tsx`

---

### Phase 2: Extend knowledgeBase Schema (1-2 hours)

**File to modify**: `give-care-app/convex/schema.ts`

Add to `knowledgeBase` table:
```typescript
knowledgeBase: defineTable({
  // ... existing fields ...

  // NEW: Email-specific metadata
  emailBlockType: v.optional(v.string()), // validation | tip | intervention | resource
  tone: v.optional(v.string()), // compassionate | encouraging | urgent | neutral
  length: v.optional(v.string()), // short | medium | long
  componentHint: v.optional(v.string()), // ValidationBlock | TipCallout | InterventionCard
  emailSubject: v.optional(v.string()), // Suggested subject line if used as email hero
  ctaText: v.optional(v.string()), // Call-to-action button text
  ctaHref: v.optional(v.string()), // CTA link URL
})
```

**Seed content**: `give-care-app/convex/functions/emailContent.ts`

```typescript
import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const seedValidationMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = [
      {
        type: 'validation',
        category: 'emotional_validation',
        title: 'Your Burden is Real',
        description: 'Clinical validation of caregiver burden',
        content: 'What you\'re feeling is real—and now it\'s measured. This clinically validated assessment gives you language for what you\'re experiencing. Caregiving is hard. You\'re not alone in this, and you deserve support.',
        pressureZones: ['emotional_wellbeing'],
        tags: ['validation', 'assessment_results', 'p1_compliant'],
        evidenceLevel: 'clinical_trial',
        deliveryFormat: 'email',
        language: 'en',
        culturalTags: ['universal'],
        locationSpecific: false,
        zipCodes: [],
        usageCount: 0,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Email-specific
        emailBlockType: 'validation',
        tone: 'compassionate',
        length: 'medium',
        componentHint: 'ValidationBlock',
      },
      // Add 9 more variations...
    ];

    for (const msg of messages) {
      await ctx.db.insert('knowledgeBase', msg);
    }

    return { inserted: messages.length };
  },
});
```

---

### Phase 3: Build Email Agent System (3-4 hours)

**Directory structure**:
```
give-care-app/
└── src/
    └── email/
        ├── orchestrator.ts      # EmailOrchestratorAgent
        ├── composer.ts          # EmailComposerAgent
        ├── context.ts           # EmailContext builder
        ├── tools.ts             # Email-specific tools
        └── instructions.ts      # Dynamic prompt generation
```

**1. EmailContext** (`src/email/context.ts`):
```typescript
export interface EmailContext {
  subscriber: {
    email: string;
    tags: string[];
    preferences: {
      newsletter: boolean;
      assessmentFollowup: boolean;
      productUpdates: boolean;
    };
    latestAssessmentScore?: number;
    latestAssessmentBand?: string;
    pressureZones?: string[];
  };
  trigger: {
    type: 'assessment_followup' | 'weekly_summary' | 'campaign';
    day?: number; // For sequences (3, 7, 14)
    metadata?: any;
  };
  history: {
    lastEmailSentAt?: number;
    emailsSentCount: number;
    lastEmailOpenedAt?: number;
  };
}

export async function buildEmailContext(
  convex: ConvexHttpClient,
  email: string,
  trigger: EmailContext['trigger']
): Promise<EmailContext> {
  const contact = await convex.query(api.functions.emailContacts.getByEmail, { email });

  if (!contact) {
    throw new Error(`Contact not found: ${email}`);
  }

  return {
    subscriber: {
      email: contact.email,
      tags: contact.tags,
      preferences: contact.preferences,
      latestAssessmentScore: contact.latestAssessmentScore,
      latestAssessmentBand: contact.latestAssessmentBand,
      pressureZones: contact.pressureZones,
    },
    trigger,
    history: {
      lastEmailSentAt: contact.lastEmailSentAt,
      emailsSentCount: contact.emailsSentCount,
      lastEmailOpenedAt: contact.lastEmailOpenedAt,
    },
  };
}
```

**2. Email Tools** (`src/email/tools.ts`):
```typescript
import { tool } from '@openai/agents';
import { z } from 'zod';

export const searchEmailContent = tool({
  name: 'search_email_content',
  description: 'Search knowledgeBase for email content blocks by type, tone, pressure zones',
  parameters: z.object({
    blockType: z.enum(['validation', 'tip', 'intervention', 'resource']),
    tone: z.enum(['compassionate', 'encouraging', 'urgent', 'neutral']).optional(),
    pressureZones: z.array(z.string()).optional(),
    band: z.enum(['Mild', 'Moderate', 'Severe']).optional(),
    limit: z.number().default(3),
  }),
  execute: async (input, context) => {
    // Vector search knowledgeBase
    // Filter by emailBlockType, tone, pressureZones, band
    // Return top N results
  },
});

export const generateSubjectLine = tool({
  name: 'generate_subject_line',
  description: 'Generate personalized subject line based on email content and subscriber context',
  parameters: z.object({
    emailType: z.string(),
    subscriberBand: z.string().optional(),
    tone: z.string(),
  }),
  execute: async (input, context) => {
    // Generate subject line using LLM
    // Keep under 50 characters
    // Avoid spam trigger words
    // Personalize with band/pressure zones
  },
});
```

**3. EmailOrchestratorAgent** (`src/email/orchestrator.ts`):
```typescript
import { Agent } from '@openai/agents';
import { EmailContext } from './context';
import { searchEmailContent, generateSubjectLine } from './tools';

export const emailOrchestratorAgent = new Agent({
  model: 'gpt-4o',
  instructions: (context: EmailContext) => `
You are the Email Orchestrator for GiveCare, a caregiver support platform.

Your role: Determine email strategy and select content blocks.

## Subscriber Context
- Email: ${context.subscriber.email}
- Assessment Band: ${context.subscriber.latestAssessmentBand || 'N/A'}
- Pressure Zones: ${context.subscriber.pressureZones?.join(', ') || 'N/A'}
- Email Trigger: ${context.trigger.type}${context.trigger.day ? ` (Day ${context.trigger.day})` : ''}

## Your Tasks
1. Determine email tone based on band and trigger
2. Select 3-5 content blocks using search_email_content tool
3. Generate subject line using generate_subject_line tool
4. Return structured plan for EmailComposerAgent

## Trauma-Informed Principles (P1-P6)
- P1: Always start with validation
- P2: Never repeat content from previous emails
- P3: Respect subscriber preferences
- P5: Always include skip/unsubscribe option
- P6: Deliver actionable value every email

## Output Format
Return JSON:
{
  "subject": "Subject line",
  "tone": "compassionate|encouraging|urgent",
  "contentBlocks": [
    { "blockId": "kb_123", "type": "validation", "priority": 1 },
    { "blockId": "kb_456", "type": "intervention", "priority": 2 }
  ]
}
`,
  tools: [searchEmailContent, generateSubjectLine],
});
```

**4. EmailComposerAgent** (`src/email/composer.ts`):
```typescript
export const emailComposerAgent = new Agent({
  model: 'gpt-4o',
  instructions: (contentPlan, context: EmailContext) => `
You are the Email Composer for GiveCare.

Your role: Map content blocks to React Email components with personalization.

## Content Plan
${JSON.stringify(contentPlan, null, 2)}

## Subscriber
- Name: ${context.subscriber.email.split('@')[0]} (use if personalizing)
- Band: ${context.subscriber.latestAssessmentBand}

## Your Tasks
1. Map each content block to appropriate email component
2. Personalize copy with subscriber data (name, band, pressure zones)
3. Arrange components in logical flow (validation → content → CTA)
4. Return component tree for rendering

## Available Components
- ValidationBlock (props: message, tone)
- ScoreCard (props: score, band, showTrend)
- PressureZoneCard (props: zone)
- InterventionCard (props: title, description, ctaText, ctaHref)
- TipCallout (props: tip, icon)
- ResourceList (props: resources)
- CTAButton (props: text, href, variant)

## Output Format
Return JSON component tree:
{
  "subject": "Subject from orchestrator",
  "previewText": "First 100 chars of email",
  "components": [
    {
      "type": "ValidationBlock",
      "props": {
        "message": "Personalized validation message",
        "tone": "compassionate"
      }
    },
    {
      "type": "InterventionCard",
      "props": {
        "title": "...",
        "description": "...",
        "ctaText": "...",
        "ctaHref": "..."
      }
    }
  ]
}
`,
  tools: [],
});
```

---

### Phase 4: Rendering & Delivery Pipeline (2 hours)

**1. Component Renderer** (`give-care-site/lib/email/renderer.ts`):
```typescript
import { render } from '@react-email/render';
import * as EmailComponents from '../../emails/components';

export interface ComponentTree {
  subject: string;
  previewText: string;
  components: Array<{
    type: string;
    props: any;
  }>;
}

export async function renderEmailFromTree(tree: ComponentTree): Promise<string> {
  const { EmailShell, EmailContainer, EmailHeader, EmailFooter, ...contentComponents } = EmailComponents;

  // Map component tree to React elements
  const contentElements = tree.components.map((comp, idx) => {
    const Component = contentComponents[comp.type as keyof typeof contentComponents];
    if (!Component) {
      throw new Error(`Unknown component: ${comp.type}`);
    }
    return <Component key={idx} {...comp.props} />;
  });

  // Wrap in shell
  const email = (
    <EmailShell previewText={tree.previewText}>
      <EmailContainer>
        <EmailHeader />
        {contentElements}
        <EmailFooter />
      </EmailContainer>
    </EmailShell>
  );

  return await render(email);
}
```

**2. Rendering API Route** (`give-care-site/app/api/email/render/route.ts`):
```typescript
import { NextResponse } from 'next/server';
import { renderEmailFromTree, ComponentTree } from '@/lib/email/renderer';

export async function POST(request: Request) {
  try {
    const tree: ComponentTree = await request.json();
    const html = await renderEmailFromTree(tree);

    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
```

**3. Email Sending Service** (`give-care-app/convex/emailActions.ts`):
```typescript
import { action } from './_generated/server';
import { v } from 'convex/values';
import { Resend } from 'resend';
import { buildEmailContext } from '../src/email/context';
import { emailOrchestratorAgent } from '../src/email/orchestrator';
import { emailComposerAgent } from '../src/email/composer';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    // 1. Build context
    const emailContext = await buildEmailContext(ctx, email, trigger);

    // 2. Orchestrator: Select content strategy
    const contentPlan = await emailOrchestratorAgent.run(emailContext);

    // 3. Composer: Map to components
    const componentTree = await emailComposerAgent.run(contentPlan, emailContext);

    // 4. Render to HTML (call Next.js API)
    const renderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/render`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(componentTree),
      }
    );

    const { html } = await renderResponse.json();

    // 5. Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'GiveCare <hello@my.givecareapp.com>',
      to: [email],
      subject: componentTree.subject,
      html,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    // 6. Track in Convex
    await ctx.runMutation(internal.functions.emailContacts.trackEmailSent, { email });

    return { success: true, messageId: data?.id };
  },
});
```

---

### Phase 5: Trigger System (2-3 hours)

**Cron Jobs** (`give-care-app/convex/crons.ts`):
```typescript
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Assessment follow-up sequences
crons.daily('assessment-day3-followup', { hourUTC: 14 },
  internal.email.sequences.sendDay3Followup
);

crons.daily('assessment-day7-followup', { hourUTC: 14 },
  internal.email.sequences.sendDay7Followup
);

crons.daily('assessment-day14-followup', { hourUTC: 14 },
  internal.email.sequences.sendDay14Followup
);

// Weekly summary
crons.weekly('weekly-summary', { hourUTC: 15, dayOfWeek: 'sunday' },
  internal.email.campaigns.sendWeeklySummary
);

export default crons;
```

**Sequence Handler** (`give-care-app/convex/email/sequences.ts`):
```typescript
import { internalAction } from '../_generated/server';

export const sendDay3Followup = internalAction({
  args: {},
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const oneDayWindow = 1 * 60 * 60 * 1000; // 1 hour window

    // Find contacts who completed assessment ~3 days ago
    const contacts = await ctx.runQuery(
      internal.functions.emailContacts.getAssessmentFollowupSubscribers
    );

    const eligible = contacts.filter(c =>
      c.latestAssessmentDate &&
      Math.abs(c.latestAssessmentDate - threeDaysAgo) < oneDayWindow
    );

    // Send to each
    for (const contact of eligible) {
      await ctx.runAction(internal.emailActions.generateAndSendEmail, {
        email: contact.email,
        trigger: { type: 'assessment_followup', day: 3 },
      });
    }

    return { sent: eligible.length };
  },
});
```

---

## Summary

**Built:**
- ✅ Design token system (complete)
- ✅ Component architecture (foundation)
- ✅ Implementation plan (detailed)

**Next:**
- Build remaining email components (2h)
- Extend knowledgeBase schema (1h)
- Build agent system (4h)
- Rendering pipeline (2h)
- Trigger system (3h)
- Admin UI (4h)

**Total remaining**: ~16 hours

You now have a solid foundation and clear path forward. The system will let an LLM orchestrate email content by selecting and arranging pre-built components with trauma-informed personalization.
