import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import type { GenericActionCtx } from 'convex/server';
import type { Config, UsageHandler } from '@convex-dev/agent';
import type { DataModel } from '../_generated/dataModel';

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
export const usageHandler: UsageHandler = async (ctx: GenericActionCtx<DataModel>, args) => {
  if (!args.usage) {
    console.debug('No usage data provided');
    return;
  }

  const { usage, userId, threadId, agentName, model, provider, providerMetadata } = args;

  await ctx.runMutation(insertLLMUsage, {
    userId,
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
