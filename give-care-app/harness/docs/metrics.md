# Metrics & Budgets

- **Latency**: track p50/p95 per channel + agent. Stream start < 250 ms, non-tool turns < 2.0 s p95.
- **Cost**: log tokens in/out per agent run, tool call counts, and budget remainders. Alert at 80% budget consumption.
- **Safety**: guardrail hit rate, crisis triggers, medical advice blocks, consent denials.
- **Quality**: assessment completion %, intervention uptake %, drop-off after N turns, golden transcript parity.
- **Reliability**: ≥99.5% successful turns. Crisis path never degraded.
- **Performance Budgets**: token/tool budgets enforced in `packages/harness/budget.ts`; retries limited to idempotent tools; streaming must start before non-critical tools.
