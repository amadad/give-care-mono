"use node";

/**
 * Memory Enrichment Actions
 *
 * Extract long-term memories and build enriched context
 */

import { internalAction } from '../_generated/server';
import { internal, api } from '../_generated/api';
import { v } from 'convex/values';
import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// ============================================================================
// EXTRACT FACTS ACTION
// ============================================================================

export const extractFacts = internalAction({
  args: {
    userId: v.string(),
    recentMessages: v.array(v.any()),
  },
  handler: async (ctx, { userId, recentMessages }) => {
    // Skip if no meaningful conversation
    if (recentMessages.length < 2) return [];

    const conversationText = recentMessages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      // ✅ Use generateObject with Zod schema for structured output
      const result = await generateObject({
        model: google('gemini-2.5-flash-lite'), // Fastest model for extraction
        prompt: `Extract important long-term facts about this caregiver from the conversation below.
Focus on:
- Care recipient details (name, condition, relationship)
- Caregiver stress levels, triggers, coping strategies
- Important dates, routines, preferences
- Crisis indicators or concerning patterns

Conversation:
${conversationText}`,
        schema: z.array(
          z.object({
            fact: z.string().describe('The fact to remember'),
            category: z.enum(['care_routine', 'preference', 'crisis_trigger', 'intervention_result']),
            importance: z.number().min(1).max(10).describe('Importance score 1-10'),
          })
        ),
        temperature: 0.2, // Very low for consistent extraction
        providerOptions: {
          google: {
            topP: 0.8,
            maxOutputTokens: 500,
          },
        },
      });

      // ✅ generateObject returns structured data directly - no parsing needed!
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
    // Get recent memories for this user
    const memories = await ctx.runQuery(api.public.listMemories, {
      userId,
      limit: 10,
    });

    if (!memories || memories.length === 0) {
      return null;
    }

    // Build enriched context summary
    const memoriesText = memories
      .map((m: any) => `[${m.category}] ${m.content} (importance: ${m.importance})`)
      .join('\n');

    try {
      const result = await generateText({
        model: google('gemini-2.5-flash-lite'), // Fastest model for context building
        prompt: `Summarize these caregiver facts into a concise context paragraph (max 200 words) for use in future conversations:

${memoriesText}

Focus on:
- Who they are (name, relationship)
- Care situation (recipient, condition)
- Current challenges and stress levels
- Important patterns or triggers

Context summary:`,
        temperature: 0.3, // Low for consistent summaries
        topP: 0.9,
        maxOutputTokens: 300, // ~200 words = ~300 tokens
        providerOptions: {
          google: {
            // No special options needed for text summarization
          },
        },
      });

      return result.text;
    } catch (error) {
      console.error('[memory-enrichment] Context building failed:', error);
      return null;
    }
  },
});
