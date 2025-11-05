# Email System Documentation

**Last Updated**: 2025-01-04

Unified email system for GiveCare with LLM-powered content orchestration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     EMAIL CONTACTS                          │
│                  (Convex - Source of Truth)                 │
│                                                             │
│  • Single contact record per email                         │
│  • Tag-based segmentation (newsletter, assessment)         │
│  • Rich metadata (scores, bands, pressure zones)           │
│  • Granular preferences (newsletter, followup, etc)        │
│  • Engagement tracking (sent, opened, clicked)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── Newsletter Signups
                            ├─── Assessment Completers
                            └─── Future Lead Magnets
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LLM ORCHESTRATION                        │
│              (OpenAI gpt-5-nano + Agents SDK)               │
│                                                             │
│  Orchestrator → Content Strategy → Composer → Components   │
│  • Select tone based on band/context                       │
│  • Search knowledgeBase for content blocks                 │
│  • Map to React Email components                           │
│  • Personalize with subscriber data                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  REACT EMAIL RENDERING                      │
│               (12 Trauma-Informed Components)               │
│                                                             │
│  • ValidationBlock, ScoreCard, PressureZoneCard            │
│  • InterventionCard, TipCallout, ResourceList, CTAButton   │
│  • EmailHeader, EmailFooter, Container, Section, Shell     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                         RESEND                              │
│                    (Email Delivery)                         │
│                                                             │
│  • Transactional emails (assessment results)               │
│  • Campaign broadcasts (weekly summary)                    │
│  • Automated sequences (Day 3/7/14 follow-ups)             │
└─────────────────────────────────────────────────────────────┘
```

---

## What's Implemented ✅

### 1. Unified Contact Database
**Table**: `emailContacts` (give-care-app/convex/schema.ts:511)

Every email address gets ONE record with:
- **Tags**: `newsletter`, `assessment`, etc.
- **Preferences**: Granular opt-in/opt-out per email type
- **Assessment Data**: Score, band, pressure zones, date
- **Engagement**: Sent/opened/clicked counts, timestamps
- **Status**: `active`, `unsubscribed`, `bounced`

### 2. LLM Email Components
**Location**: `give-care-site/emails/components/`

All 12 components implemented:
- `EmailShell.tsx` - Base wrapper with fonts/head
- `EmailContainer.tsx` - Centered 600px container
- `EmailSection.tsx` - Vertical spacing wrapper
- `EmailHeader.tsx` - Logo + title
- `EmailFooter.tsx` - Unsubscribe + attribution
- `ValidationBlock.tsx` - P1-compliant validation messages
- `ScoreCard.tsx` - Assessment score display
- `PressureZoneCard.tsx` - Single pressure zone module
- `InterventionCard.tsx` - Resource/intervention card
- `TipCallout.tsx` - Highlighted tip/insight
- `ResourceList.tsx` - Bulleted resource list
- `CTAButton.tsx` - Primary/secondary CTA

**Design System**: `emails/tokens.ts`
- Trauma-informed color palette (amber theme)
- Typography scale (hero, section, card, body, label)
- Accessibility helpers (WCAG AA compliance)
- Email client compatibility

### 3. LLM Orchestration
**File**: `give-care-app/convex/emailActions.ts`

Two-agent system:
1. **Orchestrator** - Selects content strategy
   - Determines tone based on band/trigger
   - Searches knowledgeBase for content blocks
   - Generates subject line
   - Returns content plan JSON

2. **Composer** - Maps to components
   - Maps content blocks to React components
   - Personalizes with subscriber data
   - Arranges in logical flow (validation → content → CTA)
   - Returns component tree JSON

**Model**: `gpt-5-nano` (3x cheaper than gpt-4o-mini)

### 4. Content Library
**File**: `give-care-app/convex/functions/emailContent.ts`

Extended `knowledgeBase` schema with email metadata:
- `emailBlockType`: validation, tip, intervention, resource
- `tone`: compassionate, encouraging, urgent, neutral
- `componentHint`: Which component to use
- `ctaText` / `ctaHref`: Call-to-action content

Functions:
- `seedValidationMessages()` - Seed P1-compliant validation content
- `searchEmailContent()` - Vector search with filters

### 5. Automated Sequences
**Files**:
- `convex/email/sequences.ts` - Day 3/7/14 follow-ups
- `convex/email/campaigns.ts` - Weekly summary
- `convex/crons.ts:172-212` - Cron triggers

**Active Crons**:
- Daily 9am EST: Assessment follow-ups (Day 3, 7, 14)
- Sundays 10am EST: Weekly wellness summary

### 6. Static Assessment Emails
**File**: `give-care-app/convex/functions/assessmentEmailActions.ts`

Immediate email after assessment completion:
- React Email template rendering
- Score, band, interpretation
- Pressure zones display
- Static HTML (no LLM needed for speed)

---

## How to Use

### Send Newsletter to All Subscribers

```typescript
// Get subscribers
const subscribers = await convex.query(
  api.functions.emailContacts.getNewsletterSubscribers
);

