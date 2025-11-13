/**
 * Feature Flags
 * Centralized feature flag configuration
 */

/**
 * Feature flags configuration
 * Check before expensive operations (Maps API, trends detection, proactive suggestions)
 */
export const FEATURES = {
  // Existing flags
  MAPS: process.env.FEATURE_MAPS !== "false",
  TRENDS: process.env.FEATURE_TRENDS !== "false",
  PROACTIVE: process.env.FEATURE_PROACTIVE !== "false",
  SAFE_MODE: process.env.SAFE_MODE === "on",

  // New refinement flags
  SUBSCRIPTION_GATING: process.env.SUBSCRIPTIONS_ENABLED === "true", // default: OFF for beta
  INTERVENTIONS: process.env.FEATURE_INTERVENTIONS !== "false",      // default: ON
  PROACTIVE_CHECKINS: process.env.FEATURE_CHECKINS !== "false",      // default: ON
  DEEP_ASSESSMENTS: process.env.FEATURE_DEEP_ASSESS !== "false",     // default: ON (BSFC, REACH-II)
} as const;

