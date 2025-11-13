/**
 * Agent Tools
 * All 8 tools for Main Agent and Assessment Agent
 */

"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "./_generated/api";
import type { ToolCtx } from "@convex-dev/agent";
import { Id } from "./_generated/dataModel";

/**
 * 1. searchResources - Google Maps Grounding API search
 */
export const searchResources = createTool({
  description:
    "Search for local caregiving resources using Google Maps. Returns nearby services like respite care, support groups, adult day care, home health agencies, and community resources.",
  args: z.object({
    query: z
      .string()
      .describe(
        "Natural language query for resources. Can include zip code (e.g., 'respite care near me in 11576')."
      ),
    category: z
      .string()
      .optional()
      .describe(
        "Optional category: respite, support, daycare, homecare, medical, community, meals, transport, hospice, memory"
      ),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    resources?: string;
    sources?: Array<{ placeId: string; name: string; address?: string }>;
    widgetToken?: string;
    error?: string;
    suggestion?: string;
    message?: string;
  }> => {
    // Check onboarding policy (crisis path bypasses this)
    const check = await ctx.runQuery(internal.internal.onboarding.enforcePolicy, {
      userId: ctx.userId! as Id<"users">,
      interactionType: "resource_search",
    });

    if (!check.allowed) {
      return {
        error: "missing_field",
        suggestion: check.question,
        message: check.question,
        resources: check.question || "Please provide your zip code to search for resources.",
      };
    }

    const result = await ctx.runAction(internal.resources.searchResources, {
      userId: ctx.userId! as Id<"users">,
      query: args.query,
      category: args.category,
    });
    
    // Handle error responses
    if ('error' in result) {
      return {
        error: result.error,
        suggestion: result.suggestion,
        message: result.message,
        resources: result.message || result.suggestion || 'Unable to search resources at this time.',
      };
    }
    
    return result;
  },
});

/**
 * 2. startAssessment - Begin assessment session
 */
export const startAssessment = createTool({
  description:
    "Begin a wellness assessment (EMA, CWBS, REACH-II, or SDOH). Checks cooldown periods and creates assessment session.",
  args: z.object({
    assessmentType: z
      .enum(["ema", "cwbs", "reach2", "sdoh"])
      .describe("Type of assessment to start"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    message: string;
    nextStep: string;
  }> => {
    // Check onboarding policy (crisis path bypasses this)
    const check = await ctx.runQuery(internal.internal.onboarding.enforcePolicy, {
      userId: ctx.userId! as Id<"users">,
      interactionType: "assessment",
    });

    if (!check.allowed) {
      return {
        success: false,
        message: check.question || "Please provide information about who you're caring for.",
        nextStep: "",
      };
    }

    const result = await ctx.runMutation(
      internal.internal.assessments.startAssessment,
      {
        userId: ctx.userId! as Id<"users">,
        assessmentType: args.assessmentType,
      }
    );
    return result;
  },
});

/**
 * 3. checkWellnessStatus - Get current burnout score
 */
export const checkWellnessStatus = createTool({
  description:
    "Get the user's current burnout score, band, and pressure zones from their latest assessment.",
  args: z.object({}),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    score: number;
    band: string;
    zones: Record<string, number>;
    lastAssessment: string;
  }> => {
    const result = await ctx.runQuery(internal.internal.wellness.getWellnessStatus, {
      userId: ctx.userId! as Id<"users">,
    });
    return result;
  },
});

/**
 * 4. findInterventions - Match interventions to zones
 */
export const findInterventions = createTool({
  description:
    "Find evidence-based interventions matched to specific pressure zones (emotional, physical, social, time, financial).",
  args: z.object({
    zones: z
      .array(z.string())
      .describe("Array of zone names to match interventions for"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    interventions: Array<{
      title: string;
      description: string;
      category: string;
      evidenceLevel: string;
      duration: string;
    }>;
    error?: string;
    message?: string;
  }> => {
    // Check onboarding policy (crisis path bypasses this)
    const check = await ctx.runQuery(internal.internal.onboarding.enforcePolicy, {
      userId: ctx.userId! as Id<"users">,
      interactionType: "intervention",
    });

    if (!check.allowed) {
      return {
        interventions: [],
        error: "missing_field",
        message: check.question || "Please provide information about who you're caring for.",
      };
    }

    const result = await ctx.runQuery(internal.internal.interventions.findByZones, {
      zones: args.zones,
    });
    return result;
  },
});

/**
 * 5. recordMemory - Save user context
 */
export const recordMemory = createTool({
  description:
    "Save important user context (care routines, preferences, triggers, family health info) for future reference. Agent Component handles semantic search automatically.",
  args: z.object({
    category: z
      .enum([
        "care_routine",
        "preference",
        "intervention_result",
        "crisis_trigger",
        "family_health",
      ])
      .describe("Category of memory"),
    content: z.string().describe("Content to remember"),
    importance: z
      .number()
      .min(1)
      .max(10)
      .describe("Importance score (1-10, 7+ for embedding)"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<{ success: boolean }> => {
    await ctx.runMutation(internal.internal.memories.recordMemory, {
      userId: ctx.userId! as Id<"users">,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });
    return { success: true };
  },
});

/**
 * 6. updateProfile - Update user metadata
 */
export const updateProfile = createTool({
  description:
    "Update user profile metadata (care recipient, zip code, timezone, check-in time, onboarding stage, etc.).",
  args: z.object({
    field: z.string().describe("Field name to update"),
    value: z.any().describe("Value to set"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<{ success: boolean }> => {
    await ctx.runMutation(internal.internal.users.updateProfile, {
      userId: ctx.userId! as Id<"users">,
      field: args.field,
      value: args.value,
    });
    return { success: true };
  },
});

/**
 * 7. trackInterventionPreference - Log intervention interaction
 */
export const trackInterventionPreference = createTool({
  description:
    "Track user interaction with an intervention (viewed, tried, helpful, not helpful, etc.).",
  args: z.object({
    interventionId: z.string().describe("Intervention ID"),
    status: z.string().describe("Interaction status (viewed, tried, helpful, etc.)"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<{ success: boolean }> => {
    await ctx.runMutation(internal.internal.interventions.trackEvent, {
      userId: ctx.userId! as Id<"users">,
      interventionId: args.interventionId,
      status: args.status,
    });
    return { success: true };
  },
});

/**
 * 8. getInterventions - Retrieve intervention details (Assessment Agent only)
 */
export const getInterventions = createTool({
  description:
    "Retrieve detailed information about specific interventions by their IDs. Used by Assessment Agent after scoring.",
  args: z.object({
    interventionIds: z.array(z.string()).describe("Array of intervention IDs"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    interventions: Array<{
      title: string;
      description: string;
      category: string;
      evidenceLevel: string;
      duration: string;
      content: string;
    }>;
  }> => {
    const result = await ctx.runQuery(internal.internal.interventions.getByIds, {
      interventionIds: args.interventionIds,
    });
    return result;
  },
});

