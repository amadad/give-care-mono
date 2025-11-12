/**
 * Shared Enums and Constants
 *
 * Centralized location for enum types and constant values used across the application
 */

// ============================================================================
// EVIDENCE LEVELS
// ============================================================================

export const EvidenceLevel = ['high', 'moderate', 'low'] as const;
export type EvidenceLevel = typeof EvidenceLevel[number];

export const EVIDENCE_ORDER: Record<EvidenceLevel, number> = {
  high: 3,
  moderate: 2,
  low: 1,
};

export const evidenceRank = (level: string): number => EVIDENCE_ORDER[level as EvidenceLevel] ?? 0;

// ============================================================================
// AGENT TYPES
// ============================================================================

export const AgentType = ['main', 'crisis', 'assessment'] as const;
export type AgentType = typeof AgentType[number];

// ============================================================================
// ASSESSMENT DEFINITIONS
// ============================================================================

export const AssessmentSlug = ['ema', 'bsfc', 'reach2', 'sdoh'] as const;
export type AssessmentSlug = typeof AssessmentSlug[number];

// ============================================================================
// CHANNEL TYPES
// ============================================================================

export const Channel = ['sms', 'email', 'web'] as const;
export type Channel = typeof Channel[number];

// ============================================================================
// CRISIS SEVERITY
// ============================================================================

export const CrisisSeverity = ['low', 'medium', 'high'] as const;
export type CrisisSeverity = typeof CrisisSeverity[number];
