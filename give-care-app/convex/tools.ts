/**
 * Agent Tools
 * Simplified to 4 core tools: getResources, startAssessment, recordObservation, trackInterventionHelpfulness
 */

"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "./_generated/api";
import type { ToolCtx } from "@convex-dev/agent";
import { Id } from "./_generated/dataModel";

/**
 * Extract ZIP code from query string (inline helper)
 */
function extractZipFromQuery(query: string): string | null {
  const zipMatch = query.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
}

/**
 * 1. getResources - Resource search with graceful degradation
 * No ZIP → national resources, Has ZIP → local, Has score → targeted by worst zone
 */
export const getResources = createTool({
  description:
    "Search for caregiving resources. Works progressively: returns national resources if no ZIP code, local resources if ZIP provided, and targeted resources if user has a score and worst zone identified. If user mentions a ZIP code in their message, extract it and use it in the query.",
  args: z.object({
    query: z
      .string()
      .describe(
        "Natural language query for resources (e.g., 'respite care', 'support groups'). Can include zip code (e.g., 'respite care near me in 11576')."
      ),
    zone: z
      .string()
      .optional()
      .describe(
        "Optional pressure zone (P1-P6) to target resources. Use when user has a score and worst zone is known."
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
    // Extract ZIP from query if present
    const zipFromQuery = extractZipFromQuery(args.query);
    
    // Get user to check for ZIP and score
    const user = await ctx.runQuery(internal.internal.users.getUser, {
      userId: ctx.userId as Id<"users">,
    });

    const userZip = user?.zipCode || (user?.metadata as any)?.zipCode || zipFromQuery;
    const hasScore = user?.gcSdohScore !== undefined && user.gcSdohScore !== null;

    // Call resource search with graceful degradation
    const result = await ctx.runAction(internal.resources.searchResources, {
      userId: ctx.userId as Id<"users">,
      query: args.query,
      zipCode: userZip || undefined,
      zone: args.zone || undefined,
      hasScore,
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
 * 2. startAssessment - Begin assessment session (EMA or SDOH only)
 */
export const startAssessment = createTool({
  description:
    "Begin a wellness assessment (EMA or SDOH-28). EMA is a quick 3-question daily check-in. SDOH-28 is a comprehensive 28-question assessment that should only be suggested if user has never taken it or it's been 30+ days since last completion.",
  args: z.object({
    assessmentType: z
      .enum(["ema", "sdoh"])
      .describe("Type of assessment to start: 'ema' for daily check-in, 'sdoh' for comprehensive assessment"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    message: string;
    nextStep: string;
  }> => {
    const result = await ctx.runMutation(
      internal.internal.assessments.startAssessment,
      {
        userId: ctx.userId as Id<"users">,
        assessmentType: args.assessmentType,
      }
    );
    return result;
  },
});

/**
 * 3. recordObservation - Infer P2 (Physical Health) from conversation
 */
export const recordObservation = createTool({
  description:
    "Record observations about the user's physical health from conversation. Use when user mentions physical symptoms like exhaustion, pain, sleep issues, or health concerns. This updates the P2 (Physical Health) zone score.",
  args: z.object({
    observation: z
      .string()
      .describe("What the user said about their physical health (e.g., 'I'm exhausted', 'I have back pain', 'I can't sleep')"),
    zone: z
      .string()
      .optional()
      .describe("Pressure zone (defaults to P2 for physical health, but can specify other zones if relevant)"),
    severity: z
      .number()
      .min(1)
      .max(5)
      .describe("Severity level (1=mild, 5=severe) based on language intensity"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const zone = args.zone || "P2"; // Default to P2 (Physical Health)
    
    // Convert severity (1-5) to zone score (0-100)
    // Higher severity = higher score (more stress)
    const zoneScore = ((args.severity - 1) / 4) * 100;

    await ctx.runMutation(internal.internal.score.updateZone, {
      userId: ctx.userId as Id<"users">,
      zone,
      value: zoneScore,
    });

    return {
      success: true,
      message: `Recorded observation about ${zone === "P2" ? "physical health" : zone}`,
    };
  },
});

/**
 * 4. trackInterventionHelpfulness - Simple "Did this help?" tracking
 */
export const trackInterventionHelpfulness = createTool({
  description:
    "Track whether a resource or intervention was helpful to the user. Simple yes/no feedback for closed-loop learning.",
  args: z.object({
    resourceId: z
      .string()
      .describe("ID of the resource or intervention the user interacted with"),
    helpful: z
      .boolean()
      .describe("Whether the resource was helpful (true) or not helpful (false)"),
  }),
  handler: async (ctx: ToolCtx, args): Promise<{ success: boolean }> => {
    await ctx.runMutation(internal.internal.learning.trackHelpfulnessMutation, {
      userId: ctx.userId as Id<"users">,
      resourceId: args.resourceId,
      helpful: args.helpful,
    });
    return { success: true };
  },
});

/**
 * 5. findInterventions - Recommend micro-interventions matched to user zones
 */
export const findInterventions = createTool({
  description:
    "Recommend 1-3 micro-interventions matched to user's pressure zones (P1-P6). Use after assessments or when zones are referenced in conversation.",
  args: z.object({
    zones: z
      .array(z.string())
      .describe("Pressure zones to match interventions (e.g., ['P1', 'P6'])"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of interventions to return (default: 3)"),
  }),
  handler: async (
    ctx: ToolCtx,
    args
  ): Promise<{
    interventions: Array<{
      _id: string;
      title: string;
      description: string;
      category: string;
      duration: string;
      content: string;
    }>;
  }> => {
    const result = await ctx.runQuery(internal.interventions.findInterventions, {
      zones: args.zones,
      limit: args.limit || 3,
    });

    return {
      interventions: result.map((intervention: any) => ({
        _id: intervention._id,
        title: intervention.title,
        description: intervention.description,
        category: intervention.category,
        duration: intervention.duration,
        content: intervention.content,
      })),
    };
  },
});
