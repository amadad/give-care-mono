/**
 * Assessment Service
 * Convex-aware service for assessment operations
 */

import { MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import {
  extractSDOHProfile,
  type AssessmentAnswer,
  type ZoneAverages,
} from "../domain/profileEnrichment";

/**
 * Enrich user profile from SDOH assessment
 * Only mutates low-risk fields and tracks changes in audit trail
 */
export async function enrichProfileFromSDOH(
  ctx: MutationCtx,
  userId: Id<"users">,
  answers: AssessmentAnswer[],
  zoneAverages: ZoneAverages
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) {
    return;
  }

  // Extract profile fields using domain logic
  const enriched = extractSDOHProfile(answers, zoneAverages);

  const metadata = user.metadata || {};
  const changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }> = [];

  // Update only low-risk fields
  const fieldsToUpdate: (keyof typeof enriched)[] = [
    "transportationNeeds",
    "foodInsecurity",
    "housingRisk",
  ];

  for (const field of fieldsToUpdate) {
    const oldValue = metadata[field];
    const newValue = enriched[field];

    if (oldValue !== newValue && newValue !== undefined) {
      changes.push({ field, oldValue, newValue });
      metadata[field] = newValue;
    }
  }

  // Update user metadata
  if (changes.length > 0) {
    await ctx.db.patch(userId, {
      metadata,
    });

    // Record changes in audit trail (using events table instead of profile_changes)
    for (const change of changes) {
      await ctx.db.insert("events", {
        userId,
        type: "profile.updated",
        payload: {
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          source: "sdoh_assessment",
          changedAt: Date.now(),
        },
      });
    }
  }
}

