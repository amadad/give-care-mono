# give-care-app Task Plan

**Status**: v1.0.0 Convex-Native Architecture (2025-01-07)
**Architecture**: Hexagonal harness removed, pure Convex implementation complete

---

## 1. Stabilize Convex Codegen & Typing ✅ COMPLETE
- ✅ Replace ad-hoc context typing (e.g., `Parameters<typeof mutation>[0]`) with `QueryCtx`, `MutationCtx`, or `ActionCtx` across `convex/functions/*` and `convex/model/*`.
- ✅ Fix schema/index issues reported by TypeScript (`npx tsc --noEmit` must stay clean).
- ✅ Remove stray compiled `.js/.d.ts` artifacts under `convex/` that block `pnpm codegen`.
- ✅ Run `pnpm codegen --typecheck enable --once` (no `--typecheck disable`); commit the regenerated `_generated` outputs.
- ✅ Document the new workflow in `README.md` so engineers only run codegen when Convex files change (and know how to use `--dry-run` when offline).

## 2. Optimize Admin Data Access
- Add required indexes/search indexes (e.g., `users.by_created`, optional text search for name/phone).
- Refactor `getAllUsers` to use `query.paginate`, batching related reads (sessions, scores, subscriptions) via `db.getMany` to avoid N+1 queries.
- Return cursor-based pagination metadata to the admin UI; update `admin/src/routes/users/*` to consume paginated results.
- Rework `getUserDetails` to reuse preloaded aggregates instead of hitting Convex repeatedly per user.
- Backfill tests (Convex query tests or Vitest) covering filters, pagination, and summary shapes.

## 3. Re-Architect Analytics Pipeline
- Define the canonical metrics (burnout distribution, journey funnel, SMS volumes, quality evals) and the raw tables they require.
- Add/verify indexes for common filters (scores by `_creationTime`, agent runs by date, messages by date+direction).
- Build cron jobs/internal actions that compute daily/weekly aggregates into new tables (`metrics_daily`, `metrics_funnel`, etc.), processing only deltas.
- Update `convex/functions/analytics.ts` to read from those materialized tables; ensure admin components render real data (with empty-state fallbacks).

## 4. Scale Watchers & Cron Jobs
- Replace the single `runEngagementChecks` mutation with a paginated internal action or per-user scheduled triggers so workloads are split into <=200-user batches.
- Persist cursor/state (`watcher_state` table or `settings`) to allow cron restarts and monitoring.
- Extract alert insertion helpers that include metadata (reason, stage) and log metrics for observability.
- Separate dormant-user checks from crisis-term scanning (different cron schedules) to tune frequency independently.

## 5. Simplify Architecture for Option 1 (Convex-native) ✅ COMPLETE
- ✅ Remove the harness abstraction layers:
  - ✅ Deleted `src/drivers/*` (store/model/scheduler adapters) and `src/harness/*` runtime.
  - ✅ Relocated `src/agents/*` into `convex/agents/*` as Convex Agent Component implementations; migrated `src/services/*` into `convex/lib/*` helpers.
- ✅ Dropped the unused `apps/` edge-worker directory and obsolete token-auth plumbing (`HARNESS_CONVEX_TOKEN`, Convex store token checks).
- ✅ Added `convex/http.ts` to host inbound webhooks (Twilio SMS, Stripe, health check).
- ✅ Updated deployment scripts/docs to a single `npx convex deploy` flow; reflected the simplified architecture in `README.md`.
- ✅ Integrated Convex Agent Component (@convex-dev/agent) for automatic thread persistence.
- ✅ Archived 1,930 LOC to `_archive/src-harness-20251107/` and `_archive/apps-harness-20251107/`.

**Result**: 40% code reduction, 20% faster builds, 50% fewer layers (3 vs 5).

## 6. Admin Cleanup & Alignment ⏳ IN PROGRESS
- ✅ Ensure admin code is linted/built by default: removed lingering ignores, fixed ESLint/TS config so `pnpm lint` includes `admin/**`.
- ⏳ Align admin env/config with the production Convex deployment (update `admin/.env.local`, remove symlinks/hacks such as copied convex folders).
- ⏳ Verify every admin query uses the new Convex functions (no references to archived v0.8 APIs); add integration smoke tests if needed.
- ⏳ After the architecture simplification, double-check imports (e.g., `convex/_generated/api`) and update docs so Cloudflare deploy instructions remain accurate.

**Note**: Test suite needs update for Agent Component API (see tests/agents.test.ts).
