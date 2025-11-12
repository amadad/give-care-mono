/**
 * Feature Flags
 * Centralized feature flag configuration
 */

/**
 * Feature flags configuration
 * Check before expensive operations (Maps API, trends detection, proactive suggestions)
 */
export const FEATURES = {
  MAPS: process.env.FEATURE_MAPS !== "false",
  TRENDS: process.env.FEATURE_TRENDS !== "false",
  PROACTIVE: process.env.FEATURE_PROACTIVE !== "false",
  SAFE_MODE: process.env.SAFE_MODE === "on",
} as const;

