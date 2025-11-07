# Harness Architecture

- **Harness loop** (`packages/harness/index.ts`) hydrates context, evaluates policy pre-checks, selects the right agent, enforces per-agent budgets, streams responses, and performs post-evaluations.
- **Drivers** (`packages/drivers/**`) abstract model, store, and scheduler providers. Default bindings use the OpenAI Agents SDK and Convex, but any provider can implement the same interface.
- **Policy as data** (`packages/policy`) stores YAML bundles for trauma-informed, crisis, and throttling rules. A safe expression evaluator compiles them to predicates.
- **Agents** (`packages/agents`) are thin wrappers (main, assessment, crisis) that defer domain logic to services and read tone/routing instructions from policy data.
- **Capabilities** (`packages/capabilities`) define Zod-validated tool contracts and register metadata such as consent, cost hints, and rate limits.
- **Services** (`packages/services`) contain deterministic logic for assessment scoring, scheduling, interventions, billing, and memory, all tested independently.
- **Observability** hooks are centralized in `packages/shared/tracing.ts`, emitting structured events for policy decisions, agent runs, tool usage, budgets, and crisis escalations.
- **Apps** (`apps/edge-sms`, `apps/edge-web`) are channel adapters that verify signatures, rate limit ingress, and invoke the harness.
- **Convex backend** (`harness/convex`) defines schema + functions following Convex best practices (argument validators, index-backed queries, helper modules). Harness drivers speak to these functions over admin-authenticated mutations so data hydration, persistence, and logging share a single source of truth.
