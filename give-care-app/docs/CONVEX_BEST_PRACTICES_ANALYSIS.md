# Convex Best Practices Analysis

**Date:** 2025-01-14  
**Status:** Compliance Audit  
**Focus:** Identify violations and alignment with Convex best practices

---

## Executive Summary

**Overall Compliance:** 🟡 **PARTIAL** - Good foundation, but several violations need attention

**Critical Issues:** 3 violations  
**Medium Issues:** 5 violations  
**Low Issues:** 2 violations

---

## ✅ What We're Doing Right

### 1. Argument Validators ✅
- All public functions have argument validators
- Proper use of `v.id()`, `v.string()`, `v.object()`, etc.
- Type-safe validators in `lib/validators.ts`

### 2. Schema & Indexes ✅
- Well-structured schema with appropriate indexes
- No obvious redundant indexes (e.g., `by_foo` vs `by_foo_and_bar`)
- Proper use of composite indexes for common query patterns

### 3. TypeScript Usage ✅
- All functions written in TypeScript
- Proper type annotations
- Using generated types (`Doc`, `Id`, `QueryCtx`, etc.)

### 4. Helper Functions ✅
- Good use of helper functions in `lib/utils.ts`
- Shared logic extracted (e.g., `getByExternalId`, `handleAgentError`)
- Clean separation of concerns

### 5. Component Usage ✅
- Proper use of Convex components (Agent, Workflow, Rate Limiter, Twilio)
- Components configured correctly in `convex.config.ts`

---

## ❌ Critical Violations

### 1. Using `api` Instead of `internal` in Internal Contexts ❌

**Violation:** Calling public functions (`api.*`) from internal contexts

**Locations:**
- `convex/agents.ts:471` - `api.assessments.getActiveSession` (should be `internal.assessments.getActiveSession`)
- `convex/inbound.ts:125` - `api.agents.runMainAgent` (should be `internal.agents.runMainAgent`)
- `convex/inboundHelpers.ts:42,60` - `api.assessments.getAnyActiveSession` (should be `internal`)
- `convex/workflows.ts:722` - `api.public.listMemories` (should be `internal.public.listMemories`)
- `convex/tools.ts:28,67,191` - Multiple `api.*` calls
- `convex/assessments.ts:278,289,299,321` - Multiple `api.*` calls

**Why This Matters:**
- Public functions can be called by anyone, including attackers
- Internal functions can only be called within Convex (safer)
- Reduces attack surface

**Fix:**
- Create `internal` versions of these functions OR
- Make existing functions `internal` if they're only used internally OR
- Create helper functions that can be called from both

**Priority:** 🔴 **HIGH** - Security & best practice violation

---

### 2. Unawaited Promises (Fire-and-Forget Pattern) ⚠️

**Violation:** Using `void` or `.catch()` without proper handling

**Locations:**
- `convex/assessments.ts:225,248` - `void ctx.scheduler.runAfter(...)`
- `convex/resources.ts:330` - `void ctx.runMutation(...)`
- `convex/agents.ts:149,299,416,433,570` - `.catch()` patterns (acceptable if intentional)
- `convex/inbound.ts:41` - `.catch()` pattern

**Why This Matters:**
- Unawaited promises can fail silently
- Hard to debug when background operations fail
- Convex recommends `no-floating-promises` ESLint rule

**Current Pattern (Acceptable):**
```typescript
// Intentional fire-and-forget with error handling
ctx.runMutation(...).catch((err) => console.error('Failed:', err));
```

**Problematic Pattern:**
```typescript
// No error handling - failures are silent
void ctx.scheduler.runAfter(0, internal.workflows.suggestInterventions, {...});
```

**Fix:**
- Add `.catch()` handlers to all `void` scheduler calls
- Document intentional fire-and-forget patterns
- Consider using helper function for consistent error handling

**Priority:** 🟡 **MEDIUM** - Code quality issue, but patterns are intentional

---

### 3. Using `.filter()` on Database Queries ❌

**Violation:** Using `.filter()` instead of indexes or code filtering

**Locations:**
- `convex/assessments.ts:35,91,136,179` - `.filter((q) => q.eq(q.field('status'), 'active'))`
- `convex/internal.ts:122,139` - `.filter((q) => q.eq(q.field('status'), 'active'))`
- `convex/workflows.ts:127,256,577,830` - Multiple `.filter()` uses

**Why This Matters:**
- `.filter()` on queries has same performance as filtering in code
- Should use `.withIndex()` for better performance OR filter in TypeScript code
- Indexes are more efficient for large datasets

**Example Violation:**
```typescript
// ❌ Current
const sessions = await ctx.db
  .query('assessment_sessions')
  .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
  .filter((q) => q.eq(q.field('status'), 'active'))
  .take(10);
```

**Fix Options:**

