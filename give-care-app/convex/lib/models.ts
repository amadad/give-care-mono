/**
 * LLM Model Configuration
 *
 * Hybrid Approach:
 * - Gemini 2.5 Flash: Main Agent (50% cheaper, optimized for low latency)
 * - GPT-5 mini: Assessment Agent (clinical accuracy for 5% of traffic)
 * - OpenAI embeddings: Proven with Agent Component
 */

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

// Main Agent: Gemini 2.5 Flash for 95% of traffic
// 50% cost savings, faster responses, SMS-optimized
export const MAIN_MODEL = google("gemini-2.5-flash-latest");

// Assessment Agent: Keep GPT-5 mini for clinical accuracy
// Clinical scoring, intervention matching (5% of traffic)
export const ASSESSMENT_MODEL = openai.chat("gpt-5-mini");

// Embedding model for vector search (Agent Component uses this)
export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

