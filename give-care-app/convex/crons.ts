import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'process-scheduled-triggers',
  { minutes: 5 },
  internal.functions.scheduler.internalProcessDueTriggers,
  { batchSize: 50 }
);

crons.interval(
  'engagement-watchers',
  { hours: 6 },
  internal.functions.watchers.runEngagementChecks,
  {}
);

export default crons;
