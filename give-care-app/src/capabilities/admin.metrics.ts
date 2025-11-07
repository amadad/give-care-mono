import { z } from 'zod';
import { capability } from './factory';

export const fetchAdminMetricsCapability = capability({
  name: 'admin.metrics',
  description: 'Fetch key operational metrics for the admin dashboard.',
  costHint: 'low',
  latencyHint: 'low',
  io: { input: z.object({}) },
  async run(_input, ctx) {
    return ctx.store.getAdminMetrics();
  },
});
