/**
 * Type extensions for OpenAI Agents SDK
 *
 * These types extend the official SDK types to include features that exist
 * at runtime but aren't yet exposed in the TypeScript definitions.
 *
 * Last verified: @openai/agents v0.1.9
 */

/**
 * Extended model settings with service_tier support
 *
 * The Responses API supports service_tier parameter for priority routing:
 * - "priority": Fastest processing (~20-30% faster), ~40% cost increase
 * - "auto": Uses scale tier quota if available
 * - "default": Standard processing
 * - "flex": 50% cheaper, higher latency (gpt-5 models only)
 *
 * Reference: https://platform.openai.com/docs/guides/responses
 */
export interface ExtendedModelSettings {
  reasoning?: { effort: "minimal" | "low" | "medium" | "high" };
  text?: { verbosity: "low" | "medium" | "high" };
  maxTokens?: number;
  store?: boolean;
  service_tier?: "priority" | "auto" | "default" | "flex";
}

/**
 * Run result with internal state access
 *
 * The SDK's run() function returns context updates via result.state,
 * but this isn't exposed in the public types yet.
 */
export interface RunResultWithContext<T> {
  finalOutput: string | object;
  state?: { context: T };
  agentName?: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
  }>;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  sessionId?: string;
  serviceTier?: "priority" | "auto" | "default" | "flex";
}

/**
 * Type guard to safely access context from run result
 *
 * Usage:
 * ```typescript
 * const result = await run(agent, message, { context });
 * if (hasContextState(result)) {
 *   const updatedContext = result.state.context;
 * }
 * ```
 */
export function hasContextState<T>(
  result: any
): result is RunResultWithContext<T> {
  return Boolean(
    result &&
    typeof result === 'object' &&
    result.state &&
    typeof result.state === 'object' &&
    result.state.context
  );
}

/**
 * Token usage metrics from OpenAI API response
 *
 * Extracted from result.usage (exists at runtime but not in types)
 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * Extract token usage safely from run result
 *
 * Usage:
 * ```typescript
 * const result = await run(agent, message);
 * const tokens = extractTokenUsage(result);
 * if (tokens) {
 *   console.log(`Used ${tokens.total} tokens`);
 * }
 * ```
 */
export function extractTokenUsage(result: any): TokenUsage | undefined {
  const usage = (result as any)?.usage;
  if (!usage) return undefined;

  const input = usage.inputTokens || 0;
  const output = usage.outputTokens || 0;

  return {
    input,
    output,
    total: input + output,
  };
}

/**
 * Extract service tier from run result
 *
 * The OpenAI API returns the actual service tier used in the response.
 * This may differ from the requested tier (e.g., "auto" resolves to "priority" or "default").
 *
 * Usage:
 * ```typescript
 * const result = await run(agent, message);
 * const tier = extractServiceTier(result);
 * console.log(`Request used ${tier} service tier`);
 * ```
 */
export function extractServiceTier(result: any): "priority" | "auto" | "default" | "flex" | undefined {
  // Check for serviceTier in result (may be in different locations depending on SDK version)
  const tier = (result as any)?.serviceTier
    || (result as any)?.service_tier
    || (result as any)?.usage?.serviceTier
    || (result as any)?.usage?.service_tier;

  if (!tier) return undefined;

  // Validate it's a known tier value
  if (tier === "priority" || tier === "auto" || tier === "default" || tier === "flex") {
    return tier;
  }

  return undefined;
}
