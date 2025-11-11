"use node";

/**
 * Memory Enrichment Actions
 *
 * Extract long-term memories and build enriched context
 */

import { internalAction } from '../_generated/server';
import { internal, api } from '../_generated/api';
import { v } from 'convex/values';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { LANGUAGE_MODELS } from '../lib/models';
import { FACT_EXTRACTION_TIMEOUT_MS, CONTEXT_BUILDING_TIMEOUT_MS, DEFAULT_MEMORY_LIMIT } from '../lib/constants';

// ============================================================================
// EXTRACT FACTS ACTION
// ============================================================================

export const extractFacts = internalAction({
  args: {
    userId: v.string(),
    recentMessages: v.array(v.any()),
  },
  handler: async (ctx, { userId, recentMessages }) => {
    // Skip if no meaningful conversation (reduced threshold for speed)
    if (recentMessages.length < 2) return [];

    // Limit to last 3 messages for faster processing (reduced from all)
    const limitedMessages = recentMessages.slice(-3);
    const conversationText = limitedMessages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      // Use generateObject with Zod schema for structured output
      // Optimized for speed: faster model, reduced tokens, timeout protection
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Fact extraction timeout after 2s')), FACT_EXTRACTION_TIMEOUT_MS);
      });

      const extractionPromise = generateObject({
        model: LANGUAGE_MODELS.memory,
        prompt: `Extract important long-term facts about this caregiver from the conversation below.
Focus on:
- Care recipient details (name, condition, relationship) - use 'family_health'
- Caregiver stress levels, triggers, coping strategies
- Important dates, routines, preferences
- Crisis indicators or concerning patterns

Conversation:
${conversationText}`,
        schema: z.array(
          z.object({
            fact: z.string().describe('The fact to remember'),
            category: z.enum(['care_routine', 'preference', 'crisis_trigger', 'intervention_result', 'family_health']),
            importance: z.number().min(1).max(10).describe('Importance score 1-10'),
          })
        ),
        temperature: 0.2, // Very low for consistent extraction
        providerOptions: {
          google: {
            topP: 0.8,
            maxOutputTokens: 300, // Reduced from 500 for faster responses
          },
        },
      });

      const result = await Promise.race([extractionPromise, timeoutPromise]);

      // generateObject returns structured data directly - no parsing needed!
      return result.object;
    } catch (error) {
      console.error('[memory-enrichment] Fact extraction failed:', error);
      return [];
    }
  },
});

// ============================================================================
// BUILD CONTEXT ACTION
// ============================================================================

export const buildContext = internalAction({
  args: {
    userId: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { userId, threadId }) => {
    // Get fewer memories for faster processing (reduced from 10 to 5)
    const memories = await ctx.runQuery(api.public.listMemories, {
      userId,
      limit: DEFAULT_MEMORY_LIMIT,
    });

    if (!memories || memories.length === 0) {
      return null;
    }

    // Build enriched context summary
    const memoriesText = memories
      .map((m: any) => `[${m.category}] ${m.content} (importance: ${m.importance})`)
      .join('\n');

    try {
      // Add timeout protection (2s max)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Context building timeout after 2s')), CONTEXT_BUILDING_TIMEOUT_MS);
      });

      const generationPromise = generateText({
        model: LANGUAGE_MODELS.memory,
        prompt: `Summarize these caregiver facts into a concise context paragraph (max 150 words) for use in future conversations:

${memoriesText}

Focus on:
- Who they are (name, relationship)
- Care situation (recipient, condition)
- Current challenges and stress levels
- Important patterns or triggers

Context summary:`,
        temperature: 0.3, // Low for consistent summaries
        topP: 0.9,
        maxOutputTokens: 200, // Reduced from 300 for faster responses (~150 words)
        providerOptions: {
          google: {
            // No special options needed for text summarization
          },
        },
      });

      const result = await Promise.race([generationPromise, timeoutPromise]);

      return result.text;
    } catch (error) {
      console.error('[memory-enrichment] Context building failed:', error);
      return null;
    }
  },
});