// Send via batch action
await convex.action(
  api.emailActions.sendBatchEmails,
  {
    contacts: subscribers.map(s => s.email),
    trigger: { type: 'weekly_summary' }
  }
);
```

### Send Targeted Campaign

```typescript
// Get Severe burden caregivers
const contacts = await convex.query(
  api.functions.emailContacts.getByBand,
  { band: 'Severe' }
);

// Filter by pressure zone
const targeted = contacts.filter(c =>
  c.pressureZones?.includes('Physical Exhaustion')
);

// Send campaign
await convex.action(
  api.emailActions.sendBatchEmails,
  {
    contacts: targeted.map(c => c.email),
    trigger: {
      type: 'campaign',
      metadata: { campaignName: 'exhaustion-support' }
    }
  }
);
```

### Manual Test Email

```bash
# Via Convex CLI
npx convex run emailActions:generateAndSendEmail \
  --email "test@example.com" \
  --trigger '{"type":"assessment_followup","day":3}'
```

### View Email Stats

```typescript
const stats = await convex.query(
  api.functions.emailContacts.getStats
);
// Returns: total, active, unsubscribed, by band, etc.
```

---

## Environment Variables

**Required** (give-care-app):
```bash
OPENAI_API_KEY=sk-...              # For LLM orchestration
RESEND_API_KEY=re_...              # For email delivery
```

**Optional**:
```bash
OPENAI_MODEL=gpt-5-nano            # Default model (can override)
RESEND_FROM_EMAIL=GiveCare <hello@my.givecareapp.com>
NEXT_PUBLIC_SITE_URL=https://givecareapp.com  # For rendering
```

**Setting in Convex**:
```bash
cd give-care-app
npx convex env set RESEND_API_KEY re_your_key_here
npx convex deploy
```

See [EMAIL_DELIVERY_FIX.md](./EMAIL_DELIVERY_FIX.md) for troubleshooting.

---

## Data Flow Examples

### Newsletter Signup
1. User enters email on homepage
2. POST `/api/newsletter`
3. Upserts to `emailContacts` with tag `["newsletter"]`
4. Sets `preferences.newsletter = true`
5. (Optional) Syncs to Resend audience

### Assessment Completion
1. User completes BSFC assessment
2. POST `/api/assessment/email`
3. Upserts to `emailContacts` with tag `["assessment"]`
4. Stores score, band, pressure zones
5. Sets `preferences.assessmentFollowup = true`
6. Sends immediate results email (static template)
7. Tracks email sent

### Day 3 Follow-Up (Automated)
1. Cron runs daily at 9am EST
2. Query contacts with `latestAssessmentDate` ~3 days ago
3. For each eligible contact:
   - Build email context (band, zones, history)
   - LLM Orchestrator selects content strategy
   - Search knowledgeBase for relevant blocks
   - LLM Composer maps to components
   - Render React Email to HTML
   - Send via Resend
   - Track email sent

---

## LLM Email Generation Flow

```
TRIGGER (Cron/Manual)
    ↓
Load Contact from emailContacts
    ↓
Build EmailContext (subscriber data + trigger)
    ↓
