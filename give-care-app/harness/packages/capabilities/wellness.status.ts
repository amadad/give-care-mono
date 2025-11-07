import { capability } from './factory';

export const getWellnessStatus = capability({
  name: 'wellness.status',
  description: 'Fetch latest burnout scores, trends, and pressure zones.',
  costHint: 'low',
  latencyHint: 'low',
  io: {},
  async run(_input, ctx) {
    return ctx.store.getWellnessStatus(ctx.context.userId);
  },
});
