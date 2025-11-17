/**
 * SDOH Zone Definitions
 * P1-P6 pressure zones for caregiver stress tracking
 */

export type ZoneId = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";

export interface Zone {
  id: ZoneId;
  name: string;
  description: string;
}

/**
 * Zone definitions with descriptive names
 */
export const ZONES: Record<ZoneId, Zone> = {
  P1: {
    id: "P1",
    name: "Relationship & Social Support",
    description: "Quality of relationships, social connections, and support network",
  },
  P2: {
    id: "P2",
    name: "Physical Health",
    description: "Physical wellbeing, energy levels, sleep, and health concerns",
  },
  P3: {
    id: "P3",
    name: "Housing & Environment",
    description: "Living situation, housing stability, and environmental factors",
  },
  P4: {
    id: "P4",
    name: "Financial Resources",
    description: "Financial stability, resources, and economic security",
  },
  P5: {
    id: "P5",
    name: "Legal & Navigation",
    description: "Access to legal help, navigating systems, and bureaucratic challenges",
  },
  P6: {
    id: "P6",
    name: "Emotional Wellbeing",
    description: "Mental health, emotional state, stress levels, and mood",
  },
};

/**
 * Get zone display name for user-facing messages
 */
export function getZoneDisplayName(zoneId: ZoneId): string {
  return ZONES[zoneId].name;
}

/**
 * Get all zone IDs
 */
export function getAllZoneIds(): ZoneId[] {
  return Object.keys(ZONES) as ZoneId[];
}

/**
 * Risk level thresholds
 */
export type RiskLevel = "low" | "moderate" | "high" | "crisis";

export interface RiskLevelThresholds {
  low: { min: number; max: number };
  moderate: { min: number; max: number };
  high: { min: number; max: number };
  crisis: { min: number; max: number };
}

export const RISK_THRESHOLDS: RiskLevelThresholds = {
  low: { min: 0, max: 25 },
  moderate: { min: 26, max: 50 },
  high: { min: 51, max: 75 },
  crisis: { min: 76, max: 100 },
};

/**
 * Determine risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return "crisis";
  if (score >= 51) return "high";
  if (score >= 26) return "moderate";
  return "low";
}

/**
 * Get risk level display text
 */
export function getRiskLevelDisplay(riskLevel: RiskLevel): string {
  const display: Record<RiskLevel, string> = {
    low: "low stress",
    moderate: "moderate stress",
    high: "high stress",
    crisis: "crisis level",
  };
  return display[riskLevel];
}

/**
 * Map risk level to band (for assessments table compatibility)
 * Risk levels: low, moderate, high, crisis
 * Bands: very_low, low, moderate, high
 */
export function getBandFromRiskLevel(riskLevel: RiskLevel): "very_low" | "low" | "moderate" | "high" {
  const mapping: Record<RiskLevel, "very_low" | "low" | "moderate" | "high"> = {
    low: "very_low", // score 0-25
    moderate: "low", // score 26-50
    high: "moderate", // score 51-75
    crisis: "high", // score 76-100
  };
  return mapping[riskLevel];
}

