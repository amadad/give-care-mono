import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Config, UsageHandler } from '@convex-dev/agent';

/**
 * Get billing period in YYYY-MM format
 */
function getBillingPeriod(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Internal mutation to insert LLM usage records
 * Stores the raw usage object from AI SDK
 */
export const insertLLMUsage = internalMutation({
  args: {
    userId: v.optional(v.id('users')),
    agentName: v.optional(v.string()),
    threadId: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: v.any(), // Store raw usage object from AI SDK
    providerMetadata: v.optional(v.any()),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getBillingPeriod(Date.now());

    return await ctx.db.insert('llm_usage', {
      ...args,
      billingPeriod,
    });
  },
});

/**
 * Shared usage handler for all agents
 * Tracks token usage and costs for billing and monitoring
 */
export const usageHandler: UsageHandler = async (ctx, args) => {
  if (!args.usage) {
    console.debug('No usage data provided');
    return;
  }

  const { usage, userId, threadId, agentName, model, provider, providerMetadata, metadata } = args;

  // Extract actual Convex user ID from metadata if available
  // (userId from agent is the externalId string)
  const convexUserId = (metadata as any)?.convexUserId;

  await ctx.runMutation(internal.lib.usage.insertLLMUsage, {
    userId: convexUserId, // Use actual Convex ID from metadata
    agentName,
    threadId,
    model,
    provider,
    usage, // Store entire usage object as-is
    providerMetadata,
  });

  // Log for monitoring
  console.log('LLM Usage tracked:', {
    userId,
    convexUserId,
    agentName,
    model,
  });
};

/**
 * Shared config for all agents with usage tracking
 */
export const sharedAgentConfig: Config = {
  usageHandler,
};
