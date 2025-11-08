# Welcome SMS After Stripe Checkout - Implementation

**Date**: 2025-11-07
**Status**: ✅ Implemented and deployed

---

## Overview

Automatically sends a personalized welcome SMS to new subscribers immediately after completing Stripe checkout.

## User Flow

1. User completes signup form on `/signup` with name, email, phone number
2. User is redirected to Stripe hosted checkout
3. User completes payment
4. Stripe sends `checkout.session.completed` webhook
5. **5 seconds later**: User receives welcome SMS
6. User is redirected to `/welcome` page (which tells them to expect the SMS)

## Implementation

### Files Modified

1. **`convex/functions/billing.ts`** (lines 46-96)
   - Extracts `phoneNumber` and `fullName` from Stripe webhook metadata
   - Detects `checkout.session.completed` event
   - Schedules welcome SMS with 5-second delay

2. **`convex/internal/onboarding.ts`** (NEW FILE)
   - `sendWelcomeSms` internal action
   - Sends personalized SMS via Twilio
   - Extracts first name from full name

### How It Works

```typescript
// When Stripe webhook arrives
if (type === 'checkout.session.completed' && phoneNumber) {
  // Schedule SMS to send 5 seconds later (ensures subscription is set up)
  await ctx.scheduler.runAfter(
    5000,
    internal.internal.onboarding.sendWelcomeSms,
    { phoneNumber, fullName }
  );
}
```

### Welcome Message Template

```
Hi [FirstName]! Welcome to GiveCare. I'm here to support you 24/7 on your caregiving journey. Text me anytime for guidance, resources, or just someone to listen. How are you doing today?
```

## Configuration Requirements

### Environment Variables

Must be set in Convex dashboard:

- `TWILIO_ACCOUNT_SID` - Twilio account ID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - GiveCare's Twilio phone number

### Stripe Metadata

The checkout session MUST include these metadata fields (already implemented in `convex/stripe.ts:38-41`):

```typescript
metadata: {
  fullName: args.fullName,
  phoneNumber: args.phoneNumber, // E.164 format (e.g., +14155551234)
}
```

## Error Handling

### Graceful Failures

If SMS fails to send:
- ✅ Error logged to Convex console
- ✅ Subscription still created successfully
- ✅ User can still text first to initiate conversation
- ❌ No retry mechanism (by design - avoid duplicate messages)

### Common Issues

**"Twilio not configured"**
- Missing environment variables in Convex
- Action returns `{ success: false, error: 'Twilio not configured' }`

**"Phone number invalid"**
- Twilio requires E.164 format (+1 country code)
- Signup form validation ensures this

## Monitoring

### Logs

Success:
```
[billing] Scheduling welcome SMS for checkout: { phoneNumber: '+14155551234', fullName: 'John Doe' }
[onboarding] Welcome SMS sent: { sid: 'SM...', to: '+14155551234' }
```

Failure:
```
[onboarding] Twilio error sending welcome SMS: <error details>
```

### Metrics

Track in Convex dashboard:
- Filter logs for `[onboarding]`
- Count `Welcome SMS sent` vs `Twilio error`
- Expected: >95% success rate

## Testing

### Manual Test

1. Use Stripe test mode
2. Complete checkout with test card `4242 4242 4242 4242`
3. Use real phone number for testing
4. Should receive SMS within 10 seconds

### Stripe Webhook Testing

```bash
# Use Stripe CLI to trigger webhook
stripe trigger checkout.session.completed \
  --add checkout_session:metadata[phoneNumber]=+14155551234 \
  --add checkout_session:metadata[fullName]="Test User"
```

## Cost Analysis

- **Per SMS**: ~$0.0079 (Twilio US pricing)
- **Per signup**: 1 SMS = $0.0079
- **Monthly (100 signups)**: $0.79

## Future Enhancements

### Possible Improvements

1. **Retry Logic** (if needed)
   - Track failed sends in `billing_events`
   - Retry once after 5 minutes
   - Give up after 1 retry to avoid spam

2. **A/B Testing**
   - Test different welcome message templates
   - Track response rate (did they text back?)

3. **Localization**
   - Detect user's locale
   - Send welcome message in their language

4. **Rich Media** (RCS)
   - Send image/card instead of plain SMS
   - Requires RCS capability check

5. **Timezone Awareness**
   - Don't send SMS at 3am user local time
   - Queue for 9am if checkout happens overnight

## Rollback Plan

If SMS causes issues:

1. **Disable temporarily**:
   ```typescript
   // In billing.ts line 86
   if (false && type === 'checkout.session.completed' && phoneNumber) {
   ```

2. **Remove completely**:
   - Delete lines 85-96 in `billing.ts`
   - Delete `convex/internal/onboarding.ts`
   - Run `npx convex codegen`

## References

- **Twilio SMS API**: https://www.twilio.com/docs/sms/api/message-resource
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Convex Scheduler**: https://docs.convex.dev/scheduling/scheduled-functions

---

**Implementation Date**: 2025-11-07
**Implemented By**: Claude Code
**Status**: ✅ Production ready
