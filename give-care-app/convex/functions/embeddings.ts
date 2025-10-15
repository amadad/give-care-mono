/**
 * Embedding Generation for Vector Search (Task 2)
 *
 * Uses OpenAI text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
 * for semantic search over knowledge base interventions.
 *
 * NOTE: Only actions use "use node" directive - queries/mutations run in Convex runtime
 */

import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import OpenAI from 'openai';

/**
 * Generate embedding for a text string
 *
 * @param text - Text to embed (title + description + content)
 * @returns 1536-dimensional embedding vector
 */
export const generateEmbedding = internalAction({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    "use node";

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
      input: args.text,
    });

    return response.data[0].embedding;
  },
});

/**
 * Generate embeddings for all knowledge base entries without embeddings
 *
 * Run once after adding new interventions:
 * `npx convex run functions/embeddings:generateAllEmbeddings`
 */
export const generateAllEmbeddings = internalAction({
  handler: async (ctx) => {
    "use node";

    // Get all knowledge base entries without embeddings
    const entries = await ctx.runQuery(internal.functions.embeddings.getAllWithoutEmbeddings);

    let generated = 0;
    let skipped = 0;

    for (const entry of entries) {
      // Combine title + description + content for richer embedding
      const textParts = [
        entry.title,
        entry.description,
        entry.content || '',
        // Include tags for better semantic matching
        entry.tags.join(' '),
        // Include pressure zones for context
        entry.pressureZones.join(' '),
      ];

      const text = textParts.filter(Boolean).join('\n');

      if (!text.trim()) {
        console.warn(`[Embeddings] Skipping entry ${entry._id} - no text content`);
        skipped++;
        continue;
      }

      try {
        const embedding = await ctx.runAction(internal.functions.embeddings.generateEmbedding, {
          text,
        });

        await ctx.runMutation(internal.functions.embeddings.updateEmbedding, {
          id: entry._id,
          embedding,
        });

        generated++;

        if (generated % 10 === 0) {
          console.log(`[Embeddings] Generated ${generated} embeddings...`);
        }
      } catch (error) {
        console.error(`[Embeddings] Failed to generate embedding for ${entry._id}:`, error);
      }
    }

    console.log(`[Embeddings] Complete: ${generated} generated, ${skipped} skipped`);
    return { generated, skipped, total: entries.length };
  },
});

/**
 * Get all knowledge base entries without embeddings
 */
export const getAllWithoutEmbeddings = internalQuery({
  handler: async (ctx) => {
    const entries = await ctx.db
      .query('knowledgeBase')
      .filter((q) => q.eq(q.field('embedding'), undefined))
      .collect();

    return entries;
  },
});

/**
 * Update embedding for a knowledge base entry
 */
export const updateEmbedding = internalMutation({
  args: {
    id: v.id('knowledgeBase'),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      embedding: args.embedding,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Regenerate embedding for a single knowledge base entry
 *
 * Useful when updating content: `npx convex run functions/embeddings:regenerateEmbedding '{"id": "..."}'`
 */
export const regenerateEmbedding = internalAction({
  args: { id: v.id('knowledgeBase') },
  handler: async (ctx, args) => {
    "use node";

    const entry = await ctx.runQuery(internal.functions.embeddings.getById, { id: args.id });

    if (!entry) {
      throw new Error(`Knowledge base entry ${args.id} not found`);
    }

    const textParts = [
      entry.title,
      entry.description,
      entry.content || '',
      entry.tags.join(' '),
      entry.pressureZones.join(' '),
    ];

    const text = textParts.filter(Boolean).join('\n');

    const embedding = await ctx.runAction(internal.functions.embeddings.generateEmbedding, {
      text,
    });

    await ctx.runMutation(internal.functions.embeddings.updateEmbedding, {
      id: args.id,
      embedding,
    });

    return { success: true, id: args.id };
  },
});

/**
 * Get knowledge base entry by ID
 */
export const getById = internalQuery({
  args: { id: v.id('knowledgeBase') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
