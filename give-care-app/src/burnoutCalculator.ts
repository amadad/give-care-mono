/**
 * Burnout score calculator
 * PRD §3.2: Composite burnout score (0-100)
 * PRD §3.3: Pressure zone identification
 */

export interface BurnoutScore {
  overall_score: number;
  confidence: number;
  band: string;
  ema_contribution?: number;
  cwbs_contribution?: number;
  reach_contribution?: number;
  sdoh_contribution?: number;
  pressure_zones: string[];
  pressure_zone_scores: Record<string, number>;
  previous_score?: number;
  score_delta?: number;
  trend_7day: number[];
  trend_30day: number[];
}

export interface PreviousScore {
  overall_score: number;
  calculated_at: Date;
}

// Weights for composite score (PRD §3.2)
const ASSESSMENT_WEIGHTS = {
  ema: 0.40,      // 40% - daily pulse
  cwbs: 0.30,     // 30% - weekly burnout
  reach_ii: 0.20, // 20% - stress/coping
  sdoh: 0.10      // 10% - needs screening
};

// Temporal decay (PRD §3.2)
const DECAY_DAYS = 10;  // Exponential decay over 10 days

/**
 * Calculate composite burnout score from assessments.
 *
 * @param assessmentScores - Dict of {assessment_type: score_dict}
 * @param previousScores - List of previous scores for trend analysis
 * @returns Complete burnout score with zones and trends
 */
export function calculateCompositeScore(
  assessmentScores: Record<string, any>,
  previousScores?: PreviousScore[]
): BurnoutScore {
  // Calculate weighted contribution from each assessment
  const contributions: Record<string, number> = {};
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [assessmentType, weight] of Object.entries(ASSESSMENT_WEIGHTS)) {
    if (assessmentType in assessmentScores) {
      const scoreData = assessmentScores[assessmentType];
      const score = scoreData.overall_score;

      // CRITICAL FIX: Skip if score is null or undefined (insufficient data)
      // This handles the case where calculateAssessmentScore returns null
      // when all questions are skipped (division by zero fix)
      if (score === null || score === undefined) {
        continue;
      }

      // Apply temporal decay
      let effectiveWeight = weight;
      if (scoreData.timestamp) {
        const timestamp = new Date(scoreData.timestamp);
        const ageDays = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24));
        const decayFactor = Math.exp(-ageDays / DECAY_DAYS);
        effectiveWeight = weight * decayFactor;
      }

      const contribution = score * effectiveWeight;
      contributions[assessmentType] = contribution;

      weightedSum += contribution;
      totalWeight += effectiveWeight;
    }
  }

  // Calculate overall score
  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 50.0;

  // Calculate confidence based on data completeness
  const totalPossibleWeight = Object.values(ASSESSMENT_WEIGHTS).reduce((sum, w) => sum + w, 0);
  const confidence = totalWeight / totalPossibleWeight;

  // Determine band
  const band = calculateBand(overallScore);

  // Identify pressure zones from subscores
  const [pressureZones, zoneScores] = identifyPressureZones(assessmentScores);

  // Calculate trend
  let previousScore: number | undefined;
  let scoreDelta: number | undefined;
  const trend7day: number[] = [];
  const trend30day: number[] = [];

  if (previousScores && previousScores.length > 0) {
    // Get most recent score
    previousScore = previousScores[0].overall_score;
    scoreDelta = overallScore - previousScore;

    // Extract trends
    const now = new Date();
    for (const prev of previousScores) {
      const ageDays = Math.floor((now.getTime() - prev.calculated_at.getTime()) / (1000 * 60 * 60 * 24));
      if (ageDays <= 7) {
        trend7day.push(prev.overall_score);
      }
      if (ageDays <= 30) {
        trend30day.push(prev.overall_score);
      }
    }
  }

  return {
    overall_score: Math.round(overallScore * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    band,
    ema_contribution: contributions.ema,
    cwbs_contribution: contributions.cwbs,
    reach_contribution: contributions.reach_ii,
    sdoh_contribution: contributions.sdoh,
    pressure_zones: pressureZones,
    pressure_zone_scores: zoneScores,
    previous_score: previousScore,
    score_delta: scoreDelta !== undefined ? Math.round(scoreDelta * 10) / 10 : undefined,
    trend_7day: trend7day,
    trend_30day: trend30day
  };
}

/**
 * Calculate burnout band from score.
 *
 * SCALE DIRECTION: Higher score = healthier/less burnout, Lower score = more distressed/more burnout
 * This matches the assessment scoring in assessmentTools.ts (lines 575-581)
 *
 * @param score - Burnout score (0-100)
 * @returns Band name
 */
function calculateBand(score: number): string {
  // Lower scores indicate MORE burnout/distress
  if (score < 20) return 'crisis';      // 0-19: Severe burnout, immediate support needed
  if (score < 40) return 'high';        // 20-39: High burnout, significant distress
  if (score < 60) return 'moderate';    // 40-59: Moderate burnout, common for caregivers
  if (score < 80) return 'mild';        // 60-79: Low burnout, managing well
  return 'thriving';                    // 80-100: Minimal burnout, healthy state
}

