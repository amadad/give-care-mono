# Logging Guide: HIPAA-Compliant Practices

**Last updated**: 2025-10-15
**Status**: Production-ready

---

## Quick Reference: What's Safe to Log?

### ✅ Safe to Log (NOT PII)

```typescript
import { logger } from '../src/logger';

// Internal identifiers (safe)
logger.info('Message processed', {
  userId: user._id,           // ✅ Internal Convex ID
  sessionId: session._id,     // ✅ Internal identifier
  assessmentType: 'ema',      // ✅ Non-sensitive metadata
});

// Performance metrics (safe)
logger.info('Agent response', {
  latency: 850,               // ✅ Performance data
  tokensUsed: 1200,           // ✅ Usage metrics
  modelTier: 'priority',      // ✅ Configuration
});

// Error messages (safe)
logger.error('Database query failed', {
  error: err.message,         // ✅ Technical error
  query: 'getUser',           // ✅ Function name
  userId: user._id,           // ✅ Internal ID
});
```

### ❌ Never Log (PII/PHI)

```typescript
// WRONG - Exposes PII
console.log('SMS from +15551234567:', message.body);  // ❌ Phone + message
console.log('User:', user.firstName, user.lastName);  // ❌ Name
console.log('Email:', user.email);                    // ❌ Email

// RIGHT - Redacted
logger.info('SMS received', {
  phoneNumberHash: 'a3f4c89b',  // ✅ Hashed (correlation only)
  bodyLength: 42,                // ✅ Metadata (not content)
  userId: user._id,              // ✅ Internal ID
});
```

---

## Why User IDs Are Safe

### User IDs Are Internal Identifiers

Convex generates user IDs like:
```
j9x7k2p4m8n5q1r3
```

**Why it's safe**:
1. **Not PII**: No personal information (not a phone, email, or SSN)
2. **Internal**: Only meaningful within your Convex database
3. **Essential**: Needed for debugging and correlating events
4. **HIPAA-compliant**: Not considered PHI (Protected Health Information)

### Real-World Example

**Scenario**: User reports "my messages aren't sending"

**With User ID Logging** (✅ Works):
```json
{
  "level": "ERROR",
  "message": "SMS delivery failed",
  "timestamp": "2025-10-15T10:30:00Z",
  "metadata": {
    "userId": "j9x7k2p4m8n5q1r3",
    "error": "Twilio rate limit exceeded",
    "phoneNumberHash": "a3f4c89b"
  }
}
```

**Action**: Search logs for `userId: "j9x7k2p4m8n5q1r3"` → Find all events for this user → Debug issue

**Without User ID Logging** (❌ Impossible to debug):
```json
{
  "level": "ERROR",
  "message": "SMS delivery failed",
  "timestamp": "2025-10-15T10:30:00Z",
  "metadata": {
    "error": "Twilio rate limit exceeded"
  }
}
```

**Action**: 🤷 Can't correlate this error to a specific user → Can't debug

---

## Convex Built-in Logging

Convex automatically logs:
- ✅ Function invocations (name, duration, status)
- ✅ Data read/write volume
- ✅ Error stack traces
- ✅ Database queries

**Access logs**:
```bash
# CLI
npx convex logs

# Dashboard
https://dashboard.convex.dev/t/YOUR_TEAM/YOUR_PROJECT/logs
```

**Integration with external services**:
- **Axiom**: Stream logs as events
- **Datadog**: Enrich logs with function metadata

---

## Migration: console.log → logger

### Example 1: Message Handler

**BEFORE (PII exposed)**:
```typescript
// convex/services/MessageHandler.ts:68
console.log('[MessageHandler] Incoming SMS from', message.from, ':', message.body);
```

**AFTER (PII redacted)**:
```typescript
import { logger } from '../../src/logger';

logger.info('Incoming SMS', {
  phoneNumberHash: simpleHash(message.from),  // Correlation only
  bodyLength: message.body.length,            // Metadata
  userId: user._id,                           // Internal ID
});
```

### Example 2: Assessment Responses

**BEFORE (verbose)**:
```typescript
console.log(`[Assessment] Persisted response for ${questionId} (score: ${questionScore})`);
```

**AFTER (structured)**:
```typescript
logger.debug('Assessment response saved', {
  userId: user._id,
  sessionId: session._id,
  questionId,
  score: questionScore,
});
```

### Example 3: Error Handling

**BEFORE (stack trace in prod)**:
```typescript
console.error('[MessageHandler] Error:', error);
```

**AFTER (structured error)**:
```typescript
logger.error('Message processing failed', {
  error: error.message,
  userId: user._id,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
});
```

---

## Datadog Integration (Recommended)

### Setup

