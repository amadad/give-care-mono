"use node";

/**
 * Agent Tools - All tool definitions
 *
 * Tools are reusable capabilities that agents can call.
 * Following Convex Agent pattern: tools separate from agent definitions.
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api, internal } from './_generated/api';

// ============================================================================
// RESOURCES TOOL
// ============================================================================

export const searchResources = createTool({
  args: z.object({
    query: z.string().describe('Natural language query for caregiving resources (e.g., "respite care near me", "support groups")'),
    category: z.string().optional().describe('Optional category: respite, support, daycare, homecare, medical, community, meals, transport, hospice, memory'),
  }),
  description: 'Search for local caregiving resources using Google Maps. Returns nearby services like respite care, support groups, adult day care, home health agencies, and community resources with addresses, hours, and reviews.',
  handler: async (ctx, args: { query: string; category?: string }): Promise<{ error?: string; suggestion?: string; resources?: string; sources?: any[]; widgetToken?: string }> => {
    // @ts-expect-error - metadata property exists at runtime
    const contextData = ctx.metadata as { context?: { metadata?: Record<string, unknown> } };
    const userMetadata = contextData?.context?.metadata || {};

    const result = await ctx.runAction(api.resources.searchResources, {
      query: args.query,
      category: args.category,
      userId: ctx.userId,
      metadata: userMetadata,
    });

    if ('error' in result && result.error) {
      return {
        error: result.error,
        suggestion: result.suggestion ?? 'I need your zip code to find nearby resources. What\'s your zip code?',
      };
    }

    return {
      resources: result.resources,
      sources: result.sources,
      widgetToken: result.widgetToken,
    };
  },
});

// ============================================================================
// MEMORY TOOL
// ============================================================================

export const recordMemory = createTool({
  args: z.object({
    content: z.string().describe('The information to remember about the user'),
    category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger']).describe('Category of memory'),
    importance: z.number().min(1).max(10).describe('Importance score (1-10): 9-10=critical, 6-8=important, 3-5=useful, 1-2=minor'),
  }),
  description: 'Save important information about the user to build context over time. Use for care routines, preferences, intervention results, and crisis triggers.',
  handler: async (ctx, args: { content: string; category: string; importance: number }): Promise<{ success: boolean; error?: string; message?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { success: false, error: 'User ID not available' };
    }

    await ctx.runMutation(api.public.recordMemory, {
      userId,
      category: args.category,
      content: args.content,
      importance: args.importance,
    });

    return {
      success: true,
      message: 'Memory saved successfully',
    };
  },
});

// ============================================================================
// WELLNESS TOOLS
// ============================================================================

export const checkWellnessStatus = createTool({
  args: z.object({}),
  description: 'Fetch burnout trends, pressure zones, and wellness status over time. Shows recent scores and identifies areas needing support.',
  handler: async (ctx): Promise<any> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    const status = await ctx.runQuery(api.wellness.getStatus, {
      userId,
    });

    return status;
  },
});

export const findInterventions = createTool({
  args: z.object({
    zones: z.array(z.string()).optional().describe('Pressure zones to target (e.g., ["emotional", "physical", "time"]). If not provided, uses user\'s current pressure zones.'),
    minEvidenceLevel: z.enum(['high', 'moderate', 'low']).optional().describe('Minimum evidence level (default: moderate)'),
    limit: z.number().optional().describe('Maximum number of interventions (default: 5)'),
  }),
  description: 'Get evidence-based interventions matched to pressure zones. Returns micro-commitments and support strategies with evidence levels.',
  handler: async (ctx, args: { zones?: string[]; minEvidenceLevel?: 'high' | 'moderate' | 'low'; limit?: number }): Promise<{ error?: string; interventions?: any[]; zones?: string[] }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    let zones: string[] = args.zones || [];
    if (zones.length === 0) {
      const status = await ctx.runQuery(api.wellness.getStatus, {
        userId,
      });
      zones = status.pressureZones || ['emotional', 'physical'];
    }

    const interventions = await ctx.runQuery(api.interventions.getByZones, {
      zones,
      minEvidenceLevel: args.minEvidenceLevel || 'moderate',
      limit: args.limit || 5,
    });

    return {
      interventions,
      zones,
    };
  },
});

// ============================================================================
// PROFILE TOOL
// ============================================================================

export const updateProfile = createTool({
  args: z.object({
    firstName: z.string().optional().describe('User\'s first name'),
    relationship: z.string().optional().describe('Relationship to care recipient (e.g., "daughter", "son", "spouse")'),
    careRecipientName: z.string().optional().describe('Name of person being cared for'),
    zipCode: z.string().optional().describe('ZIP code for finding local resources'),
  }),
  description: 'Update user profile information. Only include fields that are being updated.',
  handler: async (ctx, args: { firstName?: string; relationship?: string; careRecipientName?: string; zipCode?: string }): Promise<{ success: boolean; error?: string; profile?: Record<string, unknown>; message?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { success: false, error: 'User ID not available' };
    }

    // @ts-expect-error - metadata property exists at runtime
    const contextData = ctx.metadata as { context?: { metadata?: Record<string, unknown> } };
    const metadata = contextData?.context?.metadata || {};
    const profile = (metadata.profile as Record<string, unknown>) || {};

    const updatedProfile = {
      ...profile,
      ...(args.firstName && { firstName: args.firstName }),
      ...(args.relationship && { relationship: args.relationship }),
      ...(args.careRecipientName && { careRecipientName: args.careRecipientName }),
      ...(args.zipCode && { zipCode: args.zipCode }),
    };

    const convexUserId = (metadata.convex as Record<string, unknown> | undefined)?.userId;
    if (convexUserId) {
      try {
        await ctx.runMutation(internal.core.updateUserMetadata, {
          userId: convexUserId,
          metadata: { ...metadata, profile: updatedProfile },
        });
      } catch (error) {
        return {
          success: false,
          error: `Failed to persist profile: ${String(error)}`,
        };
      }
    }

    return {
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully',
    };
  },
});

// ============================================================================
// ASSESSMENT TOOLS
// ============================================================================

export const startAssessment = createTool({
  args: z.object({
    assessmentType: z.enum(['burnout_v1', 'bsfc_v1', 'ema_v1', 'reach_ii_v1', 'sdoh_v1']).describe('Type of assessment to start'),
  }),
  description: 'Begin a wellness assessment. This will initiate a structured check-in to track burnout, stress, or other wellness metrics.',
  handler: async (ctx, args: { assessmentType: string }): Promise<{ error?: string; success?: boolean; assessmentType?: string; message?: string; nextStep?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    const mapType = (t: string): 'ema' | 'bsfc' | 'reach2' | 'sdoh' => {
      if (t === 'ema_v1') return 'ema';
      if (t === 'bsfc_v1') return 'bsfc';
      if (t === 'reach_ii_v1') return 'reach2';
      if (t === 'sdoh_v1') return 'sdoh';
      return 'ema';
    };

    const definition = mapType(args.assessmentType);

    try {
      await ctx.runMutation(api.public.startAssessment, {
        userId,
        definition,
        channel: 'sms',
      });

      return {
        success: true,
        assessmentType: args.assessmentType,
        message: `Starting ${definition.toUpperCase()} now.`,
        nextStep: 'I\'ll ask one question at a time.',
      };
    } catch (error) {
      return {
        error: String(error),
        success: false,
      };
    }
  },
});

export const getInterventions = createTool({
  args: z.object({
    zones: z.array(z.string()).describe('Pressure zones from BSFC assessment'),
    minEvidenceLevel: z.enum(['high', 'moderate', 'low']).optional().describe('Minimum evidence level (default: moderate)'),
    limit: z.number().optional().describe('Max number of interventions (default: 5)'),
  }),
  description: 'Lookup evidence-based caregiver interventions matching pressure zones. Use this to provide specific, research-backed recommendations.',
  handler: async (ctx, args: { zones: string[]; minEvidenceLevel?: 'high' | 'moderate' | 'low'; limit?: number }) => {
    const interventions = await ctx.runQuery(api.interventions.getByZones, {
      zones: args.zones,
      minEvidenceLevel: args.minEvidenceLevel || 'moderate',
      limit: args.limit || 5,
    });

    return { interventions };
  },
});
