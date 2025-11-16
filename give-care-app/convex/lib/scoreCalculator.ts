/**
 * Score Calculator
 * Simple math for GC-SDOH score calculation
 */

import { ZoneId, getAllZoneIds } from "./sdoh";

export interface ZoneScores {
  P1?: number;
  P2?: number;
  P3?: number;
  P4?: number;
  P5?: number;
  P6?: number;
}

/**
 * Calculate composite score from zone scores
 * score = (P1 + P2 + P3 + P4 + P5 + P6) / 6
 */
export function calculateCompositeScore(zones: ZoneScores): number {
  const zoneIds = getAllZoneIds();
  const scores: number[] = [];

  for (const zoneId of zoneIds) {
    const score = zones[zoneId];
    if (score !== undefined && score !== null) {
      scores.push(score);
    }
  }

  if (scores.length === 0) {
    return 0;
  }

  const sum = scores.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / scores.length);
}

/**
 * Normalize a score to 0-100 range
 * Assumes input is already in 0-100 range, but ensures it's clamped
 */
export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate zone average from assessment answers
 * Maps answer values (typically 1-5) to 0-100 scale
 */
export function calculateZoneAverage(answers: number[]): number {
  if (answers.length === 0) {
    return 0;
  }

  // Assume answers are on 1-5 scale, normalize to 0-100
  // Formula: ((average - 1) / 4) * 100
  const avg = answers.reduce((sum, val) => sum + val, 0) / answers.length;
  const normalized = ((avg - 1) / 4) * 100;
  return normalizeScore(normalized);
}

/**
 * Find worst (highest) pressure zone
 */
export function findWorstZone(zones: ZoneScores): ZoneId | null {
  let worstZone: ZoneId | null = null;
  let worstScore = -1;

  for (const zoneId of getAllZoneIds()) {
    const score = zones[zoneId];
    if (score !== undefined && score !== null && score > worstScore) {
      worstScore = score;
      worstZone = zoneId;
    }
  }

  return worstZone;
}

/**
 * Get zone scores as array for easy iteration
 */
export function getZoneScoresArray(zones: ZoneScores): Array<{ zone: ZoneId; score: number }> {
  return getAllZoneIds()
    .map((zoneId) => ({
      zone: zoneId,
      score: zones[zoneId] ?? 0,
    }))
    .filter((item) => item.score > 0);
}

