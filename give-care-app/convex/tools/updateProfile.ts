"use node";

/**
 * Update Profile Tool
 * Update user profile information
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { internal } from '../_generated/api';
import type { AgentToolContext } from '../lib/types';

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

    // Validate zipCode format if provided (Zod validation should catch this, but double-check)
    if (args.zipCode && !/^\d{5}(-\d{4})?$/.test(args.zipCode)) {
      return {
        success: false,
        error: 'Invalid ZIP code format. Please use 5 digits (e.g., 12345) or 5+4 format (e.g., 12345-6789)',
      };
    }

    // Type-safe access to runtime metadata from Agent Component
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