1. **Install Datadog Convex integration**:
   ```bash
   npm install @datadog/convex-dd-trace
   ```

2. **Configure in Convex dashboard**:
   - Go to Settings → Integrations → Datadog
   - Add API key
   - Enable log streaming

3. **Enrich logs with metadata**:
   ```typescript
   import { dd } from '@datadog/convex-dd-trace';

   logger.info('SMS sent', {
     userId: user._id,
     latency: 850,
   });

   // Datadog automatically adds:
   // - Function name (e.g., "twilio:handleIncomingSMS")
   // - Request ID (correlates all logs in one request)
   // - Environment (dev/staging/prod)
   ```

### Datadog Dashboard Queries

**Example queries**:
```
# All errors for a specific user
level:error @userId:j9x7k2p4m8n5q1r3

# SMS delivery failures (last 1 hour)
message:"SMS delivery failed" @timestamp:[now-1h TO now]

# Slow responses (>1s latency)
@latency:>1000 @function:twilio:handleIncomingSMS
```

---

## HIPAA Compliance Checklist

- [ ] No phone numbers in logs (use hashes for correlation)
- [ ] No message content in logs (use `bodyLength` instead)
- [ ] No names/emails in logs (use `userId` instead)
- [ ] Stack traces only in development (not production)
- [ ] Logs encrypted in transit (HTTPS to Datadog)
- [ ] Logs encrypted at rest (Datadog default)
- [ ] Log retention policy (30-90 days, configurable)
- [ ] Access controls (only admins see logs)

---

## FAQ

### Q: Can I log error stack traces?
**A**: Yes, but only in development:
```typescript
logger.error('Function failed', {
  error: err.message,
  stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
});
```

### Q: Can I log message length?
**A**: Yes, metadata is safe:
```typescript
logger.info('Message received', {
  bodyLength: message.body.length,  // ✅ Safe
  // body: message.body,            // ❌ Not safe (PHI)
});
```

### Q: Can I log assessment answers?
**A**: Log scores, not raw answers:
```typescript
logger.debug('Assessment response', {
  questionId: 'ema_q1',
  score: 75,                        // ✅ Safe (normalized score)
  // responseValue: 'I feel sad',   // ❌ Not safe (PHI)
});
```

### Q: What if I need to debug a specific message?
**A**: Use phone number hashing for correlation:
```typescript
// Log message A
logger.info('SMS received', {
  phoneNumberHash: 'a3f4c89b',     // Hash of +15551234567
  userId: user._id,
});

// Log message B
logger.info('SMS sent', {
  phoneNumberHash: 'a3f4c89b',     // Same hash
  userId: user._id,
});

// Search logs: phoneNumberHash:a3f4c89b → All events for this phone
```

**Important**: Hash is **not reversible** (can't recover phone number)

---

## Monitoring Best Practices

### 1. Use Log Levels Appropriately

```typescript
// DEBUG: Verbose (dev only)
logger.debug('Context built', { userId: user._id, contextSize: 23 });

// INFO: Normal operations
logger.info('Assessment started', { userId: user._id, type: 'ema' });

// WARN: Recoverable issues
logger.warn('Rate limit warning', { userId: user._id, remaining: 2 });

// ERROR: Failures requiring attention
logger.error('SMS delivery failed', { userId: user._id, error: err.message });
```

### 2. Add Context to Every Log

**Bad** (no context):
```typescript
logger.info('Assessment complete');
```

**Good** (contextual):
```typescript
logger.info('Assessment complete', {
  userId: user._id,
  sessionId: session._id,
  type: 'cwbs',
  score: 67,
  latency: 850,
});
```

### 3. Use Consistent Field Names

| Field | Type | Example |
|-------|------|---------|
| `userId` | string | `"j9x7k2p4m8n5q1r3"` |
| `sessionId` | string | `"k8m6p3r2n9q4s1t7"` |
| `latency` | number (ms) | `850` |
| `error` | string | `"Rate limit exceeded"` |
| `phoneNumberHash` | string | `"a3f4c89b"` |

---

## Next Steps

1. **Replace console.log calls**:
   ```bash
   # Find all console.log calls
   grep -r "console\.log" convex/
   grep -r "console\.error" convex/
   ```

2. **Test in development**:
   ```bash
   npx convex dev
   # Trigger SMS → Check logs in terminal
   ```

3. **Deploy to production**:
   ```bash
   npx convex deploy --prod
   # Check logs in Convex dashboard
   ```

4. **Set up Datadog** (optional but recommended):
   - Install integration
   - Create dashboards
   - Set up alerts (e.g., "Error rate >5% for 5 minutes")

---

**Questions?** See `docs/CLAUDE.md` or `docs/SOP.md` for troubleshooting.
