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
// CHECK-INS DISPATCH
// ============================================================================

// Dispatch due check-ins every 15 minutes
crons.interval(
  "checkIns.dispatchDue",
  { minutes: 15 },
  internal.workflows.checkIns.dispatchDue
);

// ============================================================================
// TREND DETECTION
// ============================================================================

// Detect score trends every 6 hours
crons.interval(
  "scores.detectTrends",
  { hours: 6 },
  internal.workflows.trends.detectScoreTrends
);

// ============================================================================
// ENGAGEMENT MONITORING
// ============================================================================

// Monitor engagement every 24 hours
crons.interval(
  "users.monitorEngagement",
  { hours: 24 },
  internal.workflows.engagement.monitorEngagement
);

export default crons;
