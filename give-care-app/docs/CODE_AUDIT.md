# Convex Codebase Audit Report
**Date:** 2025-01-10  
**Scope:** All Convex functions, tools, workflows, and utilities

---

## 🔴 CRITICAL ISSUES

### 1. **N+1 Query Pattern in `wellness.ts`**
**Location:** `convex/wellness.ts:70-81`  
**Issue:** Sequential `await ctx.db.get()` calls inside a loop  
**Impact:** High latency, poor scalability  
```typescript
for (const score of scoreDocs) {
  const assessment = await ctx.db.get(score.assessmentId); // N+1!
  // ...
}
```
**Fix:** Batch fetch assessments or use a join pattern

### 2. **Full Table Scan in `interventions.ts`**
**Location:** `convex/interventions.ts:22`  
**Issue:** `collect()` without limit loads entire table  
**Impact:** Memory issues at scale, slow queries  
```typescript
const interventions = await ctx.db.query('interventions').collect();
```
**Fix:** Add pagination or limit, consider materialized view

### 3. **Redundant User Lookup in `getOrCreateThread`**
**Location:** `convex/inbound.ts:109-122`  
**Issue:** Queries user even though already fetched in `processInbound`  
**Impact:** Unnecessary database roundtrip (~10-50ms)  
**Fix:** Pass user object directly instead of re-querying

### 4. **Bug in Crisis Workflow: Wrong ID Type**
**Location:** `convex/workflows/crisis.ts:177-179`  
**Issue:** Calls `getByExternalIdQuery` with `userId.toString()` but expects `externalId`  
**Impact:** Crisis workflow fails silently  
```typescript
const user = await ctx.runQuery(internal.internal.getByExternalIdQuery, {
  externalId: args.userId.toString(), // ❌ Wrong! userId is Id<"users">, not externalId
});
```
**Fix:** Use `getUserById` instead

### 5. **Redundant User Lookups in Memory Mutations**
**Location:** `convex/workflows/memoryMutations.ts:20-23, 49-52`  
**Issue:** Both mutations query user by externalId when userId already available  
**Impact:** Unnecessary queries  
**Fix:** Accept `userId: Id<"users">` directly

---

## 🟡 PERFORMANCE ISSUES

### 6. **Inefficient Memory Query**
**Location:** `convex/public.ts:70-73`  
**Issue:** Fetches all memories then sorts in memory  
**Impact:** Loads unnecessary data  
```typescript
const memories = await ctx.db.query('memories')
  .withIndex('by_user_category', (q) => q.eq('userId', user._id))
  .collect(); // ❌ Loads all, then sorts
```
**Fix:** Add composite index on `(userId, importance, _creationTime)` or use `.order()`

### 7. **Unused Variable: `threadMetadata`**
**Location:** `convex/agents/main.ts:127-133`  
**Issue:** Variable defined but never used  
**Impact:** Dead code, confusion  
**Fix:** Remove or use it

### 8. **Missing Limit on Assessment Sessions Query**
**Location:** `convex/assessments.ts:27-30`  
**Issue:** `collect()` without limit could load many sessions  
**Impact:** Memory issues for users with many sessions  
**Fix:** Add `.take(1)` or `.first()` since only checking for active

### 9. **Inefficient Metadata Merging**
**Location:** Multiple files  
**Issue:** Repeated pattern of `(metadata ?? {}) as Record<string, unknown>`  
**Impact:** Code duplication, potential for bugs  
**Fix:** Create helper function `getMetadata(user)`

### 10. **Stub Data in Production Code**
**Location:** `convex/resources.ts:48-76`  
**Issue:** `buildStubResults()` returns fake data  
**Impact:** Users get fake resource listings  
**Fix:** Integrate real Google Maps API or remove feature

---

## 🟠 TYPE SAFETY ISSUES

### 11. **Excessive `any` Types (506 instances!)**
**Locations:** Throughout codebase  
**Issue:** Heavy use of `any` defeats TypeScript safety  
**Impact:** Runtime errors, harder refactoring  
**Key Files:**
- `convex/lib/profile.ts:5,13,20` - All functions use `any`
- `convex/lib/policy.ts:38` - `getTone(context: any)`
- `convex/workflows/memoryActions.ts:22,29,83` - Array types use `any`
- `convex/agents/main.ts:70` - `metadata: v.optional(v.any())`

**Fix:** Define proper types:
```typescript
type UserMetadata = {
  profile?: Profile;
  enrichedContext?: string;
  convex?: { userId: Id<"users"> };
  // ...
};
```

### 12. **Type Suppressions with `@ts-expect-error`**
**Location:** `convex/tools/updateProfile.ts:27`, `convex/tools/searchResources.ts:19`  
**Issue:** Suppressing type errors instead of fixing  
**Impact:** Hides real type issues  
**Fix:** Properly type `ctx.metadata` in Agent tool context

### 13. **Unsafe Type Casting**
**Location:** `convex/tools/updateProfile.ts:44`  
**Issue:** `convexUserId as any` bypasses type checking  
**Impact:** Runtime errors possible  
**Fix:** Validate type or use proper type guard

### 14. **Missing Type for `ctx: any`**
**Location:** `convex/inbound.ts:110`  
**Issue:** Function parameter uses `any`  
**Impact:** No type safety  
**Fix:** Use proper `ActionCtx` type

---

## 🔵 CODE DUPLICATION

### 15. **Repeated User Lookup Pattern**
**Locations:** `convex/lib/core.ts`, `convex/public.ts`, `convex/workflows/memoryMutations.ts`, etc.  
**Issue:** `getByExternalId` called repeatedly with same pattern  
**Impact:** Code duplication, harder maintenance  
**Fix:** Create wrapper that handles null checks consistently

