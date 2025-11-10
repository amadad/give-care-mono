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
        model: google('gemini-2.5-flash-lite'), // Fastest model for extraction
        prompt: `Extract important long-term facts about this caregiver from the conversation below.
Focus on:
- Care recipient details (name, condition, relationship)
- Caregiver stress levels, triggers, coping strategies
- Important dates, routines, preferences
- Crisis indicators or concerning patterns

Return ONLY valid JSON array (no markdown, no code blocks):
[{"fact": "...", "category": "care_routine|preference|crisis_trigger|intervention_result", "importance": 8}]

Conversation:
${conversationText}`,
        temperature: 0.2, // Very low for consistent extraction
        topP: 0.8, // Focused extraction
        maxOutputTokens: 500, // Facts can be multiple items
        providerOptions: {
          google: {
            responseMimeType: 'application/json', // ✅ Force JSON output (Gemini-specific)
          },
        },
      });

      // ✅ Fix: Strip markdown code blocks if present
      let jsonText = result.text.trim();
      // Remove ```json and ``` markers
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      // If still wrapped in ```, remove those too
      jsonText = jsonText.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

      const facts = JSON.parse(jsonText);
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
