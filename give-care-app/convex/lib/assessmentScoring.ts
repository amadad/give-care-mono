/**
 * Shared Assessment Scoring Logic
 * Single source of truth for score calculation from assessment answers
 */

import { calculateZoneAverage } from "./scoreCalculator";
import { getRiskLevel, getBandFromRiskLevel } from "./sdoh";
import type { AssessmentDefinition } from "./assessmentCatalog";

export interface AssessmentAnswer {
  questionId: string;
  value: number;
}

export interface ScoringResult {
  gcBurnout: number;
  band: string;
  rawComposite: number;
  zones: {
    P1?: number;
    P2?: number;
    P3?: number;
    P4?: number;
    P5?: number;
    P6?: number;
  };
  answeredRatio: number;
}

/**
 * Calculate scores from assessment answers
 * Single source of truth - used by both assessments.ts and internal/score.ts
 */
export function calculateAssessmentScores(
  answers: AssessmentAnswer[],
  definition: AssessmentDefinition
): ScoringResult {
  // Filter out any non-numeric answers (safety check)
  const answeredValues = answers.filter((a) => typeof a.value === "number");
  const answeredRatio = answeredValues.length / definition.questions.length;

  if (answeredValues.length === 0) {
    throw new Error("No answers provided");
  }

  // Calculate raw scores by zone (dynamically based on question.zone)
  const zoneScores: Record<string, number[]> = {};
  for (const answer of answeredValues) {
    const question = definition.questions.find((q) => q.id === answer.questionId);
    if (question?.zone) {
      if (!zoneScores[question.zone]) {
        zoneScores[question.zone] = [];
      }
      zoneScores[question.zone].push(answer.value);
    }
  }

  // Calculate zone averages (only for zones with answers)
  const zones: ScoringResult["zones"] = {};
  for (const [zone, values] of Object.entries(zoneScores)) {
    if (values.length > 0) {
      zones[zone as keyof ScoringResult["zones"]] = calculateZoneAverage(values);
    }
  }

  // Calculate composite score (average of answered questions, normalized to 0-100)
  const allValues = answeredValues.map((a) => a.value);
  const avgScore = allValues.reduce((sum, v) => sum + v, 0) / allValues.length; // Raw average (1-5 scale)
  const composite = avgScore * 20; // Normalize to 0-100
  const gcBurnout = Math.round(composite);

  // Determine band using getRiskLevel (single source of truth)
  const riskLevel = getRiskLevel(gcBurnout);
  const band = getBandFromRiskLevel(riskLevel);

  return {
    gcBurnout,
    band,
    rawComposite: avgScore,
    zones,
    answeredRatio,
  };
}
