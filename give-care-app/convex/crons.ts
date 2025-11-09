import { cronJobs } from 'convex/server';
import { api } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'process-scheduled-triggers',
  { minutes: 5 },
  api.internal.internalProcessDueTriggers,
  { batchSize: 50 }
);

crons.interval(
  'engagement-watchers',
  { hours: 6 },
  api.internal.runEngagementChecks,
  {}
);

crons.daily(
  'aggregate-daily-metrics',
  { hourUTC: 2, minuteUTC: 0 },
  api.internal.aggregateDailyMetrics,
  {}
);

export default crons;
