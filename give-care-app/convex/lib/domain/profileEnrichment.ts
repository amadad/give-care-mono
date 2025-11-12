/**
 * Profile Enrichment Domain Logic
 * Pure function to extract profile fields from SDOH assessment answers
 * No Convex dependencies
 */

export interface AssessmentAnswer {
  questionId: string;
  value: number; // 1-5 scale
}

export interface ZoneAverages {
  zone_emotional?: number;
  zone_physical?: number;
  zone_social?: number;
  zone_time?: number;
  zone_financial?: number;
}

export interface EnrichedProfile {
  transportationNeeds?: string; // "high" | "moderate" | "low"
  foodInsecurity?: string; // "high" | "moderate" | "low"
  housingRisk?: string; // "high" | "moderate" | "low"
}

/**
 * Extract SDOH profile fields from assessment answers
 * Pure function - CONVEX_01.md helper pattern
 * Only extracts low-risk fields (transportation, food, housing)
 */
export function extractSDOHProfile(
  answers: AssessmentAnswer[],
  zoneAverages: ZoneAverages
): EnrichedProfile {
  const profile: EnrichedProfile = {};

  // Transportation needs (from zone_time and zone_financial)
  const transportationScore =
    (zoneAverages.zone_time || 0) + (zoneAverages.zone_financial || 0) / 2;
  if (transportationScore > 3.5) {
    profile.transportationNeeds = "high";
  } else if (transportationScore > 2.5) {
    profile.transportationNeeds = "moderate";
  } else {
    profile.transportationNeeds = "low";
  }

  // Food insecurity (from zone_financial, question sdoh_6)
  const foodQuestion = answers.find((a) => a.questionId === "sdoh_6");
  const foodScore = foodQuestion ? foodQuestion.value : zoneAverages.zone_financial || 0;
  if (foodScore >= 4) {
    profile.foodInsecurity = "high";
  } else if (foodScore >= 3) {
    profile.foodInsecurity = "moderate";
  } else {
    profile.foodInsecurity = "low";
  }

  // Housing risk (from zone_emotional, questions sdoh_11-14)
  const housingQuestions = answers.filter((a) =>
    ["sdoh_11", "sdoh_12", "sdoh_13", "sdoh_14"].includes(a.questionId)
  );
  const housingScore =
    housingQuestions.length > 0
      ? housingQuestions.reduce((sum, q) => sum + q.value, 0) /
        housingQuestions.length
      : zoneAverages.zone_emotional || 0;
  // Lower score = higher risk (reverse scale for housing stability questions)
  const housingRiskScore = 6 - housingScore;
  if (housingRiskScore >= 4) {
    profile.housingRisk = "high";
  } else if (housingRiskScore >= 2.5) {
    profile.housingRisk = "moderate";
  } else {
    profile.housingRisk = "low";
  }

  return profile;
}

