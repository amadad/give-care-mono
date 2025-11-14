/**
 * LLM Model Configuration
 *
 * Model Selection (GPT-5 series):
 * - gpt-5-nano: High-throughput, simple instruction-following (Main Agent)
 * - gpt-5-mini: Cost-optimized reasoning, balances speed/cost/capability (Assessment)
 * - gpt-5.1: Complex reasoning, broad knowledge (future consideration)
 */

import { openai } from "@ai-sdk/openai";

// Main Agent: High-throughput for 95% of traffic
// Simple instruction-following: resource search, profile updates, check-ins
export const MAIN_MODEL = openai.chat("gpt-5-nano");

// Assessment Agent: Reasoning-optimized for 5% of traffic
// Clinical scoring, intervention matching requires more reasoning
export const ASSESSMENT_MODEL = openai.chat("gpt-5-mini");

// Embedding model for vector search (Agent Component uses this)
export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

