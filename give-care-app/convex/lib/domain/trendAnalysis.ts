/**
 * Trend Analysis Domain Logic
 * Pure functions for calculating score trends
 * No Convex dependencies
 */

export interface TrendResult {
  trend: "improving" | "declining" | "stable";
  change: number; // Absolute change in score
  changePercent: number; // Percentage change
}

/**
 * Calculate score trend from array of scores
 * Pure function - CONVEX_01.md helper pattern
 */
export function calculateScoreTrend(scores: number[]): TrendResult {
  if (scores.length < 2) {
    return {
      trend: "stable",
      change: 0,
      changePercent: 0,
    };
  }

  // Use linear regression for trend (simple approach)
  // More recent scores weighted higher
  const n = scores.length;
  const weights = scores.map((_, i) => i + 1); // Weight by recency

  // Calculate weighted average of first half vs second half
  const midpoint = Math.floor(n / 2);
  const firstHalf = scores.slice(0, midpoint);
  const secondHalf = scores.slice(midpoint);

  const firstAvg =
    firstHalf.reduce((sum, s, i) => sum + s * weights[i], 0) /
    firstHalf.reduce((sum, _, i) => sum + weights[i], 0);
  const secondAvg =
    secondHalf.reduce(
      (sum, s, i) => sum + s * weights[midpoint + i],
      0
    ) / secondHalf.reduce((sum, _, i) => sum + weights[midpoint + i], 0);

  const change = secondAvg - firstAvg;
  const changePercent = firstAvg > 0 ? (change / firstAvg) * 100 : 0;

  // Determine trend
  let trend: "improving" | "declining" | "stable";
  if (change <= -5) {
    trend = "improving"; // Score decreased (burnout improved)
  } else if (change >= 5) {
    trend = "declining"; // Score increased (burnout worsened)
  } else {
    trend = "stable";
  }

  return {
    trend,
    change: Math.abs(change),
    changePercent: Math.abs(changePercent),
  };
}

