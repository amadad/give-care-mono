import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import type { ActionCtx } from '../_generated/server';
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
 * Estimate cost based on model and token usage
 * Prices are per 1M tokens in cents
 */
function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 250, output: 1000 }, // $2.50/$10 per 1M tokens
    'gpt-4o-mini': { input: 15, output: 60 }, // $0.15/$0.60 per 1M tokens
    'gpt-4-turbo': { input: 1000, output: 3000 }, // $10/$30 per 1M tokens
    'o1-preview': { input: 1500, output: 6000 }, // $15/$60 per 1M tokens
    'o1-mini': { input: 300, output: 1200 }, // $3/$12 per 1M tokens
  };

  const modelPricing = pricing[model] || { input: 15, output: 60 }; // Default to gpt-4o-mini pricing

  const inputCost = (promptTokens / 1_000_000) * modelPricing.input;
  const outputCost = (completionTokens / 1_000_000) * modelPricing.output;

  return Math.round(inputCost + outputCost);
}

/**
 * Internal mutation to insert LLM usage records
 */
export const insertLLMUsage = internalMutation({
  args: {
    userId: v.optional(v.id('users')),
    agentName: v.optional(v.string()),
    threadId: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    providerMetadata: v.optional(v.any()),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getBillingPeriod(Date.now());
    const estimatedCost = estimateCost(args.model, args.promptTokens, args.completionTokens);

    return await ctx.db.insert('llm_usage', {
      ...args,
      billingPeriod,
      estimatedCost,
    });
  },
});

/**
 * Shared usage handler for all agents
 * Tracks token usage and costs for billing and monitoring
 */
export const usageHandler: UsageHandler = async (ctx: ActionCtx, args) => {
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
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    providerMetadata,
    traceId: ctx.auth.getUserIdentity()?.tokenIdentifier, // Use for tracing
  });

  // Log for monitoring
  console.log('LLM Usage tracked:', {
    userId,
    agentName,
    model,
    totalTokens: usage.totalTokens,
  });
};

/**
 * Shared config for all agents with usage tracking
 */
export const sharedAgentConfig: Config = {
  usageHandler,
};
