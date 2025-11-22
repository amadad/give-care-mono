/**
 * TypeScript types for GiveCare
 */

import type { Id } from "../_generated/dataModel";
import type { Infer } from "convex/values";
import { agentMetadataValidator, eventPayloadValidator } from "./validators";

export type AssessmentType = "ema" | "sdoh";

export type BurnoutBand = "very_low" | "low" | "moderate" | "high";

export type ZoneName =
  | "zone_emotional"
  | "zone_physical"
  | "zone_social"
  | "zone_time"
  | "zone_financial";

export type OnboardingStage =
  | "new"
  | "care_recipient"
  | "primary_stressor"
  | "assessment_offer"
  | "assessment_in_progress"
  | "first_assessment_complete"
  | "resource_discovery_offered"
  | "complete";

export interface OnboardingMilestone {
  milestone: string;
  completedAt: number;
}

export interface CrisisDetectionResult {
  isCrisis: boolean;
  severity?: "high" | "medium" | "low";
  isFalsePositive: boolean;
  isDVHint: boolean;
}

export interface ResourceResult {
  placeId: string;
  name: string;
  address?: string;
  types?: string[];
}

export type UserMetadata = Infer<typeof agentMetadataValidator>;

export type EventPayload = Infer<typeof eventPayloadValidator>;
