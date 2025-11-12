# Architecture Decisions - Clarifications

## 1. phoneE164 vs externalId

**Answer**: ❌ **Keep `externalId`** - phoneE164 is NOT better for a good reason

**Current State**:
- `externalId` supports BOTH phone numbers AND email (schema line 31: "Phone number or email")
- `channel` field determines which: 'sms' | 'email' | 'web'
- Frontend (`give-care-site`) already formats to E.164 using `phone.getE164()`
- Twilio sends E.164 format (+1XXXXXXXXXX)

**Problem with phoneE164**:
- Would break email users (they also use `externalId`)
- `externalId` is the user identifier across all channels

**What to Fix Instead**:
- ✅ Keep `externalId` as-is (supports phone + email)
- ✅ Normalize `phone` field to E.164 format (fix normalization in `convex/inbound.ts`)
- ✅ Use `phone` field for phone lookups (not `externalId`)
- ⚠️ Current bug: `inbound.ts` strips all non-digits: `normalized = phoneNumber.replace(/[^\d]/g, "")` - loses E.164 format

**Fix**:
```typescript
// ❌ Current (loses E.164 format)
const normalized = phoneNumber.replace(/[^\d]/g, "")

// ✅ Fixed (preserve E.164 format)
const normalized = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`
```

---

## 2. intervention_events Migration

**Answer**: ✅ **No backward compatibility needed** - Migrate directly to `events` table

**Migration Plan**:
1. Create `events` table with same indexes
2. Migrate existing `intervention_events` data to `events` with `type: 'intervention.*'`
3. Update all code to use `events` table
4. Delete `intervention_events` table after migration

---

## 3. Composite Score Recalculation

**Answer**: ✅ **Recalculate on every assessment completion**

**Implementation**:
- After any assessment completion, call `recalculateComposite()` service
- Store in `users.metadata.gcBurnout` (denormalized for quick access)
- Store in `scores_composite` table (for trend charts)
- Single mutation (CONVEX_01.md: avoid sequential mutations)

---

## 4. Import Rules

**Answer**: ✅ **Currently using TypeScript path aliases** - Sufficient, no ESLint rules needed

**Current Setup**:
- `tsconfig.json` has `paths: { "@/*": ["ui/*"] }`
- ESLint config exists but no import restriction rules
- TypeScript compiler enforces paths

**Recommendation**:
- ✅ Add path aliases for domain/services/infra: `@domain/*`, `@services/*`, `@infra/*`
- ✅ TypeScript compiler will enforce (no ESLint rules needed)
- ✅ IDE will autocomplete correctly

**Updated tsconfig.json**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["ui/*"],
      "@domain/*": ["convex/lib/domain/*"],
      "@services/*": ["convex/lib/services/*"],
      "@infra/*": ["convex/lib/infrastructure/*"]
    }
  }
}
```

---

## Updated Plan

### Schema Changes (Revised)

**Keep `externalId`**:
```typescript
users: defineTable({
  externalId: v.string(), // Phone number OR email (keep as-is)
  phone: v.optional(v.string()), // E.164 format when channel='sms'
  email: v.optional(v.string()), // Email when channel='email'
  // ... rest
}).index('by_externalId', ['externalId'])
  .index('by_phone', ['phone']) // Use this for phone lookups
```

**Fix Phone Normalization**:
- Update `convex/inbound.ts` to preserve E.164 format
- Twilio already sends E.164, so just use it directly

**New Tables**:
- `events`: Generic event log (replaces `intervention_events`)
- `scores_composite`: Composite burnout score history

---

## Implementation Order (Updated)

1. **Stripe**: Event-driven webhook, idempotent mutations
2. **Composite Burnout**: Domain function + service + write-through on assessment completion
3. **Phone Normalization**: Fix E.164 format preservation in `inbound.ts`
4. **Onboarding Policy**: Centralized `enforce()` function
5. **Events Table**: Create and migrate from `intervention_events`
6. **Zone Mapping**: Pure function for resource suggestions
7. **SDOH Enrichment**: Pure function + audit trail
8. **Trend Detection**: Event-first analysis
9. **Resource Search**: Policy-safe cache
10. **Infrastructure**: Feature flags, query batching, message templates
11. **Tests**: Domain tests, service tests, smoke tests

