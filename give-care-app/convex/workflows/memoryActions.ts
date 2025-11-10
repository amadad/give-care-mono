"use node";

/**
 * Memory Enrichment Actions
 *
 * Extract long-term memories and build enriched context
 */

import { internalAction } from '../_generated/server';
import { internal, api } from '../_generated/api';
import { v } from 'convex/values';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
      const result = await generateText({
        model: openai('gpt-4o-mini'), // Fast model for extraction
        prompt: `Extract important long-term facts about this caregiver from the conversation below.
Focus on:
- Care recipient details (name, condition, relationship)
- Caregiver stress levels, triggers, coping strategies
- Important dates, routines, preferences
- Crisis indicators or concerning patterns

Return as JSON array of facts with importance 1-10:
[{"fact": "...", "category": "care_routine|preference|crisis_trigger|intervention_result", "importance": 8}]

Conversation:
${conversationText}

JSON:`,
        temperature: 0.3,
      });

      const facts = JSON.parse(result.text);
      return Array.isArray(facts) ? facts : [];
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
        model: openai('gpt-4o-mini'),
        prompt: `Summarize these caregiver facts into a concise context paragraph (max 200 words) for use in future conversations:

${memoriesText}

Focus on:
- Who they are (name, relationship)
- Care situation (recipient, condition)
- Current challenges and stress levels
- Important patterns or triggers

Context summary:`,
        temperature: 0.3,
      });

      return result.text;
    } catch (error) {
      console.error('[memory-enrichment] Context building failed:', error);
      return null;
    }
  },
});
