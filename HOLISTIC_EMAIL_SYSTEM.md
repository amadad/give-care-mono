# Holistic Email System - Implementation Complete

## What Was Built

Unified contact management system that consolidates newsletter subscribers and assessment completers into a single, queryable database with rich segmentation capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EMAIL CONTACTS                          │
│                  (Convex - Source of Truth)                 │
│                                                             │
│  • Single contact record per email                         │
│  • Tag-based segmentation                                  │
│  • Rich metadata (scores, bands, pressure zones)           │
│  • Granular preferences                                    │
│  • Engagement tracking                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── Newsletter Signups
                            ├─── Assessment Completers
                            └─── Future Lead Magnets

                            ↓

┌─────────────────────────────────────────────────────────────┐
│                         RESEND                              │
│                 (Email Delivery Only)                       │
│                                                             │
│  • Transactional emails                                    │
│  • Campaign broadcasts                                     │
│  • Optional audience sync                                  │
└─────────────────────────────────────────────────────────────┘
```

## Files Created/Modified

### Backend (give-care-app)
- `convex/schema.ts` - Added `emailContacts` table
- `convex/functions/emailContacts.ts` - Contact management helpers (NEW)

### Frontend (give-care-site)
- `app/api/newsletter/route.ts` - Updated to use unified contacts
- `app/api/assessment/email/route.ts` - Updated to use unified contacts
- `docs/EMAIL_CAMPAIGNS.md` - Campaign examples and patterns (NEW)

## Key Features

### 1. Unified Contact Storage
Every email address gets ONE record with:
- Tags (newsletter, assessment, etc.)
- Preferences (granular opt-in/opt-out)
- Assessment metadata (score, band, pressure zones)
- Engagement metrics (sent, opened, clicked)
- Status (active, unsubscribed, bounced)

### 2. Flexible Segmentation
Query contacts by:
- Tags: `getByTags(['newsletter', 'assessment'])`
- Band: `getByBand('Severe')`
- Preferences: `getNewsletterSubscribers()`
- Custom filters: pressure zones, engagement, recency

### 3. Campaign Examples
```typescript
// Newsletter to all subscribers
const subs = await convex.query(api.functions.emailContacts.getNewsletterSubscribers);

// Targeted to Severe burden caregivers
const severe = await convex.query(api.functions.emailContacts.getByBand, { band: 'Severe' });

// Day 3 follow-up to assessment completers
const followup = await convex.query(api.functions.emailContacts.getAssessmentFollowupSubscribers);
```

## How to Use

### Send Your First Newsletter

1. Query subscribers:
```typescript
const subscribers = await convex.query(
  api.functions.emailContacts.getNewsletterSubscribers
);
```

2. Send via Resend:
```typescript
for (const contact of subscribers) {
  await resend.emails.send({
    from: 'GiveCare <hello@my.givecareapp.com>',
    to: contact.email,
    subject: 'Your subject line',
    html: emailHtml,
  });

  // Track send
  await convex.mutation(
    api.functions.emailContacts.trackEmailSent,
    { email: contact.email }
  );
}
```

### Send Targeted Campaign

```typescript
// Get Severe burden caregivers with Physical Exhaustion
const allContacts = await convex.query(api.functions.emailContacts.getByBand, { band: 'Severe' });
const targeted = allContacts.filter(c =>
  c.pressureZones?.includes('Physical Exhaustion')
);

// Send specialized content
```

### View Stats

```typescript
const stats = await convex.query(api.functions.emailContacts.getStats);
// Returns: total, active, unsubscribed, by band, etc.
```

## Data Flow

### Newsletter Signup
1. User enters email on homepage
2. POST `/api/newsletter`
3. Upserts to `emailContacts` with tag `["newsletter"]`
4. Sets `preferences.newsletter = true`
5. Optionally syncs to Resend audience

### Assessment Completion
1. User completes BSFC assessment
2. POST `/api/assessment/email`
3. Upserts to `emailContacts` with tag `["assessment"]`
4. Stores: score, band, pressure zones
5. Sets `preferences.assessmentFollowup = true`
6. Sends results email
7. Tracks email sent

### Both Newsletter + Assessment
If user does both:
- Single contact record
- Tags: `["newsletter", "assessment"]`
- Has both newsletter and assessment data
- Can segment either way

## Scheduled Sequences (Future)

Add to `convex/crons.ts`:
```typescript
// Day 3 assessment follow-up (daily at 9am)
crons.daily('day-3-followup', { hourUTC: 14 }, internal.email.sendDay3Followup);

// Weekly newsletter (Sundays at 10am)
crons.weekly('weekly-newsletter', { hourUTC: 15, dayOfWeek: 'sunday' }, internal.email.sendWeeklyNewsletter);
```

## Migration Notes

**Old Tables (Deprecated but kept for backward compatibility):**
- `newsletterSubscribers` - Basic email + timestamps
- `assessmentResults` - Assessment-specific data

**New Table (Use going forward):**
- `emailContacts` - Unified contact with rich metadata

Existing data in old tables can remain. New signups go to `emailContacts`. Eventually migrate old records.

## Environment Variables

```bash
# give-care-site/.env.local
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=GiveCare <hello@my.givecareapp.com>
RESEND_AUDIENCE_ID=... # optional
```

## Next Steps

1. **Send your first newsletter** using `getNewsletterSubscribers()`
2. **Build admin UI** to trigger campaigns (optional)
3. **Add email sequences** via Convex crons (Day 3, Day 7 follow-ups)
4. **Track engagement** via Resend webhooks (opens, clicks)
5. **A/B testing** for subject lines and content

## Summary

You now have:
- ✅ Unified contact database (single source of truth)
- ✅ Flexible segmentation (by tags, band, preferences)
- ✅ Newsletter subscriber management
- ✅ Assessment completer tracking
- ✅ Rich metadata for personalization
- ✅ Campaign examples and patterns
- ✅ Foundation for automated sequences

No separate repo needed. Everything integrated into existing Convex backend with powerful querying and Resend for delivery.
