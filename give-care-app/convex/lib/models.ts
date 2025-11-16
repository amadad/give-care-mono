/**
 * LLM Model Configuration
 *
 * Hybrid Approach:
 * - Gemini 2.0 Flash: Main Agent (50% cheaper, optimized for low latency)
 * - GPT-4o mini: Assessment Agent (clinical accuracy for 5% of traffic)
 * - OpenAI embeddings: Proven with Agent Component
 */

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

// Main Agent: Using Gemini 2.5 Flash-Lite (better quota limits than 2.0-flash-exp)
// Switched from 2.0-flash-exp due to free tier quota issues
// In CI/test environments, use OpenAI to avoid Google quota limits
// Note: Temperature would be configured at generation time via Agent Component
const IS_CI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
export const MAIN_MODEL = IS_CI
  ? openai("gpt-4o-mini")
  : google("gemini-2.5-flash-lite");

// Assessment Agent: GPT-4o mini for clinical accuracy
// Clinical scoring, intervention matching (5% of traffic)
// Note: Temperature would be configured at generation time via Agent Component
// Note: GPT-5 doesn't exist yet - using gpt-4o-mini instead
export const ASSESSMENT_MODEL = openai("gpt-4o-mini");

// Embedding model for vector search (Agent Component uses this)
export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

