import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'process-scheduled-triggers',
  { minutes: 5 },
  internal.internalProcessDueTriggers,
  { batchSize: 50 }
);

crons.interval(
  'engagement-watchers',
  { hours: 6 },
  internal.runEngagementChecks,
  {}
);

crons.daily(
  'aggregate-daily-metrics',
  { hourUTC: 2, minuteUTC: 0 },
  internal.aggregateDailyMetrics,
  {}
);

export default crons;
