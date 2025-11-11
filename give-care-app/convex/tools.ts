"use node";

/**
 * Consolidated Agent Tools
 *
 * All agent tools in one file. Previously split across 8 files, now consolidated.
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api, internal } from './_generated/api';
import type { AgentToolContext, ResourceResult } from './lib/types';

// ============================================================================
// RESOURCE SEARCH TOOL
// ============================================================================

export const searchResources = createTool({
  args: z.object({
    query: z.string().describe('Natural language query for caregiving resources. Can include zip code (e.g., "respite care near me in 11576", "support groups in 90210"). If zip code is in the query, it will be extracted automatically.'),
    category: z.string().optional().describe('Optional category: respite, support, daycare, homecare, medical, community, meals, transport, hospice, memory'),
  }),
  description: 'Search for local caregiving resources using Google Maps Grounding (real-time data from 250M+ places). Returns nearby services like respite care, support groups, adult day care, home health agencies, and community resources with real addresses, hours, ratings, and phone numbers. Zip code can be provided in the query (e.g., "support groups in 11576") or must be in user profile.',
  handler: async (ctx, args: { query: string; category?: string }): Promise<{ error?: string; suggestion?: string; resources?: string; sources?: ResourceResult[]; widgetToken?: string }> => {
    const toolCtx = ctx as unknown as AgentToolContext;
    const userMetadata = toolCtx.metadata?.context?.metadata || {};

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
// START ASSESSMENT TOOL
// ============================================================================

export const startAssessment = createTool({
  args: z.object({
    assessmentType: z.enum(['ema', 'bsfc', 'reach2', 'sdoh']).describe('Type of assessment to start'),
  }),
  description: 'Begin a wellness assessment. This will initiate a structured check-in to track burnout, stress, or other wellness metrics.',
  handler: async (ctx, args: { assessmentType: string }): Promise<{ error?: string; success?: boolean; assessmentType?: string; message?: string; nextStep?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { error: 'User ID not available' };
    }

    try {
      await ctx.runMutation(api.assessments.startAssessment, {
        userId,
        definition: args.assessmentType as 'ema' | 'bsfc' | 'reach2' | 'sdoh',
        channel: 'sms',
      });

      return {
        success: true,
        assessmentType: args.assessmentType,
        message: `Starting ${args.assessmentType.toUpperCase()} now.`,
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

// ============================================================================
// WELLNESS STATUS TOOL
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

// ============================================================================
// FIND INTERVENTIONS TOOL
// ============================================================================

const DEFAULT_ZONES = ['emotional', 'physical'] as const;

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
      zones = status.pressureZones || [...DEFAULT_ZONES];
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
// GET INTERVENTIONS TOOL (for Assessment Agent)
// ============================================================================

export const getInterventions = createTool({
  args: z.object({
    zones: z.array(z.string()).describe('Pressure zones from assessment'),
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

// ============================================================================
// RECORD MEMORY TOOL
// ============================================================================

export const recordMemory = createTool({
  args: z.object({
    content: z.string().describe('The information to remember about the user'),
    category: z.enum(['care_routine', 'preference', 'intervention_result', 'crisis_trigger', 'family_health']).describe('Category of memory: family_health for care recipient conditions/diagnoses, care_routine for daily activities, preference for user choices, intervention_result for outcomes, crisis_trigger for warning signs'),
    importance: z.number().min(1).max(10).describe('Importance score (1-10): 9-10=critical, 6-8=important, 3-5=useful, 1-2=minor'),
  }),
  description: 'Save important information about the user to build context over time. Use family_health for care recipient medical conditions, care_routine for daily schedules, preference for user choices, intervention_result for outcomes, and crisis_trigger for warning signs.',
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
// UPDATE PROFILE TOOL
// ============================================================================

export const updateProfile = createTool({
  args: z.object({
    firstName: z.string().optional().describe('User\'s first name'),
    relationship: z.string().optional().describe('Relationship to care recipient (e.g., "daughter", "son", "spouse")'),
    careRecipientName: z.string().optional().describe('Name of person being cared for'),
    zipCode: z.string()
      .optional()
      .refine(
        (val) => !val || /^\d{5}(-\d{4})?$/.test(val),
        { message: 'ZIP code must be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)' }
      )
      .describe('ZIP code for finding local resources (5 digits or 5+4 format)'),
  }),
  description: 'Update user profile information. Only include fields that are being updated.',
  handler: async (ctx, args: { firstName?: string; relationship?: string; careRecipientName?: string; zipCode?: string }): Promise<{ success: boolean; error?: string; profile?: Record<string, unknown>; message?: string }> => {
    const userId = ctx.userId;

    if (!userId) {
      return { success: false, error: 'User ID not available' };
    }

    if (args.zipCode && !/^\d{5}(-\d{4})?$/.test(args.zipCode)) {
      return {
        success: false,
        error: 'Invalid ZIP code format. Please use 5 digits (e.g., 12345) or 5+4 format (e.g., 12345-6789)',
      };
    }

    const toolCtx = ctx as unknown as AgentToolContext;
    const metadata = toolCtx.metadata?.context?.metadata || {};
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
        await ctx.runMutation(internal.internal.updateUserMetadata, {
          userId: convexUserId as any,
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
// TRACK INTERVENTION PREFERENCE TOOL
// ============================================================================

export const trackInterventionPreference = createTool({
  args: z.object({
    interventionId: z.string(),
    status: z.enum(['tried', 'liked', 'disliked', 'helpful', 'not_helpful']),
  }),
  description: 'Record whether the user tried/liked/disliked an intervention',
  handler: async (ctx, args) => {
    const user = (ctx as any).userId;
    if (!user) {
      return { success: false, error: 'No user ID available' };
    }

    const convexUser = await ctx.runQuery(internal.internal.getByExternalIdQuery, {
      externalId: user,
    });

    if (!convexUser) {
      return { success: false, error: 'User not found' };
    }

    await ctx.runMutation(internal.interventions.recordInterventionEvent, {
      userId: convexUser._id,
      interventionId: args.interventionId,
      status: args.status,
    });

    return { success: true };
  },
});

