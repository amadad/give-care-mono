import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ============================================================================
// RESOURCE CACHE CLEANUP
// ============================================================================

// Clean up expired resource cache entries every 6 hours
crons.interval(
  "resources.cleanupCache",
  { hours: 6 },
  internal.resources.cleanupResourceCache
);

// ============================================================================
// FUTURE CRON JOBS
// ============================================================================

// TODO: Add additional cron jobs as needed:
// - Daily wellness check-ins (when implemented)
// - Assessment reminders (when implemented)
// - Engagement sweeps (when implemented)

export default crons;
