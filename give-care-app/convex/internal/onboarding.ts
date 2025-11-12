/**
 * Internal Onboarding Functions
 */

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { enforce, getOnboardingPrompt } from "../lib/services/onboardingService";
import type { InteractionType } from "../lib/domain/onboarding";

/**
 * Enforce onboarding policy
 */
export const enforcePolicy = internalQuery({
  args: {
    userId: v.id("users"),
    interactionType: v.string(),
  },
  handler: async (ctx, { userId, interactionType }) => {
    return await enforce(ctx, userId, interactionType as InteractionType);
  },
});

// Alias for consistency
export const enforce = enforcePolicy;

/**
 * Get onboarding prompt
 */
export const getPrompt = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await getOnboardingPrompt(ctx, userId);
  },
});

