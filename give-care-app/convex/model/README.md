Model Layer

Purpose

- Hold business logic in plain TypeScript functions that receive Convex contexts (QueryCtx, MutationCtx, ActionCtx).
- Keep functions/* thin: validate args, apply access control, and delegate to model.
- Improve testability and reuse without crossing function boundaries unnecessarily.

Guidelines

- No public API here. Model functions are imported by functions/* and actions/* only.
- Accept the minimal Convex ctx needed (QueryCtx for reads, MutationCtx for writes, ActionCtx for Node-only work).
- Avoid runAction/runQuery unless you need a different runtime or component; prefer direct DB access with the ctx provided.
- Index-first and bounded reads (.withIndex + .take/.paginate). Avoid unbounded .collect for large sets.

Current Modules

- conversations.ts: insert, insertBatch, recent
- resources.ts: findResourcesInternal (scoring + lookups)
- analytics.ts: admin analytics helpers (charts, trends, feedback)
- admin.ts: admin dashboard helpers (metrics, user listings)
- wellness.ts: wellness score reads and writes

