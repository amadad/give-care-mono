# Convex Playbook for GiveCare Agents

Use this file as the authoritative checklist whenever you touch anything under `convex/` or the admin dashboard. Keep changes incremental, deterministic, and production-safe.

---

## 1. Mission & Principles

1. **Stay Convex-native.** All backend logic (agents, services, schedulers, webhooks) belongs under `convex/`. Avoid bespoke drivers/harness layers.
2. **Indexes before features.** Refuse to ship a query/mutation if it cannot rely on an index or search index. Convex enforces serializable transactions—your code must respect that cost profile.
3. **Queries read, mutations write, actions integrate.** Never mix responsibilities. Deterministic code inside queries/mutations only; external calls live in actions that re-use internal queries/mutations.
4. **Short, observable crons.** Any background job must process in <15s chunks, persist cursors, and emit metrics/logs.
5. **Regenerate types on backend change.** `pnpm codegen --typecheck enable --once` is required after editing schema or functions. Commit `_generated/*` updates.

---

## 2. Folder Map

| Path | Purpose |
| --- | --- |
| `convex/schema.ts` | Tables, indexes, validators. Keep comments for non-obvious indexes. |
| `convex/functions/*.ts` | Public/internal queries & mutations. One responsibility per file (e.g., `admin.ts`, `analytics.ts`). |
| `convex/internal/*.ts` | Internal-only helpers invoked by crons/actions. |
| `convex/agents/*` *(planned)* | Stateful agent/action logic once Option 1 simplification lands. |
| `convex/http.ts` *(planned)* | HTTP router for webhooks (Stripe, Twilio, etc.). |
| `docs/convex.md` | This playbook. Update whenever process changes. |

---

## 3. Authoring Queries & Mutations

1. **Use type-safe contexts.** Import `QueryCtx`, `MutationCtx`, or `ActionCtx` from `_generated/server`. Never rely on `Parameters<typeof query>[0]`.
2. **Validate inputs.** Every exported function defines `args:` with `convex/values` validators. Keep optional props explicit.
3. **Index discipline.** Before using `.withIndex('by_field', ...)`, confirm the index exists in `schema.ts`. If not, add it with a comment describing the access pattern.
4. **Batch related reads.** Prefer `ctx.db.getMany()` / `Promise.all` over per-item queries. For admin dashboards, aggregate upstream rather than fan-out in React.
5. **Pagination:**
   ```ts
   const page = await ctx.db
     .query('users')
     .withIndex('by_created', (q) => q.gt('_creationTime', cursor ?? 0))
     .paginate({ limit: 50 });
   ```
   Return `{ page, continueCursor }` to clients.
6. **Derived data:** For expensive analytics, write cron-generated tables (see §5) and query those.

---

## 4. Actions, Scheduling, Cron Jobs

1. **Actions** (`action({})`) may call APIs/LLMs. They must delegate DB work to queries/mutations.
2. **Scheduler:** Use `ctx.scheduler.runAfter` for per-user follow-ups, not long loops. Payloads should include cursors/ids only.
3. **Cron jobs (`convex/crons.ts`):**
   - Invoke internal actions via `internal['functions/myFile'].myFunc`.
   - Jobs must chunk work (≤200 records) and persist progress (e.g., `settings` table or `watcher_state`).
   - Emit structured logs (`ctx.log.info`) for observability.
4. **Watchers example pattern:**
   ```ts
   export const processBatch = internalAction({
     args: { cursor: v.optional(v.id('users')), limit: v.number() },
     handler: async (ctx, { cursor, limit }) => {
       const page = await ctx.db.query('users')
         .withIndex('by_created')
         .gte(cursor ? ['_id', cursor] : undefined)
         .take(limit);
       // ...process...
       await ctx.db.insert('watcher_state', { cursor: page.at(-1)?._id });
     },
   });
   ```

---

## 5. Analytics & Materialized Metrics

1. **Define target metrics** (burnout distribution, journey funnel, SMS volume, evaluation scores).
2. **Add supporting indexes** (`scores.by_user_created`, `messages.by_direction_created`, `agent_runs.by_created`).
3. **Cron aggregation flow:**
   ```ts
   crons.daily('aggregate-metrics', internal['functions/analytics'].computeDaily);
   ```
4. **Persist results** in dedicated tables (`metrics_daily`, `metrics_funnel`, etc.) with schema comments.
5. **Expose read-only queries** that simply fetch aggregations, optionally filtered by date range.

---

## 6. Codegen & Tooling Workflow

1. **When to run:** only after editing `convex/schema.ts`, files under `convex/functions/` or `convex/internal/`.
2. **Command:** `pnpm codegen --typecheck enable --once`. If connectivity is blocked, use `--dry-run` but rerun fully before merging.
3. **Outputs:** Always commit changes under `convex/_generated/*`.
4. **Docs:** Add/change steps in `README.md` if the workflow evolves.

---

## 7. Testing & Validation

1. **TypeScript:** `npx tsc --noEmit` must pass. Do not rely on `--typecheck disable`.
2. **Lint:** `pnpm lint` now includes `admin/**`. Fix warnings, don’t ignore directories.
3. **Convex query tests:** optional but encouraged; use `convex test` or simple harness that imports functions and mocks `ctx`.
4. **Admin smoke tests:** After API changes, run `pnpm --filter give-care-admin-dashboard dev` and verify dashboards load.

---

## 8. Deployment & Environments

1. **Env files:**
   - `.env.local` → dev deployment (`CONVEX_DEPLOYMENT=dev:...`).
   - `.env.prod.local` → production (`prod:...`).
   - Admin’s `.env.local` must point to the same Convex URL/token.
2. **Deploy flow:**
   ```bash
   pnpm lint && pnpm test
   pnpm codegen --typecheck enable --once
   npx convex deploy
   ```
3. **Cloudflare Pages (admin):** relies on checked-in `_generated` files and `VITE_CONVEX_URL`. Ensure `scripts/setup-convex.js` stays accurate.

---

## 9. Common Pitfalls & Mitigations

| Pitfall | Mitigation |
| --- | --- |
| Loading entire tables (e.g., `ctx.db.query('users').collect()`) | Use indexes + pagination; never `collect()` unless the table is guaranteed small. |
| Long-running crons/mutations | Chunk workloads, store cursors, prefer scheduler triggers. |
| Forgetting to regenerate `_generated` types | Add a git hook or CI check comparing `git status` after `pnpm codegen`. |
| Mixing action logic into mutations | Keep network calls outside database transactions; use actions. |
| Analytics derived on-the-fly | Build materialized tables from crons to keep admin latency low. |

---

## 10. Contribution Checklist

Before merging any Convex-related change:

1. ✅ Added/updated indexes and comments in `schema.ts`.
2. ✅ Queries/mutations paginated and batched.
3. ✅ Actions/crons chunked and stateful as needed.
4. ✅ `pnpm lint`, `npx tsc --noEmit`, and `pnpm codegen --typecheck enable --once` all pass.
5. ✅ Admin tested against updated API (if applicable).
6. ✅ Documentation updated (this file or `README.md`).

Keep this document up to date—future agents rely on it.
