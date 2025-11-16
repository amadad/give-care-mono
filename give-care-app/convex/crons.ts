/**
 * Scheduled Jobs
 * Simplified: EMA check-ins and message cleanup
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Note: Daily EMA check-ins disabled (workflows.ts removed in simplification)
// Re-enable when needed by creating internal/workflows.ts with runCheckIns

// Daily message cleanup (90-day retention)
crons.daily(
  "cleanupMessages",
  { hourUTC: 2, minuteUTC: 0 },
  internal.internal.cleanup.cleanupOldMessages
);

export default crons;