ORCHESTRATOR (gpt-5-nano)
- Determine tone (compassionate/encouraging/urgent)
- Select content block types (validation, tip, intervention)
- Generate subject line
- Return content plan JSON
    ↓
Search knowledgeBase for Content Blocks
- Vector search by pressure zones
- Filter by tone, block type, band
    ↓
COMPOSER (gpt-5-nano)
- Map content blocks → React components
- Personalize with subscriber data
- Arrange in logical flow
- Return component tree JSON
    ↓
Render Component Tree to HTML
- Import React Email components
- Render tree to HTML string
    ↓
Send via Resend
    ↓
Track in emailContacts (sent count, timestamp)
```

---

## Files Reference

**Backend (give-care-app)**:
- `convex/schema.ts:511` - emailContacts table
- `convex/functions/emailContacts.ts` - Contact management helpers
- `convex/functions/emailContent.ts` - Content seeding/search
- `convex/emailActions.ts` - LLM orchestration
- `convex/email/sequences.ts` - Day 3/7/14 follow-ups
- `convex/email/campaigns.ts` - Weekly summary
- `convex/crons.ts:172-212` - Cron triggers
- `convex/functions/assessmentEmailActions.ts` - Static assessment emails
- `src/email/context.ts` - EmailContext builder
- `src/email/instructions.ts` - Dynamic LLM prompts

**Frontend (give-care-site)**:
- `emails/tokens.ts` - Design system
- `emails/components/*.tsx` - 12 React Email components
- `emails/AssessmentResults.tsx` - Static assessment template
- `lib/email/renderer.ts` - Component tree renderer
- `app/api/email/render/route.ts` - Rendering API
- `app/api/newsletter/route.ts` - Newsletter signup
- `app/api/assessment/email/route.ts` - Assessment email trigger

---

## Cost & Performance

**Model**: gpt-5-nano
- Input: $0.05/1M tokens
- Output: $0.40/1M tokens
- 3x cheaper than gpt-4o-mini

**Typical Email Generation**:
- Orchestrator: ~500 tokens input, ~200 output
- Composer: ~800 tokens input, ~400 output
- **Total cost per email**: ~$0.0003 (0.03¢)

**Batch Processing**:
- Rate limit: 10 emails/second (100ms delay)
- 1,000 emails: ~2 minutes + $0.30 LLM cost

**Cron Sequences**:
- Day 3 follow-up: ~50-100 emails/day
- Weekly summary: ~1,000 emails/week
- **Monthly LLM cost**: ~$15-30

---

## Troubleshooting

### Emails Not Sending
See [EMAIL_DELIVERY_FIX.md](./EMAIL_DELIVERY_FIX.md) for:
- Missing RESEND_API_KEY configuration
- Email failure tracking
- Admin monitoring queries

### LLM Errors
Check Convex logs for:
- Missing OPENAI_API_KEY
- Model availability (gpt-5-nano)
- Rate limiting issues

### Content Search Failing
Verify knowledgeBase content:
```typescript
// Seed validation messages
await convex.mutation(
  api.functions.emailContent.seedValidationMessages,
  {}
);
```

### Cron Not Triggering
Check cron schedule:
```bash
cd give-care-app
npx convex dashboard
# Navigate to Crons → View scheduled runs
```

---

## Future Enhancements

**Not Currently Implemented**:
- Loops.so integration (visual email builder) - see [EMAIL_SYSTEM_OPTIONS.md](.archive/EMAIL_SYSTEM_OPTIONS.md) for evaluation
- A/B testing framework
- Email engagement webhooks (opens, clicks)
- Dynamic unsubscribe preferences UI
- Multi-language support

**Recommended**:
- Consider Loops.so if need non-technical team to manage campaigns
- Current LLM system works well for automated, personalized sequences

---

## Migration Notes

**Old Tables** (Deprecated but kept for compatibility):
- `newsletterSubscribers` - Basic email + timestamps only
- `assessmentResults` - Assessment-specific data only

**New Table** (Use going forward):
- `emailContacts` - Unified contact with rich metadata

Existing data in old tables can remain. New signups go to `emailContacts`.

---

**For detailed implementation history, see `.archive/` directory.**
