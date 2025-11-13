/**
 * Wellness Service
 * Convex-aware service for wellness/score operations
 */

import { QueryCtx, MutationCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { composite, band, type ScoreInput } from "../domain/burnoutScoring";
import { getCheckInFrequency } from "../domain/messaging";

/**
 * Recalculate composite burnout score for a user
 * Called after every assessment completion
 * Single mutation - CONVEX_01.md best practice
 */
export async function recalculateComposite(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<{ gcBurnout: number; band: string }> {
  // Get all completed assessments for user
  const assessments = await ctx.db
    .query("assessments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Get scores for each assessment (parallel queries - CONVEX_01.md optimization)
  const scorePromises = assessments.map((assessment) =>
    ctx.db
      .query("scores")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", userId).eq("instrument", assessment.definitionId)
      )
      .order("desc")
      .first()
  );

  const scores = await Promise.all(scorePromises);

  // Build score inputs
  const scoreInputs: ScoreInput[] = [];
  for (let i = 0; i < assessments.length; i++) {
    const score = scores[i];
    if (score) {
      scoreInputs.push({
        instrument: score.instrument,
        gcBurnout: score.gcBurnout,
        answeredRatio: score.answeredRatio,
        timeMs: assessments[i].completedAt,
      });
    }
  }

  // Calculate composite using domain logic
  const compositeScore = composite(scoreInputs);
  const burnoutBand = band(compositeScore);

  // Update user metadata (denormalized for quick access)
  const user = await ctx.db.get(userId);
  if (user) {
    const metadata = user.metadata || {};
    
    // Update check-in frequency based on composite score
    const frequency = getCheckInFrequency(compositeScore);
    
    await ctx.db.patch(userId, {
      metadata: {
        ...metadata,
        gcBurnout: compositeScore,
        checkInFrequency: frequency,
      },
    });
  }

  // Store in scores_composite table (for trend charts)
  await ctx.db.insert("scores_composite", {
    userId,
    gcBurnout: compositeScore,
    band: burnoutBand,
  });

  return { gcBurnout: compositeScore, band: burnoutBand };
}

/**
 * Get composite burnout score for a user
 * Uses denormalized value from metadata for fast access
 */
export async function getCompositeScore(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<{ gcBurnout: number; band: string; lastUpdated?: number } | null> {
  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
  }

  // Fast path: use denormalized value from metadata
  const metadata = user.metadata || {};
  if (metadata.gcBurnout !== undefined && typeof metadata.gcBurnout === "number") {
    return {
      gcBurnout: metadata.gcBurnout,
      band: band(metadata.gcBurnout),
    };
  }

  // Fallback: calculate from scores_composite table
  const latestComposite = await ctx.db
    .query("scores_composite")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .first();

  if (latestComposite) {
    return {
      gcBurnout: latestComposite.gcBurnout,
      band: latestComposite.band,
      lastUpdated: latestComposite._creationTime,
    };
  }

  return null;
}

