# Harness Convex Backend

This Convex project stores the normalized data model used by the harness and exposes a tiny, authenticated API for:

- Hydrating session context (`context:hydrate`).
- Persisting updated context state (`context:persist`).
- Recording inbound/outbound transcripts (`messages:*`).
- Logging agent runs and guardrail events (`logs:*`).

## Usage

1. Install dependencies inside this folder: `pnpm install`.
2. Run `pnpm codegen` once so `_generated` types exist.
3. Start Convex locally with `pnpm dev` or deploy with `pnpm deploy`.
4. Set the following environment variables:
   - `HARNESS_API_TOKEN` (Convex env var) — shared secret checked by every public function.
   - `HARNESS_CONVEX_URL` (harness runtime env var) — deployment URL, e.g. `https://YOUR-APP.convex.cloud`.
   - `HARNESS_CONVEX_TOKEN` (harness runtime env var) — must match `HARNESS_API_TOKEN`.

The harness driver (`packages/drivers/store/convex.store.ts`) calls these functions via `ConvexHttpClient`, so once the URL + token are configured, the runtime automatically dual-writes transcripts and telemetry into Convex.
