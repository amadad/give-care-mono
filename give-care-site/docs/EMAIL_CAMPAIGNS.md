# Email Campaign System

Unified contact management for newsletters, assessment follow-ups, and targeted campaigns.

## Architecture

**Single Source of Truth**: `emailContacts` table in Convex
**Domain Data**: `assessmentResults` for assessment-specific data
**Delivery**: Resend for email sending

## Contact Types

All contacts stored in `emailContacts` with tags for segmentation:
- `newsletter` - Newsletter subscribers
- `assessment` - Assessment completers
- `lead_magnet` - Future lead magnets
- Custom tags as needed

## How It Works

### Newsletter Signup Flow
1. User submits email on `/` homepage
2. POST to `/api/newsletter`
3. Creates/updates contact with tag `["newsletter"]`
4. Sets `preferences.newsletter = true`
5. Optionally syncs to Resend audience

### Assessment Completion Flow
1. User completes BSFC assessment
2. POST to `/api/assessment/email`
3. Creates/updates contact with tag `["assessment"]`
4. Stores assessment metadata (score, band, pressure zones)
5. Sets `preferences.assessmentFollowup = true`
6. Sends assessment results email
7. Tracks email sent

## Campaign Examples

### Send Newsletter to All Subscribers

```typescript
import { ConvexHttpClient } from 'convex/browser';
import { api } from 'give-care-app/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Get all newsletter subscribers
const subscribers = await convex.query(
  api.functions.emailContacts.getNewsletterSubscribers
);

// Send email to each
for (const contact of subscribers) {
  await resend.emails.send({
    from: 'GiveCare <hello@my.givecareapp.com>',
    to: contact.email,
    subject: 'Your Weekly Caregiver Wellness Newsletter',
    html: newsletterHtml,
  });

  // Track send
  await convex.mutation(
    api.functions.emailContacts.trackEmailSent,
    { email: contact.email }
  );
}
```

### Send to Severe Burden Caregivers Only

```typescript
// Get contacts with Severe burden band
const severeContacts = await convex.query(
  api.functions.emailContacts.getByBand,
  { band: 'Severe' }
);

// Send targeted support email
for (const contact of severeContacts) {
  await resend.emails.send({
    from: 'GiveCare <hello@my.givecareapp.com>',
    to: contact.email,
    subject: 'Urgent: Resources for High-Burden Caregivers',
    html: crisisResourcesHtml,
  });
}
```

### Send Day 3 Follow-Up to Assessment Completers

```typescript
// Get assessment completers who opted into follow-up
const assessmentContacts = await convex.query(
  api.functions.emailContacts.getAssessmentFollowupSubscribers
);

// Filter to those who completed assessment 3 days ago
const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
const day3Contacts = assessmentContacts.filter(
  c => c.latestAssessmentDate &&
       Math.abs(c.latestAssessmentDate - threeDaysAgo) < (1 * 60 * 60 * 1000) // 1 hour window
);

// Send follow-up
for (const contact of day3Contacts) {
  const emailHtml = render(FollowUpDay3Email({
    email: contact.email,
    band: contact.latestAssessmentBand!,
    pressureZones: contact.pressureZones || [],
  }));

  await resend.emails.send({
    from: 'GiveCare <hello@my.givecareapp.com>',
    to: contact.email,
    subject: 'Day 3: How are you feeling?',
    html: emailHtml,
  });
}
```

### Send to Contacts with Specific Tags

```typescript
// Get contacts with both "newsletter" and "assessment" tags
const engagedContacts = await convex.query(
  api.functions.emailContacts.getByTags,
  { tags: ['newsletter', 'assessment'] }
);

// These are highly engaged users - send special content
```

## Segmentation Patterns

### By Assessment Band
```typescript
const mildBand = await convex.query(api.functions.emailContacts.getByBand, { band: 'Mild' });
const moderateBand = await convex.query(api.functions.emailContacts.getByBand, { band: 'Moderate' });
const severeBand = await convex.query(api.functions.emailContacts.getByBand, { band: 'Severe' });
```

### By Pressure Zones
```typescript
const allContacts = await convex.query(api.functions.emailContacts.listAll);

// Filter by pressure zone
const physicalExhaustion = allContacts.filter(
  c => c.pressureZones?.includes('Physical Exhaustion')
);

const financialStrain = allContacts.filter(
  c => c.pressureZones?.includes('Financial Strain')
);
```

### By Engagement
```typescript
const allContacts = await convex.query(api.functions.emailContacts.listAll);

// Recent openers (last 7 days)
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
const recentOpeners = allContacts.filter(
  c => c.lastEmailOpenedAt && c.lastEmailOpenedAt > sevenDaysAgo
);

// Inactive (no opens in 30 days)
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
const inactive = allContacts.filter(
  c => !c.lastEmailOpenedAt || c.lastEmailOpenedAt < thirtyDaysAgo
);
```

## Scheduled Sequences

Use Convex crons to trigger automated sequences:

```typescript
// convex/crons.ts
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Day 3 assessment follow-up (daily at 9am)
crons.daily(
  'day-3-assessment-followup',
  { hourUTC: 14 }, // 9am EST
  internal.email.sendDay3Followup
);

// Day 7 assessment follow-up (daily at 9am)
crons.daily(
  'day-7-assessment-followup',
  { hourUTC: 14 },
  internal.email.sendDay7Followup
);

// Weekly newsletter (Sundays at 10am)
crons.weekly(
  'weekly-newsletter',
  { hourUTC: 15, dayOfWeek: 'sunday' },
  internal.email.sendWeeklyNewsletter
);

export default crons;
```

## Unsubscribe Handling

All emails must include unsubscribe link:

```typescript
// In email template
<a href={`https://givecareapp.com/unsubscribe?email=${email}`}>
  Unsubscribe
</a>

// API route: app/api/unsubscribe/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response('Invalid request', { status: 400 });
  }

  await convex.mutation(api.functions.emailContacts.unsubscribe, {
    email,
    reason: 'user_requested',
  });

  return new Response('You have been unsubscribed', { status: 200 });
}
```

## Admin Dashboard Queries

### Get Contact Stats
```typescript
const stats = await convex.query(api.functions.emailContacts.getStats);

console.log(stats);
// {
//   total: 1250,
//   active: 1100,
//   unsubscribed: 150,
//   newsletterSubscribers: 800,
//   assessmentCompleters: 450,
//   byBand: { Mild: 200, Moderate: 150, Severe: 100 }
// }
```

### Export All Contacts
```typescript
const allContacts = await convex.query(
  api.functions.emailContacts.listAll,
  { limit: 10000 }
);

// Convert to CSV
const csv = convertToCSV(allContacts);
```

## Best Practices

1. **Always check status**: Only send to `status === 'active'`
2. **Respect preferences**: Check `preferences` object before sending
3. **Track sends**: Use `trackEmailSent` mutation after sending
4. **Rate limiting**: Batch sends to avoid Resend rate limits (100 emails/second)
5. **Personalization**: Use contact metadata (band, pressure zones) for relevant content
6. **Testing**: Always test campaigns with your own email first
7. **GDPR compliance**: Honor unsubscribe requests immediately

## Future Enhancements

- [ ] Add email open/click tracking webhooks
- [ ] Build admin UI for campaign creation
- [ ] A/B testing for subject lines
- [ ] Advanced segmentation builder
- [ ] Email sequence automation builder
- [ ] Integration with SMS app users