**Option 1: Add status to index (Best)**
```typescript
// schema.ts
.index('by_user_definition_status', ['userId', 'definitionId', 'status'])

// Usage
const sessions = await ctx.db
  .query('assessment_sessions')
  .withIndex('by_user_definition_status', (q) => 
    q.eq('userId', user._id)
     .eq('definitionId', definition)
     .eq('status', 'active')
  )
  .take(10);
```

**Option 2: Filter in code (Simpler)**
```typescript
const sessions = await ctx.db
  .query('assessment_sessions')
  .withIndex('by_user_definition', (q) => q.eq('userId', user._id).eq('definitionId', definition))
  .collect();
const activeSessions = sessions.filter(s => s.status === 'active').slice(0, 10);
```

**Priority:** 🟡 **MEDIUM** - Performance issue, but current queries are small

---

## 🟡 Medium Priority Issues

### 4. Using `.collect()` on Potentially Large Datasets ⚠️

**Violation:** `.collect()` without limits on potentially unbounded queries

**Locations:**
- `convex/internal.ts:102` - `ctx.db.query('users').collect()` - Could be thousands of users
- `convex/workflows.ts:200` - `ctx.db.query('users').collect()` - Same issue
- `convex/workflows.ts:128,262,333,382` - Other `.collect()` calls

**Why This Matters:**
- All results count towards database bandwidth
- If any document changes, query re-runs
- Can cause performance issues as data grows

**Example:**
```typescript
// ❌ Current - potentially unbounded
export const getAllUsers = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});
```

**Fix Options:**

**Option 1: Use pagination**
```typescript
export const getAllUsers = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db.query('users').paginate(paginationOpts);
  },
});
```

**Option 2: Use limit**
```typescript
export const getAllUsers = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('users').take(1000); // Reasonable limit
  },
});
```

**Option 3: Denormalize (for counts)**
```typescript
// If only need count, store in separate table
const userCount = await ctx.db.query('user_counts').first();
```

**Priority:** 🟡 **MEDIUM** - Performance issue, but currently manageable

---

### 5. Sequential `ctx.runQuery` / `ctx.runMutation` Calls ⚠️

**Violation:** Multiple sequential calls that could be combined

**Locations:**
- `convex/inboundHelpers.ts:23-43` - Multiple queries in `Promise.all` (✅ Good!)
- `convex/inboundHelpers.ts:60` - Sequential query after `Promise.all` (could be combined)
- `convex/workflows.ts:157-182` - Sequential queries in loop

**Why This Matters:**
- Each call runs in separate transaction
- Results may not be consistent with each other
- Better to combine into single query/mutation

**Example:**
```typescript
// ⚠️ Current - two separate queries
const [seen, rateLimitCheck, userResult, activeSession] = await Promise.all([...]);
// Later...
const activeSessionCorrected = await ctx.runQuery(api.assessments.getAnyActiveSession, {
  userId: user.externalId,
});
```

**Fix:**
- Combine into single query that returns all needed data
- Or ensure queries are truly independent (current pattern is acceptable if they are)

**Priority:** 🟡 **MEDIUM** - Consistency issue, but current pattern is acceptable

---

### 6. Access Control on Public Functions ⚠️

**Violation:** Some public functions may lack proper access control

**Locations:**
- `convex/public.ts:16` - `getByExternalIdQuery` - No auth check, accepts any `externalId`
- `convex/public.ts:32` - `recordMemory` - Accepts `userId`, no verification
- `convex/public.ts:59` - `listMemories` - Accepts `userId`, no verification

**Why This Matters:**
- Public functions can be called by anyone
- Without access control, users could access/modify other users' data
- Security vulnerability

**Current Pattern:**
```typescript
// ❌ No access control
export const listMemories = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Anyone can query any userId!
    return await ctx.db.query('memories')
      .withIndex('by_user_category', (q) => q.eq('userId', userId))
      .collect();
  },
});
```

**Fix Options:**

**Option 1: Add auth check (if web users)**
```typescript
export const listMemories = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error('Unauthorized');
    }
    // Verify userId matches authenticated user
    const user = await getByExternalId(ctx, userId);
    if (user?.email !== identity.email) {
      throw new Error('Unauthorized');
    }
    // ... rest of logic
  },
});
```

**Option 2: Make internal (if only used internally)**
```typescript
// If only called from internal functions, make it internal
export const listMemories = internalQuery({...});
```

**Option 3: Phone-based auth (if SMS-only)**
```typescript
// For SMS users, userId = phone number
// Caller must know phone number (acceptable for SMS-only app)
// But still add rate limiting
```

**Priority:** 🔴 **HIGH** - Security issue, but may be acceptable for SMS-only app

---

### 7. Using `ctx.runAction` When Not Needed ⚠️

**Violation:** Calling `runAction` when plain TypeScript function would work

