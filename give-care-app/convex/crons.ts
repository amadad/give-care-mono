/**
 * Scheduled Jobs
 * Check-ins, cleanup, engagement monitoring
 */

import { cronJobs } from "convex/server";
// import { internal } from "./_generated/api";

const crons = cronJobs();

// Crons disabled - handler functions need implementation
// TODO: Implement runCheckIns and runEngagementMonitoring in internal/workflows.ts

export default crons;
