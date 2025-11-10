import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'resource-cache-cleanup',
  { hours: 1 },
  internal.resources.cleanupResourceCache,
  { limit: 200 }
);

export default crons;
