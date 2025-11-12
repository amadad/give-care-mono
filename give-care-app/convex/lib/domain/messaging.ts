/**
 * Messaging Domain Logic
 * Pure functions for messaging frequency and check-in logic
 * No Convex dependencies
 */

/**
 * Get check-in frequency based on burnout score
 * Pure function
 */
export function getCheckInFrequency(gcBurnout: number): "daily" | "weekly" {
  // Daily for crisis/moderate users (gcBurnout ≥60)
  // Weekly for stable users (gcBurnout <60)
  return gcBurnout >= 60 ? "daily" : "weekly";
}

