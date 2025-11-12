/**
 * LLM Model Configuration
 */

import { openai } from "@ai-sdk/openai";

// Main Agent: Cost-effective for high volume (95% of traffic)
export const MAIN_MODEL = openai.chat("gpt-4o-mini");

// Assessment Agent: Same model for consistency
export const ASSESSMENT_MODEL = openai.chat("gpt-4o-mini");

// Embedding model for vector search (Agent Component uses this)
export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

