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

export default crons;
