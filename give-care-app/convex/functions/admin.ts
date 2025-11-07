import { query } from '../_generated/server';

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    const totalUsers = await ctx.db.query('users').collect().then((docs) => docs.length);
    const activeSubscriptions = await ctx.db.query('subscriptions').collect().then((docs) => docs.filter((s) => s.status === 'active').length);
    const dayAgo = Date.now() - 1000 * 60 * 60 * 24;
    const alertsLast24h = await ctx.db
      .query('alerts')
      .filter((q) => q.gte(q.field('_creationTime'), dayAgo))
      .collect()
      .then((docs) => docs.length);
    const latencySamples = await ctx.db.query('agent_runs').take(50);
    const avgLatencyMs = latencySamples.length
      ? Math.round(latencySamples.reduce((sum, run) => sum + run.latencyMs, 0) / latencySamples.length)
      : 0;
    return { totalUsers, activeSubscriptions, alertsLast24h, avgLatencyMs };
  },
});
