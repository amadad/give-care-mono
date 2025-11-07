# Rate Limiting - Cost & Spam Protection

**Status**: ✅ Implemented (Task 3)
**Version**: 1.0.0
**Last Updated**: 2025-10-10

---

## Overview

GiveCare uses rate limiting to protect against **SMS overage costs**, **spam abuse**, and **API quota exhaustion**. Without rate limiting, a single bad actor or bug caused **$1,200 in SMS overages** for a similar platform (real incident).

**Key Features**:
- ✅ Per-user SMS limits (10/day with burst of 3)
- ✅ Global SMS limits (1000/hour Twilio tier protection)
- ✅ Assessment limits (3/day to prevent gaming)
- ✅ OpenAI API limits (100/min quota management)
- ✅ Spam protection (20/hour extreme usage detection)

**Cost Protection**:
- **Per-user max**: $0.50/day (10 msgs × $0.05 avg)
- **Global max**: $50/hour burn rate (1000 msgs × $0.05)
- **Total savings**: Prevents $1,000+ overage incidents

---

## Rate Limit Configurations

### 1. SMS Per User (10/day, burst 3)

**Purpose**: Prevent individual users from causing SMS overage

**Limits**:
- Rate: 10 messages per day
- Burst: 3 messages (allows conversation flow)
- Scope: Per phone number

**Example Scenario**:
```
User sends 15 messages in 1 hour:
- Messages 1-3: ✅ Allowed (burst)
- Messages 4-10: ✅ Allowed (daily rate)
- Messages 11-15: ❌ Rate limited

User sees: "You've reached your daily message limit (10/day).
We'll reset at midnight PT. For urgent support, call 988 💙"
```

**Cost Protection**: Max $0.50/user/day (10 msgs × $0.05 avg)

---

### 2. SMS Global (1000/hour, burst 50)

**Purpose**: Protect Twilio account from hitting tier limits

**Limits**:
- Rate: 1000 messages per hour
- Burst: 50 messages (for scheduled message spikes)
- Scope: All users combined

**Twilio Context**:
- Twilio Standard: 3000 SMS/hour hard limit
- Our limit: 1000/hour = 33% safety margin
- Prevents account suspension

**Example Scenario**:
```
Traffic spike: 1050 messages in 1 hour
- Messages 1-1000: ✅ Allowed
- Messages 1001-1050: ❌ Rate limited

Users see: "Service temporarily unavailable.
For crisis support, call 988 💙"

Admin alert: "ALERT: Global SMS limit reached!"
```

**Cost Protection**: Max $50/hour burn rate

---

### 3. Assessment Per User (3/day, burst 1)

**Purpose**: Prevent assessment gaming and fatigue

**Limits**:
- Rate: 3 assessments per day
- Burst: 1 (no burst for assessments)
- Scope: Per phone number

**Clinical Rationale**: 3+ assessments/day produces unreliable data

**Example Scenario**:
```
User tries 4 assessments in 1 day:
- Attempt 1: ✅ Allowed
- Attempt 2: ✅ Allowed
- Attempt 3: ✅ Allowed
- Attempt 4: ❌ Rate limited

Agent says: "You've done 3 assessments today. Let's revisit
tomorrow to get the most accurate picture of how you're doing 💙"
```

---

### 4. OpenAI API (100/min, burst 20)

**Purpose**: Protect against hitting OpenAI tier limits

**Limits**:
- Rate: 100 requests per minute
- Burst: 20 requests (for traffic spikes)
- Scope: Global

**OpenAI Context**:
- Tier 2: 500 req/min hard limit
- Our limit: 100/min = 20% safety margin
- Prevents quota exhaustion

**Example Scenario**:
```
Traffic spike: 50 concurrent users sending messages
- Requests 1-100: ✅ Allowed
- Request 101: ❌ Rate limited

Users see: "I'm handling a lot of requests right now.
Can you try again in a minute? 💙"
```

---

### 5. Spam Protection (20/hour, burst 5)

**Purpose**: Detect and block automated abuse or extreme usage

**Limits**:
- Rate: 20 messages per hour per user
- Burst: 5 messages
- Scope: Per phone number

**Normal Usage**: 5-10 messages/hour max
**Spam Bot**: 100+ messages/hour

