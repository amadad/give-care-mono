"use node";

/**
 * Resource Search Tool
 * Search for local caregiving resources using Google Maps
 */

import { createTool } from '@convex-dev/agent';
import { z } from 'zod';
import { api, internal } from '../_generated/api';

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

