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

// Main Agent: Gemini 2.0 Flash Experimental for 95% of traffic
// 50% cost savings, faster responses, SMS-optimized
// Note: Using -exp (experimental) variant for latest features
export const MAIN_MODEL = google("gemini-2.0-flash-exp");

// Assessment Agent: GPT-4o mini for clinical accuracy
// Clinical scoring, intervention matching (5% of traffic)
// Note: GPT-5 doesn't exist yet - using gpt-4o-mini instead
export const ASSESSMENT_MODEL = openai("gpt-4o-mini");

// Embedding model for vector search (Agent Component uses this)
export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