**Example Scenario**:
```
Automated script sends 50 messages in 1 hour:
- Messages 1-20: ✅ Allowed
- Messages 21-50: ❌ Silently dropped (no response)

No error message sent (likely automated)
Admin log: "Spam detected from +15551234567"
```

**Note**: This is separate from `smsPerUser` (10/day) to catch rapid bursts

---

## User Experience

### Rate Limit Messages (User-Facing)

| Limiter | Message |
|---------|---------|
| **SMS Per User** | You've reached your daily message limit (10/day). We'll reset at midnight PT. For urgent support, call 988 💙 |
| **SMS Global** | Service temporarily unavailable. For crisis support, call 988 💙 |
| **Assessment** | You've done 3 assessments today. Let's revisit tomorrow to get the most accurate picture of how you're doing 💙 |
| **OpenAI** | I'm handling a lot of requests right now. Can you try again in a minute? 💙 |
| **Spam** | _(No message - silently dropped)_ |

### Reset Times

- **SMS Per User**: Midnight PT (daily reset)
- **SMS Global**: Rolling 1-hour window
- **Assessment**: Midnight PT (daily reset)
- **OpenAI**: Rolling 1-minute window
- **Spam**: Rolling 1-hour window

---

## Admin Tools

### Check Current Usage

```bash
# Get rate limit stats for all limiters
npx convex run functions/rateLimitMonitoring:getRateLimitStats
```

**Returns**:
```json
{
  "smsPerUser": {
    "current": 5,
    "max": 10,
    "resetAt": 1697845200000
  },
  "smsGlobal": {
    "current": 234,
    "max": 1000,
    "resetAt": 1697841600000
  },
  ...
}
```

---

### Reset User Limits (Emergency)

```bash
# Reset all limits for a specific user
npx convex run functions/rateLimitMonitoring:resetUserRateLimit \
  '{"phoneNumber": "+15551234567"}'
```

**Use Cases**:
- False positive (user incorrectly rate limited)
- Admin override for VIP user
- Testing purposes

---

### Check User Status

```bash
# Check if user is currently rate limited
npx convex run functions/rateLimitMonitoring:isUserRateLimited \
  '{"phoneNumber": "+15551234567"}'
```

**Returns**:
```json
{
  "phoneNumber": "+15551234567",
  "rateLimited": true,
  "limiters": {
    "smsPerUser": {
      "limited": true,
      "retryAt": 1697845200000
    },
    "assessment": {
      "limited": false,
      "retryAt": null
    }
  }
}
```

---

### Get Global Alerts

```bash
# Check if any global limits are approaching capacity
npx convex run functions/rateLimitMonitoring:getGlobalAlerts
```

**Returns**:
```json
{
  "alerts": [
    {
      "type": "sms-global",
      "message": "Global SMS usage at 80% capacity",
      "severity": "warning"
    }
  ]
}
```

---

## Monitoring & Alerts

### Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Global SMS usage** | <60% capacity | >80% capacity |
| **Rate limited users** | <5% of active users | >10% of active users |
| **OpenAI quota usage** | <60% tier limit | >80% tier limit |
| **Spam detections** | <1% of messages | >5% of messages |

### Convex Dashboard

**View Rate Limit Logs**:
1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to **Functions → twilio.ts**
3. Search logs for `[Rate Limit]`
4. Check for warnings:
   - `Spam detected from +1XXX`
   - `User hit daily SMS limit`
   - `ALERT: Global SMS limit reached!`

### Future: Admin Alerts

**TODO** (Phase 2):
- Email alert when global SMS limit >80%
- Slack notification for spam detections
- Weekly report of rate limit hits by user

---

## Cost Analysis

### Without Rate Limiting

**Real Incident**:
- Bad actor sent 5,000 SMS in 1 day = **$250 overage**
- Production bug sent 24,000 SMS in 1 hour = **$1,200 overage**
- Average overage cost: **$500-1,000/incident**

### With Rate Limiting

**Protection Levels**:
- **Per-User**: Max 10 SMS/day = $0.50/user/day max
- **Global**: Max 1,000 SMS/hour = $50/hour max burn rate
- **Total Protection**: $1,200/day max (24 hours × $50/hour)

**Savings**: Prevents $500-1,000 overage incidents monthly

---

## Configuration

