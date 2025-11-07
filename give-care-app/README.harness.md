# GiveCare Harness

This package contains the thin agent harness, drivers, policies, and services required to run the next-generation GiveCare runtime without regressing user experience.

## Layout

```
/harness
  /apps          # Channel adapters (SMS, web)
  /packages
    /agents      # Main/assessment/crisis wrappers
    /capabilities # Tool contracts + registry metadata
    /drivers     # Vendor bindings (model/store/scheduler)
    /harness     # Orchestrator loop, budgets, runtime wiring
    /policy      # Policy bundles + evaluator + loader
    /services    # Pure domain logic
    /shared      # Types, tracing, utilities
  /tests
    /golden      # Transcript parity fixtures
    /deterministic # Service + policy unit tests
    /contract    # Capability contract tests
  /docs          # Architecture + metrics references
```

The harness keeps OpenAI Agents SDK and Convex behind driver interfaces so you can deliver the lean architecture now and swap providers later. Golden transcript tests plus staged rollout protect tone, crisis handling, and assessment accuracy.

## Getting started

1. `cd give-care-app/harness`
2. `pnpm install`
3. `pnpm test` to run golden + deterministic suites.

## Wiring providers

- Update `packages/harness/runtime.ts` to bind alternative `model`, `store`, or `scheduler` drivers.
- Implement the Convex driver stubs with real queries/mutations in `packages/drivers/store/convex.store.ts`.
- Replace `packages/drivers/model/oai.driver.ts` with OpenAI Agents SDK calls (or any other provider) without touching agents or services.

### Convex harness backend

The folder `harness/convex` is a standalone Convex project that mirrors the normalized tables, indexes, and helper modules the harness needs. Every public function:

- Validates arguments with `convex/values`.
- Enforces access via the shared `requireHarnessToken` helper (set `HARNESS_API_TOKEN` in your Convex env).
- Delegates real logic to `model/*` helpers so queries/mutations stay thin wrappers.
- Uses index-backed queries (`withIndex`, `.take`) instead of `.filter/.collect` over unbounded sets.

To hook the runtime to Convex:

1. Deploy the Convex project from `harness/convex` (`pnpm --filter @givecare/harness-convex convex deploy`).
2. Set `HARNESS_CONVEX_URL` (e.g. `https://YOUR-DEPLOYMENT.convex.cloud`) and `HARNESS_CONVEX_TOKEN` in the harness process.
3. Set the same token value as `HARNESS_API_TOKEN` in Convex so the functions can authenticate harness calls.

### OpenAI Agents SDK

The model driver (`packages/drivers/model/oai.driver.ts`) speaks to OpenAI’s Agents SDK. Configure it with:

- `HARNESS_OPENAI_API_KEY` (or `OPENAI_API_KEY`) — required for live responses.
- `HARNESS_OPENAI_MODEL` — optional override for the model name (`gpt-5.5-mini` default).
- `HARNESS_OPENAI_SERVICE_TIER` — optional service tier (`auto`, `priority`, `default`, etc.).

Without an API key the driver falls back to a placeholder response, allowing local tests to run without hitting OpenAI.

### Gemini resource search

`resources.search` uses Google Gemini with Maps grounding to find local respite spots. Configure it with:

- `HARNESS_GEMINI_API_KEY` (or `GEMINI_API_KEY`) — required.
- `HARNESS_GEMINI_MODEL` — optional model override (`gemini-2.5-flash-lite` default).

### Email (Resend)

- `HARNESS_RESEND_API_KEY` (or `RESEND_API_KEY`) — required for email delivery.
- `HARNESS_EMAIL_FROM` — optional `from` address (`GiveCare <care@givecare.ai>` default).

### Stripe billing

- `HARNESS_STRIPE_SECRET` / `STRIPE_SECRET_KEY` — Stripe API key for entitlements.
- `HARNESS_STRIPE_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET` — webhook secret for `apps/edge-stripe`.

## Extending capabilities

1. Define a new capability in `packages/capabilities/*`.
2. Register it in `packages/capabilities/registry.ts`.
3. Invoke it from an agent via `caps.invoke('capability.name', args)`.

Every capability is automatically budgeted, validated (Zod), and logged via the capability runtime.
