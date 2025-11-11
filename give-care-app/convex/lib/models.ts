import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

/**
 * Centralized model configuration for all agents and workflows.
 *
 * Using gemini-2.5-flash-lite across all agents for:
 * - Fast response times (~1-2s)
 * - Cost efficiency
 * - Consistent behavior across agent types
 *
 * Text embeddings use OpenAI text-embedding-3-small for:
 * - Proven semantic search quality
 * - Compatibility with existing vector indexes
 */

export const LANGUAGE_MODELS = {
  main: google('gemini-2.5-flash-lite'),
  crisis: google('gemini-2.5-flash-lite'),
  assessment: google('gemini-2.5-flash-lite'),
  memory: google('gemini-2.5-flash-lite'),
} as const;

export const EMBEDDING_MODELS = {
  default: openai.embedding('text-embedding-3-small'),
} as const;
