/**
 * Onboarding Service
 * Convex-aware service for onboarding policy enforcement
 */

import { QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import {
  missing,
  getNextOnboardingStep,
  getUserFriendlyPrompt,
  type InteractionType,
} from "../domain/onboarding";

/**
 * Check if user has required fields for an interaction
 * Returns single question if not allowed
 */
export async function enforce(
  ctx: QueryCtx,
  userId: Id<"users">,
  interactionType: InteractionType
): Promise<{ allowed: boolean; question?: string }> {
  const user = await ctx.db.get(userId);
  if (!user) {
    return { allowed: false, question: "User not found" };
  }

  const profile = user.metadata || {};
  const missingFields = missing(profile, interactionType);

  if (missingFields.length === 0) {
    return { allowed: true };
  }

  // Return single question for the first missing field
  // P2: Never Repeat - one thing at a time
  const firstMissingField = missingFields[0];
  const question = getUserFriendlyPrompt(firstMissingField);

  return { allowed: false, question };
}

/**
 * Get onboarding prompt for user's current stage
 */
export async function getOnboardingPrompt(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<string | null> {
  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
  }

  const metadata = user.metadata || {};
  const stage = (metadata.onboardingStage as string) || "new";
  const profile = metadata;

  const { nextField, nextStage } = getNextOnboardingStep(
    stage as any,
    profile
  );

  if (!nextField) {
    return null; // No next step
  }

  // Update stage (this should be done in a mutation, but for now return the prompt)
  return getUserFriendlyPrompt(nextField);
}