**Locations:**
- `convex/inbound.ts:67,74,114,125,140` - Multiple `ctx.runAction` calls
- `convex/tools.ts:28` - `ctx.runAction(api.resources.searchResources, ...)`

**Why This Matters:**
- `runAction` has overhead (extra function call, memory, CPU)
- Should only use when calling code in different runtime (Node.js vs Convex)
- Most of these could be plain TypeScript functions

**Example:**
```typescript
// ⚠️ Current - using runAction
const result = await ctx.runAction(internal.assessments.handleInboundAnswer, {
  userId: user.externalId,
  definition: context.activeSession.definitionId,
  text: args.text,
});
```

**Fix:**
- Check if called function uses "use node" directive
- If not, convert to plain TypeScript helper function
- Only use `runAction` for Node.js-specific code

**Priority:** 🟡 **MEDIUM** - Performance issue, but acceptable if functions need Node.js runtime

---

## 🟢 Low Priority Issues

### 8. Using `ctx.runQuery` / `ctx.runMutation` in Queries/Mutations ⚠️

**Violation:** Using `ctx.runQuery`/`ctx.runMutation` when plain TypeScript function would work

**Locations:**
- Various locations - but many are using components (✅ acceptable exception)

**Why This Matters:**
- Extra overhead compared to plain TypeScript functions
- But acceptable when using components or needing partial rollback

**Current Usage:**
- Most uses are for components (✅ acceptable)
- Some could be converted to helpers

**Priority:** 🟢 **LOW** - Code quality, but acceptable patterns

---

### 9. Helper Function Organization 🟢

**Status:** ✅ **GOOD** - We have helper functions, but could improve organization

**Current:**
- Helpers in `lib/utils.ts` (good)
- Some duplication across files (acceptable)

**Recommendation:**
- Consider `lib/model/` directory for domain-specific helpers
- Keep `lib/utils.ts` for truly generic utilities

**Priority:** 🟢 **LOW** - Code organization, not a violation

---

## Summary Table

| Best Practice | Status | Violations | Priority |
|-------------|--------|------------|----------|
| Await all Promises | 🟡 Partial | `void ctx.scheduler` (2 locations) | Medium |
| Avoid .filter on queries | ❌ Violation | 10 locations | Medium |
| Only .collect() small results | ⚠️ Warning | `getAllUsers` (2 locations) | Medium |
| Use internal, not api | ❌ Violation | 11 locations | **HIGH** |
| Access control | ⚠️ Warning | `public.ts` functions | **HIGH** |
| Use runAction sparingly | ⚠️ Warning | Multiple locations | Medium |
| Sequential ctx.run* | 🟡 Partial | Some locations | Medium |
| Argument validators | ✅ Good | None | - |
| Redundant indexes | ✅ Good | None | - |
| Helper functions | ✅ Good | Minor improvements | Low |

---

## Recommended Fixes (Priority Order)

### Phase 1: Security & Critical Issues (HIGH Priority)

1. **Replace `api.*` with `internal.*`** (11 locations)
   - Create internal versions of functions OR
   - Make functions internal if only used internally
   - **Impact:** Reduces attack surface, follows best practices

2. **Add Access Control to Public Functions** (3 functions)
   - Add auth checks OR make functions internal OR
   - Document phone-based auth pattern for SMS-only app
   - **Impact:** Prevents unauthorized access

### Phase 2: Performance & Code Quality (MEDIUM Priority)

3. **Fix `.filter()` Usage** (10 locations)
   - Add `status` to indexes OR filter in TypeScript code
   - **Impact:** Better query performance

4. **Fix Unawaited Promises** (2 locations)
   - Add `.catch()` handlers to `void ctx.scheduler` calls
   - **Impact:** Better error visibility

5. **Limit `.collect()` Usage** (2 locations)
   - Add pagination or limits to `getAllUsers`
   - **Impact:** Better scalability

6. **Optimize Sequential Queries** (1-2 locations)
   - Combine queries where possible
   - **Impact:** Better consistency

### Phase 3: Code Organization (LOW Priority)

7. **Review `runAction` Usage**
   - Convert to helpers where not needed
   - **Impact:** Minor performance improvement

---

## Alignment Score

**Overall:** 🟡 **75% Compliant**

- ✅ **Excellent:** Argument validators, TypeScript, helper functions, component usage
- 🟡 **Good:** Promise handling (mostly), query patterns (mostly)
- ❌ **Needs Work:** Using `api` instead of `internal`, access control, `.filter()` usage

---

## Next Steps

1. **Immediate:** Fix `api.*` → `internal.*` violations (security)
2. **Short-term:** Add access control to public functions
3. **Medium-term:** Fix `.filter()` and `.collect()` issues
4. **Long-term:** Optimize `runAction` usage and query patterns

