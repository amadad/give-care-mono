/**
 * Scheduled Jobs
 * Simplified: EMA check-ins and message cleanup
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily EMA check-ins (9 AM UTC = 9 AM EST/4 AM PST)
crons.daily(
  "runCheckIns",
  { hourUTC: 9, minuteUTC: 0 },
  internal.internal.workflows.runCheckIns
);

// Daily engagement watcher (10 AM UTC = 10 AM EST/5 AM PST)
crons.daily(
  "checkEngagement",
  { hourUTC: 10, minuteUTC: 0 },
  internal.internal.workflows.checkEngagement
);

// Daily message cleanup (90-day retention)
crons.daily(
  "cleanupMessages",
  { hourUTC: 2, minuteUTC: 0 },
  internal.internal.cleanup.cleanupOldMessages
);

export default crons;
