/**
 * Scheduled Jobs
 * Simplified: EMA check-ins and message cleanup
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily EMA check-ins for eligible users
crons.daily(
  "checkIns",
  { hourUTC: 9, minuteUTC: 0 },
  internal.internal.workflows.runCheckIns
);

// Daily message cleanup (90-day retention)
crons.daily(
  "cleanupMessages",
  { hourUTC: 2, minuteUTC: 0 },
  internal.internal.cleanup.cleanupOldMessages
);

export default crons;
