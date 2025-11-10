"use node";

/**
 * Update Profile Tool
 * Update user profile information
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { internal } from '../_generated/api';

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
