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
  return !!(result && typeof result === 'object' && 'state' in result);
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
