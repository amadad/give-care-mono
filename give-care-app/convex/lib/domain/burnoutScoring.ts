/**
 * Burnout Scoring Domain Logic
 * Pure functions for calculating composite burnout scores
 * No Convex dependencies
 */

export type Instrument = "ema" | "cwbs" | "reach2" | "sdoh";

export interface ScoreInput {
  instrument: Instrument;
  gcBurnout: number; // 0-100
  answeredRatio: number; // 0-1 (answered / total questions)
  timeMs: number; // Timestamp when assessment was completed
}

/**
 * Calculate composite burnout score from multiple assessments
 * Pure function - CONVEX_01.md helper pattern
 * 
 * Formula:
 * - Base weights: EMA (0.15), CWBS (0.3), REACH-II (0.3), SDOH (0.25)
 * - Reliability weight: 0.5 + 0.5 * answeredRatio (partial assessments weighted less)
 * - Recency decay: exp(-(now - timeMs) / (30*24*3600e3)) (30-day half-life)
 * - Weighted average: sum(weight * gcBurnout) / sum(weight)
 */
export function composite(inputs: ScoreInput[], now = Date.now()): number {
  if (inputs.length === 0) {
    return NaN;
  }

  const base = {
    ema: 0.15,
    cwbs: 0.3,
    reach2: 0.3,
    sdoh: 0.25,
  } as const;

  // 30-day half-life decay function
  const decay = (t: number) => Math.exp(-(now - t) / (30 * 24 * 3600e3));

  // Weight function: base * reliability * recency
  const w = (i: ScoreInput) => {
    const baseWeight = base[i.instrument];
    const reliabilityWeight = 0.5 + 0.5 * i.answeredRatio;
    const recencyWeight = decay(i.timeMs);
    return baseWeight * reliabilityWeight * recencyWeight;
  };

  // Calculate weighted average
  const num = inputs.reduce((sum, i) => sum + w(i) * i.gcBurnout, 0);
  const den = inputs.reduce((sum, i) => sum + w(i), 0);

  return den > 0 ? Math.round(num / den) : NaN;
}

/**
 * Determine burnout band from composite score
 * Pure function
 */
export function band(score: number): "very_low" | "low" | "moderate" | "high" {
  if (isNaN(score)) {
    return "moderate"; // Default if no scores
  }

  if (score < 25) {
    return "very_low";
  } else if (score < 50) {
    return "low";
  } else if (score < 75) {
    return "moderate";
  } else {
    return "high";
  }
}

