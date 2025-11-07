# Admin Dashboard

Harness exposes admin-ready metrics through the `admin.metrics` capability (and `admin:getMetrics` Convex query). Values include:

- `totalUsers`: Count of caregivers in the Convex `users` table.
- `activeSubscriptions`: Active Stripe subscriptions synced via `billing:applyStripeEvent`.
- `alertsLast24h`: Number of alerts generated in the past day.
- `avgLatencyMs`: Rolling average latency for the last 50 agent runs.

Usage examples:

```ts
import { fetchAdminMetricsCapability } from '../packages/capabilities/admin.metrics';
const metrics = await fetchAdminMetricsCapability.run({}, ctx);
```

Feed these metrics into any dashboard (e.g., Next.js admin route) to visualize system health without touching production Convex credentials.