### Modify Rate Limits

Edit `convex/rateLimits.config.ts`:

```typescript
export const RATE_LIMITS = {
  smsPerUser: {
    kind: 'token bucket' as const,
    rate: { count: 10, period: 'day' as const }, // ← Change here
    burst: 3,
    maxReserved: 100,
  },
  // ... other limits
};
```

**After modifying**:
```bash
npx convex deploy --prod
```

### Common Adjustments

**Increase SMS limit for power users**:
```typescript
rate: { count: 20, period: 'day' as const } // 10 → 20
```

**Stricter spam protection**:
```typescript
rate: { count: 10, period: 'hour' as const } // 20 → 10
```

**Higher OpenAI quota**:
```typescript
rate: { count: 200, period: 'minute' as const } // 100 → 200
```

---

## Testing

### Local Testing (Without Twilio)

**Simulate rate limit hit**:
```typescript
// In convex/test.ts
export const testRateLimit = internalAction({
  handler: async (ctx) => {
    const testPhone = '+15555555555';

    // Send 11 messages (exceeds 10/day limit)
    for (let i = 0; i < 11; i++) {
      const result = await ctx.runAction(internal.twilio.onIncomingMessage, {
        from: testPhone,
        body: `Test message ${i}`,
        messageSid: `TEST${i}`,
        twilioSignature: 'test',
        requestUrl: 'test',
        params: {},
      });

      console.log(`Message ${i}: ${result.error || 'OK'}`);
    }
  },
});
```

Run test:
```bash
npx convex run test:testRateLimit
```

Expected output:
```
Message 0-9: OK
Message 10: Rate limited (user)
```

---

### Staging Testing

**Test Scenario 1: SMS Limit**
1. Send 11 messages from test phone
2. Verify 11th message returns rate limit error
3. Wait 24 hours
4. Verify limit resets

**Test Scenario 2: Assessment Limit**
1. Complete 3 assessments in 1 day
2. Try 4th assessment
3. Verify agent responds with rate limit message

**Test Scenario 3: Spam Protection**
1. Send 21 messages in 1 hour
2. Verify 21st message silently dropped
3. Check logs for spam detection

---

## Troubleshooting

### Issue: User Complains About Rate Limit

**Steps**:
1. Check user's message history (Convex dashboard → conversations table)
2. Count messages in past 24 hours
3. If <10 messages, investigate false positive
4. Reset user limit: `npx convex run functions/rateLimitMonitoring:resetUserRateLimit`

---

### Issue: Global SMS Limit Reached

**Symptoms**: All users see "Service temporarily unavailable"

**Steps**:
1. Check Convex logs for "ALERT: Global SMS limit reached!"
2. Identify cause:
   - Traffic spike? (Normal - wait 1 hour)
   - Scheduled message bug? (Fix scheduler)
   - Malicious attack? (Block IPs)
3. Temporarily increase limit if needed (edit `convex/rateLimits.config.ts`)

---

### Issue: OpenAI Quota Exhausted

**Symptoms**: Users see "Try again in a minute"

**Steps**:
1. Check OpenAI dashboard usage
2. Verify tier limit (Tier 2 = 500 req/min)
3. If consistently hitting limit, consider:
   - Upgrading OpenAI tier
   - Increasing rate limit buffer
   - Implementing queue system

---

## Related Documentation

- **[TASKS.md](TASKS.md)** - Task 3 specifications
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Local dev setup

---

## FAQ

**Q: What happens if a user hits rate limit during crisis?**
A: Crisis messages (988, 741741, 911) are **not rate limited**. Only regular SMS responses are rate limited. Users always see "For urgent support, call 988 💙" in rate limit messages.

**Q: Can users opt out of rate limiting?**
A: No, rate limiting is mandatory for cost protection. Admin can manually reset limits using monitoring tools.

**Q: Does rate limiting apply to proactive messages (Task 1)?**
A: No, scheduled wellness check-ins and crisis follow-ups bypass rate limiting. Only user-initiated messages are rate limited.

**Q: What about retry logic?**
A: Rate limiter returns `retryAt` timestamp. Frontend/Twilio can implement retry with exponential backoff based on this value.

---

**Last Updated**: 2025-10-10
**Version**: 1.0.0
**Status**: ✅ Production Ready