/**
 * Identify pressure zones from assessment subscores.
 * PRD §3.3: Pressure zones
 *
 * @param assessmentScores - Dict of {assessment_type: score_dict}
 * @returns Tuple of [pressure_zone_list, zone_scores_dict]
 */
function identifyPressureZones(
  assessmentScores: Record<string, any>
): [string[], Record<string, number>] {
  const zoneScores: Record<string, number[]> = {};

  // Map subscales to pressure zones
  // IMPORTANT: Zone names must match what tests expect and findInterventions uses
  const subscaleToZone: Record<string, string> = {
    // EMA subscales (from assessmentTools.ts lines 47-94)
    mood: 'emotional_wellbeing',
    burden: 'time_management',
    stress: 'emotional_wellbeing',
    support: 'social_support',
    self_care: 'physical_health',

    // CWBS subscales (from assessmentTools.ts lines 98-198)
    activities: 'time_management',
    needs: 'time_management',

    // REACH-II subscales (from assessmentTools.ts lines 202-287)
    // Note: stress, self_care, support are defined above (shared subscale names)
    social: 'social_support',
    efficacy: 'emotional_wellbeing',
    emotional: 'emotional_wellbeing',
    physical: 'physical_health',

    // SDOH subscales (from assessmentTools.ts lines 291-488)
    financial: 'financial_concerns',
    housing: 'financial_concerns',
    transportation: 'financial_concerns',
    // Note: social is defined above (shared subscale name)
    healthcare: 'physical_health',
    food: 'financial_concerns',
    legal: 'financial_concerns',
    technology: 'social_support',

    // Legacy/deprecated mappings (kept for backward compatibility)
    emotional_exhaustion: 'emotional_wellbeing',
    physical_exhaustion: 'physical_health',
    guilt: 'emotional_wellbeing',
    life_satisfaction: 'physical_health',
    coping: 'emotional_wellbeing',
    behavior_problems: 'time_management',
    financial_strain: 'financial_concerns',
    social_isolation: 'social_support',
    social_needs: 'social_support',
    safety: 'social_support'
  };

  // Aggregate subscale scores into zones
  for (const [assessmentType, scoreData] of Object.entries(assessmentScores)) {
    const subscores = scoreData.subscores || {};
    for (const [subscale, score] of Object.entries(subscores)) {
      const zone = subscaleToZone[subscale];
      if (zone && typeof score === 'number') {
        if (!zoneScores[zone]) {
          zoneScores[zone] = [];
        }
        // Invert score (lower assessment score = higher pressure)
        const pressure = 100 - score;
        zoneScores[zone].push(pressure);
      }
    }
  }

  // Calculate average for each zone
  const zoneAverages: Record<string, number> = {};
  for (const [zone, scores] of Object.entries(zoneScores)) {
    zoneAverages[zone] = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  // Sort by pressure level (highest first)
  const sortedZones = Object.entries(zoneAverages)
    .sort((a, b) => b[1] - a[1]);

  // Return top zones (those above threshold of 50)
  const highPressureZones = sortedZones
    .filter(([_, score]) => score > 50)
    .map(([zone, _]) => zone);

  return [highPressureZones, zoneAverages];
}

/**
 * Format zone identifier to human-readable label.
 * Converts snake_case identifiers to Title Case labels.
 *
 * @param zone - Zone identifier (e.g., "emotional_wellbeing")
 * @returns Formatted label (e.g., "Emotional Well-being")
 */
export function formatZoneName(zone: string): string {
  const zoneLabels: Record<string, string> = {
    emotional_wellbeing: 'Emotional Well-being',
    physical_health: 'Physical Health',
    social_support: 'Social Support',
    financial_concerns: 'Financial Concerns',
    time_management: 'Time Management',

    // Legacy zone names (backward compatibility)
    emotional: 'Emotional Well-being',
    physical: 'Physical Health',
    financial_strain: 'Financial Concerns',
    social_isolation: 'Social Support',
    caregiving_tasks: 'Time Management',
    self_care: 'Self-Care',
    social_needs: 'Social Support'
  };

  if (zoneLabels[zone]) {
    return zoneLabels[zone];
  }

  // Fallback: Title Case with spaces (e.g., "unknown_zone" → "Unknown Zone")
  return zone
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get human-readable zone description.
 * Returns a contextual description of the pressure zone.
 *
 * @param zone - Zone identifier
 * @returns Contextual description (e.g., "Emotional Burden")
 */
export function getZoneDescription(zone: string): string {
  const descriptions: Record<string, string> = {
    emotional_wellbeing: 'Emotional Burden',
    physical_health: 'Physical Exhaustion',
    financial_concerns: 'Financial Stress',
    social_support: 'Feeling Isolated',
    time_management: 'Caregiving Demands',

    // Legacy descriptions (backward compatibility)
    emotional: 'Emotional Burden',
    physical: 'Physical Exhaustion',
    financial_strain: 'Financial Stress',
    social_isolation: 'Feeling Isolated',
    caregiving_tasks: 'Caregiving Demands',
    self_care: 'Self-Care Neglect',
    social_needs: 'Social Support Needs'
  };

  return descriptions[zone] || zone.replace(/_/g, ' ');
}