### 16. **Duplicate Metadata Extraction**
**Locations:** `convex/agents/main.ts:93-94`, `convex/inbound.ts:37`, `convex/tools/updateProfile.ts:29-30`  
**Issue:** Same pattern repeated: `(metadata ?? {}) as Record<string, unknown>`  
**Fix:** Helper function `extractMetadata(user)`

### 17. **Duplicate Context Building**
**Locations:** `convex/inbound.ts:38-54`, `convex/agents/crisis.ts:88-90`  
**Issue:** Similar context object construction  
**Fix:** Shared `buildAgentContext(user, metadata, crisisDetection)` function

### 18. **Two Similar Intervention Tools**
**Locations:** `convex/tools/findInterventions.ts`, `convex/tools/getInterventions.ts`  
**Issue:** Nearly identical functionality  
**Impact:** Confusion, maintenance burden  
**Fix:** Merge into single tool with optional zones parameter

---

## 🟢 ANTI-PATTERNS

### 19. **Empty Cron Jobs File**
**Location:** `convex/crons.ts`  
**Issue:** File exists but has no jobs (TODO comments only)  
**Impact:** Unclear if intentional or incomplete  
**Fix:** Either implement jobs or document why empty

### 20. **Inconsistent Error Handling**
**Locations:** Various  
**Issue:** Some functions throw, others return `{ error }`, others return `null`  
**Examples:**
- `convex/assessments.ts:23` - throws
- `convex/public.ts:42` - throws  
- `convex/public.ts:67` - returns `[]`
- `convex/tools/*.ts` - return `{ error }`

**Fix:** Standardize error handling pattern

### 21. **Missing Error Boundaries**
**Location:** `convex/agents/main.ts:194`  
**Issue:** `workflow.start()` not awaited, errors silently swallowed  
**Impact:** Memory enrichment failures go unnoticed  
**Fix:** Add error handling or await with try/catch

### 22. **Inconsistent Null Handling**
**Locations:** Various  
**Issue:** Mix of `??`, `||`, and explicit checks  
**Examples:**
- `convex/lib/profile.ts:7` - `profile?.firstName || 'there'`
- `convex/lib/profile.ts:8` - `profile?.relationship || 'caregiver'`
- `convex/inbound.ts:41` - `user.consent ?? { emergency: false, marketing: false }`

**Fix:** Standardize on `??` for nullish coalescing

### 23. **Magic Numbers**
**Location:** `convex/resources.ts:120`  
**Issue:** `ttlDays * 24 * 60 * 60 * 1000` - unclear calculation  
**Fix:** Extract constant: `const MS_PER_DAY = 24 * 60 * 60 * 1000`

### 24. **Hardcoded Fallback Values**
**Location:** `convex/tools/findInterventions.ts:31`  
**Issue:** `['emotional', 'physical']` hardcoded fallback  
**Fix:** Extract to constant or config

---

## 🔷 BLOAT & DEAD CODE

### 25. **Unused Function: `getProfileCompleteness`**
**Location:** `convex/lib/profile.ts:13-18`  
**Issue:** Function defined but never called  
**Impact:** Dead code  
**Fix:** Remove or use it

### 26. **Unused Function: `buildWellnessInfo`**
**Location:** `convex/lib/profile.ts:20-24`  
**Issue:** Returns empty string, called but does nothing  
**Impact:** Confusing code  
**Fix:** Implement or remove

### 27. **Commented Out Code Pattern**
**Location:** `convex/inbound.ts:106-108`  
**Issue:** Comment says "For now, create new thread each time" but function does query  
**Impact:** Misleading comments  
**Fix:** Update comment or simplify function

### 28. **Redundant Index Usage**
**Location:** `convex/public.ts:72`  
**Issue:** Uses `by_user_category` index but doesn't filter by category  
**Impact:** Inefficient index usage  
**Fix:** Use `by_user` index or add category filter

---

## 📊 METRICS SUMMARY

| Category | Count | Severity |
|----------|-------|----------|
| Critical Issues | 5 | 🔴 |
| Performance Issues | 6 | 🟡 |
| Type Safety Issues | 4 | 🟠 |
| Code Duplication | 4 | 🔵 |
| Anti-patterns | 6 | 🟢 |
| Bloat/Dead Code | 4 | 🔷 |
| **TOTAL** | **29** | |

---

## 🎯 PRIORITY FIXES

### P0 (Critical - Fix Immediately)
1. Fix N+1 query in `wellness.ts`
2. Fix crisis workflow bug (wrong ID type)
3. Remove full table scan in `interventions.ts`
4. Fix redundant user lookups

### P1 (High - Fix Soon)
5. Add proper TypeScript types (reduce `any` usage)
6. Fix memory query inefficiency
7. Standardize error handling
8. Merge duplicate intervention tools

### P2 (Medium - Fix When Convenient)
9. Remove dead code
10. Extract helper functions for common patterns
11. Add missing limits to queries
12. Fix stub data issue

---

## 💡 RECOMMENDATIONS

1. **Add Query Limits Everywhere**: Always use `.take()` or `.first()` instead of `.collect()`
2. **Type Safety First**: Replace all `any` with proper types
3. **Batch Operations**: Use `Promise.all()` for parallel queries
4. **Index Optimization**: Review all queries and ensure proper indexes
5. **Error Handling Standard**: Pick one pattern and use consistently
6. **Code Review Checklist**: Add these patterns to prevent regressions

---

**Next Steps:**
1. Create tickets for P0 issues
2. Set up linting rules to catch `any` types
3. Add query performance monitoring
4. Refactor common patterns into shared utilities

